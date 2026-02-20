import {
	existsSync,
	readdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ReactLoadedConfig } from "./define-config";

export type { ReactLoadedConfig };

export interface ResolvedConfig {
	port: number;
	outDir: string;
	allowedHosts: string[];
}

const DEFAULT_PORT = 7331;
const DEFAULT_OUT_DIR = "src/generated/skeletons";
const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "::1"];

const CONFIG_FILES = [
	"react-loaded.config.ts",
	"react-loaded.config.js",
	"react-loaded.config.mjs",
	"loaded.config.ts",
	"loaded.config.js",
	"loaded.config.mjs",
];

export function resolveConfig(
	raw: ReactLoadedConfig,
	cwd: string,
): ResolvedConfig {
	const port = raw.port ?? DEFAULT_PORT;
	const outDir = resolve(cwd, raw.outDir ?? DEFAULT_OUT_DIR);
	const allowedHosts = raw.allowedHosts ?? DEFAULT_ALLOWED_HOSTS;

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(
			`Invalid port ${JSON.stringify(raw.port)}: expected integer 1-65535`,
		);
	}

	return { port, outDir, allowedHosts };
}

async function importConfig(filePath: string): Promise<ReactLoadedConfig> {
	// .mjs/.mts extensions are always treated as ESM by Node — no warning.
	// For .ts/.js files (where Node depends on the nearest package.json "type"
	// field), we copy to a temp file with the explicit ESM extension so the
	// consumer doesn't need "type": "module" in their package.json.
	const needsTempFile = filePath.endsWith(".ts") || filePath.endsWith(".js");
	const tempExt = filePath.endsWith(".ts") ? ".mts" : ".mjs";
	const configDir = dirname(filePath);

	// Clean up any orphaned temp files from previous crashed runs
	try {
		for (const f of readdirSync(configDir)) {
			if (f.startsWith(".loaded-config-tmp-")) {
				try {
					unlinkSync(join(configDir, f));
				} catch {}
			}
		}
	} catch {}

	const tempFile = needsTempFile
		? join(configDir, `.loaded-config-tmp-${process.pid}${tempExt}`)
		: null;

	try {
		const target = tempFile ?? filePath;
		if (tempFile) {
			writeFileSync(tempFile, readFileSync(filePath, "utf-8"), "utf-8");
		}
		const mod = await import(pathToFileURL(target).href);
		return mod.default ?? mod;
	} catch (error) {
		if (
			filePath.endsWith(".ts") &&
			error instanceof Error &&
			error.message.includes("Unknown file extension")
		) {
			throw new Error(
				[
					`Failed to load ${filePath}`,
					'  TypeScript config requires Node 23.6+ or NODE_OPTIONS="--experimental-strip-types"',
					"  Alternatively, use a .js config file.",
				].join("\n"),
			);
		}
		throw error;
	} finally {
		if (tempFile) {
			try {
				unlinkSync(tempFile);
			} catch {}
		}
	}
}

export async function loadConfig(
	cwd: string,
	configPath?: string,
): Promise<ReactLoadedConfig> {
	if (configPath) {
		const resolved = resolve(cwd, configPath);
		if (!existsSync(resolved)) {
			throw new Error(`Config file not found: ${configPath}`);
		}
		return importConfig(resolved);
	}

	for (const file of CONFIG_FILES) {
		const resolved = resolve(cwd, file);
		if (existsSync(resolved)) {
			return importConfig(resolved);
		}
	}

	return {};
}
