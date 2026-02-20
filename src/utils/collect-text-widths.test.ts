import { describe, expect, it } from "vitest";
import { collectTextDimensions } from "./collect-text-widths";

function el(html: string): Element {
	const container = document.createElement("div");
	container.innerHTML = html;
	return container;
}

describe("collectTextDimensions", () => {
	it("returns both widths and heights with matching keys", () => {
		const root = el("<span>Hello</span><span>World</span>");
		const { widths, heights } = collectTextDimensions(root);
		expect(Object.keys(widths)).toEqual(["t0", "t1"]);
		expect(Object.keys(heights)).toEqual(["t0", "t1"]);
	});

	it("returns empty maps for empty tree", () => {
		const root = el("");
		const { widths, heights } = collectTextDimensions(root);
		expect(Object.keys(widths)).toHaveLength(0);
		expect(Object.keys(heights)).toHaveLength(0);
	});
});
