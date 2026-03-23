/**
 * Pixel-perfect skeleton layout tests.
 *
 * These tests run in a REAL browser (Chromium via Playwright) and verify
 * that skeleton components maintain the exact same dimensions as the
 * original HTML — measured with getBoundingClientRect().
 *
 * Pipeline tested end-to-end:
 *   HTML fixture → serializeElement() → generateComponent() → eval → render → measure → compare
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { transform } from "sucrase";
import { afterEach, describe, expect, it } from "vitest";
import { serializeElement } from "../capture/serialize";
import { generateComponent } from "../generator/to-jsx";
import { requireValue } from "../utils/require-value";
import cssText from "./autoskeleton.css?raw";

// Tolerance in pixels for dimension comparison.
// Sub-pixel rounding can cause ±1px differences.
const TOLERANCE = 1;

// ---------------------------------------------------------------------------
// Setup: inject skeleton CSS into the page
// ---------------------------------------------------------------------------
let styleEl: HTMLStyleElement | null = null;
const containers: HTMLElement[] = [];

function injectCSS() {
	if (styleEl) return;
	styleEl = document.createElement("style");
	styleEl.textContent = cssText;
	document.head.appendChild(styleEl);
}

afterEach(() => {
	for (const c of containers) c.remove();
	containers.length = 0;
});

// ---------------------------------------------------------------------------
// Helper: eval generated TSX source into a React component
// ---------------------------------------------------------------------------
function evalComponent(source: string): React.ComponentType<{
	variant?: "filled" | "ghost";
	className?: string;
	style?: React.CSSProperties;
	dataSkId?: string;
}> {
	const fnName = source.match(/export function (\w+)/)?.[1];
	if (!fnName) throw new Error("Could not find exported function name");

	// Use classic JSX transform (React.createElement) — no require/import needed
	const { code } = transform(source, {
		transforms: ["typescript", "jsx", "imports"],
		jsxRuntime: "classic",
		jsxPragma: "React.createElement",
		jsxFragmentPragma: "React.Fragment",
		production: true,
	});

	const exports: Record<string, unknown> = {};
	const module_ = { exports };
	const require_ = (mod: string) => {
		if (mod === "react") return React;
		throw new Error(`Unexpected require in browser eval: ${mod}`);
	};

	const fn = new Function("React", "exports", "module", "require", code);
	fn(React, exports, module_, require_);

	return (module_.exports as Record<string, unknown>)[
		fnName
	] as React.ComponentType<{
		variant?: "filled" | "ghost";
		className?: string;
		style?: React.CSSProperties;
		dataSkId?: string;
	}>;
}

// ---------------------------------------------------------------------------
// Helper: mount HTML string, returns the first child element
// ---------------------------------------------------------------------------
function mountHTML(html: string): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.style.position = "absolute";
	wrapper.style.left = "0";
	wrapper.style.top = "0";
	wrapper.style.width = "600px"; // Fixed container width for consistent tests
	wrapper.innerHTML = html;
	document.body.appendChild(wrapper);
	containers.push(wrapper);
	return wrapper.firstElementChild as HTMLElement;
}

// ---------------------------------------------------------------------------
// Helper: render a React component into the DOM and wait for paint
// ---------------------------------------------------------------------------
function mountReact(
	Component: React.ComponentType<Record<string, unknown>>,
	props: Record<string, unknown>,
): Promise<HTMLElement> {
	return new Promise((resolve) => {
		const wrapper = document.createElement("div");
		wrapper.style.position = "absolute";
		wrapper.style.left = "0";
		wrapper.style.top = "0";
		wrapper.style.width = "600px";
		document.body.appendChild(wrapper);
		containers.push(wrapper);

		const root = ReactDOM.createRoot(wrapper);
		root.render(React.createElement(Component, props));

		// Wait for browser to paint
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				resolve(wrapper.firstElementChild as HTMLElement);
			});
		});
	});
}

// ---------------------------------------------------------------------------
// Measure: collect boundingClientRect for each element in DFS order
// ---------------------------------------------------------------------------
interface ElementRect {
	tag: string;
	width: number;
	height: number;
	// Position relative to root
	offsetX: number;
	offsetY: number;
}

function measureAll(root: HTMLElement): ElementRect[] {
	const rootRect = root.getBoundingClientRect();
	const results: ElementRect[] = [];

	function walk(el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		results.push({
			tag: el.tagName.toLowerCase(),
			width: rect.width,
			height: rect.height,
			offsetX: rect.left - rootRect.left,
			offsetY: rect.top - rootRect.top,
		});
		for (const child of el.children) {
			walk(child as HTMLElement);
		}
	}

	walk(root);
	return results;
}

// ---------------------------------------------------------------------------
// Measure text elements specifically — collect widths/heights for CSS vars
// ---------------------------------------------------------------------------
function measureTextElements(root: HTMLElement): {
	widths: Record<string, number>;
	heights: Record<string, number>;
} {
	const widths: Record<string, number> = {};
	const heights: Record<string, number> = {};

	// Walk in DFS order matching serialize order — text elements are leaf
	// elements with text content and no child elements
	let textIndex = 0;

	function walk(el: HTMLElement) {
		const hasChildElements = el.childElementCount > 0;
		const hasText = !!el.textContent?.trim();

		if (!hasChildElements && hasText) {
			// This is a text element
			const rect = el.getBoundingClientRect();
			const key = `t${textIndex}`;
			widths[key] = Math.round(rect.width);
			heights[key] = Math.round(rect.height);
			textIndex++;
			return;
		}

		for (const child of el.children) {
			walk(child as HTMLElement);
		}
	}

	walk(root);
	return { widths, heights };
}

// ---------------------------------------------------------------------------
// Full pipeline: HTML → serialize → generate → eval → render → measure
// ---------------------------------------------------------------------------
async function runPixelTest(
	html: string,
	id: string,
	opts: { variant?: "filled" | "ghost"; tolerance?: number } = {},
) {
	injectCSS();

	const tolerance = opts.tolerance ?? TOLERANCE;

	// 1. Mount original HTML and measure
	const original = mountHTML(html);

	// Force layout
	original.getBoundingClientRect();

	const originalMeasurements = measureAll(original);
	const { widths, heights } = measureTextElements(original);

	// 2. Serialize
	const tree = serializeElement(original);
	if (!tree) throw new Error("serializeElement returned null");

	// 3. Generate skeleton component
	const source = generateComponent(id, tree);

	// 4. Eval into React component
	const Component = evalComponent(source);

	// 5. Build CSS variables for text dimensions
	const cssVars: Record<string, string> = {};
	for (const [key, value] of Object.entries(widths)) {
		cssVars[`--sk-w-${key}`] = `${value}px`;
	}
	for (const [key, value] of Object.entries(heights)) {
		cssVars[`--sk-h-${key}`] = `${value}px`;
	}

	// 6. Render skeleton
	const skeleton = await mountReact(Component, {
		variant: opts.variant ?? "ghost",
		style: cssVars,
		dataSkId: id,
	});

	if (!skeleton) throw new Error("Skeleton did not render");

	// 7. Measure skeleton
	const skeletonMeasurements = measureAll(skeleton);

	// 8. Compare root dimensions
	const origRoot = originalMeasurements[0];
	const skelRoot = skeletonMeasurements[0];

	return {
		original: originalMeasurements,
		skeleton: skeletonMeasurements,
		origRoot,
		skelRoot,
		source,
		tolerance,
	};
}

function expectClose(
	actual: number,
	expected: number,
	tolerance: number,
	label: string,
) {
	const diff = Math.abs(actual - expected);
	expect(
		diff,
		`${label}: expected ~${expected}px, got ${actual}px (diff: ${diff}px, tolerance: ${tolerance}px)`,
	).toBeLessThanOrEqual(tolerance);
}

// ====================================================================
// TESTS
// ====================================================================

describe("pixel-perfect skeleton layout", () => {
	// ----------------------------------------------------------------
	// 1. Block text elements
	// ----------------------------------------------------------------
	describe("block text elements", () => {
		it("<p> maintains width and height", async () => {
			const r = await runPixelTest(
				`<div style="width: 400px">
					<p style="font-size: 16px; line-height: 24px; margin: 0">Hello World</p>
				</div>`,
				"block-p",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("<h1> maintains dimensions", async () => {
			const r = await runPixelTest(
				`<div style="width: 500px">
					<h1 style="font-size: 32px; margin: 0">Page Title</h1>
				</div>`,
				"block-h1",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("<div> with text maintains dimensions", async () => {
			const r = await runPixelTest(
				`<div style="width: 300px">
					<div style="font-size: 14px; line-height: 20px">Some content text here</div>
				</div>`,
				"block-div",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});
	});

	// ----------------------------------------------------------------
	// 2. Inline text elements — the main bug scenario
	// ----------------------------------------------------------------
	describe("inline text elements (min-width bug)", () => {
		it("<span> width matches original text width", async () => {
			const r = await runPixelTest(
				`<div>
					<span style="font-size: 16px">Short text</span>
				</div>`,
				"inline-span",
			);
			// The skeleton span should be at least as wide as the original
			const origSpan = r.original[1]; // first child
			const skelSpan = r.skeleton[1];
			expectClose(skelSpan.width, origSpan.width, r.tolerance, "span width");
			expectClose(skelSpan.height, origSpan.height, r.tolerance, "span height");
		});

		it("<strong> inside <p> preserves dimensions", async () => {
			const r = await runPixelTest(
				`<div>
					<p style="margin: 0"><strong style="font-size: 16px">Bold text here</strong></p>
				</div>`,
				"inline-strong",
			);
			// Find the strong in each tree
			const origStrong = r.original.find((e) => e.tag === "strong");
			const skelStrong = r.skeleton.find((e) => e.tag === "strong");
			expect(origStrong).toBeDefined();
			expect(skelStrong).toBeDefined();
			const originalStrong = requireValue(
				origStrong,
				"Missing original strong measurement",
			);
			const skeletonStrong = requireValue(
				skelStrong,
				"Missing skeleton strong measurement",
			);
			expectClose(
				skeletonStrong.width,
				originalStrong.width,
				r.tolerance,
				"strong width",
			);
			expectClose(
				skeletonStrong.height,
				originalStrong.height,
				r.tolerance,
				"strong height",
			);
		});

		it("<em> maintains width", async () => {
			const r = await runPixelTest(
				`<div>
					<em style="font-size: 14px">Emphasized content</em>
				</div>`,
				"inline-em",
			);
			const origEm = r.original.find((e) => e.tag === "em");
			const skelEm = r.skeleton.find((e) => e.tag === "em");
			expect(origEm).toBeDefined();
			expect(skelEm).toBeDefined();
			expectClose(
				requireValue(skelEm, "Missing skeleton em measurement").width,
				requireValue(origEm, "Missing original em measurement").width,
				r.tolerance,
				"em width",
			);
		});

		it("<a> link (interactive) preserves outer container dimensions", async () => {
			// <a> is classified as "interactive" (not "text"), so the skeleton
			// replaces its content with \u00A0 and uses explicit width/height.
			// We verify the root container dimensions stay the same.
			const r = await runPixelTest(
				`<div style="display: inline-flex">
					<a style="font-size: 14px; display: inline-block">Click here for more</a>
				</div>`,
				"inline-a",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("<small> + <code> maintain individual widths", async () => {
			const r = await runPixelTest(
				`<div style="font-size: 14px">
					<small>Version 1.0</small>
					<code style="margin-left: 8px">npm install</code>
				</div>`,
				"inline-multi",
			);
			const origSmall = r.original.find((e) => e.tag === "small");
			const skelSmall = r.skeleton.find((e) => e.tag === "small");
			const origCode = r.original.find((e) => e.tag === "code");
			const skelCode = r.skeleton.find((e) => e.tag === "code");
			expect(origSmall).toBeDefined();
			expect(skelSmall).toBeDefined();
			const originalSmall = requireValue(
				origSmall,
				"Missing original small measurement",
			);
			const skeletonSmall = requireValue(
				skelSmall,
				"Missing skeleton small measurement",
			);
			expectClose(
				skeletonSmall.width,
				originalSmall.width,
				r.tolerance,
				"small width",
			);
			expect(origCode).toBeDefined();
			expect(skelCode).toBeDefined();
			expectClose(
				requireValue(skelCode, "Missing skeleton code measurement").width,
				requireValue(origCode, "Missing original code measurement").width,
				r.tolerance,
				"code width",
			);
		});
	});

	// ----------------------------------------------------------------
	// 3. Flex containers
	// ----------------------------------------------------------------
	describe("flex containers", () => {
		it("flex row with text children", async () => {
			const r = await runPixelTest(
				`<div style="display: flex; align-items: center; gap: 12px; font-size: 14px">
					<span>Label</span>
					<span>Value here</span>
				</div>`,
				"flex-row",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("flex column with multiple paragraphs", async () => {
			const r = await runPixelTest(
				`<div style="display: flex; flex-direction: column; gap: 8px; width: 300px">
					<p style="margin: 0; font-size: 18px">Title</p>
					<p style="margin: 0; font-size: 14px">Description text goes here and might be longer</p>
					<p style="margin: 0; font-size: 12px; color: gray">2 hours ago</p>
				</div>`,
				"flex-col",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("inline-flex icon + text", async () => {
			const r = await runPixelTest(
				`<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 14px">
					<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>
					<span>Status</span>
				</span>`,
				"inline-flex-icon",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});
	});

	// ----------------------------------------------------------------
	// 4. Shrink-to-fit / width-dependent containers
	// ----------------------------------------------------------------
	describe("shrink-to-fit containers", () => {
		it("inline-block container depends on child text width", async () => {
			const r = await runPixelTest(
				`<div style="display: inline-block; padding: 8px 16px; border: 1px solid black; font-size: 14px">
					<span>Dynamic width label</span>
				</div>`,
				"shrink-inline-block",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("fit-content container", async () => {
			const r = await runPixelTest(
				`<div style="width: fit-content; padding: 4px 12px; font-size: 14px">
					<span>Tag Label</span>
				</div>`,
				"shrink-fit-content",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});
	});

	// ----------------------------------------------------------------
	// 5. Media elements
	// ----------------------------------------------------------------
	describe("media elements", () => {
		it("img with explicit dimensions", async () => {
			const r = await runPixelTest(
				`<div>
					<img width="200" height="150" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
				</div>`,
				"media-img",
			);
			// img becomes div.loaded-media with explicit width/height
			const origImg = r.original.find((e) => e.tag === "img");
			const originalImage = requireValue(
				origImg,
				"Missing original image measurement",
			);
			const origImgIndex = r.original.indexOf(originalImage);
			const skelMedia = r.skeleton[origImgIndex];
			expect(origImg).toBeDefined();
			expect(skelMedia).toBeDefined();
			const skeletonMedia = requireValue(
				skelMedia,
				"Missing skeleton image measurement",
			);
			expectClose(
				skeletonMedia.width,
				originalImage.width,
				r.tolerance,
				"img width",
			);
			expectClose(
				skeletonMedia.height,
				originalImage.height,
				r.tolerance,
				"img height",
			);
		});
	});

	// ----------------------------------------------------------------
	// 6. Complex card layouts
	// ----------------------------------------------------------------
	describe("complex card layouts", () => {
		it("user card: avatar + text column", async () => {
			const r = await runPixelTest(
				`<div style="display: flex; align-items: center; gap: 12px; padding: 16px; width: 350px">
					<img width="48" height="48" style="border-radius: 50%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
					<div style="display: flex; flex-direction: column; gap: 4px">
						<strong style="font-size: 16px">John Doe</strong>
						<span style="font-size: 14px; color: gray">john@example.com</span>
						<span style="font-size: 12px; color: gray">Member since 2020</span>
					</div>
				</div>`,
				"user-card",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"card width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"card height",
			);

			// Check individual text elements
			const origTexts = r.original.filter(
				(e) => ["strong", "span"].includes(e.tag) && e.width > 0,
			);
			const skelTexts = r.skeleton.filter(
				(e) => ["strong", "span"].includes(e.tag) && e.width > 0,
			);
			for (let i = 0; i < Math.min(origTexts.length, skelTexts.length); i++) {
				expectClose(
					skelTexts[i].width,
					origTexts[i].width,
					r.tolerance,
					`text[${i}] (${origTexts[i].tag}) width`,
				);
				expectClose(
					skelTexts[i].height,
					origTexts[i].height,
					r.tolerance,
					`text[${i}] (${origTexts[i].tag}) height`,
				);
			}
		});

		it("post card: title + body + meta", async () => {
			const r = await runPixelTest(
				`<div style="display: flex; flex-direction: column; gap: 8px; padding: 16px; width: 400px">
					<h3 style="margin: 0; font-size: 20px">Blog Post Title</h3>
					<p style="margin: 0; font-size: 14px; line-height: 1.5">
						This is the body text of the post. It might wrap to multiple lines depending on container width.
					</p>
					<span style="font-size: 12px; color: gray">3 days ago</span>
				</div>`,
				"post-card",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"card width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"card height",
			);
		});

		it("stat card: label + value + trend", async () => {
			const r = await runPixelTest(
				`<div style="display: flex; flex-direction: column; gap: 4px; padding: 16px; width: 200px">
					<span style="font-size: 12px; color: gray">Revenue</span>
					<h2 style="margin: 0; font-size: 28px; font-weight: bold">$12,450</h2>
					<div style="display: flex; align-items: center; gap: 4px">
						<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 4l4 8H4z" fill="green"/></svg>
						<span style="font-size: 14px; color: green">+14.2%</span>
					</div>
				</div>`,
				"stat-card",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"card width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"card height",
			);
		});
	});

	// ----------------------------------------------------------------
	// 7. Mixed inline + block
	// ----------------------------------------------------------------
	describe("mixed structures", () => {
		it("paragraph with inline elements preserves layout", async () => {
			const r = await runPixelTest(
				`<div style="width: 400px">
					<p style="margin: 0; font-size: 14px; line-height: 1.6">
						<strong>Important:</strong>
						<em>This is mixed content</em>
					</p>
				</div>`,
				"mixed-inline",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("list items maintain dimensions", async () => {
			const r = await runPixelTest(
				`<ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px">
					<li>First item</li>
					<li>Second longer item here</li>
					<li>Third</li>
				</ul>`,
				"list-items",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"list width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"list height",
			);
		});
	});

	// ----------------------------------------------------------------
	// 8. Edge cases
	// ----------------------------------------------------------------
	describe("edge cases", () => {
		it("very long text wrapping in fixed-width container", async () => {
			const r = await runPixelTest(
				`<div style="width: 200px; font-size: 14px">
					<p style="margin: 0; line-height: 1.5">
						This is a very long paragraph that will definitely wrap across multiple lines in a narrow 200px container
					</p>
				</div>`,
				"long-text-wrap",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});

		it("single character text", async () => {
			const r = await runPixelTest(
				`<div>
					<span style="font-size: 14px">X</span>
				</div>`,
				"single-char",
			);
			const origSpan = r.original.find((e) => e.tag === "span");
			const skelSpan = r.skeleton.find((e) => e.tag === "span");
			expect(origSpan).toBeDefined();
			expect(skelSpan).toBeDefined();
			expectClose(
				requireValue(skelSpan, "Missing skeleton span measurement").width,
				requireValue(origSpan, "Missing original span measurement").width,
				r.tolerance,
				"span width",
			);
		});

		it("deeply nested structure preserves outer dimensions", async () => {
			const r = await runPixelTest(
				`<div style="padding: 16px; width: 300px">
					<div style="display: flex; flex-direction: column; gap: 8px">
						<div style="display: flex; align-items: center; gap: 8px">
							<div style="display: flex; flex-direction: column">
								<span style="font-size: 14px">Nested label</span>
							</div>
						</div>
					</div>
				</div>`,
				"deep-nested",
			);
			expectClose(
				r.skelRoot.width,
				r.origRoot.width,
				r.tolerance,
				"root width",
			);
			expectClose(
				r.skelRoot.height,
				r.origRoot.height,
				r.tolerance,
				"root height",
			);
		});
	});
});
