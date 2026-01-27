import { useEffect, useRef, useState } from "react";

declare const process: { env?: { NODE_ENV?: string } } | undefined;

const __DEV__ =
  typeof process !== "undefined" && process?.env?.NODE_ENV === "development";

function getStoredCount(key: string): number | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const value = localStorage.getItem(`loaded:${key}`);
    if (value === null) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

function setStoredCount(key: string, count: number): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(`loaded:${key}`, String(count));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export interface UsePersistedCountOptions {
  storageKey?: string;
  defaultCount?: number;
  currentCount?: number;
  loading: boolean;
}

export function usePersistedCount({
  storageKey,
  defaultCount = 3,
  currentCount,
  loading,
}: UsePersistedCountOptions): number {
  const [count, setCount] = useState<number>(() => {
    if (storageKey) {
      const stored = getStoredCount(storageKey);
      if (stored !== null) return stored;
    }
    return defaultCount;
  });

  const hasWarnedRef = useRef(false);

  // Persist count when data arrives
  useEffect(() => {
    if (!loading && currentCount !== undefined && storageKey) {
      setStoredCount(storageKey, currentCount);
      setCount(currentCount);
    }
  }, [loading, currentCount, storageKey]);

  // Dev warning for missing storageKey
  useEffect(() => {
    if (__DEV__ && !storageKey && !hasWarnedRef.current) {
      console.warn(
        "[Loaded] SmartSkeletonList used without storageKey. " +
          "Consider adding a storageKey to persist the item count and avoid layout jumps.",
      );
      hasWarnedRef.current = true;
    }
  }, [storageKey]);

  return count;
}
