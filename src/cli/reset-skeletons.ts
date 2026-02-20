import {
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { generateRegistry } from "../generator/to-registry";

export interface ResetSkeletonsResult {
	removedCount: number;
	createdDir: boolean;
}

export function resetSkeletons(outDir: string): ResetSkeletonsResult {
	let createdDir = false;
	if (!existsSync(outDir)) {
		mkdirSync(outDir, { recursive: true });
		createdDir = true;
	}

	const removableFiles = readdirSync(outDir).filter(
		(file) => file.endsWith(".tsx") && file !== "registry.ts",
	);

	for (const file of removableFiles) {
		rmSync(join(outDir, file), { force: true });
	}

	writeFileSync(join(outDir, "registry.ts"), generateRegistry([]), "utf-8");

	return {
		removedCount: removableFiles.length,
		createdDir,
	};
}
