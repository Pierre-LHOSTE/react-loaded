// Text width configuration (in ch units)
const TEXT_WIDTH_MIN_CH = 6;
const TEXT_WIDTH_MAX_CH = 40;

function isElement(value: unknown): value is Element {
	if (!value || typeof value !== "object") return false;
	const maybeElement = value as Element;
	// Must have nodeType 1 (Element) and a working querySelectorAll
	if (maybeElement.nodeType !== 1) return false;
	if (typeof maybeElement.tagName !== "string") return false;
	if (typeof maybeElement.querySelectorAll !== "function") return false;
	// Additional check: instanceof Element if available
	if (typeof Element !== "undefined" && !(value instanceof Element)) {
		return false;
	}
	return true;
}

export function isUsableElement(value: unknown): value is Element {
	if (!isElement(value)) return false;
	// Test that querySelectorAll actually works
	try {
		(value as Element).querySelectorAll("*");
		return true;
	} catch {
		return false;
	}
}

const MEDIA_ELEMENTS = new Set(["IMG", "VIDEO", "CANVAS"]);
const SVG_ELEMENTS = new Set(["SVG"]);

const INTERACTIVE_ELEMENTS = new Set([
	"BUTTON",
	"INPUT",
	"TEXTAREA",
	"SELECT",
	"A",
]);

const BUTTON_LIKE_SELECTOR = "button,input,textarea,select,a,[role='button']";
const SKIPPED_TAGS = new Set([
	"SCRIPT",
	"STYLE",
	"LINK",
	"META",
	"NOSCRIPT",
	"TEMPLATE",
]);

function getTagName(el: Element): string {
	return el.tagName.toUpperCase();
}

function isButtonLikeElement(el: Element, tagName = getTagName(el)): boolean {
	if (INTERACTIVE_ELEMENTS.has(tagName)) return true;
	const role = el.getAttribute("role");
	return role === "button";
}

function isButtonLikeDescendant(el: Element, tagName: string): boolean {
	const closestButton = el.closest(BUTTON_LIKE_SELECTOR);
	return Boolean(closestButton && !isButtonLikeElement(el, tagName));
}

function isContentElement(el: Element, tagName = getTagName(el)): boolean {
	if (MEDIA_ELEMENTS.has(tagName)) return true;
	if (SVG_ELEMENTS.has(tagName)) return true;
	if (isButtonLikeElement(el, tagName)) return true;

	const isLeafNode = el.childElementCount === 0;

	// Text elements that are leaf nodes (no child elements, only text)
	if (isLeafNode && el.textContent?.trim()) return true;

	return false;
}

/**
 * Calculate text skeleton width in ch units based on text content.
 * Uses a deterministic jitter: widthCh = clamp(6, 40, len + 2 + jitter)
 */
function calculateTextWidthCh(text: string, seedKey: string): number {
	const textLength = text.length;
	const jitterRange = Math.max(4, 0.8 * textLength);
	const jitter = deterministicJitter(seedKey) * jitterRange;
	const width = textLength + 2 + jitter;
	return Math.max(TEXT_WIDTH_MIN_CH, Math.min(TEXT_WIDTH_MAX_CH, width));
}

function deterministicJitter(seedKey: string): number {
	if (!seedKey) return 0;
	let hash = 2166136261;
	for (let index = 0; index < seedKey.length; index += 1) {
		hash ^= seedKey.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	const normalized = (hash >>> 0) / 0xffffffff;
	return normalized * 2 - 1;
}

function resolveTextAlign(el: HTMLElement): "left" | "center" | "right" {
	const align = globalThis.getComputedStyle(el).textAlign;
	if (align === "center") return "center";
	if (align === "right" || align === "end") return "right";
	return "left";
}

export function applySkeletonClasses(
	rootElement: Element,
	options: { animate?: boolean; seed?: string | number } = {},
): void {
	const { animate = true, seed } = options;
	const baseSeed =
		seed === undefined || seed === null ? "loaded" : String(seed);

	if (!isElement(rootElement)) {
		return;
	}

	const htmlRoot = rootElement as HTMLElement;

	// Apply skeleton mode to the root element
	htmlRoot.classList.add("loaded-skeleton-mode");

	if (animate) {
		htmlRoot.classList.add("loaded-animate");
	}

	// Apply background class for standalone usage (when not used via SmartSkeleton JSX)
	// If element has loaded-skeleton-wrapper, CSS handles bg via > :first-child rule
	// If element already has loaded-skeleton-bg (from JSX), this is a no-op
	const isWrapper = htmlRoot.classList.contains("loaded-skeleton-wrapper");
	if (!isWrapper) {
		htmlRoot.classList.add("loaded-skeleton-bg");
	}

	// Only add specific classes where needed (text, media, content)
	const descendants = rootElement.getElementsByTagName("*");

	let textIndex = 0;

	const processElement = (el: Element) => {
		const tagName = getTagName(el);
		if (SKIPPED_TAGS.has(tagName)) return;
		if (!isContentElement(el, tagName)) return;

		const htmlEl = el as HTMLElement;
		const isInsideButtonLike = isButtonLikeDescendant(el, tagName);
		if (isInsideButtonLike) {
			htmlEl.classList.add("loaded-skeleton-force-hide");
			return;
		}

		const textContent = el.textContent?.trim();
		const isLeafWithText = el.childElementCount === 0 && textContent;

		if (
			isLeafWithText &&
			!MEDIA_ELEMENTS.has(tagName) &&
			!SVG_ELEMENTS.has(tagName) &&
			!isButtonLikeElement(el, tagName)
		) {
			// Text elements: overlay bar with ch-based width
			htmlEl.classList.add("loaded-text-skeleton");
			htmlEl.dataset.skeletonAlign = resolveTextAlign(htmlEl);
			const seedKey = `${baseSeed}|${textIndex}|${textContent ?? ""}`;
			textIndex += 1;
			const widthCh = calculateTextWidthCh(textContent ?? "", seedKey);
			htmlEl.style.setProperty("--skeleton-text-width", `${widthCh}ch`);
		} else if (MEDIA_ELEMENTS.has(tagName)) {
			// Media elements
			htmlEl.classList.add("loaded-skeleton-media");
		} else if (SVG_ELEMENTS.has(tagName)) {
			// SVG elements rendered as rounded content blocks
			htmlEl.classList.add("loaded-skeleton-content");
			htmlEl.classList.add("loaded-skeleton-svg");
		} else {
			// Interactive elements (buttons, inputs, etc.)
			htmlEl.classList.add("loaded-skeleton-content");
			// Prevent keyboard focus / interaction while in skeleton mode.
			// aria-hidden does not remove elements from the tab order.
			htmlEl.setAttribute("tabindex", "-1");
		}
	};

	processElement(rootElement);
	for (const el of descendants) {
		processElement(el);
	}
}
