export const STORAGE_KEY = "react-loaded";
export const STORAGE_VERSION = 1 as const;
export const STORAGE_UPDATE_EVENT = "react-loaded:storage-update";

export type Distribution = { avg: number; dev: number };

export type StoragePayload = {
	v: typeof STORAGE_VERSION;
	c: Record<string, number>;
	w: Record<string, Record<string, number>>;
	h: Record<string, Record<string, number>>;
	wd: Record<string, Record<string, Distribution>>;
	hd: Record<string, Record<string, Distribution>>;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function computeDistributions(
	allItemMeasurements: Record<string, number>[],
): Record<string, Distribution> {
	const allKeys = new Set<string>();
	for (const measurements of allItemMeasurements) {
		for (const key of Object.keys(measurements)) {
			allKeys.add(key);
		}
	}

	const distributions: Record<string, Distribution> = {};

	for (const key of allKeys) {
		const values: number[] = [];
		for (const measurements of allItemMeasurements) {
			if (key in measurements) {
				values.push(measurements[key]);
			}
		}

		if (values.length === 0) continue;

		const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
		const variance =
			values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
		const dev = Math.sqrt(variance);

		distributions[key] = {
			avg: Math.round(avg * 10) / 10,
			dev: Math.round(dev * 10) / 10,
		};
	}

	return distributions;
}

function toNumberRecord(value: unknown): Record<string, number> {
	if (!isRecord(value)) return {};

	const result: Record<string, number> = {};
	for (const [key, maybeNumber] of Object.entries(value)) {
		if (typeof maybeNumber === "number") {
			result[key] = maybeNumber;
		}
	}
	return result;
}

/** Validates `{ componentId: { "t0": 185.5, "t1": 320 } }` */
function toKeyedWidthsRecord(
	value: unknown,
): Record<string, Record<string, number>> {
	if (!isRecord(value)) return {};

	const result: Record<string, Record<string, number>> = {};
	for (const [componentKey, maybeMap] of Object.entries(value)) {
		if (!isRecord(maybeMap)) continue;

		const widths: Record<string, number> = {};
		let valid = true;
		for (const [textKey, maybeNum] of Object.entries(maybeMap)) {
			if (typeof maybeNum === "number") {
				widths[textKey] = maybeNum;
			} else {
				valid = false;
				break;
			}
		}
		if (valid && Object.keys(widths).length > 0) {
			result[componentKey] = widths;
		}
	}
	return result;
}

/** Validates `{ componentId: { "t0": { avg, dev }, "t1": { avg, dev } } }` */
function toKeyedDistributionRecord(
	value: unknown,
): Record<string, Record<string, Distribution>> {
	if (!isRecord(value)) return {};

	const result: Record<string, Record<string, Distribution>> = {};
	for (const [componentKey, maybeMap] of Object.entries(value)) {
		if (!isRecord(maybeMap)) continue;

		const distributions: Record<string, Distribution> = {};
		let valid = true;
		for (const [textKey, maybeItem] of Object.entries(maybeMap)) {
			if (
				isRecord(maybeItem) &&
				typeof maybeItem.avg === "number" &&
				typeof maybeItem.dev === "number"
			) {
				distributions[textKey] = {
					avg: maybeItem.avg,
					dev: maybeItem.dev,
				};
			} else {
				valid = false;
				break;
			}
		}
		if (valid && Object.keys(distributions).length > 0) {
			result[componentKey] = distributions;
		}
	}
	return result;
}

function makeEmptyPayload(): StoragePayload {
	return {
		v: STORAGE_VERSION,
		c: {},
		w: {},
		h: {},
		wd: {},
		hd: {},
	};
}

function parsePayload(value: unknown): StoragePayload {
	if (!isRecord(value) || value.v !== STORAGE_VERSION) {
		return makeEmptyPayload();
	}

	return {
		v: STORAGE_VERSION,
		c: toNumberRecord(value.c),
		w: toKeyedWidthsRecord(value.w),
		h: toKeyedWidthsRecord(value.h),
		wd: toKeyedDistributionRecord(value.wd),
		hd: toKeyedDistributionRecord(value.hd),
	};
}

export function getStoragePayload(): StoragePayload {
	if (typeof localStorage === "undefined") return makeEmptyPayload();

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw !== null) {
			return parsePayload(JSON.parse(raw));
		}

		return makeEmptyPayload();
	} catch {
		return makeEmptyPayload();
	}
}

export function updateStoragePayload(
	updater: (payload: StoragePayload) => void,
): void {
	const payload = getStoragePayload();
	updater(payload);
	writeStoragePayload(payload);
}

export function writeStoragePayload(payload: StoragePayload): void {
	if (typeof localStorage === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		if (typeof window !== "undefined") {
			window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT));
		}
	} catch {
		// Ignore storage write failures (quota/security errors).
	}
}
