import { useEffect, useRef, useState } from "react";

function isDevEnv(): boolean {
  if (typeof globalThis === "undefined") return false;
  const maybeProcess = (
    globalThis as { process?: { env?: { NODE_ENV?: string } } }
  ).process;
  return maybeProcess?.env?.NODE_ENV !== "production";
}

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
  const [count, setCount] = useState<number>(() => {
    if (storageKey) {
      const stored = getStoredCount(storageKey);
      if (stored !== null) {
        return clampCount(stored, minCount, maxCount);
      }
    }
    return clampCount(defaultCount, minCount, maxCount);
  });

  const hasWarnedRef = useRef(false);

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
    if (isDevEnv() && !storageKey && !hasWarnedRef.current) {
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
