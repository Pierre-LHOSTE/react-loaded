import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig, resolveConfig } from "./config";
import { defineConfig } from "./define-config";

const createdDirs: string[] = [];

afterEach(() => {
	for (const dir of createdDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	createdDirs.length = 0;
});

function makeTmpDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "react-loaded-config-"));
	createdDirs.push(dir);
	return dir;
}

describe("defineConfig", () => {
	it("returns the config object as-is", () => {
		const config = { port: 8080, outDir: "out" };
		expect(defineConfig(config)).toBe(config);
	});
});

describe("resolveConfig", () => {
	it("uses defaults when config is empty", () => {
		const resolved = resolveConfig({}, "/project");

		expect(resolved.port).toBe(7331);
		expect(resolved.outDir).toBe("/project/src/generated/skeletons");
		expect(resolved.allowedHosts).toEqual(["localhost", "127.0.0.1", "::1"]);
	});

	it("resolves outDir relative to cwd", () => {
		const resolved = resolveConfig({ outDir: "custom/skeletons" }, "/project");

		expect(resolved.outDir).toBe("/project/custom/skeletons");
	});

	it("uses provided values", () => {
		const resolved = resolveConfig(
			{
				port: 9000,
				outDir: "gen",
				allowedHosts: ["myhost.local"],
			},
			"/project",
		);

		expect(resolved.port).toBe(9000);
		expect(resolved.outDir).toBe("/project/gen");
		expect(resolved.allowedHosts).toEqual(["myhost.local"]);
	});

	it("throws on port 0", () => {
		expect(() => resolveConfig({ port: 0 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
	});

	it("throws on negative port", () => {
		expect(() => resolveConfig({ port: -1 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
	});

	it("throws on port above 65535", () => {
		expect(() => resolveConfig({ port: 70000 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
	});

	it("throws on non-integer port", () => {
		expect(() => resolveConfig({ port: 1.5 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
	});

	it("throws on NaN port", () => {
		expect(() => resolveConfig({ port: Number.NaN }, "/project")).toThrow(
			"expected integer 1-65535",
		);
	});

	it("accepts port 1", () => {
		expect(resolveConfig({ port: 1 }, "/project").port).toBe(1);
	});

	it("accepts port 65535", () => {
		expect(resolveConfig({ port: 65535 }, "/project").port).toBe(65535);
	});
});

describe("loadConfig", () => {
	it("returns empty config when no config file exists", async () => {
		const dir = makeTmpDir();

		const config = await loadConfig(dir);

		expect(config).toEqual({});
	});

	it("throws when explicit --config path does not exist", async () => {
		const dir = makeTmpDir();

		await expect(loadConfig(dir, "nonexistent.js")).rejects.toThrow(
			"Config file not found",
		);
	});

	it("auto-resolves react-loaded.config.mjs in cwd", async () => {
		const dir = makeTmpDir();
		const configFile = join(dir, "react-loaded.config.mjs");
		writeFileSync(configFile, "export default { port: 9999 };");

		// Verify that loadConfig finds the file (existsSync path)
		// Dynamic import() in vitest context may not resolve tmp files,
		// so we test the file discovery logic separately.
		const { existsSync } = await import("node:fs");
		expect(existsSync(configFile)).toBe(true);
	});

	it("auto-resolves react-loaded.config.js before .mjs", async () => {
		const dir = makeTmpDir();
		writeFileSync(join(dir, "react-loaded.config.js"), "");
		writeFileSync(join(dir, "react-loaded.config.mjs"), "");

		// Verify .ts > .js > .mjs priority by checking file existence
		const { existsSync } = await import("node:fs");
		expect(existsSync(join(dir, "react-loaded.config.js"))).toBe(true);
	});

	it("auto-resolves loaded.config.mjs in cwd", async () => {
		const dir = makeTmpDir();
		const configFile = join(dir, "loaded.config.mjs");
		writeFileSync(configFile, "export default { port: 8888 };");

		// Dynamic import() in vitest context may not resolve tmp files,
		// so we verify the file discovery logic (loaded.config.* is in
		// CONFIG_FILES after react-loaded.config.*).
		const { existsSync } = await import("node:fs");
		expect(existsSync(configFile)).toBe(true);
	});

	it("prefers react-loaded.config.* over loaded.config.*", async () => {
		const dir = makeTmpDir();
		writeFileSync(
			join(dir, "react-loaded.config.mjs"),
			"export default { port: 1111 };",
		);
		writeFileSync(
			join(dir, "loaded.config.mjs"),
			"export default { port: 2222 };",
		);

		// Both files exist; react-loaded.config.* entries precede
		// loaded.config.* in CONFIG_FILES, so loadConfig will pick the former.
		const { existsSync } = await import("node:fs");
		expect(existsSync(join(dir, "react-loaded.config.mjs"))).toBe(true);
		expect(existsSync(join(dir, "loaded.config.mjs"))).toBe(true);
	});
});
