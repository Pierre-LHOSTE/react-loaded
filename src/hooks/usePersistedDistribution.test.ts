import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "./storage";
import { usePersistedDistribution } from "./usePersistedDistribution";

type HookProps = {
	storageKey?: string;
	allItemWidths?: Record<string, number>[];
	loading: boolean;
	initialDistributions?: Record<string, { avg: number; dev: number }> | null;
};

describe("usePersistedDistribution", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data stored", () => {
		const { result } = renderHook(() =>
			usePersistedDistribution({
				storageKey: "list",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("reads stored wd by key", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				wd: {
					list: {
						t0: { avg: 120, dev: 25 },
						t1: { avg: 280, dev: 45 },
					},
				},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedDistribution({
				storageKey: "list",
				loading: true,
			}),
		);

		expect(result.current).toEqual({
			t0: { avg: 120, dev: 25 },
			t1: { avg: 280, dev: 45 },
		});
	});

	it("computes and persists keyed wd when loading finishes", async () => {
		const allItemWidths = [
			{ t0: 100, t1: 200 },
			{ t0: 120, t1: 220 },
			{ t0: 110, t1: 210 },
		];

		const { rerender } = renderHook(
			(props: HookProps) => usePersistedDistribution(props),
			{
				initialProps: {
					storageKey: "list",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "list",
			allItemWidths,
			loading: false,
		});

		await waitFor(() => {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
			const dists = stored.wd.list;
			expect(dists.t0).toBeDefined();
			expect(dists.t1).toBeDefined();
			// avg of [100, 120, 110] = 110
			expect(dists.t0.avg).toBe(110);
			// avg of [200, 220, 210] = 210
			expect(dists.t1.avg).toBe(210);
			// dev should be reasonable
			expect(dists.t0.dev).toBeGreaterThan(0);
			expect(dists.t1.dev).toBeGreaterThan(0);
		});
	});

	it("handles items with different text keys", async () => {
		const allItemWidths: Record<string, number>[] = [
			{ t0: 100, t1: 200, t2: 300 },
			{ t0: 120, t1: 220 },
		];

		const { rerender } = renderHook(
			(props: HookProps) => usePersistedDistribution(props),
			{
				initialProps: {
					storageKey: "list",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "list",
			allItemWidths,
			loading: false,
		});

		await waitFor(() => {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
			const dists = stored.wd.list;
			expect(dists.t0).toBeDefined();
			expect(dists.t1).toBeDefined();
			expect(dists.t2).toBeDefined();
			// t2 only has one value (300), so dev should be 0
			expect(dists.t2.avg).toBe(300);
			expect(dists.t2.dev).toBe(0);
		});
	});

	it("does not persist without storageKey", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedDistribution(props),
			{
				initialProps: {
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			allItemWidths: [{ t0: 100, t1: 200 }],
			loading: false,
		});

		await waitFor(() => {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const stored = JSON.parse(raw);
				expect(Object.keys(stored.wd || {})).toHaveLength(0);
			}
		});
	});

	it("does not persist empty item w", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedDistribution(props),
			{
				initialProps: {
					storageKey: "list",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "list",
			allItemWidths: [],
			loading: false,
		});

		await waitFor(() => {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const stored = JSON.parse(raw);
				expect(stored.wd?.list).toBeUndefined();
			}
		});
	});

	it("re-reads stored wd when storageKey changes", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				wd: {
					list: {
						t0: { avg: 120, dev: 25 },
					},
					grid: {
						t0: { avg: 300, dev: 50 },
					},
				},
			}),
		);

		const { result, rerender } = renderHook(
			(props: HookProps) => usePersistedDistribution(props),
			{
				initialProps: {
					storageKey: "list",
					loading: true,
				} as HookProps,
			},
		);

		expect(result.current).toEqual({
			t0: { avg: 120, dev: 25 },
		});

		rerender({
			storageKey: "grid",
			loading: true,
		});

		expect(result.current).toEqual({
			t0: { avg: 300, dev: 50 },
		});
	});

	it("prefers initial wd over localStorage values", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				wd: {
					list: {
						t0: { avg: 999, dev: 1 },
					},
				},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedDistribution({
				storageKey: "list",
				loading: true,
				initialDistributions: {
					t0: { avg: 120, dev: 25 },
					t1: { avg: 280, dev: 45 },
				},
			}),
		);

		expect(result.current).toEqual({
			t0: { avg: 120, dev: 25 },
			t1: { avg: 280, dev: 45 },
		});
	});
});
