import { beforeEach, describe, expect, it, vi } from "vitest";

const mockResetSkeletons = vi
	.fn()
	.mockReturnValue({ createdDir: false, removedCount: 0 });
const mockBootstrapRegistry = vi
	.fn()
	.mockReturnValue({ createdRegistry: false });

const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);
const mockCreateDevServer = vi.fn().mockReturnValue({
	start: mockStart,
	stop: mockStop,
	port: 7331,
});

const mockLoadConfig = vi.fn().mockResolvedValue({});

vi.mock("./reset-skeletons", () => ({
	resetSkeletons: mockResetSkeletons,
}));

vi.mock("./dev-server", () => ({
	createDevServer: mockCreateDevServer,
}));

vi.mock("./bootstrap-registry", () => ({
	bootstrapRegistry: mockBootstrapRegistry,
}));

vi.mock("./load-config", () => ({
	loadConfig: mockLoadConfig,
	resolveConfig: vi.fn(
		(config: { port?: number; outDir?: string; allowedHosts?: string[] }) => ({
			port: config.port ?? 7331,
			outDir: config.outDir ?? `${process.cwd()}/src/generated/skeletons`,
			allowedHosts: config.allowedHosts ?? ["localhost", "127.0.0.1", "::1"],
		}),
	),
}));

beforeEach(() => {
	vi.restoreAllMocks();
	mockResetSkeletons.mockClear();
	mockResetSkeletons.mockReturnValue({ createdDir: false, removedCount: 0 });
	mockBootstrapRegistry.mockClear();
	mockBootstrapRegistry.mockReturnValue({ createdRegistry: false });
	mockCreateDevServer.mockClear();
	mockCreateDevServer.mockReturnValue({
		start: mockStart,
		stop: mockStop,
		port: 7331,
	});
	mockStart.mockClear();
	mockStart.mockResolvedValue(undefined);
	mockStop.mockClear();
	mockLoadConfig.mockClear();
	mockLoadConfig.mockResolvedValue({});
});

describe("main – error cases", () => {
	it("exits with code 1 when no command is provided", async () => {
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit");
		});
		vi.spyOn(console, "log").mockImplementation(() => {});

		process.argv = ["node", "autoskeleton"];
		const { main } = await import("./main");

		await expect(main()).rejects.toThrow("process.exit");
		expect(mockExit).toHaveBeenCalledWith(1);
	});

	it("exits with code 1 on unknown command", async () => {
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit");
		});
		vi.spyOn(console, "log").mockImplementation(() => {});

		process.argv = ["node", "autoskeleton", "unknown"];
		const { main } = await import("./main");

		await expect(main()).rejects.toThrow("process.exit");
		expect(mockExit).toHaveBeenCalledWith(1);
	});

	it("throws when --config is provided without a value", async () => {
		process.argv = ["node", "autoskeleton", "dev", "--config"];
		const { main } = await import("./main");

		await expect(main()).rejects.toThrow("--config requires a file path");
	});

	it("throws when --config is followed by another flag", async () => {
		process.argv = ["node", "autoskeleton", "dev", "--config", "--foo"];
		const { main } = await import("./main");

		await expect(main()).rejects.toThrow("--config requires a file path");
	});
});

describe("main – reset command", () => {
	it("calls resetSkeletons with the output directory", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "reset"];

		const { main } = await import("./main");
		await main();

		expect(mockResetSkeletons).toHaveBeenCalledTimes(1);
		expect(mockResetSkeletons.mock.calls[0][0]).toMatch(
			/src\/generated\/skeletons$/,
		);
	});

	it("uses custom outDir from config for reset", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		mockLoadConfig.mockResolvedValue({ outDir: "custom/skeletons" });
		process.argv = [
			"node",
			"autoskeleton",
			"reset",
			"--config",
			"my.config.ts",
		];

		const { main } = await import("./main");
		await main();

		expect(mockLoadConfig).toHaveBeenCalledWith(process.cwd(), "my.config.ts");
		expect(mockResetSkeletons).toHaveBeenCalledTimes(1);
		expect(mockResetSkeletons.mock.calls[0][0]).toMatch(/custom\/skeletons$/);
	});

	it("logs created directory when createdDir is true", async () => {
		mockResetSkeletons.mockReturnValue({ createdDir: true, removedCount: 0 });
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "reset"];

		const { main } = await import("./main");
		await main();

		const logCalls = logSpy.mock.calls.map((c) => c[0]);
		expect(
			logCalls.some((msg: string) => msg.includes("Created output directory")),
		).toBe(true);
	});

	it("logs removed file count", async () => {
		mockResetSkeletons.mockReturnValue({
			createdDir: false,
			removedCount: 5,
		});
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "reset"];

		const { main } = await import("./main");
		await main();

		const logCalls = logSpy.mock.calls.map((c) => c[0]);
		expect(
			logCalls.some((msg: string) => msg.includes("removed 5 file(s)")),
		).toBe(true);
	});
});

