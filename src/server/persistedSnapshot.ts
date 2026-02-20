import type { PersistedSkeletonSnapshot } from "../components/LoadedProvider";
import { type Distribution, isRecord } from "../hooks/storage";

export interface PersistedSnapshotCompactOptions {
	/** Maximum number of skeleton IDs to keep per section (c/w/wd). */
	maxSkeletons?: number;
	/** Maximum number of text keys to keep for each skeleton ID. */
	maxTextKeysPerSkeleton?: number;
	/** Optional decimal rounding for width/distribution numbers. */
	decimals?: number;
}

function normalizeLimit(value: number | undefined): number {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return Number.POSITIVE_INFINITY;
	}
	return Math.floor(value);
}

function normalizeNumber(value: unknown, decimals?: number): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return null;
	}
	if (
		typeof decimals !== "number" ||
		!Number.isInteger(decimals) ||
		decimals < 0
	) {
		return value;
	}
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function normalizeCount(value: unknown): number | null {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return null;
	}
	return Math.round(value);
}

function takeLimitedEntries<T>(
	record: Record<string, T>,
	limit: number,
): [string, T][] {
	if (limit === Number.POSITIVE_INFINITY) {
		return Object.entries(record);
	}
	return Object.entries(record).slice(0, limit);
}

function normalizeWidths(
	value: unknown,
	maxSkeletons: number,
	maxTextKeysPerSkeleton: number,
	decimals?: number,
): Record<string, Record<string, number>> {
	if (!isRecord(value)) return {};

	const result: Record<string, Record<string, number>> = {};
	const skeletonEntries = takeLimitedEntries(value, maxSkeletons);
	for (const [skeletonId, maybeWidths] of skeletonEntries) {
		if (!isRecord(maybeWidths)) continue;

		const w: Record<string, number> = {};
		const textEntries = takeLimitedEntries(maybeWidths, maxTextKeysPerSkeleton);
		for (const [textKey, maybeWidth] of textEntries) {
			const width = normalizeNumber(maybeWidth, decimals);
			if (width === null) continue;
			w[textKey] = width;
		}

		if (Object.keys(w).length > 0) {
			result[skeletonId] = w;
		}
	}

	return result;
}

function normalizeDistributions(
	value: unknown,
	maxSkeletons: number,
	maxTextKeysPerSkeleton: number,
	decimals?: number,
): Record<string, Record<string, Distribution>> {
	if (!isRecord(value)) return {};

	const result: Record<string, Record<string, Distribution>> = {};
	const skeletonEntries = takeLimitedEntries(value, maxSkeletons);
	for (const [skeletonId, maybeDistributions] of skeletonEntries) {
		if (!isRecord(maybeDistributions)) continue;

		const wd: Record<string, Distribution> = {};
		const textEntries = takeLimitedEntries(
			maybeDistributions,
			maxTextKeysPerSkeleton,
		);
		for (const [textKey, maybeDistribution] of textEntries) {
			if (!isRecord(maybeDistribution)) continue;

			const avg = normalizeNumber(maybeDistribution.avg, decimals);
			const dev = normalizeNumber(maybeDistribution.dev, decimals);
			if (avg === null || dev === null) continue;

			wd[textKey] = { avg, dev };
		}

		if (Object.keys(wd).length > 0) {
			result[skeletonId] = wd;
		}
	}

	return result;
}

function normalizeCounts(
	value: unknown,
	maxSkeletons: number,
): Record<string, number> {
	if (!isRecord(value)) return {};

	const result: Record<string, number> = {};
	for (const [key, maybeCount] of takeLimitedEntries(value, maxSkeletons)) {
		const count = normalizeCount(maybeCount);
		if (count === null) continue;
		result[key] = count;
	}

	return result;
}

export function compactPersistedSnapshot(
	snapshot: PersistedSkeletonSnapshot,
	options: PersistedSnapshotCompactOptions = {},
): PersistedSkeletonSnapshot {
	const maxSkeletons = normalizeLimit(options.maxSkeletons);
	const maxTextKeysPerSkeleton = normalizeLimit(options.maxTextKeysPerSkeleton);
	const decimals = options.decimals;

	return {
		c: normalizeCounts(snapshot.c, maxSkeletons),
		w: normalizeWidths(
			snapshot.w,
			maxSkeletons,
			maxTextKeysPerSkeleton,
			decimals,
		),
		h: normalizeWidths(
			snapshot.h,
			maxSkeletons,
			maxTextKeysPerSkeleton,
			decimals,
		),
		wd: normalizeDistributions(
			snapshot.wd,
			maxSkeletons,
			maxTextKeysPerSkeleton,
			decimals,
		),
		hd: normalizeDistributions(
			snapshot.hd,
			maxSkeletons,
			maxTextKeysPerSkeleton,
			decimals,
		),
	};
}

export function serializePersistedSnapshot(
	snapshot: PersistedSkeletonSnapshot,
	options?: PersistedSnapshotCompactOptions,
): string {
	return JSON.stringify(compactPersistedSnapshot(snapshot, options));
}

export function parsePersistedSnapshot(
	raw: string | null | undefined,
): PersistedSkeletonSnapshot {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		if (!isRecord(parsed)) return {};
		return compactPersistedSnapshot(parsed);
	} catch {
		return {};
	}
}
