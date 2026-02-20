import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "../hooks/storage";
import {
	getClientPersistedSnapshot,
	serializeClientPersistedSnapshot,
} from "./persistedSnapshot";

describe("client persistedSnapshot", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("reads the localStorage payload as snapshot", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: { list: 3 },
				w: { card: { t0: 120.2 } },
				h: { card: { t0: 20.5 } },
				wd: { list: { t0: { avg: 120.2, dev: 10.3 } } },
				hd: { list: { t0: { avg: 20, dev: 3 } } },
			}),
		);

		expect(getClientPersistedSnapshot()).toEqual({
			c: { list: 3 },
			w: { card: { t0: 120.2 } },
			h: { card: { t0: 20.5 } },
			wd: { list: { t0: { avg: 120.2, dev: 10.3 } } },
			hd: { list: { t0: { avg: 20, dev: 3 } } },
		});
	});

	it("compacts snapshot with options", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: { a: 1, b: 2 },
				w: { a: { t0: 120.26, t1: 90.99 } },
				h: { a: { t0: 20.26 } },
				wd: { a: { t0: { avg: 200.66, dev: 10.44 } } },
				hd: { a: { t0: { avg: 20.66, dev: 3.44 } } },
			}),
		);

		expect(
			getClientPersistedSnapshot({
				maxSkeletons: 1,
				maxTextKeysPerSkeleton: 1,
				decimals: 1,
			}),
		).toEqual({
			c: { a: 1 },
			w: { a: { t0: 120.3 } },
			h: { a: { t0: 20.3 } },
			wd: { a: { t0: { avg: 200.7, dev: 10.4 } } },
			hd: { a: { t0: { avg: 20.7, dev: 3.4 } } },
		});
	});

	it("serializes snapshot to JSON", () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 1,
				c: { list: 3 },
				w: {},
				h: {},
				wd: {},
				hd: {},
			}),
		);

		expect(JSON.parse(serializeClientPersistedSnapshot())).toEqual({
			c: { list: 3 },
			w: {},
			h: {},
			wd: {},
			hd: {},
		});
	});
});
