import {
	existsSync,
	readdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ReactLoadedConfig } from "../types";

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
	const needsTempFile = filePath.endsWith(".ts") || filePath.endsWith(".js");
	const tempExt = filePath.endsWith(".ts") ? ".mts" : ".mjs";
	const configDir = dirname(filePath);

	try {
		for (const fileName of readdirSync(configDir)) {
			if (fileName.startsWith(".loaded-config-tmp-")) {
				try {
					unlinkSync(join(configDir, fileName));
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
		const absolutePath = resolve(cwd, configPath);
		if (!existsSync(absolutePath)) {
			throw new Error(`Config file not found: ${configPath}`);
		}
		return importConfig(absolutePath);
	}

	for (const fileName of CONFIG_FILES) {
		const absolutePath = resolve(cwd, fileName);
		if (existsSync(absolutePath)) {
			return importConfig(absolutePath);
		}
	}

	return {};
}
