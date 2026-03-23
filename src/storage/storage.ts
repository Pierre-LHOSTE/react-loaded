import type { Distribution, StoragePayload } from "../types";

export const STORAGE_KEY = "react-loaded";
export const STORAGE_VERSION = 2;
export const STORAGE_UPDATE_EVENT = "react-loaded:storage-update";

export function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumberRecord(value: unknown): Record<string, number> {
	if (!isRecord(value)) return {};
	const result: Record<string, number> = {};
	for (const [key, v] of Object.entries(value)) {
		if (typeof v === "number") result[key] = v;
	}
	return result;
}

function toKeyedNumberRecord(
	value: unknown,
): Record<string, Record<string, number>> {
	if (!isRecord(value)) return {};
	const result: Record<string, Record<string, number>> = {};
	for (const [key, inner] of Object.entries(value)) {
		if (!isRecord(inner)) continue;
		const nums: Record<string, number> = {};
		let valid = true;
		for (const [k, v] of Object.entries(inner)) {
			if (typeof v === "number") nums[k] = v;
			else {
				valid = false;
				break;
			}
		}
		if (valid && Object.keys(nums).length > 0) result[key] = nums;
	}
	return result;
}

function toKeyedDistributionRecord(
	value: unknown,
): Record<string, Record<string, { avg: number; dev: number }>> {
	if (!isRecord(value)) return {};
	const result: Record<
		string,
		Record<string, { avg: number; dev: number }>
	> = {};
	for (const [key, inner] of Object.entries(value)) {
		if (!isRecord(inner)) continue;
		const dists: Record<string, { avg: number; dev: number }> = {};
		let valid = true;
		for (const [k, v] of Object.entries(inner)) {
			if (
				isRecord(v) &&
				typeof v.avg === "number" &&
				typeof v.dev === "number"
			) {
				dists[k] = { avg: v.avg, dev: v.dev };
			} else {
				valid = false;
				break;
			}
		}
		if (valid && Object.keys(dists).length > 0) result[key] = dists;
	}
	return result;
}

function makeEmptyPayload(): StoragePayload {
	return { v: 2, c: {}, w: {}, h: {}, wd: {}, hd: {} };
}

function parsePayload(value: unknown): StoragePayload {
	if (!isRecord(value) || value.v !== STORAGE_VERSION) {
		return makeEmptyPayload();
	}
	return {
		v: 2,
		c: toNumberRecord(value.c),
		w: toKeyedNumberRecord(value.w),
		h: toKeyedNumberRecord(value.h),
		wd: toKeyedDistributionRecord(value.wd),
		hd: toKeyedDistributionRecord(value.hd),
	};
}

export function getStoragePayload(): StoragePayload {
	if (typeof localStorage === "undefined") return makeEmptyPayload();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw !== null) return parsePayload(JSON.parse(raw));
		return makeEmptyPayload();
	} catch {
		return makeEmptyPayload();
	}
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

export function updateStoragePayload(
	updater: (payload: StoragePayload) => void,
): void {
	const payload = getStoragePayload();
	updater(payload);
	writeStoragePayload(payload);
}

export function clampCount(value: number, min: number, max?: number): number {
	const clamped = Math.max(value, min);
	return max !== undefined ? Math.min(clamped, max) : clamped;
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
