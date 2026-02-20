import { describe, expect, it } from "vitest";
import { generateRegistry } from "./to-registry";

describe("generateRegistry", () => {
	it("generates an empty registry when no ids are provided", () => {
		const output = generateRegistry([]);

		expect(output).toContain(
			"export const registry: Record<string, ComponentType> = {};",
		);
		expect(output).not.toContain('from "./');
	});

	it("generates imports and mappings for provided ids", () => {
		const output = generateRegistry(["user-card", "profile_header"]);

		expect(output).toContain('import { UserCardSkeleton } from "./user-card";');
		expect(output).toContain(
			'import { ProfileHeaderSkeleton } from "./profile_header";',
		);
		expect(output).toContain('"user-card": UserCardSkeleton,');
		expect(output).toContain('"profile_header": ProfileHeaderSkeleton,');
	});

	it("does not include captureConfig by default", () => {
		const output = generateRegistry(["user-card"]);
		expect(output).not.toContain("__captureConfig__");
	});

	it("includes captureConfig when captureUrl option is provided", () => {
		const output = generateRegistry(["user-card"], {
			captureUrl: "http://127.0.0.1:9000",
		});

		expect(output).toContain("__captureConfig__");
		expect(output).toContain('"http://127.0.0.1:9000"');
		expect(output).toContain("enumerable: false");
	});

	it("throws on invalid id", () => {
		expect(() => generateRegistry(["../bad-path"])).toThrow(
			"Invalid skeleton id",
		);
	});

	it("includes captureConfig on empty registry", () => {
		const output = generateRegistry([], {
			captureUrl: "http://127.0.0.1:7331",
		});

		expect(output).toContain("__captureConfig__");
		expect(output).toContain('"http://127.0.0.1:7331"');
	});
});
