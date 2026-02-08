export function isDevEnv(): boolean {
	const maybeGlobal = globalThis as unknown as Record<string, unknown>;

	// Manual override for environments where NODE_ENV isn't injected.
	// Example: `globalThis.__REACT_LOADED_DEV__ = true`.
	const override = maybeGlobal.__REACT_LOADED_DEV__;
	if (typeof override === "boolean") return override;

	// Common global used by some toolchains/runtimes.
	const devFlag = maybeGlobal.__DEV__;
	if (typeof devFlag === "boolean") return devFlag;

	const maybeProcess = (globalThis as unknown as { process?: unknown }).process;
	const nodeEnv =
		typeof maybeProcess === "object" && maybeProcess !== null
			? (maybeProcess as { env?: { NODE_ENV?: unknown } }).env?.NODE_ENV
			: undefined;

	if (typeof nodeEnv === "string") {
		return nodeEnv !== "production";
	}

	// No environment detected — assume production (convention: opt-in to dev mode).
	return false;
}
