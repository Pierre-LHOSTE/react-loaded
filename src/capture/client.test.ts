import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./serialize", () => ({
	serializeElement: vi.fn(),
}));

import type { CapturedNode } from "../types";
import { captureElement, configureCapture, sendCapture } from "./client";
import { serializeElement } from "./serialize";

const mockTree: CapturedNode = {
	tag: "div",
	className: "card",
	style: {},
	attributes: {},
	children: [],
	nodeType: "layout",
};

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.mocked(serializeElement).mockReturnValue(mockTree);
	fetchSpy = vi.fn().mockResolvedValue({
		ok: true,
		json: () => Promise.resolve({ result: "generated" }),
	});
	vi.stubGlobal("fetch", fetchSpy);
	configureCapture({ url: "http://127.0.0.1:7331" });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("configureCapture", () => {
	it("sets capture URL via url option", () => {
		configureCapture({ url: "http://localhost:9000" });
		sendCapture({ id: "test", tree: mockTree, timestamp: 1 });

		const [url] = fetchSpy.mock.calls[0];
		expect(url).toBe("http://localhost:9000/capture");
	});

	it("sets capture URL via port option", () => {
		configureCapture({ port: 5000 });
		sendCapture({ id: "test", tree: mockTree, timestamp: 1 });

		const [url] = fetchSpy.mock.calls[0];
		expect(url).toBe("http://127.0.0.1:5000/capture");
	});
});

describe("sendCapture", () => {
	it("sends POST to capture endpoint", () => {
		const payload = { id: "my-card", tree: mockTree, timestamp: 123 };
		sendCapture(payload);

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe("http://127.0.0.1:7331/capture");
		expect(init.method).toBe("POST");
		expect(init.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(init.body)).toEqual(payload);
	});

	it("silently ignores fetch errors", () => {
		fetchSpy.mockRejectedValue(new Error("network error"));
		expect(() =>
			sendCapture({ id: "test", tree: mockTree, timestamp: 1 }),
		).not.toThrow();
	});
});

describe("captureElement", () => {
	it("serializes element and sends capture", () => {
		const el = document.createElement("div");
		captureElement("my-card", el);

		expect(serializeElement).toHaveBeenCalledWith(el);
		expect(fetchSpy).toHaveBeenCalledTimes(1);

		const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
		expect(body.id).toBe("my-card");
		expect(body.tree).toEqual(mockTree);
	});

	it("does nothing when serializeElement returns null", () => {
		vi.mocked(serializeElement).mockReturnValue(null);
		const el = document.createElement("div");
		captureElement("my-card", el);

		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
