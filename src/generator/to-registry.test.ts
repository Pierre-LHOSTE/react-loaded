import { describe, expect, it } from "vitest";
import { generateRegistry } from "./to-registry";

describe("toExportName (via generateRegistry output)", () => {
	it("converts a simple kebab-case id to PascalCase + Skeleton suffix", () => {
		const output = generateRegistry(["user-card"]);

		expect(output).toContain("import { UserCardSkeleton }");
		expect(output).toContain('"user-card": UserCardSkeleton');
	});

	it("converts a single word id", () => {
		const output = generateRegistry(["profile"]);

		expect(output).toContain("import { ProfileSkeleton }");
		expect(output).toContain('"profile": ProfileSkeleton');
	});

	it("handles ids with special characters", () => {
		const output = generateRegistry(["my@comp!onent"]);

		expect(output).toContain("MyCompOnentSkeleton");
	});

	it("falls back to 'Skeleton' for ids with only special characters", () => {
		const output = generateRegistry(["@#$%"]);

		expect(output).toContain("import { Skeleton }");
		expect(output).toContain('"@#$%": Skeleton');
	});
});

describe("generateRegistry", () => {
	it("generates an empty registry when no ids are provided", () => {
		const output = generateRegistry([]);

		expect(output).toContain(
			"export const registry: Record<string, ComponentType<any>> = {};",
		);
		expect(output).not.toContain("import {");
	});

	it("generates import lines and registry entries for multiple ids", () => {
		const output = generateRegistry(["card", "avatar"]);

		expect(output).toContain('import { AvatarSkeleton } from "./avatar";');
		expect(output).toContain('import { CardSkeleton } from "./card";');
		expect(output).toContain('"avatar": AvatarSkeleton,');
		expect(output).toContain('"card": CardSkeleton,');
	});

	it("sorts ids alphabetically", () => {
		const output = generateRegistry(["zebra", "alpha", "middle"]);

		const alphaIdx = output.indexOf("alpha");
		const middleIdx = output.indexOf("middle");
		const zebraIdx = output.indexOf("zebra");

		expect(alphaIdx).toBeLessThan(middleIdx);
		expect(middleIdx).toBeLessThan(zebraIdx);
	});

	it("always imports ComponentType from react", () => {
		const output = generateRegistry([]);

		expect(output).toContain('import type { ComponentType } from "react";');
	});

	it("adds captureConfig metadata when captureUrl is provided", () => {
		const output = generateRegistry(["card"], {
			captureUrl: "http://localhost:3001",
		});

		expect(output).toContain("__captureConfig__");
		expect(output).toContain('"http://localhost:3001"');
	});

	it("does not add captureConfig when captureUrl is omitted", () => {
		const output = generateRegistry(["card"]);

		expect(output).not.toContain("__captureConfig__");
	});

	it("closes the registry object for non-empty registries", () => {
		const output = generateRegistry(["card"]);

		expect(output).toContain("};");
	});
});
