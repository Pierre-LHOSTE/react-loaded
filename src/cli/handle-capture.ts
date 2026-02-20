import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { generateComponent } from "../generator/to-jsx";
import { generateRegistry } from "../generator/to-registry";
import type { CapturePayload } from "../types";

export type CaptureResult = "no_change" | "updated" | "generated";

function getExistingIds(outDir: string): string[] {
	if (!existsSync(outDir)) return [];
	return readdirSync(outDir)
		.filter((f) => f.endsWith(".tsx") && f !== "registry.ts")
		.map((f) => f.replace(/\.tsx$/, ""));
}

export function handleCapture(
	payload: CapturePayload,
	outDir: string,
	captureUrl?: string,
): CaptureResult {
	const { id, tree } = payload;
	const resolvedOutDir = resolve(outDir);
	const componentFile = resolve(join(outDir, `${id}.tsx`));

	const rel = relative(resolvedOutDir, componentFile);
	if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
		throw new Error(`Path traversal detected: "${id}" escapes outDir`);
	}
	const registryFile = join(outDir, "registry.ts");
	const existedBeforeWrite = existsSync(componentFile);

	const newContent = generateComponent(id, tree);

	// Check if file exists and content is identical.
	if (existedBeforeWrite) {
		const existing = readFileSync(componentFile, "utf-8");
		if (existing === newContent) {
			console.log(`  Captured: "${id}" - no changes`);
			return "no_change";
		}
		console.log(`  Captured: "${id}" - updated`);
	} else {
		console.log(`  Captured: "${id}" - generated`);
	}

	writeFileSync(componentFile, newContent, "utf-8");

	const ids = getExistingIds(outDir);
	if (!ids.includes(id)) ids.push(id);
	ids.sort();

	const newRegistry = generateRegistry(
		ids,
		captureUrl ? { captureUrl } : undefined,
	);
	const existingRegistry = existsSync(registryFile)
		? readFileSync(registryFile, "utf-8")
		: "";

	if (newRegistry !== existingRegistry) {
		writeFileSync(registryFile, newRegistry, "utf-8");
	}
	console.log(`  Registry: ${ids.length} skeleton(s)\n`);

	return existedBeforeWrite ? "updated" : "generated";
}
