import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateRegistry } from "../generator/to-registry";

function ensureDir(dir: string): void {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

export interface BootstrapRegistryResult {
	createdRegistry: boolean;
}

export function bootstrapRegistry(
	outDir: string,
	captureUrl: string,
): BootstrapRegistryResult {
	ensureDir(outDir);

	const registryFile = join(outDir, "registry.ts");
	const createdRegistry = !existsSync(registryFile);
	const ids = readdirSync(outDir)
		.filter(
			(fileName) => fileName.endsWith(".tsx") && fileName !== "registry.ts",
		)
		.map((fileName) => fileName.replace(/\.tsx$/, ""))
		.sort();

	writeFileSync(registryFile, generateRegistry(ids, { captureUrl }), "utf-8");

	return { createdRegistry };
}
