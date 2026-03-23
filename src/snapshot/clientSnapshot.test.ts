import { beforeEach, describe, expect, it } from "vitest";
import {
	getClientPersistedSnapshot,
	serializeClientPersistedSnapshot,
} from "./clientSnapshot";

const STORAGE_KEY = "react-loaded";

import { requireValue } from "../utils/require-value";

describe("getClientPersistedSnapshot", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns empty snapshot when localStorage is empty", () => {
		const result = getClientPersistedSnapshot();
		expect(result).toEqual({
			c: {},
			w: {},
			h: {},
			wd: {},
			hd: {},
		});
	});

	it("reads and compacts data from localStorage", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { feed: 5 },
				w: { card: { t0: 120 } },
				h: { card: { t0: 24 } },
				wd: { feed: { t0: { avg: 100, dev: 10 } } },
				hd: {},
			}),
		);

		const result = getClientPersistedSnapshot();
		expect(result.c).toEqual({ feed: 5 });
		expect(result.w).toEqual({ card: { t0: 120 } });
		expect(result.h).toEqual({ card: { t0: 24 } });
		expect(result.wd).toEqual({ feed: { t0: { avg: 100, dev: 10 } } });
	});

	it("applies compact options", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { a: 1, b: 2, c: 3 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		const result = getClientPersistedSnapshot({ maxSkeletons: 2 });
		expect(
			Object.keys(requireValue(result.c, "Expected compacted counts to exist")),
		).toHaveLength(2);
	});
});

describe("serializeClientPersistedSnapshot", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns JSON string of client snapshot", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: { feed: 3 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		const json = serializeClientPersistedSnapshot();
		const parsed = JSON.parse(json);
		expect(parsed.c).toEqual({ feed: 3 });
	});
});
