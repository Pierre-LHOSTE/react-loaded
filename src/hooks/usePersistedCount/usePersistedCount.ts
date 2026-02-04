import { useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "../../utils/useIsomorphicLayoutEffect";

const STORAGE_KEY = "loaded";

function getStoredCounts(): Record<string, number> {
  if (typeof localStorage === "undefined") return {};

  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) return {};
    return JSON.parse(value) as Record<string, number>;
  } catch {
    return {};
  }
}

function getStoredCount(key: string): number | null {
  const counts = getStoredCounts();
  const value = counts[key];
  return typeof value === "number" ? value : null;
}

function setStoredCount(key: string, count: number): void {
  if (typeof localStorage === "undefined") return;

  try {
    const counts = getStoredCounts();
    counts[key] = count;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export interface UsePersistedCountOptions {
  storageKey?: string;
  defaultCount?: number;
  currentCount?: number;
  loading: boolean;
  minCount?: number;
  maxCount?: number;
}

export function usePersistedCount({
  storageKey,
  defaultCount = 3,
  currentCount,
  loading,
  minCount = 1,
  maxCount,
}: UsePersistedCountOptions): number {
  // Always start from the default to match SSR output, then (on the client)
  // sync to the persisted value in a layout effect before first paint.
  const [count, setCount] = useState<number>(() =>
    clampCount(defaultCount, minCount, maxCount),
  );

  const hasWarnedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!storageKey) return;
    const stored = getStoredCount(storageKey);
    if (stored === null) return;
    const next = clampCount(stored, minCount, maxCount);
    setCount((prev) => (Object.is(prev, next) ? prev : next));
  }, [storageKey, minCount, maxCount]);

  useEffect(() => {
    if (!loading && currentCount !== undefined) {
      const newCount = clampCount(currentCount, minCount, maxCount);
      setCount(newCount);

      if (storageKey) {
        setStoredCount(storageKey, newCount);
      }
    }
  }, [loading, currentCount, storageKey, minCount, maxCount]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      !storageKey &&
      !hasWarnedRef.current
    ) {
      console.warn(
        "[Loaded] SmartSkeletonList used without storageKey. " +
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
