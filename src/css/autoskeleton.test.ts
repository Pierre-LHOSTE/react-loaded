// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssPath = resolve(__dirname, "autoskeleton.css");
const css = readFileSync(cssPath, "utf-8");

/**
 * Helper: checks that a CSS block matching the given selector contains
 * the expected property-value pair.
 *
 * We parse naively by finding the selector then scanning the next { … }
 * block for the declaration.  Good enough for a contract test — we are
 * asserting the *presence* of rules, not validating the full cascade.
 */
function expectRule(
	selector: string,
	property: string,
	value: string | RegExp,
) {
	// Escape special regex chars in the selector so we can use it verbatim
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	// Match the selector followed by a { … } block
	const blockRegex = new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "gs");

	const blocks: string[] = [];
	for (const match of css.matchAll(blockRegex)) {
		blocks.push(match[1]);
	}

	expect(
		blocks.length,
		`Selector "${selector}" not found in CSS`,
	).toBeGreaterThan(0);

	const found = blocks.some((block) => {
		const declaration =
			value instanceof RegExp
				? new RegExp(`${property}\\s*:\\s*${value.source}`, "i")
				: new RegExp(
						`${property}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
						"i",
					);
		return declaration.test(block);
	});

	const valueStr = value instanceof RegExp ? value.source : value;
	expect(
		found,
		`Expected "${selector}" to contain "${property}: ${valueStr}"`,
	).toBe(true);
}

// ---------------------------------------------------------------------------
// CSS Custom Properties (design tokens)
// ---------------------------------------------------------------------------
describe("CSS custom properties (:root)", () => {
	it("defines --loaded-bg", () => {
		expectRule(":root", "--loaded-bg", /rgba?\([^)]+\)/);
	});

	it("defines --loaded-content", () => {
		expectRule(":root", "--loaded-content", /rgba?\([^)]+\)/);
	});

	it("defines --loaded-radius", () => {
		expectRule(":root", "--loaded-radius", /\d+px/);
	});

	it("defines --loaded-text-inset", () => {
		expectRule(":root", "--loaded-text-inset", /[\d.]+em/);
	});

	it("defines --loaded-shimmer-duration", () => {
		expectRule(":root", "--loaded-shimmer-duration", /[\d.]+s/);
	});
});

// ---------------------------------------------------------------------------
// Base skeleton — interaction lockout
// ---------------------------------------------------------------------------
describe(".loaded-skeleton base", () => {
	it("disables user-select", () => {
		expectRule(".loaded-skeleton", "user-select", "none");
	});

	it("disables pointer-events", () => {
		expectRule(".loaded-skeleton", "pointer-events", "none");
	});
});

// ---------------------------------------------------------------------------
// Dev mode — re-enable interaction
// ---------------------------------------------------------------------------
describe("dev mode (.loaded-dev-skeleton)", () => {
	it("re-enables user-select inside .loaded-dev-skeleton", () => {
		expectRule(".loaded-dev-skeleton .loaded-skeleton", "user-select", "auto");
	});

	it("re-enables pointer-events inside .loaded-dev-skeleton", () => {
		expectRule(
			".loaded-dev-skeleton .loaded-skeleton",
			"pointer-events",
			"auto",
		);
	});
});

// ---------------------------------------------------------------------------
// "Nuke everything" — transparent overrides on skeleton + all descendants
// ---------------------------------------------------------------------------
describe("transparent overrides (.loaded-skeleton, .loaded-skeleton *)", () => {
	// We check that the combined selector block contains each override
	it("sets color to transparent", () => {
		expect(css).toMatch(
			/\.loaded-skeleton[\s\S]*?color:\s*transparent\s*!important/,
		);
	});

	it("sets background-color to transparent", () => {
		expect(css).toMatch(
			/\.loaded-skeleton[\s\S]*?background-color:\s*transparent\s*!important/,
		);
	});

	it("sets border-color to transparent", () => {
		expect(css).toMatch(
			/\.loaded-skeleton[\s\S]*?border-color:\s*transparent\s*!important/,
		);
	});

	it("removes background-image", () => {
		expect(css).toMatch(
			/\.loaded-skeleton[\s\S]*?background-image:\s*none\s*!important/,
		);
	});

	it("removes box-shadow", () => {
		expect(css).toMatch(
			/\.loaded-skeleton[\s\S]*?box-shadow:\s*none\s*!important/,
		);
	});

	it("removes text-shadow", () => {
		expect(css).toMatch(
			/\.loaded-skeleton[\s\S]*?text-shadow:\s*none\s*!important/,
		);
	});
});

// ---------------------------------------------------------------------------
// Images — push off-screen
// ---------------------------------------------------------------------------
describe(".loaded-skeleton img", () => {
	it("pushes images off-screen via object-position", () => {
		expectRule(
			".loaded-skeleton img",
			"object-position",
			"-9999px -9999px !important",
		);
	});
});

// ---------------------------------------------------------------------------
// Pseudo-elements — transparent overrides
// ---------------------------------------------------------------------------
describe("pseudo-element overrides (::before, ::after)", () => {
	it("sets pseudo-element backgrounds to transparent", () => {
		expect(css).toMatch(
			/\.loaded-skeleton\s+\*::before[\s\S]*?background:\s*transparent\s*!important/,
		);
	});

	it("removes pseudo-element background-image", () => {
		expect(css).toMatch(
			/\.loaded-skeleton\s+\*::before[\s\S]*?background-image:\s*none\s*!important/,
		);
	});

	it("hides pseudo-element text color", () => {
		expect(css).toMatch(
			/\.loaded-skeleton\s+\*::before[\s\S]*?color:\s*transparent\s*!important/,
		);
	});

	it("removes pseudo-element border-color", () => {
		expect(css).toMatch(
			/\.loaded-skeleton\s+\*::before[\s\S]*?border-color:\s*transparent\s*!important/,
		);
	});

	it("removes pseudo-element box-shadow", () => {
		expect(css).toMatch(
			/\.loaded-skeleton\s+\*::before[\s\S]*?box-shadow:\s*none\s*!important/,
		);
	});

	it("removes pseudo-element text-shadow", () => {
		expect(css).toMatch(
			/\.loaded-skeleton\s+\*::before[\s\S]*?text-shadow:\s*none\s*!important/,
		);
	});
});

// ---------------------------------------------------------------------------
// Placeholder text — hidden
// ---------------------------------------------------------------------------
describe("::placeholder", () => {
	it("hides input placeholder color", () => {
		expectRule(
			".loaded-skeleton ::placeholder",
			"color",
			"transparent !important",
		);
	});

	it("hides input placeholder opacity", () => {
		expectRule(".loaded-skeleton ::placeholder", "opacity", "0 !important");
	});
});

// ---------------------------------------------------------------------------
// .loaded-bg — filled variant root background
// ---------------------------------------------------------------------------
describe(".loaded-skeleton.loaded-bg", () => {
	it("applies --loaded-bg as background-color", () => {
		expectRule(
			".loaded-skeleton.loaded-bg",
			"background-color",
			"var(--loaded-bg) !important",
		);
	});
});

// ---------------------------------------------------------------------------
// .loaded-text — text skeleton bars
// ---------------------------------------------------------------------------
describe(".loaded-text", () => {
	it("sets position relative", () => {
		expectRule(".loaded-skeleton .loaded-text", "position", "relative");
	});

	it("does NOT force display (preserves original element display)", () => {
		// A <div> with .loaded-text should stay block, a <span> should stay inline.
		// Forcing display: inline-block would break layout for block-level elements.
		const blockRegex = /\.loaded-skeleton\s+\.loaded-text\s*\{([^}]+)\}/gs;
		const blocks: string[] = [];
		for (const match of css.matchAll(blockRegex)) {
			blocks.push(match[1]);
		}
		for (const block of blocks) {
			expect(block).not.toMatch(/\bdisplay\s*:/);
		}
	});

	it("uses --loaded-text-width for min-width", () => {
		expectRule(
			".loaded-skeleton .loaded-text",
			"min-width",
			/var\(--loaded-text-width/,
		);
	});

	it("uses --loaded-text-height for min-height", () => {
		expectRule(
			".loaded-skeleton .loaded-text",
			"min-height",
			/var\(--loaded-text-height/,
		);
	});
});

describe(".loaded-text::before (skeleton bar)", () => {
	it("uses --loaded-text-content for content", () => {
		expectRule(
			".loaded-skeleton .loaded-text::before",
			"content",
			/var\(--loaded-text-content/,
		);
	});

	it("is positioned absolutely", () => {
		expectRule(
			".loaded-skeleton .loaded-text::before",
			"position",
			"absolute !important",
		);
	});

	it("uses --loaded-content as background", () => {
		expectRule(
			".loaded-skeleton .loaded-text::before",
			"background",
			"var(--loaded-content) !important",
		);
	});

	it("uses --loaded-radius for border-radius", () => {
		expectRule(
			".loaded-skeleton .loaded-text::before",
			"border-radius",
			"var(--loaded-radius) !important",
		);
	});

	it("uses --loaded-text-inset for top and bottom", () => {
		expectRule(
			".loaded-skeleton .loaded-text::before",
			"top",
			"var(--loaded-text-inset) !important",
		);
		expectRule(
			".loaded-skeleton .loaded-text::before",
			"bottom",
			"var(--loaded-text-inset) !important",
		);
	});
});

// ---------------------------------------------------------------------------
// Text alignment variants
// ---------------------------------------------------------------------------
describe("text alignment", () => {
	it("centers text bar for data-loaded-align=center", () => {
		expectRule(
			'.loaded-skeleton .loaded-text[data-loaded-align="center"]::before',
			"left",
			"50% !important",
		);
		expectRule(
			'.loaded-skeleton .loaded-text[data-loaded-align="center"]::before',
			"transform",
			"translateX(-50%) !important",
		);
	});

	it("right-aligns text bar for data-loaded-align=right", () => {
		expectRule(
			'.loaded-skeleton .loaded-text[data-loaded-align="right"]::before',
			"left",
			"auto !important",
		);
		expectRule(
			'.loaded-skeleton .loaded-text[data-loaded-align="right"]::before',
			"right",
			"0 !important",
		);
	});
});

// ---------------------------------------------------------------------------
// .loaded-media — media placeholders
// ---------------------------------------------------------------------------
describe(".loaded-media", () => {
	it("applies --loaded-content as background-color", () => {
		expectRule(
			".loaded-skeleton .loaded-media",
			"background-color",
			"var(--loaded-content) !important",
		);
	});

	it("forces opacity to 1", () => {
		expectRule(".loaded-skeleton .loaded-media", "opacity", "1 !important");
	});
});

// ---------------------------------------------------------------------------
// .loaded-svg — SVG placeholders (rounded)
// ---------------------------------------------------------------------------
describe(".loaded-svg", () => {
	it("applies --loaded-content as background-color", () => {
		expectRule(
			".loaded-skeleton .loaded-svg",
			"background-color",
			"var(--loaded-content) !important",
		);
	});

	it("applies 50% border-radius (circle)", () => {
		expectRule(
			".loaded-skeleton .loaded-svg",
			"border-radius",
			"50% !important",
		);
	});

	it("hides SVG children", () => {
		expectRule(
			".loaded-skeleton .loaded-svg *",
			"visibility",
			"hidden !important",
		);
	});
});

// ---------------------------------------------------------------------------
// .loaded-interactive — interactive element placeholders
// ---------------------------------------------------------------------------
describe(".loaded-interactive", () => {
	it("applies --loaded-content as background-color", () => {
		expectRule(
			".loaded-skeleton .loaded-interactive",
			"background-color",
			"var(--loaded-content) !important",
		);
	});
});

// ---------------------------------------------------------------------------
// .loaded-hide — force-hidden descendants
// ---------------------------------------------------------------------------
describe(".loaded-hide", () => {
	it("forces opacity 0", () => {
		expectRule(".loaded-skeleton .loaded-hide", "opacity", "0 !important");
	});

	it("forces visibility hidden", () => {
		expectRule(
			".loaded-skeleton .loaded-hide",
			"visibility",
			"hidden !important",
		);
	});
});

// ---------------------------------------------------------------------------
// Shimmer animation
// ---------------------------------------------------------------------------
describe("shimmer animation", () => {
	it("defines @keyframes loaded-shimmer", () => {
		expect(css).toContain("@keyframes loaded-shimmer");
	});

	it("applies animation on .loaded-skeleton.loaded-animate", () => {
		expectRule(
			".loaded-skeleton.loaded-animate",
			"animation",
			/loaded-shimmer/,
		);
	});

	it("disables animation when .loaded-no-animate is present (descendant)", () => {
		expectRule(
			".loaded-no-animate .loaded-skeleton.loaded-animate",
			"animation",
			"none !important",
		);
	});
});

// ---------------------------------------------------------------------------
// Dark mode (@media prefers-color-scheme: dark)
// ---------------------------------------------------------------------------
describe("dark mode (@media prefers-color-scheme: dark)", () => {
	// Extract the content of the @media (prefers-color-scheme: dark) block
	const darkMediaRegex =
		/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{([\s\S]*?)\n\}/;
	const darkMatch = css.match(darkMediaRegex);
	const darkBlock = darkMatch?.[1] ?? "";

	it("has a @media (prefers-color-scheme: dark) block", () => {
		expect(darkMatch).not.toBeNull();
	});

	it("redefines --loaded-bg inside :root", () => {
		expect(darkBlock).toMatch(/--loaded-bg\s*:\s*rgba?\([^)]+\)/);
	});

	it("redefines --loaded-content inside :root", () => {
		expect(darkBlock).toMatch(/--loaded-content\s*:\s*rgba?\([^)]+\)/);
	});

	it("dark --loaded-bg is different from light --loaded-bg", () => {
		const lightBg = css
			.match(/:root\s*\{[^}]*--loaded-bg\s*:\s*([^;]+);/)?.[1]
			?.trim();
		const darkBg = darkBlock.match(/--loaded-bg\s*:\s*([^;]+);/)?.[1]?.trim();
		expect(lightBg).toBeDefined();
		expect(darkBg).toBeDefined();
		expect(darkBg).not.toBe(lightBg);
	});

	it("dark --loaded-content is different from light --loaded-content", () => {
		const lightContent = css
			.match(/:root\s*\{[^}]*--loaded-content\s*:\s*([^;]+);/)?.[1]
			?.trim();
		const darkContent = darkBlock
			.match(/--loaded-content\s*:\s*([^;]+);/)?.[1]
			?.trim();
		expect(lightContent).toBeDefined();
		expect(darkContent).toBeDefined();
		expect(darkContent).not.toBe(lightContent);
	});

	it("does not redefine non-color properties (radius, inset, shimmer-duration)", () => {
		expect(darkBlock).not.toContain("--loaded-radius");
		expect(darkBlock).not.toContain("--loaded-text-inset");
		expect(darkBlock).not.toContain("--loaded-shimmer-duration");
	});
});
