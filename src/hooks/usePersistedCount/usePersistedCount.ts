import { useEffect, useRef, useState } from "react";
import { isDevEnv } from "../../utils/isDevEnv";
import { useIsomorphicLayoutEffect } from "../../utils/useIsomorphicLayoutEffect";

const STORAGE_KEY = "react-loaded";
const LEGACY_STORAGE_KEY = "loaded";
const STORAGE_VERSION = 1 as const;

type StoredCounts = Record<string, number>;
type StoredPayloadV1 = { v: typeof STORAGE_VERSION; counts: StoredCounts };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumberRecord(value: unknown): StoredCounts {
  if (!isRecord(value)) return {};
  const result: StoredCounts = {};
  for (const [key, maybeNumber] of Object.entries(value)) {
    if (typeof maybeNumber === "number") {
      result[key] = maybeNumber;
    }
  }
  return result;
}

function parseStoredCounts(value: unknown): StoredCounts {
  // Current schema: { v: 1, counts: Record<string, number> }
  if (isRecord(value) && value.v === STORAGE_VERSION) {
    return toNumberRecord(value.counts);
  }

  // Legacy schema: Record<string, number>
  return toNumberRecord(value);
}

function readStoredCountsFromKey(key: string): StoredCounts {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return {};
    return parseStoredCounts(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeStoredCounts(counts: StoredCounts): void {
  if (typeof localStorage === "undefined") return;
  const payload: StoredPayloadV1 = { v: STORAGE_VERSION, counts };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

function getStoredCounts(): Record<string, number> {
  if (typeof localStorage === "undefined") return {};

  try {
    const rawNew = localStorage.getItem(STORAGE_KEY);
    if (rawNew !== null) {
      return parseStoredCounts(JSON.parse(rawNew));
    }

    // Backward compatibility: migrate legacy key once if present.
    const legacyCounts = readStoredCountsFromKey(LEGACY_STORAGE_KEY);
    if (Object.keys(legacyCounts).length > 0) {
      writeStoredCounts(legacyCounts);
    }
    return legacyCounts;
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
    writeStoredCounts(counts);
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
