import type { PersistedSkeletonSnapshot } from "../components/LoadedProvider";
import { getStoragePayload } from "../hooks/storage";
import {
	compactPersistedSnapshot,
	type PersistedSnapshotCompactOptions,
	serializePersistedSnapshot,
} from "../server/persistedSnapshot";

export function getClientPersistedSnapshot(
	options?: PersistedSnapshotCompactOptions,
): PersistedSkeletonSnapshot {
	if (typeof localStorage === "undefined") return {};

	const payload = getStoragePayload();
	return compactPersistedSnapshot(
		{
			c: payload.c,
			w: payload.w,
			h: payload.h,
			wd: payload.wd,
			hd: payload.hd,
		},
		options,
	);
}

export function serializeClientPersistedSnapshot(
	options?: PersistedSnapshotCompactOptions,
): string {
	return serializePersistedSnapshot(getClientPersistedSnapshot(options));
}
