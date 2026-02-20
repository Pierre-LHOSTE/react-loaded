import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	STORAGE_KEY,
	STORAGE_UPDATE_EVENT,
	type StoragePayload,
} from "../hooks/storage";
import { SNAPSHOT_COOKIE_NAME } from "./constants";
import { useSkeletonCookieSync } from "./useSkeletonCookieSync";

describe("useSkeletonCookieSync", () => {
	beforeEach(() => {
		localStorage.clear();
		// biome-ignore lint/suspicious/noDocumentCookie: test cleanup
		document.cookie = `${SNAPSHOT_COOKIE_NAME}=;max-age=0`;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("syncs snapshot to cookie on mount", () => {
		const payload: StoragePayload = {
			v: 2,
			c: { list: 3 },
			w: {},
			h: {},
			wd: {},
			hd: {},
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		renderHook(() => useSkeletonCookieSync());

		expect(document.cookie).toContain(SNAPSHOT_COOKIE_NAME);
	});

	it("syncs on STORAGE_UPDATE_EVENT", () => {
		renderHook(() => useSkeletonCookieSync());

		// Set data after mount
		const payload: StoragePayload = {
			v: 2,
			c: { updated: 10 },
			w: {},
			h: {},
			wd: {},
			hd: {},
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));

		const cookieValue = document.cookie;
		expect(cookieValue).toContain(SNAPSHOT_COOKIE_NAME);
		expect(cookieValue).toContain("updated");
	});

	it("cleans up event listener on unmount", () => {
		const removeSpy = vi.spyOn(window, "removeEventListener");

		const { unmount } = renderHook(() => useSkeletonCookieSync());
		unmount();

		expect(removeSpy).toHaveBeenCalledWith(
			STORAGE_UPDATE_EVENT,
			expect.any(Function),
		);
	});
});
