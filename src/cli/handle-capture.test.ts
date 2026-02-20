import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { CapturePayload } from "../types";
import { handleCapture } from "./handle-capture";

function makePayload(id: string, text: string): CapturePayload {
	return {
		id,
		timestamp: 1,
		tree: {
			tag: "div",
			className: "",
			style: {},
			attributes: {},
			nodeType: "layout",
			children: [
				{
					tag: "span",
					className: "",
					style: {},
					attributes: {},
					nodeType: "text",
					textContent: text,
					children: [],
				},
			],
		},
	};
}

const createdDirs: string[] = [];

afterEach(() => {
	for (const dir of createdDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	createdDirs.length = 0;
});

describe("handleCapture", () => {
	it("returns generated when component file did not exist before write", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-handle-capture-"));
		createdDirs.push(outDir);

		const result = handleCapture(makePayload("user-card", "Initial"), outDir);

		expect(result).toBe("generated");
		expect(readFileSync(join(outDir, "registry.ts"), "utf-8")).toContain(
			"user-card",
		);
	});

	it("returns updated only when component file existed and content changed", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-handle-capture-"));
		createdDirs.push(outDir);

		const first = handleCapture(makePayload("user-card", "Initial"), outDir);
		const second = handleCapture(makePayload("user-card", "Changed"), outDir);

		expect(first).toBe("generated");
		expect(second).toBe("updated");
	});

	it("returns no_change when component content is unchanged", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-handle-capture-"));
		createdDirs.push(outDir);

		handleCapture(makePayload("user-card", "Initial"), outDir);
		const result = handleCapture(makePayload("user-card", "Initial"), outDir);

		expect(result).toBe("no_change");
	});

	it("handles multiple IDs and includes all in registry", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-handle-capture-"));
		createdDirs.push(outDir);

		handleCapture(makePayload("user-card", "User"), outDir);
		handleCapture(makePayload("comment-card", "Comment"), outDir);

		const registry = readFileSync(join(outDir, "registry.ts"), "utf-8");
		expect(registry).toContain("user-card");
		expect(registry).toContain("comment-card");
	});

	it("sorts IDs alphabetically in registry", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-handle-capture-"));
		createdDirs.push(outDir);

		handleCapture(makePayload("zebra-card", "Z"), outDir);
		handleCapture(makePayload("alpha-card", "A"), outDir);

		const registry = readFileSync(join(outDir, "registry.ts"), "utf-8");
		const alphaIndex = registry.indexOf("alpha-card");
		const zebraIndex = registry.indexOf("zebra-card");
		expect(alphaIndex).toBeLessThan(zebraIndex);
	});

	it("throws on path traversal attempt", () => {
		const outDir = mkdtempSync(join(tmpdir(), "autoskeleton-handle-capture-"));
		createdDirs.push(outDir);

		expect(() =>
			handleCapture(makePayload("../../etc/passwd", "X"), outDir),
		).toThrow("Path traversal detected");
	});
});
