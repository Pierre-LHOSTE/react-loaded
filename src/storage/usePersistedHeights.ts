import { usePersistedValueRecord } from "./usePersistedValueRecord";

export function usePersistedHeights(options: {
	storageKey: string;
	currentHeights?: Record<string, number>;
	loading: boolean;
	initialHeights?: Record<string, number> | null;
}): Record<string, number> | null {
	return usePersistedValueRecord({
		storageField: "h",
		storageKey: options.storageKey,
		currentValues: options.currentHeights,
		loading: options.loading,
		initialValues: options.initialHeights,
	});
}
