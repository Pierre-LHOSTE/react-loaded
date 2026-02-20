import { describe, expect, it } from "vitest";
import { parseSnapshotCookie } from "./parseSnapshotCookie";

describe("parseSnapshotCookie", () => {
	it("parses a URI-encoded cookie value", () => {
		const snapshot = {
			c: { list: 3 },
			w: { card: { t0: 120.3 } },
			wd: { list: { t0: { avg: 120.3, dev: 10.8 } } },
		};
		const encoded = encodeURIComponent(JSON.stringify(snapshot));
		const result = parseSnapshotCookie(encoded);

		expect(result.c).toEqual({ list: 3 });
		expect(result.w).toEqual({ card: { t0: 120.3 } });
		expect(result.wd).toEqual({
			list: { t0: { avg: 120.3, dev: 10.8 } },
		});
	});

	it("parses a non-encoded JSON string", () => {
		const snapshot = { c: { list: 5 }, w: {}, wd: {} };
		const result = parseSnapshotCookie(JSON.stringify(snapshot));

		expect(result.c).toEqual({ list: 5 });
	});

	it("returns empty snapshot for null", () => {
		expect(parseSnapshotCookie(null)).toEqual({});
	});

	it("returns empty snapshot for undefined", () => {
		expect(parseSnapshotCookie(undefined)).toEqual({});
	});

	it("returns empty snapshot for invalid string", () => {
		expect(parseSnapshotCookie("not-json{{{")).toEqual({});
	});

	it("returns empty snapshot for malformed URI encoding", () => {
		expect(parseSnapshotCookie("%E0%A4%A")).toEqual({});
	});
});
