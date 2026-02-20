// @vitest-environment node
import { createServer } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidId, startServer } from "./http-server";

type CloseFn = () => void;
const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "::1"];

async function getFreePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once("error", reject);
		probe.listen(0, "127.0.0.1", () => {
			const address = probe.address();
			if (!address || typeof address === "string") {
				probe.close();
				reject(new Error("Failed to resolve free port"));
				return;
			}
			const port = address.port;
			probe.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(port);
			});
		});
	});
}

function makePayload() {
	return {
		id: "card-id",
		timestamp: Date.now(),
		tree: {
			tag: "div",
			className: "",
			style: {},
			attributes: {},
			children: [],
			nodeType: "layout" as const,
		},
	};
}

describe("isValidId", () => {
	it("accepts valid kebab-case ids", () => {
		expect(isValidId("user-card")).toBe(true);
		expect(isValidId("ProfileHeader")).toBe(true);
		expect(isValidId("a")).toBe(true);
		expect(isValidId("my_component-v2")).toBe(true);
	});

	it("rejects path traversal attempts", () => {
		expect(isValidId("../etc/passwd")).toBe(false);
		expect(isValidId("foo/../../bar")).toBe(false);
		expect(isValidId("..")).toBe(false);
	});

	it("rejects ids with special characters", () => {
		expect(isValidId("foo bar")).toBe(false);
		expect(isValidId("foo;rm -rf")).toBe(false);
		expect(isValidId('id"injection')).toBe(false);
		expect(isValidId("id<script>")).toBe(false);
	});

	it("rejects empty or too-long ids", () => {
		expect(isValidId("")).toBe(false);
		expect(isValidId("a".repeat(129))).toBe(false);
	});

	it("rejects ids starting with a digit or dash", () => {
		expect(isValidId("1card")).toBe(false);
		expect(isValidId("-card")).toBe(false);
		expect(isValidId("_card")).toBe(false);
	});
});

describe("startServer", () => {
	const closers: CloseFn[] = [];

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		for (const close of closers.splice(0)) {
			close();
		}
		vi.restoreAllMocks();
	});

	async function createTestServer(
		allowedHosts: string[] = DEFAULT_ALLOWED_HOSTS,
		onCapture: Parameters<typeof startServer>[0]["onCapture"] = () =>
			"generated",
	): Promise<string> {
		const port = await getFreePort();
		const server = await startServer({ port, allowedHosts, onCapture });
		closers.push(server.close);
		return `http://127.0.0.1:${port}`;
	}

	it("returns 204 for OPTIONS requests", async () => {
		const url = await createTestServer();

		const response = await fetch(url, { method: "OPTIONS" });

		expect(response.status).toBe(204);
	});

	it("returns 403 for OPTIONS requests with forbidden host", async () => {
		const url = await createTestServer(["localhost"]);

		const response = await fetch(url, { method: "OPTIONS" });
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(403);
		expect(body.error).toBe("Forbidden host");
	});

	it("returns 405 for methods other than POST", async () => {
		const url = await createTestServer();

		const response = await fetch(url, { method: "GET" });
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(405);
		expect(body.error).toBe("Method not allowed");
	});

	it("returns 400 for invalid JSON", async () => {
		const url = await createTestServer();

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "{",
		});
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(400);
		expect(body.error).toBe("Invalid JSON");
	});

	it("returns 400 when payload misses id or tree", async () => {
		const url = await createTestServer();

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: "missing-tree" }),
		});
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(400);
		expect(body.error).toBe("Invalid payload: missing id or tree");
	});

	it("calls onCapture and returns capture result for valid payload", async () => {
		const onCapture = vi.fn().mockReturnValue("updated");
		const url = await createTestServer(DEFAULT_ALLOWED_HOSTS, onCapture);
		const payload = makePayload();

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const body = (await response.json()) as {
			ok: boolean;
			id: string;
			result: string;
		};

		expect(response.status).toBe(200);
		expect(onCapture).toHaveBeenCalledWith(payload);
		expect(body).toEqual({
			ok: true,
			id: "card-id",
			result: "updated",
		});
	});

	it("returns 400 for path traversal id", async () => {
		const onCapture = vi.fn().mockReturnValue("generated");
		const url = await createTestServer(DEFAULT_ALLOWED_HOSTS, onCapture);

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...makePayload(),
				id: "../etc/passwd",
			}),
		});
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(400);
		expect(body.error).toContain("Invalid id");
		expect(onCapture).not.toHaveBeenCalled();
	});

	it("returns 400 for id with special characters", async () => {
		const onCapture = vi.fn().mockReturnValue("generated");
		const url = await createTestServer(DEFAULT_ALLOWED_HOSTS, onCapture);

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...makePayload(),
				id: "foo;rm -rf /",
			}),
		});
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(400);
		expect(body.error).toContain("Invalid id");
		expect(onCapture).not.toHaveBeenCalled();
	});

	it("returns 403 for requests when Host is not allowlisted", async () => {
		const onCapture = vi.fn().mockReturnValue("generated");
		const url = await createTestServer(["localhost"], onCapture);

		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(makePayload()),
		});
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(403);
		expect(body.error).toBe("Forbidden host");
		expect(onCapture).not.toHaveBeenCalled();
	});

	it("sets CORS and Vary headers only for allowed origins", async () => {
		const url = await createTestServer();

		const allowed = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
			},
			body: JSON.stringify(makePayload()),
		});

		expect(allowed.headers.get("access-control-allow-origin")).toBe(
			"http://localhost:3000",
		);
		expect(allowed.headers.get("vary")).toBe("Origin");

		const denied = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://evil.example",
			},
			body: JSON.stringify(makePayload()),
		});

		expect(denied.headers.get("access-control-allow-origin")).toBeNull();
		expect(denied.headers.get("vary")).toBeNull();
	});

	it("rejects with a clear message when port is already in use", async () => {
		const port = await getFreePort();
		const first = await startServer({
			port,
			allowedHosts: DEFAULT_ALLOWED_HOSTS,
			onCapture: () => "generated",
		});
		closers.push(first.close);

		await expect(
			startServer({
				port,
				allowedHosts: DEFAULT_ALLOWED_HOSTS,
				onCapture: () => "generated",
			}),
		).rejects.toThrow("already in use");
	});
});
