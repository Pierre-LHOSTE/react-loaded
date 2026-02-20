import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { sendCapture } from "../capture/client";
import { serializeElement } from "../capture/serialize";
import { usePersistedHeights } from "../hooks/usePersistedHeights";
import { usePersistedWidths } from "../hooks/usePersistedWidths";
import { collectTextDimensions } from "../utils/collect-text-widths";
import {
	useInitialHeightSnapshot,
	useInitialWidthSnapshot,
	useRegistry,
} from "./LoadedProvider";
import { SkeletonContext } from "./SkeletonContext";

const isDev = process.env.NODE_ENV !== "production";

const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

function buildDimensionVars(
	widths: Record<string, number> | null | undefined,
	heights: Record<string, number> | null | undefined,
): CSSProperties {
	const style: Record<string, string> = { display: "contents" };

	if (widths) {
		for (const [key, value] of Object.entries(widths)) {
			if (!Number.isFinite(value) || value < 0) continue;
			style[`--sk-w-${key}`] = `${value}px`;
		}
	}

	if (heights) {
		for (const [key, value] of Object.entries(heights)) {
			if (!Number.isFinite(value) || value < 0) continue;
			style[`--sk-h-${key}`] = `${value}px`;
		}
	}

	return style as CSSProperties;
}

export interface AutoSkeletonProps {
	id: string;
	children: ReactNode;
	loading?: boolean;
	animate?: boolean;
	/** Additional CSS class name applied to the skeleton root. */
	className?: string;
	variant?: "filled" | "ghost";
	/** Pre-computed widths to apply (used internally by AutoSkeletonList). */
	_textWidths?: Record<string, number>;
	/** Pre-computed heights to apply (used internally by AutoSkeletonList). */
	_textHeights?: Record<string, number>;
}

export function AutoSkeleton({
	id,
	children,
	loading = true,
	animate = true,
	className,
	variant = "filled",
	_textWidths,
	_textHeights,
}: AutoSkeletonProps) {
	const registry = useRegistry();
	const captureRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const skeletonRef = useRef<HTMLDivElement>(null);
	const initialWidths = useInitialWidthSnapshot(id);
	const initialHeights = useInitialHeightSnapshot(id);
	const [measuredWidths, setMeasuredWidths] = useState<
		Record<string, number> | undefined
	>();
	const [measuredHeights, setMeasuredHeights] = useState<
		Record<string, number> | undefined
	>();

	const storedWidths = usePersistedWidths({
		storageKey: id,
		currentWidths: measuredWidths,
		loading,
		initialWidths,
	});

	const storedHeights = usePersistedHeights({
		storageKey: id,
		currentHeights: measuredHeights,
		loading,
		initialHeights,
	});

	// Measure text dimensions once children are rendered (loading=false)
	const handleMeasure = useCallback(() => {
		if (loading) return;
		if (!measureRef.current) return;

		const firstChild = measureRef.current.firstElementChild;
		if (!firstChild) return;

		const { widths, heights } = collectTextDimensions(firstChild);
		if (Object.keys(widths).length > 0) {
			setMeasuredWidths(widths);
		}
		if (Object.keys(heights).length > 0) {
			setMeasuredHeights(heights);
		}
	}, [loading]);

	useEffect(() => {
		handleMeasure();
	}, [handleMeasure]);

	const widthsToApply = _textWidths ?? storedWidths;
	const heightsToApply = _textHeights ?? storedHeights;
	const skeletonWrapperStyle = buildDimensionVars(
		widthsToApply,
		heightsToApply,
	);

	useIsomorphicLayoutEffect(() => {
		if (!loading || !skeletonRef.current) return;
		if (!widthsToApply && !heightsToApply) return;

		const textElements =
			skeletonRef.current.querySelectorAll<HTMLElement>("[data-sk-key]");
		for (const el of textElements) {
			const key = el.dataset.skKey;
			if (!key) continue;
			if (widthsToApply && key in widthsToApply) {
				el.style.setProperty("--loaded-text-width", `${widthsToApply[key]}px`);
			}
			if (heightsToApply && key in heightsToApply) {
				el.style.setProperty(
					"--loaded-text-height",
					`${heightsToApply[key]}px`,
				);
			}
		}
	}, [loading, widthsToApply, heightsToApply]);

	useEffect(() => {
		if (!isDev) return;
		if (!captureRef.current) return;

		const root = captureRef.current.firstElementChild;
		if (!root) return;

		const timer = setTimeout(() => {
			const tree = serializeElement(root);
			if (!tree) return;

			sendCapture({
				id,
				tree,
				timestamp: Date.now(),
			});
		}, 100);

		return () => clearTimeout(timer);
	}, [id]);

	// When not loading in production, render children with a measure wrapper
	if (!loading && !isDev) {
		return (
			<div ref={measureRef} style={{ display: "contents" }}>
				{children}
			</div>
		);
	}

	const Generated = registry[id];

	if (isDev && loading && !Generated) {
		console.warn(
			`[react-loaded] No generated skeleton found for id "${id}". ` +
				"Run the autoskeleton CLI to capture and generate it.",
		);
	}

	const renderedSkeleton =
		loading && Generated ? (
			animate ? (
				<Generated variant={variant} className={className} />
			) : (
				<div className="loaded-no-animate">
					<Generated variant={variant} className={className} />
				</div>
			)
		) : null;
	const generatedSkeleton =
		isDev && renderedSkeleton ? (
			<div className="loaded-dev-skeleton">{renderedSkeleton}</div>
		) : (
			renderedSkeleton
		);

	// Production: use the generated skeleton if available, otherwise render children
	if (!isDev) {
		if (generatedSkeleton) {
			return (
				<SkeletonContext.Provider value={true}>
					<div ref={skeletonRef} data-sk-id={id} style={skeletonWrapperStyle}>
						{generatedSkeleton}
					</div>
				</SkeletonContext.Provider>
			);
		}
		return (
			<div ref={measureRef} style={{ display: "contents" }}>
				{children}
			</div>
		);
	}

	// Dev: always render children for capture, even when loading=false
	// Show generated skeleton if loading and available
	return (
		<>
			{generatedSkeleton ? (
				<SkeletonContext.Provider value={true}>
					<div ref={skeletonRef} data-sk-id={id} style={skeletonWrapperStyle}>
						{generatedSkeleton}
					</div>
				</SkeletonContext.Provider>
			) : null}
			<div
				ref={(el) => {
					captureRef.current = el;
					measureRef.current = el;
				}}
				aria-hidden="true"
				style={
					generatedSkeleton
						? {
								position: "fixed",
								top: 0,
								left: "-10000px",
								width: "100%",
								visibility: "hidden",
								pointerEvents: "none",
							}
						: { display: "contents" }
				}
			>
				{children}
			</div>
		</>
	);
}
