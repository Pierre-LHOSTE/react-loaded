import { getStoragePayload } from "../storage/storage";
import type { PersistedSkeletonSnapshot } from "../types";
import {
	compactPersistedSnapshot,
	type PersistedSnapshotCompactOptions,
	serializePersistedSnapshot,
} from "./compactPersistedSnapshot";

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
