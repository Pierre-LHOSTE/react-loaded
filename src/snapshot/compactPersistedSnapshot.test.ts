import { describe, expect, it } from "vitest";
import type { PersistedSkeletonSnapshot } from "../types";
import { requireValue } from "../utils/require-value";
import {
	compactPersistedSnapshot,
	parsePersistedSnapshot,
	serializePersistedSnapshot,
} from "./compactPersistedSnapshot";

describe("compactPersistedSnapshot", () => {
	it("passes through a valid snapshot unchanged (no options)", () => {
		const snapshot: PersistedSkeletonSnapshot = {
			v: 1,
			c: { feed: 5 },
			w: { card: { t0: 120.5 } },
			h: { card: { t0: 24 } },
			wd: { feed: { t0: { avg: 100, dev: 10 } } },
			hd: { feed: { t0: { avg: 24, dev: 2 } } },
		};

		const result = compactPersistedSnapshot(snapshot);
		expect(result.c).toEqual({ feed: 5 });
		expect(result.w).toEqual({ card: { t0: 120.5 } });
		expect(result.h).toEqual({ card: { t0: 24 } });
		expect(result.wd).toEqual({ feed: { t0: { avg: 100, dev: 10 } } });
		expect(result.hd).toEqual({ feed: { t0: { avg: 24, dev: 2 } } });
	});

	it("strips invalid count values (NaN, negative, non-number)", () => {
		const snapshot = {
			c: {
				valid: 5,
				negative: -1,
				nan: Number.NaN,
				string: "hello" as unknown as number,
			},
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot);
		expect(result.c).toEqual({ valid: 5 });
	});

	it("rounds count values to integers", () => {
		const snapshot = {
			c: { feed: 5.7 },
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot);
		expect(result.c).toEqual({ feed: 6 });
	});

	it("strips invalid width values", () => {
		const snapshot = {
			w: {
				card: {
					valid: 120,
					negative: -5,
					nan: Number.NaN,
					inf: Number.POSITIVE_INFINITY,
				},
			},
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot);
		expect(result.w).toEqual({ card: { valid: 120 } });
	});

	it("strips empty skeleton entries from widths", () => {
		const snapshot = {
			w: {
				allBad: { a: -1, b: Number.NaN },
				good: { t0: 100 },
			},
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot);
		expect(result.w).toEqual({ good: { t0: 100 } });
	});

	it("strips invalid distribution values", () => {
		const snapshot = {
			wd: {
				feed: {
					valid: { avg: 100, dev: 10 },
					badAvg: { avg: -1, dev: 10 },
					badDev: { avg: 100, dev: Number.NaN },
					notObj: "hello" as unknown as { avg: number; dev: number },
				},
			},
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot);
		expect(result.wd).toEqual({ feed: { valid: { avg: 100, dev: 10 } } });
	});

	it("respects maxSkeletons option", () => {
		const snapshot = {
			c: { a: 1, b: 2, c: 3 },
			w: { a: { t0: 10 }, b: { t0: 20 }, c: { t0: 30 } },
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot, { maxSkeletons: 2 });
		expect(
			Object.keys(requireValue(result.c, "Expected compacted counts to exist")),
		).toHaveLength(2);
		expect(
			Object.keys(requireValue(result.w, "Expected compacted widths to exist")),
		).toHaveLength(2);
	});

	it("respects maxTextKeysPerSkeleton option", () => {
		const snapshot = {
			w: { card: { t0: 10, t1: 20, t2: 30, t3: 40 } },
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot, {
			maxTextKeysPerSkeleton: 2,
		});
		expect(
			Object.keys(
				requireValue(result.w, "Expected compacted widths to exist").card,
			),
		).toHaveLength(2);
	});

	it("rounds numbers when decimals option is set", () => {
		const snapshot = {
			w: { card: { t0: 123.456789 } },
			wd: { feed: { t0: { avg: 100.123456, dev: 10.654321 } } },
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot, { decimals: 1 });
		expect(
			requireValue(result.w, "Expected rounded widths to exist").card.t0,
		).toBe(123.5);
		expect(
			requireValue(result.wd, "Expected rounded width distributions to exist")
				.feed.t0.avg,
		).toBe(100.1);
		expect(
			requireValue(result.wd, "Expected rounded width distributions to exist")
				.feed.t0.dev,
		).toBe(10.7);
	});

	it("returns empty sections when snapshot has undefined sections", () => {
		const result = compactPersistedSnapshot({} as PersistedSkeletonSnapshot);
		expect(result.c).toEqual({});
		expect(result.w).toEqual({});
		expect(result.h).toEqual({});
		expect(result.wd).toEqual({});
		expect(result.hd).toEqual({});
	});

	it("handles non-record values in sections gracefully", () => {
		const snapshot = {
			c: "not a record" as unknown as Record<string, number>,
			w: 42 as unknown as Record<string, Record<string, number>>,
		} as PersistedSkeletonSnapshot;

		const result = compactPersistedSnapshot(snapshot);
		expect(result.c).toEqual({});
		expect(result.w).toEqual({});
	});
});

describe("serializePersistedSnapshot", () => {
	it("returns JSON string of compacted snapshot", () => {
		const snapshot = {
			c: { feed: 5 },
			w: { card: { t0: 100 } },
		} as PersistedSkeletonSnapshot;

		const json = serializePersistedSnapshot(snapshot);
		const parsed = JSON.parse(json);
		expect(parsed.c).toEqual({ feed: 5 });
		expect(parsed.w).toEqual({ card: { t0: 100 } });
	});

	it("applies compact options before serialization", () => {
		const snapshot = {
			w: { card: { t0: 123.456 } },
		} as PersistedSkeletonSnapshot;

		const json = serializePersistedSnapshot(snapshot, { decimals: 0 });
		const parsed = JSON.parse(json);
		expect(parsed.w.card.t0).toBe(123);
	});
});

describe("parsePersistedSnapshot", () => {
	it("parses valid JSON string into a compacted snapshot", () => {
		const raw = JSON.stringify({ c: { feed: 3 }, w: { card: { t0: 100 } } });
		const result = parsePersistedSnapshot(raw);
		expect(result.c).toEqual({ feed: 3 });
		expect(result.w).toEqual({ card: { t0: 100 } });
	});

	it("returns empty snapshot for null input", () => {
		const result = parsePersistedSnapshot(null);
		expect(result).toEqual({});
	});

	it("returns empty snapshot for undefined input", () => {
		const result = parsePersistedSnapshot(undefined);
		expect(result).toEqual({});
	});

	it("returns empty snapshot for empty string", () => {
		const result = parsePersistedSnapshot("");
		expect(result).toEqual({});
	});

	it("returns empty snapshot for invalid JSON", () => {
		const result = parsePersistedSnapshot("{invalid json}");
		expect(result).toEqual({});
	});

	it("returns empty snapshot for non-object JSON", () => {
		const result = parsePersistedSnapshot('"just a string"');
		expect(result).toEqual({});
	});

	it("strips invalid values during parsing", () => {
		const raw = JSON.stringify({
			c: { feed: 3, bad: -1 },
			w: { card: { t0: 100, bad: Number.NaN } },
		});
		const result = parsePersistedSnapshot(raw);
		expect(result.c).toEqual({ feed: 3 });
		expect(result.w).toEqual({ card: { t0: 100 } });
	});
});
