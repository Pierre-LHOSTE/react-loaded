import { serializeClientPersistedSnapshot } from "../client/persistedSnapshot";
import type { PersistedSnapshotCompactOptions } from "../server/persistedSnapshot";
import {
	COOKIE_SIZE_WARNING_THRESHOLD,
	DEFAULT_COOKIE_COMPACT_OPTIONS,
	SNAPSHOT_COOKIE_NAME,
} from "./constants";

export interface SyncSnapshotToCookieOptions {
	cookieName?: string;
	path?: string;
	maxAge?: number;
	compact?: PersistedSnapshotCompactOptions;
}

const isDev = process.env.NODE_ENV !== "production";

export function syncSnapshotToCookie(
	options?: SyncSnapshotToCookieOptions,
): void {
	if (typeof document === "undefined") return;

	const cookieName = options?.cookieName ?? SNAPSHOT_COOKIE_NAME;
	const path = options?.path ?? "/";
	const maxAge = options?.maxAge ?? 31_536_000;
	const compact = options?.compact ?? DEFAULT_COOKIE_COMPACT_OPTIONS;

	const json = serializeClientPersistedSnapshot(compact);
	const encoded = encodeURIComponent(json);

	if (isDev && encoded.length > COOKIE_SIZE_WARNING_THRESHOLD) {
		console.warn(
			`[react-loaded] Cookie "${cookieName}" is ${encoded.length} bytes (threshold: ${COOKIE_SIZE_WARNING_THRESHOLD}). ` +
				"Consider reducing maxSkeletons or maxTextKeysPerSkeleton in compact options.",
		);
	}

	// biome-ignore lint/suspicious/noDocumentCookie: intentional cookie write for SSR sync
	document.cookie = `${cookieName}=${encoded};path=${path};max-age=${maxAge};SameSite=Lax`;
}
