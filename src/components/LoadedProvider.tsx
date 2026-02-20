import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { configureCapture } from "../capture/client";
import type { Distribution } from "../hooks/storage";
import type { SkeletonRegistry } from "../types";

export type PersistedSkeletonSnapshot = {
	c?: Record<string, number>;
	w?: Record<string, Record<string, number>>;
	h?: Record<string, Record<string, number>>;
	wd?: Record<string, Record<string, Distribution>>;
	hd?: Record<string, Record<string, Distribution>>;
};

const RegistryContext = createContext<SkeletonRegistry>({});
const PersistedSnapshotContext = createContext<PersistedSkeletonSnapshot>({});

export function LoadedProvider({
	registry,
	persistedSnapshot,
	children,
}: {
	registry: SkeletonRegistry;
	persistedSnapshot?: PersistedSkeletonSnapshot;
	children: ReactNode;
}) {
	const lastCaptureUrlRef = useRef<string | null>(null);

	useEffect(() => {
		const meta = (registry as Record<string, unknown>).__captureConfig__ as
			| { url?: string }
			| undefined;
		if (meta?.url && meta.url !== lastCaptureUrlRef.current) {
			lastCaptureUrlRef.current = meta.url;
			configureCapture({ url: meta.url });
			if (process.env.NODE_ENV !== "production") {
				console.debug(`[react-loaded] Capture configured → ${meta.url}`);
			}
		}
	}, [registry]);

	return (
		<RegistryContext.Provider value={registry}>
			<PersistedSnapshotContext.Provider value={persistedSnapshot ?? {}}>
				{children}
			</PersistedSnapshotContext.Provider>
		</RegistryContext.Provider>
	);
}

export function useRegistry(): SkeletonRegistry {
	return useContext(RegistryContext);
}

export function useInitialWidthSnapshot(
	skeletonId: string,
): Record<string, number> | null {
	const snapshot = useContext(PersistedSnapshotContext);
	const w = snapshot.w?.[skeletonId];
	if (!w || Object.keys(w).length === 0) return null;
	return w;
}

export function useInitialDistributionSnapshot(
	storageKey?: string,
): Record<string, Distribution> | null {
	const snapshot = useContext(PersistedSnapshotContext);
	if (!storageKey) return null;
	const wd = snapshot.wd?.[storageKey];
	if (!wd || Object.keys(wd).length === 0) return null;
	return wd;
}

export function useInitialHeightSnapshot(
	skeletonId: string,
): Record<string, number> | null {
	const snapshot = useContext(PersistedSnapshotContext);
	const h = snapshot.h?.[skeletonId];
	if (!h || Object.keys(h).length === 0) return null;
	return h;
}

export function useInitialHeightDistributionSnapshot(
	storageKey?: string,
): Record<string, Distribution> | null {
	const snapshot = useContext(PersistedSnapshotContext);
	if (!storageKey) return null;
	const wd = snapshot.hd?.[storageKey];
	if (!wd || Object.keys(wd).length === 0) return null;
	return wd;
}

export function useInitialCountSnapshot(storageKey?: string): number | null {
	const snapshot = useContext(PersistedSnapshotContext);
	if (!storageKey) return null;
	const count = snapshot.c?.[storageKey];
	return typeof count === "number" ? count : null;
}
