import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getStoragePayload, writeStoragePayload } from "./storage";

const isDev = process.env.NODE_ENV !== "production";

const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

function getStoredCount(key: string): number | null {
	const payload = getStoragePayload();
	const value = payload.c[key];
	return typeof value === "number" ? value : null;
}

function setStoredCount(key: string, count: number): void {
	try {
		const payload = getStoragePayload();
		payload.c[key] = count;
		writeStoragePayload(payload);
	} catch {
		// Ignore storage write failures (quota/security errors).
	}
}

export interface UsePersistedCountOptions {
	storageKey?: string;
	defaultCount?: number;
	currentCount?: number;
	loading: boolean;
	minCount?: number;
	maxCount?: number;
	initialCount?: number | null;
}

export function usePersistedCount({
	storageKey,
	defaultCount = 3,
	currentCount,
	loading,
	minCount = 1,
	maxCount,
	initialCount,
}: UsePersistedCountOptions): number {
	const [count, setCount] = useState<number>(() => {
		if (typeof initialCount === "number") {
			return clampCount(initialCount, minCount, maxCount);
		}
		return clampCount(defaultCount, minCount, maxCount);
	});
	const hasWarnedRef = useRef(false);

	useIsomorphicLayoutEffect(() => {
		if (typeof initialCount === "number") {
			const next = clampCount(initialCount, minCount, maxCount);
			setCount((prev) => (Object.is(prev, next) ? prev : next));
			return;
		}
		if (!storageKey) return;

		const stored = getStoredCount(storageKey);
		const next = clampCount(stored ?? defaultCount, minCount, maxCount);
		setCount((prev) => (Object.is(prev, next) ? prev : next));
	}, [storageKey, minCount, maxCount, initialCount, defaultCount]);

	useEffect(() => {
		if (!loading && currentCount !== undefined) {
			const next = clampCount(currentCount, minCount, maxCount);
			setCount(next);

			if (storageKey) {
				setStoredCount(storageKey, next);
			}
		}
	}, [loading, currentCount, storageKey, minCount, maxCount]);

	useEffect(() => {
		if (isDev && !storageKey && !hasWarnedRef.current) {
			console.warn(
				"[react-loaded] AutoSkeletonList used without storageKey. " +
					"The count will reset on remount. Add a storageKey to persist across sessions.",
			);
			hasWarnedRef.current = true;
		}
	}, [storageKey]);

	return count;
}

function clampCount(
	value: number,
	min: number,
	max: number | undefined,
): number {
	let result = Math.max(value, min);
	if (max !== undefined) {
		result = Math.min(result, max);
	}
	return result;
}
