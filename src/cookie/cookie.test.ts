import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_UPDATE_EVENT } from "../storage/storage";
import {
	COOKIE_SIZE_WARNING_THRESHOLD,
	DEFAULT_COOKIE_COMPACT_OPTIONS,
	SNAPSHOT_COOKIE_NAME,
} from "./constants";
import { parseSnapshotCookie } from "./parseSnapshotCookie";
import { syncSnapshotToCookie } from "./syncSnapshotToCookie";
import { useSkeletonCookieSync } from "./useSkeletonCookieSync";

const STORAGE_KEY = "react-loaded";

describe("constants", () => {
	it("exports correct cookie name", () => {
		expect(SNAPSHOT_COOKIE_NAME).toBe("react-loaded-snapshot");
	});

	it("exports cookie size warning threshold", () => {
		expect(COOKIE_SIZE_WARNING_THRESHOLD).toBe(3800);
	});

	it("exports default compact options", () => {
		expect(DEFAULT_COOKIE_COMPACT_OPTIONS).toEqual({
			maxSkeletons: 20,
			maxTextKeysPerSkeleton: 10,
			decimals: 1,
		});
	});
});

describe("parseSnapshotCookie", () => {
	it("returns empty snapshot for null", () => {
		expect(parseSnapshotCookie(null)).toEqual({});
	});

	it("returns empty snapshot for undefined", () => {
		expect(parseSnapshotCookie(undefined)).toEqual({});
	});

	it("returns empty snapshot for empty string", () => {
		expect(parseSnapshotCookie("")).toEqual({});
	});

	it("parses URL-encoded JSON cookie value", () => {
		const data = { c: { feed: 5 }, w: { card: { t0: 100 } } };
		const encoded = encodeURIComponent(JSON.stringify(data));

		const result = parseSnapshotCookie(encoded);
		expect(result.c).toEqual({ feed: 5 });
		expect(result.w).toEqual({ card: { t0: 100 } });
	});

	it("parses plain JSON cookie value (not encoded)", () => {
		const json = JSON.stringify({ c: { feed: 3 } });
		const result = parseSnapshotCookie(json);
		expect(result.c).toEqual({ feed: 3 });
	});

	it("returns empty snapshot for invalid JSON", () => {
		expect(parseSnapshotCookie("not{json")).toEqual({});
	});
});

describe("syncSnapshotToCookie", () => {
	beforeEach(() => {
		localStorage.clear();
		// Clear cookies by setting expired
		// biome-ignore lint/suspicious/noDocumentCookie: test cleanup
		document.cookie =
			"react-loaded-snapshot=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
	});

	it("writes cookie from localStorage data", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { feed: 5 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		syncSnapshotToCookie();

		expect(document.cookie).toContain("react-loaded-snapshot=");
		// Cookie should contain the serialized data
		const cookieValue = document.cookie
			.split(";")
			.find((c) => c.trim().startsWith("react-loaded-snapshot="))
			?.split("=")
			.slice(1)
			.join("=");

		expect(cookieValue).toBeDefined();
		const parsed = parseSnapshotCookie(cookieValue);
		expect(parsed.c).toEqual({ feed: 5 });
	});

	it("uses custom cookie name", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { x: 1 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		syncSnapshotToCookie({ cookieName: "my-custom-cookie" });
		expect(document.cookie).toContain("my-custom-cookie=");
	});

	it("warns in dev when cookie exceeds size threshold", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Create a large payload to exceed the threshold
		const bigPayload: Record<string, Record<string, number>> = {};
		for (let i = 0; i < 100; i++) {
			const widths: Record<string, number> = {};
			for (let j = 0; j < 20; j++) {
				widths[`t${j}`] = Math.random() * 1000;
			}
			bigPayload[`skeleton-${i}`] = widths;
		}

		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: bigPayload,
				h: {},
				wd: {},
				hd: {},
			}),
		);

		// With no compact limits, this will be huge
		syncSnapshotToCookie({
			compact: {
				maxSkeletons: 100,
				maxTextKeysPerSkeleton: 20,
			},
		});

		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Cookie"));

		warnSpy.mockRestore();
	});
});

describe("useSkeletonCookieSync", () => {
	beforeEach(() => {
		localStorage.clear();
		// biome-ignore lint/suspicious/noDocumentCookie: test cleanup
		document.cookie =
			"react-loaded-snapshot=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
	});

	afterEach(() => {
		cleanup();
	});

	it("syncs cookie on mount", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { feed: 3 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		renderHook(() => useSkeletonCookieSync());

		expect(document.cookie).toContain("react-loaded-snapshot=");
		const cookieValue = document.cookie
			.split(";")
			.find((c) => c.trim().startsWith("react-loaded-snapshot="))
			?.split("=")
			.slice(1)
			.join("=");
		const parsed = parseSnapshotCookie(cookieValue);
		expect(parsed.c).toEqual({ feed: 3 });
	});

	it("syncs cookie when STORAGE_UPDATE_EVENT fires", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		renderHook(() => useSkeletonCookieSync());

		// Now update localStorage and fire the event
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { card: 7 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));

		const cookieValue = document.cookie
			.split(";")
			.find((c) => c.trim().startsWith("react-loaded-snapshot="))
			?.split("=")
			.slice(1)
			.join("=");
		const parsed = parseSnapshotCookie(cookieValue);
		expect(parsed.c).toEqual({ card: 7 });
	});

	it("cleans up event listener on unmount", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { a: 1 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		const addSpy = vi.spyOn(window, "addEventListener");
		const removeSpy = vi.spyOn(window, "removeEventListener");

		const { unmount } = renderHook(() => useSkeletonCookieSync());

		expect(addSpy).toHaveBeenCalledWith(
			STORAGE_UPDATE_EVENT,
			expect.any(Function),
		);

		unmount();

		expect(removeSpy).toHaveBeenCalledWith(
			STORAGE_UPDATE_EVENT,
			expect.any(Function),
		);

		addSpy.mockRestore();
		removeSpy.mockRestore();
	});

	it("uses custom options", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { x: 2 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		renderHook(() => useSkeletonCookieSync({ cookieName: "custom-snap" }));

		expect(document.cookie).toContain("custom-snap=");
	});
});
