import {
	Fragment,
	type ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Distribution } from "../hooks/storage";
import { usePersistedCount } from "../hooks/usePersistedCount";
import { usePersistedDistribution } from "../hooks/usePersistedDistribution";
import { usePersistedHeightDistribution } from "../hooks/usePersistedHeightDistribution";
import type { SkeletonProps } from "../types";
import { collectTextDimensions } from "../utils/collect-text-widths";
import { AutoSkeleton } from "./AutoSkeleton";
import {
	useInitialCountSnapshot,
	useInitialDistributionSnapshot,
	useInitialHeightDistributionSnapshot,
} from "./LoadedProvider";

export interface AutoSkeletonListProps<T> {
	/** Skeleton registry id used for each loading row. */
	id: string;
	/** Whether the list is currently loading. Default: false */
	loading?: boolean;
	/** The items to render. Pass undefined while loading. */
	items: T[] | undefined;
	/** Render function for each item when loaded. */
	renderItem: (item: T, index: number) => ReactElement;
	/** Render function for each loading row source element. */
	renderSkeleton: (index: number) => ReactElement;
	/** Key for localStorage persistence. Without it, count resets on remount. */
	storageKey?: string;
	/** Initial skeleton count before any data is known. Default: 3 */
	defaultCount?: number;
	/** Minimum skeletons to show. Default: 1 */
	minCount?: number;
	/** Maximum skeletons to show. */
	maxCount?: number;
	/** Enable shimmer animation. Default: true */
	animate?: boolean;
	/** Visual variant for skeleton surface. Default: "filled" */
	variant?: SkeletonProps["variant"];
	/** Extract unique key for each item. Default: index */
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
	animate = true,
	variant = "filled",
	keyExtractor = (_, index) => index,
}: AutoSkeletonListProps<T>): ReactElement | null {
	const initialCount = useInitialCountSnapshot(storageKey);
	const initialDistributions = useInitialDistributionSnapshot(storageKey);
	const initialHeightDistributions =
		useInitialHeightDistributionSnapshot(storageKey);

	const skeletonCount = usePersistedCount({
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
		return generateWidthsFromDistribution(distributions, skeletonCount, seed);
	}, [distributions, skeletonCount, seed]);

	const generatedHeights = useMemo(() => {
		if (!heightDistributions) return null;
		return generateWidthsFromDistribution(
			heightDistributions,
			skeletonCount,
			`${seed}:h`,
		);
	}, [heightDistributions, skeletonCount, seed]);

	if (loading) {
		const skeletons = new Array(skeletonCount);
		for (let index = 0; index < skeletonCount; index += 1) {
			skeletons[index] = (
				<AutoSkeleton
					key={`skeleton-${index}`}
					id={id}
					animate={animate}
					variant={variant}
					_textWidths={generatedWidths?.[index]}
					_textHeights={generatedHeights?.[index]}
				>
					{renderSkeleton(index)}
				</AutoSkeleton>
			);
		}

		return <>{skeletons}</>;
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
