import { describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({
	loadConfig: vi.fn().mockResolvedValue({}),
	resolveConfig: vi.fn().mockReturnValue({
		port: 7331,
		outDir: "/tmp/test-out",
		allowedHosts: ["localhost"],
	}),
}));

vi.mock("./server/http-server", () => ({
	startServer: vi.fn(),
}));

vi.mock("./cli/handle-capture", () => ({
	handleCapture: vi.fn(),
}));

vi.mock("./cli/reset-skeletons", () => ({
	resetSkeletons: vi
		.fn()
		.mockReturnValue({ createdDir: false, removedCount: 0 }),
}));

vi.mock("./generator/to-registry", () => ({
	generateRegistry: vi.fn().mockReturnValue(""),
}));

describe("main", () => {
	it("exits with code 1 on unknown command", async () => {
		const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit");
		});
		vi.spyOn(console, "log").mockImplementation(() => {});

		process.argv = ["node", "autoskeleton", "unknown"];
		const { main } = await import("./cli");

		await expect(main()).rejects.toThrow("process.exit");
		expect(mockExit).toHaveBeenCalledWith(1);

		mockExit.mockRestore();
	});

	it("throws when --config is provided without a value", async () => {
		process.argv = ["node", "autoskeleton", "dev", "--config"];
		const { main } = await import("./cli");

		await expect(main()).rejects.toThrow("--config requires a file path");
	});

	it("throws when --config is followed by another flag", async () => {
		process.argv = ["node", "autoskeleton", "dev", "--config", "--something"];
		const { main } = await import("./cli");

		await expect(main()).rejects.toThrow("--config requires a file path");
	});
});
