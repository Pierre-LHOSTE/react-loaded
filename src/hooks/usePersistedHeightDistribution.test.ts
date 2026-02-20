import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "./storage";
import { usePersistedHeightDistribution } from "./usePersistedHeightDistribution";

type HookProps = {
	storageKey?: string;
	allItemHeights?: Record<string, number>[];
	loading: boolean;
	initialDistributions?: Record<string, { avg: number; dev: number }> | null;
};

describe("usePersistedHeightDistribution", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data stored", () => {
		const { result } = renderHook(() =>
			usePersistedHeightDistribution({
				storageKey: "list",
				loading: true,
			}),
		);

		expect(result.current).toBeNull();
	});

	it("reads stored height wd by key", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: {},
				w: {},
				h: {},
				wd: {},
				hd: {
					list: {
						t0: { avg: 20, dev: 3 },
						t1: { avg: 36, dev: 5 },
					},
				},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedHeightDistribution({
				storageKey: "list",
				loading: true,
			}),
		);

		expect(result.current).toEqual({
			t0: { avg: 20, dev: 3 },
			t1: { avg: 36, dev: 5 },
		});
	});

	it("computes and persists height wd when loading finishes", async () => {
		const allItemHeights = [
			{ t0: 18, t1: 36 },
			{ t0: 20, t1: 40 },
			{ t0: 22, t1: 38 },
		];

		const { rerender } = renderHook(
			(props: HookProps) => usePersistedHeightDistribution(props),
			{
				initialProps: {
					storageKey: "list",
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			storageKey: "list",
			allItemHeights,
			loading: false,
		});

		await waitFor(() => {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
			const dists = stored.hd.list;
			expect(dists.t0).toBeDefined();
			expect(dists.t1).toBeDefined();
			// avg of [18, 20, 22] = 20
			expect(dists.t0.avg).toBe(20);
			// avg of [36, 40, 38] = 38
			expect(dists.t1.avg).toBe(38);
			expect(dists.t0.dev).toBeGreaterThan(0);
			expect(dists.t1.dev).toBeGreaterThan(0);
		});
	});

	it("does not persist without storageKey", async () => {
		const { rerender } = renderHook(
			(props: HookProps) => usePersistedHeightDistribution(props),
			{
				initialProps: {
					loading: true,
				} as HookProps,
			},
		);

		rerender({
			allItemHeights: [{ t0: 18, t1: 36 }],
			loading: false,
		});

		await waitFor(() => {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const stored = JSON.parse(raw);
				expect(Object.keys(stored.hd || {})).toHaveLength(0);
			}
		});
	});

	it("prefers initial wd over localStorage values", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: {},
				w: {},
				h: {},
				wd: {},
				hd: {
					list: {
						t0: { avg: 999, dev: 1 },
					},
				},
			}),
		);

		const { result } = renderHook(() =>
			usePersistedHeightDistribution({
				storageKey: "list",
				loading: true,
				initialDistributions: {
					t0: { avg: 20, dev: 3 },
					t1: { avg: 36, dev: 5 },
				},
			}),
		);

		expect(result.current).toEqual({
			t0: { avg: 20, dev: 3 },
			t1: { avg: 36, dev: 5 },
		});
	});
});
