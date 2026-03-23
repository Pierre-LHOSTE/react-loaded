import { bootstrapRegistry } from "./bootstrap-registry";
import { createDevServer } from "./dev-server";
import { loadConfig, resolveConfig } from "./load-config";
import { resetSkeletons } from "./reset-skeletons";

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

	const captureUrl = `http://127.0.0.1:${port}`;
	const bootstrap = bootstrapRegistry(outDir, captureUrl);
	const server = createDevServer({ port, outDir, allowedHosts });
	await server.start();

	if (bootstrap.createdRegistry) {
		console.log(`  Created empty registry: ${outDir}/registry.ts`);
	}
	console.log(`  autoskeleton dev server listening on port ${server.port}`);

	const shutdown = async () => {
		await server.stop();
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}
