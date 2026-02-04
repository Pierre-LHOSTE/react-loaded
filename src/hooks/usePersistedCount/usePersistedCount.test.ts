import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type UsePersistedCountOptions,
  usePersistedCount,
} from "./usePersistedCount";

describe("usePersistedCount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns clamped default count when no storage", () => {
    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        defaultCount: 10,
        minCount: 2,
        maxCount: 4,
      }),
    );

    expect(result.current).toBe(4);
  });

  it("uses stored count when available", () => {
    localStorage.setItem(
      "react-loaded",
      JSON.stringify({ v: 1, counts: { list: 5 } }),
    );

    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        storageKey: "list",
        defaultCount: 3,
        minCount: 1,
        maxCount: 10,
      }),
    );

    expect(result.current).toBe(5);
  });

  it("persists count when loading finishes", async () => {
    const initialProps: UsePersistedCountOptions = {
      loading: true,
      storageKey: "list",
      defaultCount: 3,
      minCount: 1,
      maxCount: 10,
    };

    const { rerender } = renderHook(
      (props: UsePersistedCountOptions) => usePersistedCount(props),
      {
        initialProps,
      },
    );

    rerender({
      loading: false,
      storageKey: "list",
      defaultCount: 3,
      currentCount: 7,
      minCount: 1,
      maxCount: 10,
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("react-loaded") ?? "{}");
      expect(stored.v).toBe(1);
      expect(stored.counts.list).toBe(7);
    });
  });

  it("warns once when storageKey is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { rerender } = renderHook(
      (props: UsePersistedCountOptions) => usePersistedCount(props),
      {
        initialProps: {
          loading: true,
          defaultCount: 3,
        },
      },
    );

    rerender({
      loading: false,
      defaultCount: 3,
    });

    rerender({
      loading: true,
      defaultCount: 3,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("react-loaded", "invalid json {{{");

    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        storageKey: "list",
        defaultCount: 5,
        minCount: 1,
        maxCount: 10,
      }),
    );

    expect(result.current).toBe(5);
  });

  it("handles non-numeric stored value gracefully", () => {
    localStorage.setItem(
      "react-loaded",
      JSON.stringify({ v: 1, counts: { list: "not a number" } }),
    );

    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        storageKey: "list",
        defaultCount: 4,
        minCount: 1,
        maxCount: 10,
      }),
    );

    expect(result.current).toBe(4);
  });

  it("clamps stored value to minCount", () => {
    localStorage.setItem(
      "react-loaded",
      JSON.stringify({ v: 1, counts: { list: 1 } }),
    );

    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        storageKey: "list",
        defaultCount: 5,
        minCount: 3,
        maxCount: 10,
      }),
    );

    expect(result.current).toBe(3);
  });

  it("works without maxCount constraint", () => {
    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        defaultCount: 100,
        minCount: 1,
      }),
    );

    expect(result.current).toBe(100);
  });

  it("does not persist when storageKey is omitted", async () => {
    const initialProps: UsePersistedCountOptions = {
      loading: true,
      defaultCount: 3,
      minCount: 1,
      maxCount: 10,
    };

    const { rerender } = renderHook(
      (props: UsePersistedCountOptions) => usePersistedCount(props),
      {
        initialProps,
      },
    );

    rerender({
      loading: false,
      defaultCount: 3,
      currentCount: 5,
      minCount: 1,
      maxCount: 10,
    });

    await waitFor(() => {
      const stored = localStorage.getItem("react-loaded");
      // Should not have persisted anything since no storageKey
      expect(stored).toBeNull();
    });
  });

  it("handles localStorage setItem failure gracefully", async () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    const initialProps: UsePersistedCountOptions = {
      loading: true,
      storageKey: "failing-list",
      defaultCount: 3,
      minCount: 1,
      maxCount: 10,
    };

    const { rerender, result } = renderHook(
      (props: UsePersistedCountOptions) => usePersistedCount(props),
      {
        initialProps,
      },
    );

    rerender({
      loading: false,
      storageKey: "failing-list",
      defaultCount: 3,
      currentCount: 7,
      minCount: 1,
      maxCount: 10,
    });

    // Should still work, just not persist
    await waitFor(() => {
      expect(result.current).toBe(7);
    });

    setItemSpy.mockRestore();
  });

  it("reads legacy storage key and migrates to the versioned schema", async () => {
    localStorage.setItem("loaded", JSON.stringify({ list: 5 }));

    const { result } = renderHook(() =>
      usePersistedCount({
        loading: true,
        storageKey: "list",
        defaultCount: 3,
        minCount: 1,
        maxCount: 10,
      }),
    );

    expect(result.current).toBe(5);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("react-loaded") ?? "{}");
      expect(stored.v).toBe(1);
      expect(stored.counts.list).toBe(5);
    });
  });
});
