import { dismissByKey, showToast } from "../notifications/toast";
import type { CapturePayload } from "../types";

export interface CaptureConfig {
	port?: number;
	url?: string;
}

let captureUrl = "http://127.0.0.1:7331";

export function configureCapture(options: CaptureConfig): void {
	if (options.url) {
		captureUrl = options.url;
	} else if (options.port) {
		captureUrl = `http://127.0.0.1:${options.port}`;
	}
}

export function sendCapture(payload: CapturePayload): void {
	fetch(captureUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})
		.then((res) => res.json())
		.then((data: { ok?: boolean; id?: string; result?: string }) => {
			if (!data.ok || !data.id) return;

			if (data.result === "no_change") {
				dismissByKey(`capture-${data.id}`);
				return;
			}

			showToast({
				message: `"${data.id}" ${data.result === "updated" ? "updated" : "generated"}`,
				sub: "Refresh the page to see the skeleton.",
				type: "success",
				key: `capture-${data.id}`,
			});
		})
		.catch(() => {
			// Server not running — silently ignore
		});
}
