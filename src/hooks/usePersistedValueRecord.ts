import { useEffect, useLayoutEffect, useState } from "react";
import {
	getStoragePayload,
	type StoragePayload,
	updateStoragePayload,
} from "./storage";

const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

type MeasurementField = Extract<keyof StoragePayload, "w" | "h">;

export function usePersistedValueRecord(options: {
	storageField: MeasurementField;
	storageKey: string;
	currentValues?: Record<string, number>;
	loading: boolean;
	initialValues?: Record<string, number> | null;
}): Record<string, number> | null {
	const { storageField, storageKey, currentValues, loading, initialValues } =
		options;

	const [storedValues, setStoredValues] = useState<Record<
		string,
		number
	> | null>(() => {
		if (initialValues && Object.keys(initialValues).length > 0) {
			return initialValues;
		}
		return null;
	});

	useIsomorphicLayoutEffect(() => {
		if (initialValues && Object.keys(initialValues).length > 0) {
			setStoredValues(initialValues);
			return;
		}
		if (!storageKey) {
			setStoredValues(null);
			return;
		}
		const payload = getStoragePayload();
		const values = payload[storageField][storageKey];
		if (values && Object.keys(values).length > 0) {
			setStoredValues(values);
		} else {
			setStoredValues(null);
		}
	}, [storageField, storageKey, initialValues]);

	useEffect(() => {
		if (!loading && currentValues && Object.keys(currentValues).length > 0) {
			updateStoragePayload((payload) => {
				payload[storageField][storageKey] = currentValues;
			});
			setStoredValues(currentValues);
		}
	}, [loading, currentValues, storageKey, storageField]);

	return storedValues;
}
