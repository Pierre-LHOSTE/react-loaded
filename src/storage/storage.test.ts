import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoragePayload } from "../types";
import {
	clampCount,
	computeDistributions,
	getStoragePayload,
	isRecord,
	STORAGE_UPDATE_EVENT,
	updateStoragePayload,
	writeStoragePayload,
} from "./storage";

const STORAGE_KEY = "react-loaded";

function makePayload(overrides?: Partial<StoragePayload>): StoragePayload {
	return {
		v: 2,
		c: {},
		w: {},
		h: {},
		wd: {},
		hd: {},
		...overrides,
	};
}

describe("getStoragePayload", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns empty payload when localStorage is empty", () => {
		const result = getStoragePayload();
		expect(result).toEqual(makePayload());
	});

	it("parses and returns stored payload", () => {
		const payload = makePayload({ c: { feed: 5 } });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		const result = getStoragePayload();
		expect(result.c.feed).toBe(5);
	});

	it("returns empty payload on corrupted JSON", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{{");

		const result = getStoragePayload();
		expect(result).toEqual(makePayload());
	});

	it("returns empty payload when version mismatches", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, c: { x: 3 } }));

		const result = getStoragePayload();
		expect(result).toEqual(makePayload());
	});
});

describe("writeStoragePayload", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("serializes and writes to localStorage", () => {
		const payload = makePayload({ c: { list: 7 } });
		writeStoragePayload(payload);

		const raw = localStorage.getItem(STORAGE_KEY);
		expect(raw).not.toBeNull();
		expect(JSON.parse(raw as string).c.list).toBe(7);
	});
});

describe("updateStoragePayload", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("reads, mutates, and rewrites", () => {
		const payload = makePayload({ c: { items: 3 } });
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

		updateStoragePayload((p) => {
			p.c.items = 10;
		});

		const raw = localStorage.getItem(STORAGE_KEY);
		expect(JSON.parse(raw as string).c.items).toBe(10);
	});

	it("creates payload from scratch when none exists", () => {
		updateStoragePayload((p) => {
			p.c.new = 1;
		});

		const raw = localStorage.getItem(STORAGE_KEY);
		expect(JSON.parse(raw as string).c.new).toBe(1);
	});
});

describe("clampCount", () => {
	it("clamps below min", () => {
		expect(clampCount(0, 1)).toBe(1);
	});

	it("clamps above max", () => {
		expect(clampCount(10, 1, 5)).toBe(5);
	});

	it("returns value when within range", () => {
		expect(clampCount(3, 1, 5)).toBe(3);
	});

	it("ignores max when undefined", () => {
		expect(clampCount(100, 1)).toBe(100);
	});
});

describe("isRecord", () => {
	it("returns true for plain objects", () => {
		expect(isRecord({})).toBe(true);
		expect(isRecord({ a: 1 })).toBe(true);
	});

	it("returns false for non-objects", () => {
		expect(isRecord(null)).toBe(false);
		expect(isRecord(undefined)).toBe(false);
		expect(isRecord(42)).toBe(false);
		expect(isRecord("string")).toBe(false);
		expect(isRecord([])).toBe(false);
	});
});

describe("computeDistributions", () => {
	it("computes avg and dev for a single text key across items", () => {
		const items = [{ t0: 100 }, { t0: 200 }, { t0: 300 }];
		const result = computeDistributions(items);

		expect(result.t0.avg).toBe(200);
		expect(result.t0.dev).toBeCloseTo(81.6, 0);
	});

	it("computes distributions for multiple text keys", () => {
		const items = [
			{ t0: 100, t1: 50 },
			{ t0: 200, t1: 60 },
		];
		const result = computeDistributions(items);

		expect(result.t0.avg).toBe(150);
		expect(result.t1.avg).toBe(55);
	});

	it("returns empty record for empty input", () => {
		expect(computeDistributions([])).toEqual({});
	});

	it("handles single item (dev = 0)", () => {
		const result = computeDistributions([{ t0: 42 }]);
		expect(result.t0.avg).toBe(42);
		expect(result.t0.dev).toBe(0);
	});

	it("rounds to 1 decimal place", () => {
		// Values designed to produce non-integer avg/dev
		const items = [{ t0: 10 }, { t0: 20 }, { t0: 33 }];
		const result = computeDistributions(items);

		expect(result.t0.avg).toBe(21);
		const devStr = result.t0.dev.toString();
		const decimals = devStr.includes(".") ? devStr.split(".")[1].length : 0;
		expect(decimals).toBeLessThanOrEqual(1);
	});

	it("skips keys that are not present in all items", () => {
		const items: Record<string, number>[] = [{ t0: 100, t1: 50 }, { t0: 200 }];
		const result = computeDistributions(items);

		// t0 has 2 values, t1 has 1 value
		expect(result.t0).toBeDefined();
		expect(result.t1).toBeDefined();
		expect(result.t1.avg).toBe(50);
		expect(result.t1.dev).toBe(0);
	});
});

describe("STORAGE_UPDATE_EVENT", () => {
	it("is a string constant", () => {
		expect(typeof STORAGE_UPDATE_EVENT).toBe("string");
		expect(STORAGE_UPDATE_EVENT).toBe("react-loaded:storage-update");
	});
});

describe("writeStoragePayload dispatches event", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("dispatches STORAGE_UPDATE_EVENT on write", () => {
		const handler = vi.fn();
		window.addEventListener(STORAGE_UPDATE_EVENT, handler);

		writeStoragePayload(makePayload({ c: { x: 1 } }));

		expect(handler).toHaveBeenCalledTimes(1);
		window.removeEventListener(STORAGE_UPDATE_EVENT, handler);
	});
});
