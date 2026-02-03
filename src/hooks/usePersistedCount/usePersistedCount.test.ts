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
      const stored = JSON.parse(localStorage.getItem("loaded") ?? "{}");
      expect(stored.list).toBe(7);
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
});
