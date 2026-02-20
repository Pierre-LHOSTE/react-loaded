import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { handleCapture } from "./cli/handle-capture";
import { resetSkeletons } from "./cli/reset-skeletons";
import { loadConfig, resolveConfig } from "./config";
import { generateRegistry } from "./generator/to-registry";
import { startServer } from "./server/http-server";

function parseCliArgs(args: string[]): {
	command: string;
	configPath?: string;
} {
	const command = args[0] ?? "";
	let configPath: string | undefined;

	for (let i = 1; i < args.length; i++) {
		if (args[i] === "--config") {
			if (!args[i + 1] || args[i + 1].startsWith("--")) {
				throw new Error(
					"--config requires a file path, e.g. --config react-loaded.config.ts",
				);
			}
			configPath = args[i + 1];
			i++;
		}
	}

	return { command, configPath };
}

function ensureDir(dir: string): void {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

export async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const { command, configPath } = parseCliArgs(args);

	if (command !== "dev" && command !== "reset") {
		console.log(
			[
				"Usage:",
				"  autoskeleton dev [--config react-loaded.config.ts]",
				"  autoskeleton reset [--config react-loaded.config.ts]",
			].join("\n"),
		);
		process.exit(1);
	}

	const rawConfig = await loadConfig(process.cwd(), configPath);
	const { port, outDir, allowedHosts } = resolveConfig(
		rawConfig,
		process.cwd(),
	);

	if (command === "reset") {
		const result = resetSkeletons(outDir);
		if (result.createdDir) {
			console.log(`  Created output directory: ${outDir}`);
		}
		console.log(`  Reset skeletons: removed ${result.removedCount} file(s)`);
		console.log(`  Registry reset: ${outDir}/registry.ts`);
		return;
	}

	ensureDir(outDir);

	const captureUrl = `http://127.0.0.1:${port}`;

	const registryFile = join(outDir, "registry.ts");
	if (!existsSync(registryFile)) {
		writeFileSync(registryFile, generateRegistry([], { captureUrl }), "utf-8");
		console.log(`  Created empty registry: ${outDir}/registry.ts`);
	} else {
		// Re-generate registry to ensure __captureConfig__ reflects current port
		const ids = readdirSync(outDir)
			.filter((f) => f.endsWith(".tsx") && f !== "registry.ts")
			.map((f) => f.replace(/\.tsx$/, ""))
			.sort();
		writeFileSync(registryFile, generateRegistry(ids, { captureUrl }), "utf-8");
	}

	console.log("\n  react-loaded dev\n");

	await startServer({
		port,
		allowedHosts,
		onCapture: (payload) => handleCapture(payload, outDir, captureUrl),
	});
}
