import { useEffect, useLayoutEffect, useState } from "react";
import {
	computeDistributions,
	type Distribution,
	getStoragePayload,
	updateStoragePayload,
} from "./storage";

const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export function usePersistedDistribution(options: {
	storageKey?: string;
	allItemWidths?: Record<string, number>[];
	loading: boolean;
	initialDistributions?: Record<string, Distribution> | null;
}): Record<string, Distribution> | null {
	const { storageKey, allItemWidths, loading, initialDistributions } = options;
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
		const wd = payload.wd[storageKey];
		setStoredDistributions(wd && Object.keys(wd).length > 0 ? wd : null);
	}, [storageKey, initialDistributions]);

	useEffect(() => {
		if (!loading && storageKey && allItemWidths && allItemWidths.length > 0) {
			const wd = computeDistributions(allItemWidths);
			if (Object.keys(wd).length > 0) {
				updateStoragePayload((payload) => {
					payload.wd[storageKey] = wd;
				});
				setStoredDistributions(wd);
			}
		}
	}, [loading, allItemWidths, storageKey]);

	return storedDistributions;
}
