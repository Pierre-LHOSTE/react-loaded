// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig, resolveConfig } from "./load-config";

const createdDirs: string[] = [];

afterEach(() => {
	for (const dir of createdDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	createdDirs.length = 0;
});

function makeTmpDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "react-loaded-v3-config-"));
	createdDirs.push(dir);
	return dir;
}

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

	it("throws on invalid ports", () => {
		expect(() => resolveConfig({ port: 0 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
		expect(() => resolveConfig({ port: -1 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
		expect(() => resolveConfig({ port: 70000 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
		expect(() => resolveConfig({ port: 1.5 }, "/project")).toThrow(
			"expected integer 1-65535",
		);
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

	it("loads an explicit config path relative to cwd", async () => {
		const dir = makeTmpDir();
		writeFileSync(
			join(dir, "custom.config.mjs"),
			'export default { port: 4567, outDir: "generated/custom" };',
		);

		const config = await loadConfig(dir, "custom.config.mjs");

		expect(config).toEqual({ port: 4567, outDir: "generated/custom" });
	});

	it("auto-discovers react-loaded.config before loaded.config", async () => {
		const dir = makeTmpDir();
		writeFileSync(
			join(dir, "react-loaded.config.mjs"),
			"export default { port: 1111 };",
		);
		writeFileSync(
			join(dir, "loaded.config.mjs"),
			"export default { port: 2222 };",
		);

		const config = await loadConfig(dir);

		expect(config.port).toBe(1111);
	});

	it("supports named exports", async () => {
		const dir = makeTmpDir();
		writeFileSync(
			join(dir, "react-loaded.config.mjs"),
			'export const enabled = false; export const allowedHosts = ["myhost.local"];',
		);

		const config = await loadConfig(dir);

		expect(config.enabled).toBe(false);
		expect(config.allowedHosts).toEqual(["myhost.local"]);
	});
});
