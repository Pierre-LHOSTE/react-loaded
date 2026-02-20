import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import type { CapturePayload } from "../types";
import { isValidId } from "../utils/validate-id";
export { isValidId };

export type CaptureResult = "no_change" | "updated" | "generated";

export interface ServerOptions {
	port: number;
	allowedHosts: string[];
	onCapture: (payload: CapturePayload) => CaptureResult;
}

const MAX_BODY_BYTES = 1_048_576; // 1 MB

function normalizeHost(raw: string): string | null {
	const value = raw.trim().toLowerCase();
	if (!value) return null;

	// RFC-compliant IPv6 host form: [::1]:7331
	if (value.startsWith("[")) {
		const closeIndex = value.indexOf("]");
		if (closeIndex === -1) return null;
		const host = value.slice(1, closeIndex);
		return host.length > 0 ? host : null;
	}

	// host:port for IPv4/domain (single colon).
	const firstColon = value.indexOf(":");
	const lastColon = value.lastIndexOf(":");
	if (firstColon !== -1 && firstColon === lastColon) {
		const host = value.slice(0, firstColon);
		return host.length > 0 ? host : null;
	}

	// Bare IPv6 or plain host without port.
	return value;
}

function normalizeAllowedHosts(hosts: string[]): Set<string> {
	const result = new Set<string>();
	for (const host of hosts) {
		const normalized = normalizeHost(host);
		if (normalized) result.add(normalized);
	}
	return result;
}

function isAllowedRequestHost(
	hostHeader: string | undefined,
	allowedHosts: Set<string>,
): boolean {
	if (!hostHeader) return false;
	const normalized = normalizeHost(hostHeader);
	if (!normalized) return false;
	return allowedHosts.has(normalized);
}

function isAllowedOrigin(
	origin: string | undefined,
	allowedHosts: Set<string>,
): boolean {
	if (!origin) return false;
	try {
		const url = new URL(origin);
		const normalized = normalizeHost(url.hostname);
		if (!normalized) return false;
		return allowedHosts.has(normalized);
	} catch {
		return false;
	}
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		req.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > MAX_BODY_BYTES) {
				req.destroy();
				reject(new Error("Body too large"));
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => resolve(Buffer.concat(chunks).toString()));
		req.on("error", reject);
	});
}

function setCorsHeaders(
	req: IncomingMessage,
	res: ServerResponse,
	allowedHosts: Set<string>,
): void {
	const origin = req.headers.origin;
	if (isAllowedOrigin(origin, allowedHosts)) {
		res.setHeader("Access-Control-Allow-Origin", origin as string);
		res.setHeader("Vary", "Origin");
	}
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(
	res: ServerResponse,
	status: number,
	data: Record<string, unknown>,
): void {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

export function startServer(
	options: ServerOptions,
): Promise<{ close: () => void }> {
	const { port, onCapture } = options;
	const allowedHosts = normalizeAllowedHosts(options.allowedHosts);

	const server = createServer(async (req, res) => {
		setCorsHeaders(req, res, allowedHosts);

		if (!isAllowedRequestHost(req.headers.host, allowedHosts)) {
			sendJson(res, 403, { error: "Forbidden host" });
			return;
		}

		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}

		if (req.method !== "POST") {
			sendJson(res, 405, { error: "Method not allowed" });
			return;
		}

		let payload: CapturePayload;
		try {
			const body = await readBody(req);
			payload = JSON.parse(body) as CapturePayload;
		} catch {
			sendJson(res, 400, { error: "Invalid JSON" });
			return;
		}

		if (!payload || typeof payload.id !== "string" || !payload.tree) {
			sendJson(res, 400, {
				error: "Invalid payload: missing id or tree",
			});
			return;
		}

		if (!isValidId(payload.id)) {
			sendJson(res, 400, {
				error: "Invalid id: must match [a-zA-Z][a-zA-Z0-9_-]{0,127}",
			});
			return;
		}

		try {
			const result = onCapture(payload);
			sendJson(res, 200, { ok: true, id: payload.id, result });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Internal error";
			sendJson(res, 500, { error: message });
		}
	});

	return new Promise((resolve, reject) => {
		server.on("error", (err: NodeJS.ErrnoException) => {
			if (err.code === "EADDRINUSE") {
				reject(
					new Error(
						`Port ${port} is already in use. Stop the other process or use a different port in your config.`,
					),
				);
			} else {
				reject(err);
			}
		});

		server.listen(port, "127.0.0.1", () => {
			console.log(
				`  react-loaded: server listening on http://127.0.0.1:${port}`,
			);
			console.log("  Waiting for captures...\n");
			resolve({ close: () => server.close() });
		});
	});
}
