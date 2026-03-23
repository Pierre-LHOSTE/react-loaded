import "./css/autoskeleton.css";

export {
	type CaptureConfig,
	captureElement,
	configureCapture,
	sendCapture,
} from "./capture/client";
export { serializeElement } from "./capture/serialize";
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
export {
	type SyncSnapshotToCookieOptions,
	syncSnapshotToCookie,
} from "./cookie/syncSnapshotToCookie";
export { useSkeletonCookieSync } from "./cookie/useSkeletonCookieSync";
export { defineConfig } from "./define-config";
export {
	getClientPersistedSnapshot,
	serializeClientPersistedSnapshot,
} from "./snapshot/clientSnapshot";
export {
	compactPersistedSnapshot,
	type PersistedSnapshotCompactOptions,
	parsePersistedSnapshot,
	serializePersistedSnapshot,
} from "./snapshot/compactPersistedSnapshot";
export { STORAGE_UPDATE_EVENT } from "./storage/storage";
export {
	type UsePersistedCountOptions,
	usePersistedCount,
} from "./storage/usePersistedCount";
export { usePersistedDistribution } from "./storage/usePersistedDistribution";
export { usePersistedHeightDistribution } from "./storage/usePersistedHeightDistribution";
export { usePersistedHeights } from "./storage/usePersistedHeights";
export { usePersistedWidths } from "./storage/usePersistedWidths";
export type {
	CapturedNode,
	CapturePayload,
	CaptureResult,
	Distribution,
	ReactLoadedConfig,
	SkeletonRegistry,
	StoragePayload,
} from "./types";
export { isValidId } from "./utils/validate-id";
