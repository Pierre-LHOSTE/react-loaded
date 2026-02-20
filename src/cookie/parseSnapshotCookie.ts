import type { PersistedSkeletonSnapshot } from "../components/LoadedProvider";
import { parsePersistedSnapshot } from "../server/persistedSnapshot";

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
