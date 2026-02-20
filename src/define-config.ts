export interface ReactLoadedConfig {
	port?: number;
	outDir?: string;
	allowedHosts?: string[];
}

export function defineConfig(config: ReactLoadedConfig): ReactLoadedConfig {
	return config;
}
