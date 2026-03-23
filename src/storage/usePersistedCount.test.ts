import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePersistedCount } from "./usePersistedCount";

const STORAGE_KEY = "react-loaded";

function setStoredPayload(counts: Record<string, number>): void {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({ v: 2, c: counts, w: {}, h: {}, wd: {}, hd: {} }),
	);
}

describe("usePersistedCount", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns defaultCount when no persisted data exists", () => {
		const { result } = renderHook(() =>
			usePersistedCount({ loading: true, defaultCount: 5 }),
		);
		expect(result.current).toBe(5);
	});

	it("returns stored count when storageKey exists in localStorage", () => {
		setStoredPayload({ feed: 7 });

		const { result } = renderHook(() =>
			usePersistedCount({ loading: true, storageKey: "feed", defaultCount: 3 }),
		);
		expect(result.current).toBe(7);
	});

	it("clamps result between minCount and maxCount", () => {
		setStoredPayload({ feed: 20 });

		const { result } = renderHook(() =>
			usePersistedCount({
				loading: true,
				storageKey: "feed",
				defaultCount: 3,
				minCount: 1,
				maxCount: 10,
			}),
		);
		expect(result.current).toBe(10);
	});

	it("clamps result above minCount", () => {
		setStoredPayload({ feed: 0 });

		const { result } = renderHook(() =>
			usePersistedCount({
				loading: true,
				storageKey: "feed",
				defaultCount: 3,
				minCount: 2,
			}),
		);
		expect(result.current).toBe(2);
	});

	it("persists currentCount when loading becomes false", () => {
		const { rerender } = renderHook((props) => usePersistedCount(props), {
			initialProps: {
				loading: true,
				storageKey: "feed",
				defaultCount: 3,
				currentCount: undefined as number | undefined,
			},
		});

		rerender({
			loading: false,
			storageKey: "feed",
			defaultCount: 3,
			currentCount: 8,
		});

		const raw = localStorage.getItem(STORAGE_KEY);
		expect(JSON.parse(raw as string).c.feed).toBe(8);
	});

	it("does not persist anything without storageKey", () => {
		const { rerender } = renderHook((props) => usePersistedCount(props), {
			initialProps: {
				loading: true,
				defaultCount: 3,
				currentCount: undefined as number | undefined,
			},
		});

		rerender({
			loading: false,
			defaultCount: 3,
			currentCount: 5,
		});

		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it("updates count when currentCount changes", () => {
		const { result, rerender } = renderHook(
			(props) => usePersistedCount(props),
			{
				initialProps: {
					loading: false,
					storageKey: "feed",
					defaultCount: 3,
					currentCount: 4,
				},
			},
		);

		expect(result.current).toBe(4);

		rerender({
			loading: false,
			storageKey: "feed",
			defaultCount: 3,
			currentCount: 6,
		});

		expect(result.current).toBe(6);
	});

	it("defaults minCount to 1", () => {
		const { result } = renderHook(() =>
			usePersistedCount({ loading: true, defaultCount: 0 }),
		);
		expect(result.current).toBe(1);
	});

	it("uses initialCount from SSR snapshot when provided", () => {
		const { result } = renderHook(() =>
			usePersistedCount({
				loading: true,
				defaultCount: 3,
				initialCount: 7,
			}),
		);
		expect(result.current).toBe(7);
	});

	it("clamps initialCount within minCount/maxCount", () => {
		const { result } = renderHook(() =>
			usePersistedCount({
				loading: true,
				defaultCount: 3,
				initialCount: 20,
				maxCount: 10,
			}),
		);
		expect(result.current).toBe(10);
	});

	it("prefers initialCount over stored count", () => {
		setStoredPayload({ feed: 4 });

		const { result } = renderHook(() =>
			usePersistedCount({
				loading: true,
				storageKey: "feed",
				defaultCount: 3,
				initialCount: 9,
			}),
		);
		expect(result.current).toBe(9);
	});
});
