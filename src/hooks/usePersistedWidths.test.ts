import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "./storage";
import { usePersistedWidths } from "./usePersistedWidths";

type HookProps = {
	storageKey: string;
	currentWidths?: Record<string, number>;
	loading: boolean;
	initialWidths?: Record<string, number> | null;
};

describe("usePersistedWidths", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data stored", () => {
		const { result } = renderHook(() =>
			usePersistedWidths({
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("reads stored w by key", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: {},
				w: { card: { t0: 100, t1: 200, t2: 50 } },
				wd: {},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedWidths({
				storageKey: "card",
				loading: true,
			}),
		);

		expect(result.current).toEqual({ t0: 100, t1: 200, t2: 50 });
	});

	it("persists keyed w when loading becomes false", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedWidths(props),
			{
				initialProps: {
					storageKey: "card",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "card",
			currentWidths: { t0: 150, t1: 300 },
			loading: false,
		});

		await waitFor(() => {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
			expect(stored.w.card).toEqual({ t0: 150, t1: 300 });
		});
	});

	it("does not persist empty w", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedWidths(props),
			{
				initialProps: {
					storageKey: "card",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "card",
			currentWidths: {},
			loading: false,
		});

		await waitFor(() => {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const stored = JSON.parse(raw);
				expect(stored.w?.card).toBeUndefined();
			}
		});
	});

	it("handles corrupted data gracefully", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{{");

		const { result } = renderHook(() =>
			usePersistedWidths({
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
				(props: HookProps) => usePersistedWidths(props),
				{
					initialProps: {
						storageKey: "card",
						loading: true,
					} as HookProps,
				},
			);

			rerender({
				storageKey: "card",
				currentWidths: { t0: 100, t1: 200 },
				loading: false,
			});

			// Should not throw — w are still kept in memory even when storage fails
			await waitFor(() => {
				expect(result.current).toEqual({ t0: 100, t1: 200 });
			});
		} finally {
			setItemSpy.mockRestore();
		}
	});

	it("re-reads stored w when storageKey changes", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: {},
				w: {
					card: { t0: 100, t1: 200 },
					banner: { t0: 300, t1: 400 },
				},
				wd: {},
			}),
		);

		const { result, rerender } = renderHook(
			(props: HookProps) => usePersistedWidths(props),
			{
				initialProps: {
					storageKey: "card",
					loading: true,
				} as HookProps,
			},
		);

		expect(result.current).toEqual({ t0: 100, t1: 200 });

		rerender({
			storageKey: "banner",
			loading: true,
		});

		expect(result.current).toEqual({ t0: 300, t1: 400 });
	});

	it("prefers initial w over localStorage values", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: {},
				w: { card: { t0: 999 } },
				wd: {},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedWidths({
				storageKey: "card",
				loading: true,
				initialWidths: { t0: 120, t1: 80 },
			}),
		);

		expect(result.current).toEqual({ t0: 120, t1: 80 });
	});
});
