import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("next/index.ts — server bundle safety", () => {
	const source = readFileSync(resolve(__dirname, "index.ts"), "utf-8");

	it("does not import from react (no hooks in server bundle)", () => {
		// The next/index.ts server entry must never import from "react"
		// because it runs in a Server Component context where hooks are forbidden.
		expect(source).not.toMatch(/from\s+["']react["']/);
	});

	it("does not re-export SkeletonCookieSync (client-only component)", () => {
		// SkeletonCookieSync uses useEffect and must only be in the
		// next/client entry point (dist/next/SkeletonCookieSync.js).
		expect(source).not.toContain("SkeletonCookieSync");
	});

	it("does not import useSkeletonCookieSync", () => {
		expect(source).not.toContain("useSkeletonCookieSync");
	});

	it("exports getServerSnapshot", () => {
		expect(source).toContain("getServerSnapshot");
	});

	it("exports GetServerSnapshotOptions type", () => {
		expect(source).toContain("GetServerSnapshotOptions");
	});

	it("exports SyncSnapshotToCookieOptions type", () => {
		// Type-only export is safe — it's erased at build time
		expect(source).toContain("SyncSnapshotToCookieOptions");
	});
});
