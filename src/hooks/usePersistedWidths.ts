import { usePersistedValueRecord } from "./usePersistedValueRecord";

export function usePersistedWidths(options: {
	storageKey: string;
	currentWidths?: Record<string, number>;
	loading: boolean;
	initialWidths?: Record<string, number> | null;
}): Record<string, number> | null {
	return usePersistedValueRecord({
		storageField: "w",
		storageKey: options.storageKey,
		currentValues: options.currentWidths,
		loading: options.loading,
		initialValues: options.initialWidths,
	});
}
