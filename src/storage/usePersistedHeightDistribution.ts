import { useEffect, useLayoutEffect, useState } from "react";
import type { Distribution } from "../types";
import {
	computeDistributions,
	getStoragePayload,
	updateStoragePayload,
} from "./storage";

const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export function usePersistedHeightDistribution(options: {
	storageKey?: string;
	allItemHeights?: Record<string, number>[];
	loading: boolean;
	initialDistributions?: Record<string, Distribution> | null;
}): Record<string, Distribution> | null {
	const { storageKey, allItemHeights, loading, initialDistributions } = options;

	const [storedDistributions, setStoredDistributions] = useState<Record<
		string,
		Distribution
	> | null>(() => {
		if (initialDistributions && Object.keys(initialDistributions).length > 0) {
			return initialDistributions;
		}
		return null;
	});

	useIsomorphicLayoutEffect(() => {
		if (initialDistributions && Object.keys(initialDistributions).length > 0) {
			setStoredDistributions(initialDistributions);
			return;
		}
		if (!storageKey) {
			setStoredDistributions(null);
			return;
		}
		const payload = getStoragePayload();
		const hd = payload.hd[storageKey];
		setStoredDistributions(hd && Object.keys(hd).length > 0 ? hd : null);
	}, [storageKey, initialDistributions]);

	useEffect(() => {
		if (!loading && storageKey && allItemHeights && allItemHeights.length > 0) {
			const hd = computeDistributions(allItemHeights);
			if (Object.keys(hd).length > 0) {
				updateStoragePayload((payload) => {
					payload.hd[storageKey] = hd;
				});
				setStoredDistributions(hd);
			}
		}
	}, [loading, allItemHeights, storageKey]);

	return storedDistributions;
}
