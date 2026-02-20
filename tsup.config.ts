import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		splitting: false,
		sourcemap: true,
		clean: true,
		external: ["react", "react-dom"],
		outDir: "dist",
		treeshake: true,
	},
	{
		entry: ["src/next/SkeletonCookieSync.tsx"],
		format: ["cjs", "esm"],
		dts: true,
		splitting: false,
		sourcemap: true,
		external: ["react", "react-dom"],
		outDir: "dist/next",
		banner: { js: '"use client";' },
	},
	{
		entry: ["src/next/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		splitting: false,
		sourcemap: true,
		external: ["react", "react-dom", "next"],
		outDir: "dist/next",
		treeshake: true,
	},
	{
		entry: { autoskeleton: "src/bin/autoskeleton.ts" },
		format: ["esm"],
		platform: "node",
		sourcemap: true,
		outDir: "dist",
		banner: { js: "#!/usr/bin/env node" },
	},
]);
