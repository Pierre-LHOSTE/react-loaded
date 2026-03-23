import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
} from "react";
import { configureCapture } from "../capture/client";
import type {
	Distribution,
	PersistedSkeletonSnapshot,
	SkeletonRegistry,
} from "../types";

export interface LoadedProviderProps {
	registry?: SkeletonRegistry;
	// Keep the public prop name short; the persisted nature is already captured
	// by the PersistedSkeletonSnapshot type.
	snapshot?: PersistedSkeletonSnapshot | null;
	children?: ReactNode;
}

export const LoadedContext = createContext<PersistedSkeletonSnapshot | null>(
	null,
);
export const RegistryContext = createContext<SkeletonRegistry>({});

export function LoadedProvider({
	registry = {},
	snapshot = null,
	children,
}: LoadedProviderProps) {
	const lastCaptureUrlRef = useRef<string | null>(null);

	useEffect(() => {
		const meta = (registry as Record<string, unknown>).__captureConfig__ as
			| { url?: string }
			| undefined;
		if (meta?.url && meta.url !== lastCaptureUrlRef.current) {
			lastCaptureUrlRef.current = meta.url;
			configureCapture({ url: meta.url });
		}
	}, [registry]);

	return (
		<RegistryContext.Provider value={registry}>
			<LoadedContext.Provider value={snapshot}>
				{children}
			</LoadedContext.Provider>
		</RegistryContext.Provider>
	);
}

export function useRegistry(): SkeletonRegistry {
	return useContext(RegistryContext);
}

export function useInitialWidthSnapshot(
	skeletonId: string,
): Record<string, number> | null {
	const snapshot = useContext(LoadedContext);
	const w = snapshot?.w?.[skeletonId];
	if (!w || Object.keys(w).length === 0) return null;
	return w;
}

export function useInitialHeightSnapshot(
	skeletonId: string,
): Record<string, number> | null {
	const snapshot = useContext(LoadedContext);
	const h = snapshot?.h?.[skeletonId];
	if (!h || Object.keys(h).length === 0) return null;
	return h;
}

export function useInitialCountSnapshot(storageKey?: string): number | null {
	const snapshot = useContext(LoadedContext);
	if (!storageKey) return null;
	const count = snapshot?.c?.[storageKey];
	return typeof count === "number" ? count : null;
}

export function useInitialDistributionSnapshot(
	storageKey?: string,
): Record<string, Distribution> | null {
	const snapshot = useContext(LoadedContext);
	if (!storageKey) return null;
	const wd = snapshot?.wd?.[storageKey];
	if (!wd || Object.keys(wd).length === 0) return null;
	return wd;
}

export function useInitialHeightDistributionSnapshot(
	storageKey?: string,
): Record<string, Distribution> | null {
	const snapshot = useContext(LoadedContext);
	if (!storageKey) return null;
	const hd = snapshot?.hd?.[storageKey];
	if (!hd || Object.keys(hd).length === 0) return null;
	return hd;
}

export type { PersistedSkeletonSnapshot, SkeletonRegistry } from "../types";
