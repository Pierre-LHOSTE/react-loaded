import { useEffect, useLayoutEffect, useState } from "react";
import { clampCount, getStoragePayload, writeStoragePayload } from "./storage";

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
	}, [storageKey, minCount, maxCount, defaultCount, initialCount]);

	useEffect(() => {
		if (!loading && currentCount !== undefined) {
			const next = clampCount(currentCount, minCount, maxCount);
			setCount(next);
			if (storageKey) {
				setStoredCount(storageKey, next);
			}
		}
	}, [loading, currentCount, storageKey, minCount, maxCount]);

	return count;
}
