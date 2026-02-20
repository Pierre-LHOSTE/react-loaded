import {
	INTERACTIVE_TAGS,
	MEDIA_TAGS,
	SKIP_TAGS,
	SVG_TAGS,
} from "../capture/constants";

export type TextDimensions = {
	widths: Record<string, number>;
	heights: Record<string, number>;
};

/**
 * Traverses a DOM subtree depth-first and collects the rendered widths
 * and heights of leaf text elements — using the same classification logic as
 * serialize.ts so the indices match 1-to-1 with the `.loaded-text`
 * nodes in the generated skeleton.
 *
 * Returns `{ widths: { "t0": w, ... }, heights: { "t0": h, ... } }` where
 * keys follow the same depth-first order as the CLI generator.
 */
export function collectTextDimensions(root: Element): TextDimensions {
	const widths: Record<string, number> = {};
	const heights: Record<string, number> = {};
	const counter = { value: 0 };
	collectFromElement(root, widths, heights, counter);
	return { widths, heights };
}

function collectFromElement(
	el: Element,
	widths: Record<string, number>,
	heights: Record<string, number>,
	counter: { value: number },
): void {
	const tag = el.tagName.toUpperCase();

	if (SKIP_TAGS.has(tag)) return;
	if (MEDIA_TAGS.has(tag)) return;
	if (SVG_TAGS.has(tag)) return;
	if (INTERACTIVE_TAGS.has(tag) || el.getAttribute("role") === "button") {
		return;
	}

	// Leaf element with text content → measure width via Range, height via element box
	if (el.childElementCount === 0 && el.textContent?.trim()) {
		const key = `t${counter.value++}`;
		widths[key] = measureTextWidth(el);
		// Height comes from the element itself (includes padding, line-height, etc.)
		heights[key] = el.getBoundingClientRect().height;
		return;
	}

	// Layout node → check for direct text nodes (same logic as serialize.ts)
	for (const child of el.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			collectFromElement(child as Element, widths, heights, counter);
		} else if (child.nodeType === Node.TEXT_NODE) {
			const text = child.textContent?.trim();
			if (text) {
				const key = `t${counter.value++}`;
				widths[key] = measureNodeWidth(child);
				// For bare text nodes, use the parent element's height
				heights[key] = el.getBoundingClientRect().height;
			}
		}
	}
}

/**
 * Measures the rendered width of the text content inside an element
 * using a Range, so block-level elements return the text width
 * rather than the full box width.
 */
function measureTextWidth(el: Element): number {
	try {
		const range = document.createRange();
		range.selectNodeContents(el);
		return range.getBoundingClientRect().width;
	} catch {
		return 0;
	}
}

/** Measures the rendered width of a single DOM node (typically a Text node). */
function measureNodeWidth(node: Node): number {
	try {
		const range = document.createRange();
		range.selectNodeContents(node);
		return range.getBoundingClientRect().width;
	} catch {
		return 0;
	}
}