describe("main – dev command", () => {
	it("starts dev server with default port 7331", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "dev"];

		const { main } = await import("./main");
		await main();

		expect(mockCreateDevServer).toHaveBeenCalledTimes(1);
		expect(mockLoadConfig).toHaveBeenCalledWith(process.cwd(), undefined);
		const opts = mockCreateDevServer.mock.calls[0][0];
		expect(opts.port).toBe(7331);
		expect(opts.outDir).toMatch(/src\/generated\/skeletons$/);
		expect(mockStart).toHaveBeenCalledTimes(1);
	});

	it("uses custom port from config", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		mockLoadConfig.mockResolvedValue({ port: 9000 });
		process.argv = ["node", "autoskeleton", "dev", "--config", "my.config.ts"];

		const { main } = await import("./main");
		await main();

		expect(mockLoadConfig).toHaveBeenCalledWith(process.cwd(), "my.config.ts");
		const opts = mockCreateDevServer.mock.calls[0][0];
		expect(opts.port).toBe(9000);
	});

	it("passes custom allowedHosts from config", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		mockLoadConfig.mockResolvedValue({ allowedHosts: ["myhost.local"] });
		process.argv = ["node", "autoskeleton", "dev", "--config", "my.config.ts"];

		const { main } = await import("./main");
		await main();

		const opts = mockCreateDevServer.mock.calls[0][0];
		expect(opts.allowedHosts).toEqual(["myhost.local"]);
	});

	it("uses default allowedHosts when config does not provide them", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "dev"];

		const { main } = await import("./main");
		await main();

		const opts = mockCreateDevServer.mock.calls[0][0];
		expect(opts.allowedHosts).toEqual(["localhost", "127.0.0.1", "::1"]);
	});

	it("uses custom outDir from config", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		mockLoadConfig.mockResolvedValue({ outDir: "custom/skeletons" });
		process.argv = ["node", "autoskeleton", "dev", "--config", "my.config.ts"];

		const { main } = await import("./main");
		await main();

		const opts = mockCreateDevServer.mock.calls[0][0];
		expect(opts.outDir).toMatch(/custom\/skeletons$/);
	});

	it("does not call resetSkeletons", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "dev"];

		const { main } = await import("./main");
		await main();

		expect(mockResetSkeletons).not.toHaveBeenCalled();
	});

	it("loads config discovery when --config is not provided", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "dev"];

		const { main } = await import("./main");
		await main();

		expect(mockLoadConfig).toHaveBeenCalledWith(process.cwd(), undefined);
	});

	it("bootstraps the registry before starting the dev server", async () => {
		vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "dev"];

		const { main } = await import("./main");
		await main();

		expect(mockBootstrapRegistry).toHaveBeenCalledWith(
			expect.stringMatching(/src\/generated\/skeletons$/),
			"http://127.0.0.1:7331",
		);
		expect(mockStart).toHaveBeenCalledTimes(1);
	});

	it("logs when the bootstrap creates an empty registry", async () => {
		mockBootstrapRegistry.mockReturnValue({ createdRegistry: true });
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		process.argv = ["node", "autoskeleton", "dev"];

		const { main } = await import("./main");
		await main();

		const logCalls = logSpy.mock.calls.map((call) => call[0]);
		expect(
			logCalls.some((msg: string) => msg.includes("Created empty registry")),
		).toBe(true);
	});
});

describe("main – usage output", () => {
	it("prints usage instructions for unknown commands", async () => {
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit");
		});
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		process.argv = ["node", "autoskeleton", "bad"];
		const { main } = await import("./main");

		await expect(main()).rejects.toThrow("process.exit");

		const logCalls = logSpy.mock.calls.map((c) => c[0]);
		expect(logCalls.some((msg: string) => msg.includes("Usage:"))).toBe(true);

		mockExit.mockRestore();
	});
});
