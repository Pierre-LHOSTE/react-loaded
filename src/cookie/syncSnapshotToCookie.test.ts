import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, type StoragePayload } from "../hooks/storage";
import {
	COOKIE_SIZE_WARNING_THRESHOLD,
	SNAPSHOT_COOKIE_NAME,
} from "./constants";
import { syncSnapshotToCookie } from "./syncSnapshotToCookie";

describe("syncSnapshotToCookie", () => {
	beforeEach(() => {
		localStorage.clear();
		// biome-ignore lint/suspicious/noDocumentCookie: test cleanup
		document.cookie = `${SNAPSHOT_COOKIE_NAME}=;max-age=0`;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("writes localStorage snapshot to document.cookie", () => {
		const payload: StoragePayload = {
			v: 1,
			c: { list: 3 },
			w: { card: { t0: 100 } },
			h: {},
			wd: {},
			hd: {},
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		syncSnapshotToCookie();

		expect(document.cookie).toContain(SNAPSHOT_COOKIE_NAME);
	});

	it("uses custom cookie name", () => {
		const payload: StoragePayload = {
			v: 1,
			c: { list: 1 },
			w: {},
			h: {},
			wd: {},
			hd: {},
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		syncSnapshotToCookie({ cookieName: "custom-cookie" });

		expect(document.cookie).toContain("custom-cookie");
	});

	it("does nothing when document is undefined (SSR guard)", () => {
		const originalDocument = globalThis.document;
		// @ts-expect-error - simulating SSR
		delete globalThis.document;

		expect(() => syncSnapshotToCookie()).not.toThrow();

		globalThis.document = originalDocument;
	});

	it("warns in dev when encoded cookie exceeds threshold", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Build a large payload to exceed threshold
		const w: Record<string, Record<string, number>> = {};
		for (let i = 0; i < 100; i++) {
			const textKeys: Record<string, number> = {};
			for (let j = 0; j < 20; j++) {
				textKeys[`text-key-${j}`] = 123.456;
			}
			w[`skeleton-${i}`] = textKeys;
		}
		const payload: StoragePayload = {
			v: 1,
			c: {},
			w,
			h: {},
			wd: {},
			hd: {},
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		syncSnapshotToCookie({ compact: {} });

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining(String(COOKIE_SIZE_WARNING_THRESHOLD)),
		);
	});
});
