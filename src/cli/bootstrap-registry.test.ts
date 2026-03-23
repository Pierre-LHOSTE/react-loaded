// @vitest-environment node
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapRegistry } from "./bootstrap-registry";

const createdDirs: string[] = [];

afterEach(() => {
	for (const dir of createdDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	createdDirs.length = 0;
});

function makeTmpDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "react-loaded-v3-registry-"));
	createdDirs.push(dir);
	return dir;
}

describe("bootstrapRegistry", () => {
	it("creates the output directory and an empty registry when missing", () => {
		const outDir = join(makeTmpDir(), "nested", "generated", "skeletons");

		const result = bootstrapRegistry(outDir, "http://127.0.0.1:7331");

		expect(result).toEqual({ createdRegistry: true });
		expect(existsSync(join(outDir, "registry.ts"))).toBe(true);
		expect(readFileSync(join(outDir, "registry.ts"), "utf-8")).toContain(
			'url: "http://127.0.0.1:7331"',
		);
	});

	it("ignores non-.tsx files when generating the registry", () => {
		const outDir = makeTmpDir();
		writeFileSync(join(outDir, "readme.md"), "hello", "utf-8");
		writeFileSync(join(outDir, "config.json"), "{}", "utf-8");
		writeFileSync(join(outDir, "utils.ts"), "export const x = 1;", "utf-8");

		bootstrapRegistry(outDir, "http://127.0.0.1:7331");
		const registry = readFileSync(join(outDir, "registry.ts"), "utf-8");

		// No skeleton imports should be present — only the captureConfig entry
		expect(registry).not.toContain('from "./readme"');
		expect(registry).not.toContain('from "./config"');
		expect(registry).not.toContain('from "./utils"');
	});

	it("regenerates the registry from existing skeleton files", () => {
		const outDir = makeTmpDir();
		writeFileSync(
			join(outDir, "user-card.tsx"),
			"export const x = 1;",
			"utf-8",
		);
		writeFileSync(
			join(outDir, "post-card.tsx"),
			"export const y = 1;",
			"utf-8",
		);
		writeFileSync(join(outDir, "registry.ts"), "stale", "utf-8");

		const result = bootstrapRegistry(outDir, "http://127.0.0.1:9000");
		const registry = readFileSync(join(outDir, "registry.ts"), "utf-8");

		expect(result).toEqual({ createdRegistry: false });
		expect(registry).toContain(
			'import { PostCardSkeleton } from "./post-card";',
		);
		expect(registry).toContain(
			'import { UserCardSkeleton } from "./user-card";',
		);
		expect(registry).toContain('url: "http://127.0.0.1:9000"');
	});
});
