import "./css/autoskeleton.css";

export {
	type CaptureConfig,
	configureCapture,
} from "./capture/client";
export {
	getClientPersistedSnapshot,
	serializeClientPersistedSnapshot,
} from "./client/persistedSnapshot";
export {
	AutoSkeleton,
	type AutoSkeletonProps,
} from "./components/AutoSkeleton";
export {
	AutoSkeletonList,
	type AutoSkeletonListProps,
} from "./components/AutoSkeletonList";
export {
	LoadedProvider,
	type PersistedSkeletonSnapshot,
} from "./components/LoadedProvider";
export {
	SkeletonContext,
	useIsSkeletonMode,
} from "./components/SkeletonContext";
export { SNAPSHOT_COOKIE_NAME } from "./cookie/constants";
export { parseSnapshotCookie } from "./cookie/parseSnapshotCookie";
export { defineConfig, type ReactLoadedConfig } from "./define-config";
export { type Distribution, STORAGE_UPDATE_EVENT } from "./hooks/storage";
export {
	type UsePersistedCountOptions,
	usePersistedCount,
} from "./hooks/usePersistedCount";
export { usePersistedDistribution } from "./hooks/usePersistedDistribution";
export { usePersistedHeightDistribution } from "./hooks/usePersistedHeightDistribution";
export { usePersistedHeights } from "./hooks/usePersistedHeights";
export { usePersistedWidths } from "./hooks/usePersistedWidths";
export {
	compactPersistedSnapshot,
	type PersistedSnapshotCompactOptions,
	parsePersistedSnapshot,
	serializePersistedSnapshot,
} from "./server/persistedSnapshot";
export type { CapturedNode, CapturePayload, SkeletonRegistry } from "./types";
