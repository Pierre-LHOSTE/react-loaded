import { describe, expect, it } from "vitest";
import {
	compactPersistedSnapshot,
	parsePersistedSnapshot,
	serializePersistedSnapshot,
} from "./persistedSnapshot";

describe("persistedSnapshot", () => {
	it("parses a valid JSON snapshot", () => {
		const snapshot = parsePersistedSnapshot(
			JSON.stringify({
				c: { list: 3 },
				w: { card: { t0: 120.25 } },
				h: { card: { t0: 20.5 } },
				wd: { list: { t0: { avg: 120.25, dev: 10.75 } } },
				hd: { list: { t0: { avg: 20, dev: 3 } } },
			}),
		);

		expect(snapshot.c).toEqual({ list: 3 });
		expect(snapshot.w).toEqual({ card: { t0: 120.25 } });
		expect(snapshot.h).toEqual({ card: { t0: 20.5 } });
		expect(snapshot.wd).toEqual({
			list: { t0: { avg: 120.25, dev: 10.75 } },
		});
		expect(snapshot.hd).toEqual({
			list: { t0: { avg: 20, dev: 3 } },
		});
	});

	it("returns empty snapshot on invalid input", () => {
		expect(parsePersistedSnapshot("invalid-json{{")).toEqual({});
		expect(parsePersistedSnapshot(null)).toEqual({});
	});

	it("compacts snapshot with limits and decimals", () => {
		const compacted = compactPersistedSnapshot(
			{
				c: { a: 1, b: 2, c: 3 },
				w: {
					a: { t0: 120.26, t1: 99.99 },
					b: { t0: 80.33 },
				},
				h: {
					a: { t0: 20.26, t1: 18.99 },
					b: { t0: 22.33 },
				},
				wd: {
					a: { t0: { avg: 200.66, dev: 10.44 }, t1: { avg: 50.2, dev: 5.2 } },
					b: { t0: { avg: 100.8, dev: 12.3 } },
				},
				hd: {
					a: { t0: { avg: 20.66, dev: 3.44 } },
				},
			},
			{
				maxSkeletons: 1,
				maxTextKeysPerSkeleton: 1,
				decimals: 1,
			},
		);

		expect(compacted.c).toEqual({ a: 1 });
		expect(compacted.w).toEqual({ a: { t0: 120.3 } });
		expect(compacted.h).toEqual({ a: { t0: 20.3 } });
		expect(compacted.wd).toEqual({
			a: { t0: { avg: 200.7, dev: 10.4 } },
		});
		expect(compacted.hd).toEqual({
			a: { t0: { avg: 20.7, dev: 3.4 } },
		});
	});

	it("serializes compacted snapshot to JSON", () => {
		const json = serializePersistedSnapshot(
			{
				w: { card: { t0: 120.26 } },
			},
			{ decimals: 1 },
		);

		expect(JSON.parse(json)).toEqual({
			c: {},
			w: { card: { t0: 120.3 } },
			h: {},
			wd: {},
			hd: {},
		});
	});
});
