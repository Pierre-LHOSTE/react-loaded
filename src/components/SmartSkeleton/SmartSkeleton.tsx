import {
	cloneElement,
	type ReactElement,
	useCallback,
	useRef,
	useState,
} from "react";
import { isDevEnv } from "../../utils/isDevEnv";
import { useIsomorphicLayoutEffect } from "../../utils/useIsomorphicLayoutEffect";
import { SkeletonContext } from "../SkeletonContext/SkeletonContext";
import { applySkeletonClasses } from "./applySkeletonClasses";
import {
	forwardRef,
	getElementDisplayName,
	getOriginalRef,
	resolveRefTarget,
} from "./refUtils";
import "./SmartSkeleton.css";

export { applySkeletonClasses } from "./applySkeletonClasses";

const warnedComponents = new Set<string>();

export type SmartSkeletonVariant = "filled" | "ghost";

export interface SmartSkeletonProps {
	/** The skeleton element with mock data, rendered when loading */
	element: ReactElement;
	/** The real content to render when not loading. If omitted, returns null when loading=false. */
	children?: ReactElement;
	/** Whether the skeleton is currently loading. Default: false */
	loading?: boolean;
	/** Enable shimmer animation. Default: true */
	animate?: boolean;
	/** Additional CSS class name */
	className?: string;
	/** Optional seed to stabilize skeleton text widths */
	seed?: string | number;
	/** Visual variant for skeleton surface. `filled` adds a background, `ghost` does not. Default: "filled" */
	variant?: SmartSkeletonVariant;
	/** Suppress warning when auto-wrapper is applied. Default: false */
	suppressRefWarning?: boolean;
}

export function SmartSkeleton({
	element,
	children,
	loading = false,
	animate = true,
	className = "",
	seed,
	variant = "filled",
	suppressRefWarning = false,
}: SmartSkeletonProps): ReactElement | null {
	const currentElementType = element.type;
	const currentElementKey = element.key ?? null;
	const hasAppliedRef = useRef(false);
	const refWasCalledRef = useRef(false);
	const lastRefNodeRef = useRef<unknown>(null);
	const needsWrapperRef = useRef(false);
	const [needsWrapper, setNeedsWrapper] = useState(false);
	const previousLoadingRef = useRef(loading);
	const previousElementTypeRef =
		useRef<ReactElement["type"]>(currentElementType);
	const previousElementKeyRef = useRef<ReactElement["key"] | null>(
		currentElementKey,
	);

	const setWrapperState = useCallback((next: boolean) => {
		needsWrapperRef.current = next;
		setNeedsWrapper(next);
	}, []);

	const originalRef = getOriginalRef(element);

	const enableWrapperWithWarning = useCallback(
		(reason: "non-dom-ref" | "no-ref-call") => {
			if (!needsWrapperRef.current) {
				setWrapperState(true);
			}

			if (!suppressRefWarning && isDevEnv()) {
				const displayName = getElementDisplayName(element);
				if (!warnedComponents.has(displayName)) {
					if (reason === "non-dom-ref") {
						console.warn(
							`[SmartSkeleton] ${displayName} does not forward its ref to a DOM element. ` +
								`A wrapper <div> has been added automatically. Use forwardRef to avoid this.`,
						);
					} else {
						console.warn(
							`[SmartSkeleton] ${displayName} does not accept a ref. ` +
								`A wrapper <div> has been added automatically. Use forwardRef to avoid this.`,
						);
					}
					warnedComponents.add(displayName);
				}
			}
		},
		[element, suppressRefWarning, setWrapperState],
	);

	const refCallback = useCallback(
		(node: unknown) => {
			refWasCalledRef.current = true;
			lastRefNodeRef.current = node;

			const target = resolveRefTarget(node);

			if (target && loading && !hasAppliedRef.current) {
				applySkeletonClasses(target, { animate, seed, variant });
				hasAppliedRef.current = true;
			}

			// Forward ref to original element
			forwardRef(originalRef, node);
		},
		[loading, originalRef, animate, seed, variant],
	);

	// Single layout effect: handles identity reset AND wrapper fallback decision.
	// Merged into one effect because React fires ref callbacks (during commit)
	// BEFORE layout effects. Having a separate reset effect would clear the ref
	// data that was just written by the current commit's ref callbacks.
	useIsomorphicLayoutEffect(() => {
		const previousLoading = previousLoadingRef.current;
		const previousElementType = previousElementTypeRef.current;
		const previousElementKey = previousElementKeyRef.current;

		const didExitLoading = previousLoading && !loading;
		const hasElementIdentityChanged =
			previousElementType !== currentElementType ||
			previousElementKey !== currentElementKey;

		previousLoadingRef.current = loading;
		previousElementTypeRef.current = currentElementType;
		previousElementKeyRef.current = currentElementKey;

		if (didExitLoading || hasElementIdentityChanged) {
			hasAppliedRef.current = false;
			if (didExitLoading) {
				refWasCalledRef.current = false;
				lastRefNodeRef.current = null;
			} else if (hasElementIdentityChanged && lastRefNodeRef.current === null) {
				// Ignore cleanup-only ref callbacks from previous element identity.
				refWasCalledRef.current = false;
			}

			if (needsWrapperRef.current) {
				setWrapperState(false);
				// Re-render will re-run this effect with the direct path.
				return;
			}
		}

		if (!loading) return;
		if (needsWrapper) return;

		const node = lastRefNodeRef.current;
		const target = resolveRefTarget(node);

		if (target && !hasAppliedRef.current) {
			applySkeletonClasses(target, { animate, seed, variant });
			hasAppliedRef.current = true;
		}

		if (refWasCalledRef.current) {
			if (node !== null && !target) {
				enableWrapperWithWarning("non-dom-ref");
				return;
			}
			if (node !== null) {
				return;
			}
			// Ref callback was only invoked with null during cleanup.
			// Treat as a missing ref call for the current element.
			refWasCalledRef.current = false;
		}

		// Ref was not called: the component doesn't accept refs.
		// Switch to wrapper mode synchronously (before browser paint).
		enableWrapperWithWarning("no-ref-call");
	}, [
		loading,
		needsWrapper,
		currentElementType,
		currentElementKey,
		animate,
		seed,
		variant,
		enableWrapperWithWarning,
		setWrapperState,
	]);

	// Not loading: return children or null
	if (!loading) {
		return children ?? null;
	}

	// Build merged className for skeleton mode
	const elementProps = element.props as { className?: string };
	const existingClassName = elementProps.className ?? "";

	// Base classes for skeleton mode
	const baseClasses = ["loaded-skeleton-mode", animate && "loaded-animate"]
		.filter(Boolean)
		.join(" ");
	const filledOnlyClass = variant === "filled" ? "loaded-skeleton-bg" : "";

	// When wrapping: wrapper gets mode + wrapper marker (no bg - it goes on child via ref)
	const wrapperClassName = [baseClasses, "loaded-skeleton-wrapper", className]
		.filter(Boolean)
		.join(" ");

	// When not wrapping: element gets mode + bg directly (for SSR)
	const mergedClassName = [
		existingClassName,
		baseClasses,
		filledOnlyClass,
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<SkeletonContext.Provider value={true}>
			{needsWrapper ? (
				<div ref={refCallback} className={wrapperClassName} aria-hidden="true">
					{element}
				</div>
			) : (
				cloneElement(element as ReactElement<Record<string, unknown>>, {
					ref: refCallback,
					className: mergedClassName,
					"aria-hidden": true,
				})
			)}
		</SkeletonContext.Provider>
	);
}
