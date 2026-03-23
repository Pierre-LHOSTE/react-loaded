import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Distribution, StoragePayload } from "../types";
import { usePersistedDistribution } from "./usePersistedDistribution";
import { usePersistedHeightDistribution } from "./usePersistedHeightDistribution";

const STORAGE_KEY = "react-loaded";

function makePayload(overrides?: Partial<StoragePayload>): StoragePayload {
	return { v: 2, c: {}, w: {}, h: {}, wd: {}, hd: {}, ...overrides };
}

describe("usePersistedDistribution", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data exists", () => {
		const { result } = renderHook(() =>
			usePersistedDistribution({
				storageKey: "feed",
				loading: true,
			}),
		);
		expect(result.current).toBeNull();
	});

	it("returns initialDistributions when provided", () => {
		const initial: Record<string, Distribution> = {
			t0: { avg: 150, dev: 20 },
		};
		const { result } = renderHook(() =>
			usePersistedDistribution({
				storageKey: "feed",
				loading: true,
				initialDistributions: initial,
			}),
		);
		expect(result.current).toEqual(initial);
	});

	it("reads from localStorage when no initialDistributions", () => {
		const payload = makePayload({
			wd: { feed: { t0: { avg: 120, dev: 15 } } },
		});
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		const { result } = renderHook(() =>
			usePersistedDistribution({
				storageKey: "feed",
				loading: true,
			}),
		);
		expect(result.current).toEqual({ t0: { avg: 120, dev: 15 } });
	});

	it("returns null when storageKey is undefined", () => {
		const { result } = renderHook(() =>
			usePersistedDistribution({
				loading: true,
			}),
		);
		expect(result.current).toBeNull();
	});

	it("computes and persists distributions when loading becomes false", () => {
		const allItemWidths: Record<string, number>[] = [{ t0: 100 }, { t0: 200 }];

		const { result, rerender } = renderHook(
			(props) => usePersistedDistribution(props),
			{
				initialProps: {
					storageKey: "feed",
					loading: true as boolean,
					allItemWidths: undefined as Record<string, number>[] | undefined,
				},
			},
		);

		expect(result.current).toBeNull();

		rerender({
			storageKey: "feed",
			loading: false,
			allItemWidths,
		});

		expect(result.current).not.toBeNull();
		expect(result.current?.t0.avg).toBe(150);

		// Verify in localStorage
		const raw = localStorage.getItem(STORAGE_KEY);
		const stored = JSON.parse(raw!);
		expect(stored.wd.feed.t0.avg).toBe(150);
	});
});

describe("usePersistedHeightDistribution", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns null when no data exists", () => {
		const { result } = renderHook(() =>
			usePersistedHeightDistribution({
				storageKey: "feed",
				loading: true,
			}),
		);
		expect(result.current).toBeNull();
	});

	it("reads from localStorage hd field", () => {
		const payload = makePayload({
			hd: { feed: { t0: { avg: 24, dev: 4 } } },
		});
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		const { result } = renderHook(() =>
			usePersistedHeightDistribution({
				storageKey: "feed",
				loading: true,
			}),
		);
		expect(result.current).toEqual({ t0: { avg: 24, dev: 4 } });
	});

	it("computes and persists height distributions", () => {
		const allItemHeights: Record<string, number>[] = [{ t0: 20 }, { t0: 30 }];

		const { result, rerender } = renderHook(
			(props) => usePersistedHeightDistribution(props),
			{
				initialProps: {
					storageKey: "feed",
					loading: true as boolean,
					allItemHeights: undefined as Record<string, number>[] | undefined,
				},
			},
		);

		rerender({
			storageKey: "feed",
			loading: false,
			allItemHeights,
		});

		expect(result.current).not.toBeNull();
		expect(result.current?.t0.avg).toBe(25);

		const raw = localStorage.getItem(STORAGE_KEY);
		const stored = JSON.parse(raw!);
		expect(stored.hd.feed.t0.avg).toBe(25);
	});
});
