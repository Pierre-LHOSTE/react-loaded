import { parsePersistedSnapshot } from "../snapshot/compactPersistedSnapshot";
import type { PersistedSkeletonSnapshot } from "../types";

function tryDecodeURIComponent(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export function parseSnapshotCookie(
	cookieValue: string | null | undefined,
): PersistedSkeletonSnapshot {
	if (!cookieValue) return {};
	try {
		return parsePersistedSnapshot(tryDecodeURIComponent(cookieValue));
	} catch {
		return {};
	}
}
