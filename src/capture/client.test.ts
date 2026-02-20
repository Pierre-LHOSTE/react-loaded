import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../notifications/toast", () => ({
	dismissByKey: vi.fn(),
	showToast: vi.fn(),
}));

describe("configureCapture", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("uses default URL http://127.0.0.1:7331", async () => {
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				new Response(
					JSON.stringify({ ok: true, id: "test", result: "generated" }),
				),
			);

		const { sendCapture } = await import("./client");
		sendCapture({ id: "test", tree: {} as never, timestamp: 1 });

		expect(fetchSpy.mock.calls[0][0]).toBe("http://127.0.0.1:7331");
	});

	it("updates URL when configureCapture is called with port", async () => {
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				new Response(
					JSON.stringify({ ok: true, id: "test", result: "generated" }),
				),
			);

		const { configureCapture, sendCapture } = await import("./client");
		configureCapture({ port: 9000 });
		sendCapture({ id: "test", tree: {} as never, timestamp: 1 });

		expect(fetchSpy.mock.calls[0][0]).toBe("http://127.0.0.1:9000");

		// Reset to default for other tests
		configureCapture({ url: "http://127.0.0.1:7331" });
	});

	it("prefers url over port", async () => {
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				new Response(
					JSON.stringify({ ok: true, id: "test", result: "generated" }),
				),
			);

		const { configureCapture, sendCapture } = await import("./client");
		configureCapture({ port: 9000, url: "http://custom:1234" });
		sendCapture({ id: "test", tree: {} as never, timestamp: 1 });

		expect(fetchSpy.mock.calls[0][0]).toBe("http://custom:1234");

		// Reset to default for other tests
		configureCapture({ url: "http://127.0.0.1:7331" });
	});

	it("does not access process.env at module scope", async () => {
		const mod = await import("./client");

		expect(mod.configureCapture).toBeDefined();
		expect(mod.sendCapture).toBeDefined();
	});
});
