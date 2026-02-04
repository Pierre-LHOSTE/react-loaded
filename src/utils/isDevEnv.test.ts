import { describe, expect, it } from "vitest";
import { isDevEnv } from "./isDevEnv";

describe("isDevEnv", () => {
  it("returns override when __REACT_LOADED_DEV__ is set", () => {
    const globalRecord = globalThis as unknown as Record<string, unknown>;
    const previous = globalRecord.__REACT_LOADED_DEV__;
    globalRecord.__REACT_LOADED_DEV__ = true;

    try {
      expect(isDevEnv()).toBe(true);
    } finally {
      globalRecord.__REACT_LOADED_DEV__ = previous;
    }
  });

  it("returns __DEV__ when set and no override exists", () => {
    const globalRecord = globalThis as unknown as Record<string, unknown>;
    const previousOverride = globalRecord.__REACT_LOADED_DEV__;
    const previousDev = globalRecord.__DEV__;

    delete globalRecord.__REACT_LOADED_DEV__;
    globalRecord.__DEV__ = false;

    try {
      expect(isDevEnv()).toBe(false);
    } finally {
      globalRecord.__REACT_LOADED_DEV__ = previousOverride;
      globalRecord.__DEV__ = previousDev;
    }
  });

  it("returns false when no environment is detected (production by default)", () => {
    const globalRecord = globalThis as unknown as Record<string, unknown>;
    const previousOverride = globalRecord.__REACT_LOADED_DEV__;
    const previousDev = globalRecord.__DEV__;
    const previousProcess = globalRecord.process;

    delete globalRecord.__REACT_LOADED_DEV__;
    delete globalRecord.__DEV__;
    delete globalRecord.process;

    try {
      expect(isDevEnv()).toBe(false);
    } finally {
      globalRecord.__REACT_LOADED_DEV__ = previousOverride;
      globalRecord.__DEV__ = previousDev;
      globalRecord.process = previousProcess;
    }
  });
});

