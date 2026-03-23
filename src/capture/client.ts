import type { CapturePayload } from "../types";
import { serializeElement } from "./serialize";

let captureUrl = "http://127.0.0.1:7331";

export interface CaptureConfig {
	url?: string;
	port?: number;
}

export function configureCapture(options: CaptureConfig): void {
	if (options.url) {
		captureUrl = options.url;
	} else if (options.port) {
		captureUrl = `http://127.0.0.1:${options.port}`;
	}
}

export function sendCapture(payload: CapturePayload): void {
	fetch(`${captureUrl}/capture`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	}).catch(() => {
		// Server not running — silently ignore
	});
}

export function captureElement(id: string, element: Element): void {
	const tree = serializeElement(element);
	if (!tree) return;

	sendCapture({ id, tree, timestamp: Date.now() });
}
