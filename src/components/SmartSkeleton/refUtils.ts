import { type ReactElement, type Ref, version as reactVersion } from "react";
import { isUsableElement } from "./applySkeletonClasses";

export const REACT_MAJOR_VERSION = Number.parseInt(reactVersion, 10);
const IS_REACT_19_OR_NEWER =
	Number.isFinite(REACT_MAJOR_VERSION) && REACT_MAJOR_VERSION >= 19;

export function resolveRefTarget(node: unknown): Element | null {
	if (isUsableElement(node)) return node;
	if (node && typeof node === "object" && "nativeElement" in node) {
		const nativeElement = (node as { nativeElement?: unknown }).nativeElement;
		if (isUsableElement(nativeElement)) return nativeElement;
	}
	return null;
}

export function getElementDisplayName(element: ReactElement): string {
	const type = element.type;
	if (typeof type === "string") {
		return `<${type}>`;
	}
	if (typeof type === "function") {
		const fn = type as { displayName?: string; name?: string };
		return `<${fn.displayName || fn.name || "Unknown"}>`;
	}
	if (typeof type === "object" && type !== null) {
		const obj = type as { displayName?: string; name?: string };
		return `<${obj.displayName || obj.name || "Unknown"}>`;
	}
	return "<Unknown>";
}

/**
 * Get the original ref from the element, supporting both React 18 and React 19.
 * React 19: ref is a regular prop on element.props.ref
 * React 18: ref is on element.ref
 */
export function getOriginalRef(
	element: ReactElement,
): Ref<unknown> | undefined {
	// React 19 style (ref as prop)
	const elementProps = element.props as { ref?: Ref<unknown> } | undefined;
	const propsRef = elementProps?.ref;
	if (propsRef !== undefined) return propsRef;

	// React 19+ warns on element.ref access; skip legacy fallback entirely.
	if (IS_REACT_19_OR_NEWER) return undefined;

	// React 18 style
	const legacyRef = (element as ReactElement & { ref?: Ref<unknown> }).ref;
	if (legacyRef !== undefined) return legacyRef;

	return undefined;
}

/**
 * Forward a ref value to the original ref (callback or object style).
 */
export function forwardRef(
	originalRef: Ref<unknown> | undefined,
	node: unknown,
) {
	if (!originalRef) return;
	if (typeof originalRef === "function") {
		originalRef(node);
	} else {
		(originalRef as React.MutableRefObject<unknown>).current = node;
	}
}
