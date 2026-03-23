import { describe, expect, it } from "vitest";
import { defineConfig } from "./define-config";

describe("defineConfig", () => {
	it("returns the config object as-is", () => {
		const config = { enabled: true };
		expect(defineConfig(config)).toBe(config);
	});

	it("returns an empty config", () => {
		const config = {};
		expect(defineConfig(config)).toBe(config);
	});

	it("preserves enabled=false", () => {
		const config = { enabled: false };
		const result = defineConfig(config);
		expect(result.enabled).toBe(false);
	});

	it("preserves port option", () => {
		const config = { port: 4000 };
		const result = defineConfig(config);
		expect(result.port).toBe(4000);
	});

	it("preserves outDir option", () => {
		const config = { outDir: "src/custom-skeletons" };
		const result = defineConfig(config);
		expect(result.outDir).toBe("src/custom-skeletons");
	});
});
