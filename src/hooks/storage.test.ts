import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getStoragePayload,
	STORAGE_KEY,
	STORAGE_UPDATE_EVENT,
	STORAGE_VERSION,
	type StoragePayload,
	updateStoragePayload,
	writeStoragePayload,
} from "./storage";

describe("storage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("getStoragePayload", () => {
		it("returns empty payload when nothing stored", () => {
			const payload = getStoragePayload();
			expect(payload).toEqual({
				v: STORAGE_VERSION,
				c: {},
				w: {},
				h: {},
				wd: {},
				hd: {},
			});
		});

		it("reads v2 payload correctly", () => {
			const stored: StoragePayload = {
				v: 1,
				c: { list: 5 },
				w: { card: { t0: 100, t1: 200 } },
				h: { card: { t0: 20, t1: 24 } },
				wd: {
					list: {
						t0: { avg: 120, dev: 25 },
						t1: { avg: 280, dev: 45 },
					},
				},
				hd: {
					list: {
						t0: { avg: 20, dev: 2 },
					},
				},
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

			const payload = getStoragePayload();
			expect(payload).toEqual(stored);
		});

		it("handles corrupted JSON gracefully", () => {
			localStorage.setItem(STORAGE_KEY, "not json {{{");

			const payload = getStoragePayload();
			expect(payload).toEqual({
				v: STORAGE_VERSION,
				c: {},
				w: {},
				h: {},
				wd: {},
				hd: {},
			});
		});

		it("filters out non-numeric c", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					v: 1,
					c: { good: 5, bad: "string" },
					w: {},
					wd: {},
				}),
			);

			const payload = getStoragePayload();
			expect(payload.c).toEqual({ good: 5 });
		});

		it("filters out invalid w", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					v: 1,
					c: {},
					w: {
						good: { t0: 100, t1: 200 },
						bad: "not object",
						mixed: { t0: 100, t1: "str" },
					},
					wd: {},
				}),
			);

			const payload = getStoragePayload();
			expect(payload.w).toEqual({ good: { t0: 100, t1: 200 } });
		});

		it("reads h and hd from v2 payload", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					v: 1,
					c: {},
					w: {},
					h: { card: { t0: 18, t1: 36 } },
					wd: {},
					hd: {
						list: { t0: { avg: 20, dev: 3 } },
					},
				}),
			);

			const payload = getStoragePayload();
			expect(payload.h).toEqual({ card: { t0: 18, t1: 36 } });
			expect(payload.hd).toEqual({
				list: { t0: { avg: 20, dev: 3 } },
			});
		});

		it("defaults h to empty when missing from v2 payload", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					v: 1,
					c: {},
					w: {},
					wd: {},
				}),
			);

			const payload = getStoragePayload();
			expect(payload.h).toEqual({});
			expect(payload.hd).toEqual({});
		});

		it("filters out invalid wd", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					v: 1,
					c: {},
					w: {},
					wd: {
						good: { t0: { avg: 100, dev: 10 } },
						bad: "not object",
						incomplete: { t0: { avg: 100 } },
					},
				}),
			);

			const payload = getStoragePayload();
			expect(payload.wd).toEqual({
				good: { t0: { avg: 100, dev: 10 } },
			});
		});
	});

	describe("writeStoragePayload", () => {
		it("writes payload to localStorage", () => {
			const payload: StoragePayload = {
				v: 1,
				c: { list: 5 },
				w: { card: { t0: 150 } },
				h: {},
				wd: { list: { t0: { avg: 100, dev: 20 } } },
				hd: {},
			};

			writeStoragePayload(payload);

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
			expect(stored).toEqual(payload);
		});

		it("handles quota exceeded error gracefully", () => {
			const setItemSpy = vi
				.spyOn(Storage.prototype, "setItem")
				.mockImplementation(() => {
					throw new Error("QuotaExceededError");
				});

			expect(() => {
				writeStoragePayload({
					v: 1,
					c: {},
					w: {},
					h: {},
					wd: {},
					hd: {},
				});
			}).not.toThrow();

			setItemSpy.mockRestore();
		});

		it("dispatches STORAGE_UPDATE_EVENT after successful write", () => {
			const listener = vi.fn();
			window.addEventListener(STORAGE_UPDATE_EVENT, listener);

			writeStoragePayload({
				v: 1,
				c: { list: 1 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			});

			expect(listener).toHaveBeenCalledOnce();
			window.removeEventListener(STORAGE_UPDATE_EVENT, listener);
		});

		it("does not lose data when two updateStoragePayload calls run consecutively", () => {
			updateStoragePayload((payload) => {
				payload.w.card = { t0: 100 };
			});
			updateStoragePayload((payload) => {
				payload.h.card = { t0: 20 };
			});

			const stored = getStoragePayload();
			expect(stored.w.card).toEqual({ t0: 100 });
			expect(stored.h.card).toEqual({ t0: 20 });
		});

		it("does not dispatch STORAGE_UPDATE_EVENT when write throws", () => {
			const setItemSpy = vi
				.spyOn(Storage.prototype, "setItem")
				.mockImplementation(() => {
					throw new Error("QuotaExceededError");
				});

			const listener = vi.fn();
			window.addEventListener(STORAGE_UPDATE_EVENT, listener);

			writeStoragePayload({
				v: 1,
				c: {},
				w: {},
				h: {},
				wd: {},
				hd: {},
			});

			expect(listener).not.toHaveBeenCalled();
			window.removeEventListener(STORAGE_UPDATE_EVENT, listener);
			setItemSpy.mockRestore();
		});
	});
});
