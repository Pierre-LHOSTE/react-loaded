import { describe, expect, it } from "vitest";
import { serializeElement } from "./serialize";

function mockRect(
	el: Element,
	rect: Partial<DOMRect> & { width: number; height: number },
): void {
	Object.defineProperty(el, "getBoundingClientRect", {
		value: () =>
			({
				x: 0,
				y: 0,
				top: 0,
				left: 0,
				...rect,
				right: rect.width,
				bottom: rect.height,
				width: rect.width,
				height: rect.height,
				toJSON: () => ({}),
			}) as DOMRect,
	});
}

describe("serializeElement", () => {
	it("returns null for skipped root tags", () => {
		const script = document.createElement("script");
		script.textContent = "console.log('skip')";

		expect(serializeElement(script)).toBeNull();
	});

	it("serializes layout, text, media, svg and interactive nodes with filtered attributes", () => {
		const root = document.createElement("section");
		root.className =
			"shell css-dev-only-do-not-override-tchc97 css-var-_R_lb_ shell css-tchc97";
		root.setAttribute("data-root", "yes");
		root.setAttribute("href", "#ignored");
		root.innerHTML = `
			<p class="headline css-dev-only-do-not-override-abc123" style="text-align:right">Hello autoskeleton</p>
			<script>console.log("ignored")</script>
			<img data-slot="hero" alt="ignored attribute" />
			<div role="button" aria-label="Open panel"><span>Open</span></div>
			<svg><rect width="10" height="10"></rect></svg>
		`;

		const image = root.querySelector("img");
		const buttonLike = root.querySelector("div[role='button']");
		const svg = root.querySelector("svg");

		if (!image || !buttonLike || !svg) {
			throw new Error("Fixture setup failed");
		}

		mockRect(image, { width: 320.2, height: 180.7 });
		mockRect(buttonLike, { width: 200, height: 48 });
		mockRect(svg, { width: 64, height: 40 });

		const tree = serializeElement(root);
		if (!tree) throw new Error("Tree should not be null");

		expect(tree.tag).toBe("section");
		expect(tree.nodeType).toBe("layout");
		expect(tree.className).toBe(
			"shell css-dev-only-do-not-override-tchc97 css-tchc97 css-var-_R_lb_",
		);
		expect(tree.attributes).toEqual({ "data-root": "yes" });
		expect(tree.children).toHaveLength(4);

		const textNode = tree.children[0];
		expect(textNode.tag).toBe("p");
		expect(textNode.nodeType).toBe("text");
		expect(textNode.className).toBe(
			"headline css-dev-only-do-not-override-abc123 css-abc123",
		);
		expect(textNode.textContent).toBe("••••• ••••••••••••");
		expect(textNode.textAlign).toBe("right");

		const mediaNode = tree.children[1];
		expect(mediaNode.tag).toBe("img");
		expect(mediaNode.nodeType).toBe("media");
		expect(mediaNode.rect).toEqual({ width: 320, height: 181 });
		expect(mediaNode.attributes).toEqual({ "data-slot": "hero" });

		const interactiveNode = tree.children[2];
		expect(interactiveNode.tag).toBe("div");
		expect(interactiveNode.nodeType).toBe("interactive");
		expect(interactiveNode.rect).toEqual({ width: 200, height: 48 });
		expect(interactiveNode.attributes).toEqual({
			role: "button",
			"aria-label": "Open panel",
		});
		expect(interactiveNode.children[0]?.nodeType).toBe("text");

		const svgNode = tree.children[3];
		expect(svgNode.tag).toBe("svg");
		expect(svgNode.nodeType).toBe("svg");
		expect(svgNode.rect).toEqual({ width: 64, height: 40 });
		expect(svgNode.children).toEqual([]);
	});

	it("masks text content with bullets while preserving spaces", () => {
		const root = document.createElement("div");
		root.innerHTML = "<p>username here</p>";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected serialized tree");

		expect(tree.children[0]?.textContent).toBe("•••••••• ••••");
	});

	it("produces stable masked text across repeated calls", () => {
		const root = document.createElement("div");
		root.innerHTML = "<span>Stable output expected</span>";

		const first = serializeElement(root);
		const second = serializeElement(root);

		if (!first || !second) throw new Error("Expected serialized trees");

		expect(first.children[0]?.textContent).toBe(
			second.children[0]?.textContent,
		);
	});

	it("resolves text-align center", () => {
		const root = document.createElement("div");
		root.innerHTML = '<p style="text-align:center">Centered</p>';

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.children[0]?.textAlign).toBe("center");
	});

	it("resolves text-align end as right", () => {
		const root = document.createElement("div");
		root.innerHTML = '<p style="text-align:end">End aligned</p>';

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.children[0]?.textAlign).toBe("right");
	});

	it("defaults text-align left (omits textAlign field)", () => {
		const root = document.createElement("div");
		root.innerHTML = "<p>Left aligned</p>";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.children[0]?.textAlign).toBeUndefined();
	});

	it("classifies role=button as interactive", () => {
		const root = document.createElement("div");
		root.innerHTML = '<span role="button">Click me</span>';
		const btn = root.querySelector("span");
		if (!btn) throw new Error("Fixture setup failed");
		mockRect(btn, { width: 100, height: 36 });

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.children[0]?.nodeType).toBe("interactive");
		expect(tree.children[0]?.rect).toEqual({ width: 100, height: 36 });
	});

	it("serializes 3+ levels of nesting", () => {
		const root = document.createElement("div");
		root.innerHTML = "<div><div><span>Deep</span></div></div>";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		const level3 = tree.children[0]?.children[0]?.children[0];
		expect(level3?.tag).toBe("span");
		expect(level3?.textContent).toBe("••••");
	});

	it("deduplicates class names", () => {
		const root = document.createElement("div");
		root.className = "foo bar foo baz bar";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.className).toBe("foo bar baz");
	});

	it("handles empty className gracefully", () => {
		const root = document.createElement("div");
		root.className = "";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.className).toBe("");
	});

	it("extracts inline styles", () => {
		const root = document.createElement("div");
		root.style.setProperty("padding", "8px");
		root.style.setProperty("--custom", "red");

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		expect(tree.style.padding).toBe("8px");
		expect(tree.style["--custom"]).toBe("red");
	});

	it("ignores whitespace-only text nodes", () => {
		const root = document.createElement("div");
		root.innerHTML = "<span>  </span><span>   \t\n  </span>";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected tree");

		// spans with only whitespace become layout nodes (no textContent)
		for (const child of tree.children) {
			expect(child.nodeType).toBe("layout");
		}
	});

	it("captures direct text nodes mixed with element children", () => {
		const root = document.createElement("div");
		root.innerHTML =
			"<span class='meta'><span aria-label='icon'>*</span>Reply</span>";

		const tree = serializeElement(root);
		if (!tree) throw new Error("Expected serialized tree");

		const meta = tree.children[0];
		expect(meta?.tag).toBe("span");
		expect(meta?.nodeType).toBe("layout");
		expect(meta?.children).toHaveLength(2);
		expect(meta?.children[0]?.tag).toBe("span");
		expect(meta?.children[1]?.nodeType).toBe("text");
		expect(meta?.children[1]?.textContent).toBe("•••••");
	});
});
