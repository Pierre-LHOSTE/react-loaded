import type { PersistedSnapshotCompactOptions } from "../server/persistedSnapshot";

export const SNAPSHOT_COOKIE_NAME = "react-loaded-snapshot";
export const COOKIE_SIZE_WARNING_THRESHOLD = 3800;

export const DEFAULT_COOKIE_COMPACT_OPTIONS: PersistedSnapshotCompactOptions = {
	maxSkeletons: 20,
	maxTextKeysPerSkeleton: 10,
	decimals: 1,
};
