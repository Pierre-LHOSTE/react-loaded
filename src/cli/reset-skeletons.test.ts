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
import { resetSkeletons } from "./reset-skeletons";

const createdDirs: string[] = [];

afterEach(() => {
	for (const dir of createdDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	createdDirs.length = 0;
});

describe("resetSkeletons", () => {
	it("removes generated skeleton tsx files and recreates an empty registry", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-reset-"));
		createdDirs.push(outDir);

		writeFileSync(
			join(outDir, "user-card.tsx"),
			"export const a = 1;",
			"utf-8",
		);
		writeFileSync(
			join(outDir, "comment-card.tsx"),
			"export const b = 2;",
			"utf-8",
		);
		writeFileSync(join(outDir, "registry.ts"), "stale registry", "utf-8");

		const result = resetSkeletons(outDir);

		expect(result).toEqual({ removedCount: 2, createdDir: false });
		expect(existsSync(join(outDir, "user-card.tsx"))).toBe(false);
		expect(existsSync(join(outDir, "comment-card.tsx"))).toBe(false);
		expect(readFileSync(join(outDir, "registry.ts"), "utf-8")).toContain(
			"export const registry: Record<string, ComponentType> = {};",
		);
	});

	it("creates outDir and empty registry when outDir does not exist", () => {
		const parent = mkdtempSync(join(tmpdir(), "autoskeleton-reset-parent-"));
		const outDir = join(parent, "nested/generated/autoskeleton");
		createdDirs.push(parent);

		const result = resetSkeletons(outDir);

		expect(result).toEqual({ removedCount: 0, createdDir: true });
		expect(existsSync(outDir)).toBe(true);
		expect(readFileSync(join(outDir, "registry.ts"), "utf-8")).toContain(
			"export const registry: Record<string, ComponentType> = {};",
		);
	});

	it("does not remove non-tsx files", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-reset-"));
		createdDirs.push(outDir);

		writeFileSync(join(outDir, "notes.txt"), "keep me", "utf-8");
		writeFileSync(join(outDir, "component.ts"), "keep me too", "utf-8");
		writeFileSync(join(outDir, "sample.tsx"), "remove me", "utf-8");

		const result = resetSkeletons(outDir);

		expect(result.removedCount).toBe(1);
		expect(existsSync(join(outDir, "sample.tsx"))).toBe(false);
		expect(existsSync(join(outDir, "notes.txt"))).toBe(true);
		expect(existsSync(join(outDir, "component.ts"))).toBe(true);
	});

	it("handles empty directory with no tsx files", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-reset-"));
		createdDirs.push(outDir);

		const result = resetSkeletons(outDir);

		expect(result).toEqual({ removedCount: 0, createdDir: false });
		expect(readFileSync(join(outDir, "registry.ts"), "utf-8")).toContain(
			"export const registry: Record<string, ComponentType> = {};",
		);
	});

	it("preserves registry.ts file (does not count it as removed)", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-reset-"));
		createdDirs.push(outDir);

		writeFileSync(join(outDir, "registry.ts"), "old registry", "utf-8");
		writeFileSync(join(outDir, "card.tsx"), "export const c = 1;", "utf-8");

		const result = resetSkeletons(outDir);

		expect(result.removedCount).toBe(1);
		expect(existsSync(join(outDir, "registry.ts"))).toBe(true);
	});
});
