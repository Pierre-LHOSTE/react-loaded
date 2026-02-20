import type { CapturedNode } from "../types";
import { INTERACTIVE_TAGS, MEDIA_TAGS, SKIP_TAGS, SVG_TAGS } from "./constants";

const ANT_DEV_ONLY_CLASS_PREFIX = "css-dev-only-do-not-override-";
const MASK_CHAR = "•";
const NON_WHITESPACE = /\S/g;

function classifyNode(el: Element): CapturedNode["nodeType"] {
	const tag = el.tagName.toUpperCase();
	if (MEDIA_TAGS.has(tag)) return "media";
	if (SVG_TAGS.has(tag)) return "svg";
	if (INTERACTIVE_TAGS.has(tag) || el.getAttribute("role") === "button") {
		return "interactive";
	}
	if (el.childElementCount === 0 && el.textContent?.trim()) return "text";
	return "layout";
}

function maskTextContent(text: string): string {
	return text.replace(NON_WHITESPACE, MASK_CHAR);
}

function resolveTextAlign(el: HTMLElement): "left" | "center" | "right" {
	const align = globalThis.getComputedStyle(el).textAlign;
	if (align === "center") return "center";
	if (align === "right" || align === "end") return "right";
	return "left";
}

function getInlineStyles(el: HTMLElement): Record<string, string> {
	const style: Record<string, string> = {};
	for (let i = 0; i < el.style.length; i++) {
		const prop = el.style[i];
		style[prop] = el.style.getPropertyValue(prop);
	}
	return style;
}

function normalizeClassToken(token: string): string[] {
	if (token.startsWith(ANT_DEV_ONLY_CLASS_PREFIX)) {
		const hash = token.slice(ANT_DEV_ONLY_CLASS_PREFIX.length);
		if (hash) return [token, `css-${hash}`];
	}
	return [token];
}

function normalizeClassName(rawClassName: string): string {
	if (!rawClassName) return "";

	const uniqueTokens = new Set<string>();
	for (const token of rawClassName.split(/\s+/)) {
		if (!token) continue;
		for (const normalized of normalizeClassToken(token)) {
			if (!normalized) continue;
			uniqueTokens.add(normalized);
		}
	}
	return Array.from(uniqueTokens).join(" ");
}

function serializeNode(el: Element): CapturedNode | null {
	const tag = el.tagName.toUpperCase();
	if (SKIP_TAGS.has(tag)) return null;

	const htmlEl = el as HTMLElement;
	const nodeType = classifyNode(el);
	const rawClassName = el.getAttribute("class") || "";
	const className = normalizeClassName(rawClassName);
	const style = getInlineStyles(htmlEl);

	const attributes: Record<string, string> = {};
	for (const attr of el.attributes) {
		if (attr.name === "class" || attr.name === "style") continue;
		if (
			attr.name.startsWith("data-") ||
			attr.name === "role" ||
			attr.name === "aria-label"
		) {
			attributes[attr.name] = attr.value;
		}
	}

	const node: CapturedNode = {
		tag: tag.toLowerCase(),
		className,
		style,
		attributes,
		children: [],
		nodeType,
	};

	if (
		nodeType === "media" ||
		nodeType === "svg" ||
		nodeType === "interactive"
	) {
		const rect = el.getBoundingClientRect();
		node.rect = {
			width: Math.round(rect.width),
			height: Math.round(rect.height),
		};
	}

	if (nodeType === "text") {
		const text = el.textContent?.trim() || "";
		const maskedText = maskTextContent(text);
		node.textContent = maskedText;
		const align = resolveTextAlign(htmlEl);
		if (align !== "left") node.textAlign = align;
	}

	// Don't recurse into SVG children — they'll be replaced by a block
	if (nodeType === "svg") return node;

	for (const child of el.childNodes) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			const childNode = serializeNode(child as Element);
			if (childNode) node.children.push(childNode);
			continue;
		}

		// Preserve direct text nodes when mixed with child elements
		// (e.g. icon + "Reply"), otherwise the label disappears.
		if (child.nodeType === Node.TEXT_NODE && nodeType === "layout") {
			const rawText = child.textContent ?? "";
			const text = rawText.trim();
			if (!text) continue;
			node.children.push({
				tag: "span",
				className: "",
				style: {},
				attributes: {},
				children: [],
				nodeType: "text",
				textContent: maskTextContent(text),
			});
		}
	}

	return node;
}

export function serializeElement(root: Element): CapturedNode | null {
	return serializeNode(root);
}
