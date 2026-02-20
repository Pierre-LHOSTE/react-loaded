import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "./storage";
import { usePersistedHeights } from "./usePersistedHeights";

type HookProps = {
	storageKey: string;
	currentHeights?: Record<string, number>;
	loading: boolean;
	initialHeights?: Record<string, number> | null;
};

describe("usePersistedHeights", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data stored", () => {
		const { result } = renderHook(() =>
			usePersistedHeights({
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("reads stored h by key", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				h: { card: { t0: 18, t1: 36, t2: 20 } },
				wd: {},
				hd: {},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedHeights({
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toEqual({ t0: 18, t1: 36, t2: 20 });
	});

	it("persists keyed h when loading becomes false", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedHeights(props),
			{
				initialProps: {
					storageKey: "card",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "card",
			currentHeights: { t0: 18, t1: 36 },
			loading: false,
		});

		await waitFor(() => {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
			expect(stored.h.card).toEqual({ t0: 18, t1: 36 });
		});
	});

	it("does not persist empty h", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedHeights(props),
			{
				initialProps: {
					storageKey: "card",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "card",
			currentHeights: {},
			loading: false,
		});

		await waitFor(() => {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const stored = JSON.parse(raw);
				expect(stored.h?.card).toBeUndefined();
			}
		});
	});

	it("handles corrupted data gracefully", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{{");

		const { result } = renderHook(() =>
			usePersistedHeights({
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("handles quota exceeded error gracefully", async () => {
		const setItemSpy = vi
			.spyOn(Storage.prototype, "setItem")
			.mockImplementation(() => {
				throw new Error("QuotaExceededError");
			});

		try {
			const { rerender, result } = renderHook(
				(props: HookProps) => usePersistedHeights(props),
				{
					initialProps: {
						storageKey: "card",
						loading: true,
					} as HookProps,
				},
			);

			rerender({
				storageKey: "card",
				currentHeights: { t0: 18, t1: 36 },
				loading: false,
			});

			await waitFor(() => {
				expect(result.current).toEqual({ t0: 18, t1: 36 });
			});
		} finally {
			setItemSpy.mockRestore();
		}
	});

	it("re-reads stored h when storageKey changes", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				h: {
					card: { t0: 18, t1: 36 },
					banner: { t0: 24, t1: 48 },
				},
				wd: {},
				hd: {},
			}),
		);

		const { result, rerender } = renderHook(
			(props: HookProps) => usePersistedHeights(props),
			{
				initialProps: {
					storageKey: "card",
					loading: true,
				} as HookProps,
			},
		);

		expect(result.current).toEqual({ t0: 18, t1: 36 });

		rerender({
			storageKey: "banner",
			loading: true,
		});

		expect(result.current).toEqual({ t0: 24, t1: 48 });
	});

	it("prefers initial h over localStorage values", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				h: { card: { t0: 999 } },
				wd: {},
				hd: {},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedHeights({
				storageKey: "card",
				loading: true,
				initialHeights: { t0: 18, t1: 36 },
			}),
		);

		expect(result.current).toEqual({ t0: 18, t1: 36 });
	});
});
