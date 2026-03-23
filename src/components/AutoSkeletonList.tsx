import {
	Fragment,
	type ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { usePersistedCount } from "../storage/usePersistedCount";
import { usePersistedDistribution } from "../storage/usePersistedDistribution";
import { usePersistedHeightDistribution } from "../storage/usePersistedHeightDistribution";
import type { Distribution } from "../types";
import { collectTextDimensions } from "../utils/collect-text-dimensions";
import { AutoSkeleton } from "./AutoSkeleton";
import {
	useInitialCountSnapshot,
	useInitialDistributionSnapshot,
	useInitialHeightDistributionSnapshot,
} from "./LoadedProvider";

export interface AutoSkeletonListProps<T> {
	id: string;
	loading?: boolean;
	items: T[] | undefined;
	renderItem: (item: T, index: number) => ReactElement;
	renderSkeleton: (index: number) => ReactElement;
	storageKey?: string;
	defaultCount?: number;
	minCount?: number;
	maxCount?: number;
	animate?: boolean;
	variant?: "filled" | "ghost";
	keyExtractor?: (item: T, index: number) => string | number;
}

/** FNV-1a hash → uint32 seed */
function hashStringToSeed(str: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** Mulberry32 PRNG — returns () => number in [0, 1) */
function mulberry32(seed: number): () => number {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function generateWidthsFromDistribution(
	distributions: Record<string, Distribution>,
	count: number,
	seed: string,
): Record<string, number>[] {
	const rng = mulberry32(hashStringToSeed(seed));
	const result: Record<string, number>[] = [];
	for (let i = 0; i < count; i++) {
		const widths: Record<string, number> = {};
		for (const [key, { avg, dev }] of Object.entries(distributions)) {
			// uniform(-1, 1) * dev + avg
			const random = (rng() * 2 - 1) * dev + avg;
			widths[key] = Math.max(0, Math.round(random * 10) / 10);
		}
		result.push(widths);
	}
	return result;
}

export function AutoSkeletonList<T>({
	id,
	loading = false,
	items,
	renderItem,
	renderSkeleton,
	storageKey,
	defaultCount = 3,
	minCount = 1,
	maxCount,
	animate,
	variant,
	keyExtractor = (_, index) => index,
}: AutoSkeletonListProps<T>) {
	const initialCount = useInitialCountSnapshot(storageKey);
	const initialDistributions = useInitialDistributionSnapshot(storageKey);
	const initialHeightDistributions =
		useInitialHeightDistributionSnapshot(storageKey);

	const count = usePersistedCount({
		storageKey,
		defaultCount,
		currentCount: items?.length,
		loading,
		minCount,
		maxCount,
		initialCount,
	});

	const measureRef = useRef<HTMLDivElement>(null);
	const [allItemWidths, setAllItemWidths] = useState<
		Record<string, number>[] | undefined
	>();
	const [allItemHeights, setAllItemHeights] = useState<
		Record<string, number>[] | undefined
	>();

	const distributions = usePersistedDistribution({
		storageKey,
		allItemWidths,
		loading,
		initialDistributions,
	});

	const heightDistributions = usePersistedHeightDistribution({
		storageKey,
		allItemHeights,
		loading,
		initialDistributions: initialHeightDistributions,
	});

	// Measure text dimensions of all items when loading finishes
	const handleMeasure = useCallback(() => {
		if (loading || !items || items.length === 0) return;
		if (!measureRef.current) return;

		const itemElements = measureRef.current.children;
		const widths: Record<string, number>[] = [];
		const heights: Record<string, number>[] = [];
		for (let i = 0; i < itemElements.length; i++) {
			const dims = collectTextDimensions(itemElements[i]);
			widths.push(dims.widths);
			heights.push(dims.heights);
		}

		if (widths.length > 0) {
			setAllItemWidths(widths);
		}
		if (heights.length > 0) {
			setAllItemHeights(heights);
		}
	}, [loading, items]);

	useEffect(() => {
		handleMeasure();
	}, [handleMeasure]);

	// Generate randomized widths/heights from distributions (stable across renders)
	const seed = storageKey ?? id;
	const generatedWidths = useMemo(() => {
		if (!distributions) return null;
		return generateWidthsFromDistribution(distributions, count, seed);
	}, [distributions, count, seed]);

	const generatedHeights = useMemo(() => {
		if (!heightDistributions) return null;
		return generateWidthsFromDistribution(
			heightDistributions,
			count,
			`${seed}:h`,
		);
	}, [heightDistributions, count, seed]);

	if (loading) {
		return (
			<>
				{Array.from({ length: count }, (_, index) => (
					<AutoSkeleton
						key={index}
						id={id}
						loading={true}
						animate={animate}
						variant={variant}
						_textWidths={generatedWidths?.[index]}
						_textHeights={generatedHeights?.[index]}
					>
						{renderSkeleton(index)}
					</AutoSkeleton>
				))}
			</>
		);
	}

	if (!items || items.length === 0) {
		return null;
	}

	return (
		<div ref={measureRef} style={{ display: "contents" }}>
			{items.map((item, index) => (
				<Fragment key={keyExtractor(item, index)}>
					{renderItem(item, index)}
				</Fragment>
			))}
		</div>
	);
}
