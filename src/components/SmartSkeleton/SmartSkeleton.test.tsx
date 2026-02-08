import { render, screen, waitFor } from "@testing-library/react";
import { Button } from "antd";
import {
	createRef,
	forwardRef,
	memo,
	StrictMode,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import { describe, expect, it, vi } from "vitest";
import { applySkeletonClasses, SmartSkeleton } from "./SmartSkeleton";

const skeletonElement = (
	<div data-testid="skeleton">
		<p data-testid="skeleton-text">Loading text</p>
		<img data-testid="skeleton-image" alt="" />
	</div>
);

const contentElement = <div data-testid="content">Loaded</div>;

describe("SmartSkeleton", () => {
	it("renders children when not loading", () => {
		render(
			<SmartSkeleton loading={false} element={skeletonElement}>
				{contentElement}
			</SmartSkeleton>,
		);

		expect(screen.getByTestId("content")).toBeInTheDocument();
		expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
	});

	it("renders skeleton with loading classes", () => {
		render(<SmartSkeleton loading={true} element={skeletonElement} />);

		const skeleton = screen.getByTestId("skeleton");
		expect(skeleton).toBeInTheDocument();
		expect(skeleton).toHaveClass("loaded-skeleton-mode");
		expect(skeleton).toHaveClass("loaded-animate");

		const text = screen.getByTestId("skeleton-text");
		const image = screen.getByTestId("skeleton-image");
		expect(text).toHaveClass("loaded-text-skeleton");
		expect(text).toHaveAttribute("data-skeleton-align", "left");
		expect(image).toHaveClass("loaded-skeleton-media");
	});

	it("does not add animate class when animate is false", () => {
		render(
			<SmartSkeleton
				loading={true}
				element={skeletonElement}
				animate={false}
			/>,
		);

		const skeleton = screen.getByTestId("skeleton");
		expect(skeleton).toHaveClass("loaded-skeleton-mode");
		expect(skeleton).not.toHaveClass("loaded-animate");
	});

	it("updates from loading to loaded", () => {
		const { rerender } = render(
			<SmartSkeleton loading={true} element={skeletonElement} />,
		);

		rerender(
			<SmartSkeleton loading={false} element={skeletonElement}>
				{contentElement}
			</SmartSkeleton>,
		);

		expect(screen.getByTestId("content")).toBeInTheDocument();
		expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
	});

	it("adds content classes for svg descendants", () => {
		const root = document.createElement("div");
		root.innerHTML = "<svg data-testid='icon'></svg>";
		const svg = root.querySelector("svg");
		if (!svg) throw new Error("SVG element not found");

		applySkeletonClasses(root);

		expect(root).toHaveClass("loaded-skeleton-mode");
		expect(svg).toHaveClass("loaded-skeleton-content");
		expect(svg).toHaveClass("loaded-skeleton-svg");
	});

	it("applies text alignment for centered text", () => {
		const root = document.createElement("div");
		root.innerHTML =
			"<p data-testid='centered' style='text-align:center'>Centered</p>";
		const text = root.querySelector("p");
		if (!text) throw new Error("Centered text not found");

		applySkeletonClasses(root);

		expect(text).toHaveClass("loaded-text-skeleton");
		expect(text).toHaveAttribute("data-skeleton-align", "center");
	});

	it("applies text alignment for right-aligned text", () => {
		const root = document.createElement("div");
		root.innerHTML =
			"<p data-testid='right' style='text-align:right'>Right</p>";
		const text = root.querySelector("p");
		if (!text) throw new Error("Right text not found");

		applySkeletonClasses(root);

		expect(text).toHaveClass("loaded-text-skeleton");
		expect(text).toHaveAttribute("data-skeleton-align", "right");
	});

	it("does not add text skeleton classes for empty text", () => {
		const root = document.createElement("div");
		root.innerHTML = "<p data-testid='empty'></p>";
		const text = root.querySelector("p");
		if (!text) throw new Error("Empty text not found");

		applySkeletonClasses(root);

		expect(text).not.toHaveClass("loaded-text-skeleton");
	});

	it("handles complex trees with mixed content", () => {
		const root = document.createElement("div");
		root.innerHTML = "<div><span>Label</span><button>Action</button></div>";
		const label = root.querySelector("span");
		const button = root.querySelector("button");
		if (!label || !button) throw new Error("Complex tree not found");

		applySkeletonClasses(root);

		expect(label).toHaveClass("loaded-text-skeleton");
		expect(button).toHaveClass("loaded-skeleton-content");
	});

	it("force-hides descendants inside a button-like parent", () => {
		const root = document.createElement("div");
		root.innerHTML =
			"<button><span data-testid='inside'>Inside</span></button>";
		const inside = root.querySelector("span");
		if (!inside) throw new Error("Nested text not found");

		applySkeletonClasses(root);

		expect(inside).not.toHaveClass("loaded-text-skeleton");
		expect(inside).toHaveClass("loaded-skeleton-force-hide");
	});

	it("treats role=button as button-like and force-hides its descendants", () => {
		const root = document.createElement("div");
		root.innerHTML =
			"<div role='button'><span data-testid='inside'>Inside</span></div>";
		const inside = root.querySelector("span");
		if (!inside) throw new Error("Nested text not found");

		applySkeletonClasses(root);

		expect(inside).not.toHaveClass("loaded-text-skeleton");
		expect(inside).toHaveClass("loaded-skeleton-force-hide");
	});

	it("force-hides media descendants inside button-like parents", () => {
		const root = document.createElement("div");
		root.innerHTML = `
      <button>
        <img data-testid='inside-image' alt='' />
        <svg data-testid='inside-svg'></svg>
      </button>
    `;
		const insideImage = root.querySelector("[data-testid='inside-image']");
		const insideSvg = root.querySelector("[data-testid='inside-svg']");
		if (!insideImage || !insideSvg) throw new Error("Nested media not found");

		applySkeletonClasses(root);

		expect(insideImage).toHaveClass("loaded-skeleton-force-hide");
		expect(insideSvg).toHaveClass("loaded-skeleton-force-hide");
	});

	it("adds wrapper and warns when element ref does not resolve to DOM", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const NoDomRef = () => <span>Child</span>;

		render(
			<SmartSkeleton
				loading={true}
				element={<NoDomRef />}
				suppressRefWarning={false}
			/>,
		);

		await waitFor(() => {
			const wrapper = document.querySelector(".loaded-skeleton-wrapper");
			expect(wrapper).toBeInTheDocument();
			expect(warnSpy).toHaveBeenCalled();
		});

		warnSpy.mockRestore();
	});

	it("does not warn when suppressRefWarning is true", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const NoDomRef = () => <span>Child</span>;

		render(
			<SmartSkeleton
				loading={true}
				element={<NoDomRef />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			const wrapper = document.querySelector(".loaded-skeleton-wrapper");
			expect(wrapper).toBeInTheDocument();
			expect(warnSpy).not.toHaveBeenCalled();
		});
		warnSpy.mockRestore();
	});

	it("resets wrapper state when switching from non-ref to ref-forwarding element", async () => {
		const NoRef = () => <span>No ref</span>;

		const { rerender } = render(
			<SmartSkeleton
				loading={true}
				element={<NoRef />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
		});

		// Switch to a native element that supports refs
		rerender(
			<SmartSkeleton
				loading={true}
				element={<div data-testid="native">Native</div>}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			// The wrapper should be gone since native div supports refs
			const native = screen.getByTestId("native");
			expect(native).toBeInTheDocument();
			expect(native).toHaveClass("loaded-skeleton-mode");
		});
	});

	it("triggers element change detection when key changes", () => {
		const { rerender } = render(
			<SmartSkeleton loading={true} element={<div key="a">Content A</div>} />,
		);

		const firstDiv = screen.getByText("Content A");
		expect(firstDiv).toHaveClass("loaded-skeleton-mode");

		rerender(
			<SmartSkeleton loading={true} element={<div key="b">Content B</div>} />,
		);

		const secondDiv = screen.getByText("Content B");
		expect(secondDiv).toHaveClass("loaded-skeleton-mode");
	});

	it("handles component that forwards ref but returns non-DOM value", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const CustomRef = forwardRef<{ custom: boolean }>((_, ref) => {
			useImperativeHandle(ref, () => ({ custom: true }));
			return <span>Custom</span>;
		});
		CustomRef.displayName = "CustomRef";

		render(
			<SmartSkeleton
				loading={true}
				element={<CustomRef />}
				suppressRefWarning={false}
			/>,
		);

		await waitFor(() => {
			const wrapper = document.querySelector(".loaded-skeleton-wrapper");
			expect(wrapper).toBeInTheDocument();
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("does not forward its ref to a DOM element"),
			);
		});

		warnSpy.mockRestore();
	});

	it("returns null when not loading and no children provided", () => {
		const { container } = render(
			<SmartSkeleton loading={false} element={<div>Skeleton</div>} />,
		);

		expect(container.firstChild).toBeNull();
	});

	it("applies seed prop for deterministic text widths", () => {
		const root = document.createElement("div");
		root.innerHTML = "<p>Test text</p>";

		applySkeletonClasses(root, { seed: "test-seed" });

		const text = root.querySelector("p");
		expect(text).toHaveClass("loaded-text-skeleton");
		expect(text?.style.getPropertyValue("--skeleton-text-width")).toBeTruthy();
	});

	it("uses default seed when seed is null or undefined", () => {
		const root1 = document.createElement("div");
		root1.innerHTML = "<p>Same text</p>";
		applySkeletonClasses(root1, { seed: undefined });

		const root2 = document.createElement("div");
		root2.innerHTML = "<p>Same text</p>";
		applySkeletonClasses(root2, { seed: null as unknown as string });

		const text1 = root1.querySelector("p");
		const text2 = root2.querySelector("p");
		expect(text1?.style.getPropertyValue("--skeleton-text-width")).toBe(
			text2?.style.getPropertyValue("--skeleton-text-width"),
		);
	});

	it("handles text-align: end as right alignment", () => {
		const root = document.createElement("div");
		root.innerHTML = "<p style='text-align:end'>End aligned</p>";

		applySkeletonClasses(root);

		const text = root.querySelector("p");
		expect(text).toHaveAttribute("data-skeleton-align", "right");
	});

	it("skips script, style, and other non-rendered tags", () => {
		const root = document.createElement("div");
		root.innerHTML = `
      <script>console.log('test')</script>
      <style>.test{}</style>
      <noscript>No JS</noscript>
      <p>Visible</p>
    `;

		applySkeletonClasses(root);

		expect(root.querySelector("script")).not.toHaveClass(
			"loaded-text-skeleton",
		);
		expect(root.querySelector("style")).not.toHaveClass("loaded-text-skeleton");
		expect(root.querySelector("p")).toHaveClass("loaded-text-skeleton");
	});

	it("handles video and canvas as media elements", () => {
		const root = document.createElement("div");
		root.innerHTML = "<video></video><canvas></canvas>";

		applySkeletonClasses(root);

		expect(root.querySelector("video")).toHaveClass("loaded-skeleton-media");
		expect(root.querySelector("canvas")).toHaveClass("loaded-skeleton-media");
	});

	it("handles input, textarea, select, and anchor as interactive elements", () => {
		const root = document.createElement("div");
		root.innerHTML = `
      <input type="text" />
      <textarea></textarea>
      <select><option>A</option></select>
      <a href="#">Link</a>
    `;

		applySkeletonClasses(root);

		expect(root.querySelector("input")).toHaveClass("loaded-skeleton-content");
		expect(root.querySelector("textarea")).toHaveClass(
			"loaded-skeleton-content",
		);
		expect(root.querySelector("select")).toHaveClass("loaded-skeleton-content");
		expect(root.querySelector("a")).toHaveClass("loaded-skeleton-content");
	});

	it("does not apply classes to non-element values", () => {
		applySkeletonClasses(null as unknown as Element);
		applySkeletonClasses(undefined as unknown as Element);
		applySkeletonClasses("string" as unknown as Element);
		applySkeletonClasses(123 as unknown as Element);
	});

	it("forwards callback ref to original element", async () => {
		let capturedNode: HTMLDivElement | null = null;
		const callbackRef = (node: HTMLDivElement | null) => {
			capturedNode = node;
		};

		render(
			<SmartSkeleton
				loading={true}
				element={
					<div ref={callbackRef} data-testid="with-ref">
						Content
					</div>
				}
			/>,
		);

		await waitFor(() => {
			expect(capturedNode).toBeInstanceOf(HTMLDivElement);
			expect(capturedNode?.dataset.testid).toBe("with-ref");
		});
	});

	it("forwards object ref to original element", async () => {
		const objectRef = createRef<HTMLDivElement>();

		render(
			<SmartSkeleton
				loading={true}
				element={
					<div ref={objectRef} data-testid="with-object-ref">
						Content
					</div>
				}
			/>,
		);

		await waitFor(() => {
			expect(objectRef.current).toBeInstanceOf(HTMLDivElement);
			expect(objectRef.current?.dataset.testid).toBe("with-object-ref");
		});
	});

	it("handles forwardRef component with nativeElement pattern", async () => {
		const RefWithNativeElement = forwardRef<{
			nativeElement: HTMLSpanElement | null;
		}>((_, ref) => {
			const spanRef = useRef<HTMLSpanElement>(null);
			useImperativeHandle(ref, () => ({
				nativeElement: spanRef.current,
			}));
			return <span ref={spanRef}>Native element pattern</span>;
		});

		render(
			<SmartSkeleton
				loading={true}
				element={<RefWithNativeElement />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			const span = screen.getByText("Native element pattern");
			expect(span).toHaveClass("loaded-text-skeleton");
		});
	});

	it("handles React 19 ref-as-prop (no forwardRef) and forwards original ref", async () => {
		let capturedNode: HTMLDivElement | null = null;
		const originalRef = (node: HTMLDivElement | null) => {
			capturedNode = node;
		};

		// React 19 style: ref is a regular prop, no forwardRef needed
		function RefAsPropComponent({
			ref,
			children,
		}: {
			ref?: React.Ref<HTMLDivElement>;
			children: React.ReactNode;
		}) {
			return (
				<div ref={ref} data-testid="r19-ref">
					{children}
				</div>
			);
		}

		render(
			<SmartSkeleton
				loading={true}
				element={
					<RefAsPropComponent ref={originalRef}>Content</RefAsPropComponent>
				}
			/>,
		);

		await waitFor(() => {
			// SmartSkeleton should NOT need a wrapper — ref should resolve to DOM
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			// Skeleton classes should be applied directly
			const el = screen.getByTestId("r19-ref");
			expect(el).toHaveClass("loaded-skeleton-mode");
			// The original ref should have been forwarded
			expect(capturedNode).toBeInstanceOf(HTMLDivElement);
			expect(capturedNode?.dataset.testid).toBe("r19-ref");
		});
	});

	it("does not add wrapper for React 19 component using props.ref", async () => {
		function RefViaProps(props: {
			ref?: React.Ref<HTMLDivElement>;
			children: React.ReactNode;
		}) {
			return (
				<div ref={props.ref} data-testid="r19-props-ref">
					{props.children}
				</div>
			);
		}

		render(
			<SmartSkeleton
				loading={true}
				element={<RefViaProps>Content</RefViaProps>}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("r19-props-ref")).toHaveClass(
				"loaded-skeleton-mode",
			);
		});
	});

	it("falls back to wrapper when ref is forwarded via useEffect (delayed)", async () => {
		function DelayedRefAsProp({
			ref,
			children,
		}: {
			ref?: React.Ref<HTMLDivElement>;
			children: React.ReactNode;
		}) {
			const divRef = useRef<HTMLDivElement>(null);

			useEffect(() => {
				if (!ref) return;
				if (typeof ref === "function") {
					ref(divRef.current);
					return () => {
						ref(null);
					};
				}
				(ref as React.MutableRefObject<HTMLDivElement | null>).current =
					divRef.current;
				return () => {
					(ref as React.MutableRefObject<HTMLDivElement | null>).current = null;
				};
			}, [ref]);

			return (
				<div ref={divRef} data-testid="r19-delayed-ref">
					{children}
				</div>
			);
		}

		render(
			<SmartSkeleton
				loading={true}
				element={<DelayedRefAsProp>Delayed content</DelayedRefAsProp>}
				suppressRefWarning
			/>,
		);

		await waitFor(() => {
			// useEffect-based ref forwarding is too late for synchronous wrapper
			// detection, so a wrapper is expected to avoid FOUC.
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
		});
	});

	it("adds wrapper when switching ref-compatible to no-ref component while loading", async () => {
		function RefCompatible({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
			return (
				<div ref={ref} data-testid="ref-compatible">
					Ref compatible
				</div>
			);
		}

		function NoRefComponent() {
			return <div data-testid="no-ref-switch">No ref</div>;
		}

		const { rerender } = render(
			<SmartSkeleton
				loading={true}
				element={<RefCompatible />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("ref-compatible")).toHaveClass(
				"loaded-skeleton-mode",
			);
		});

		rerender(
			<SmartSkeleton
				loading={true}
				element={<NoRefComponent />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
			expect(screen.getByTestId("no-ref-switch")).toBeInTheDocument();
		});
	});

	it("does not add wrapper on parent rerender for same React 19 ref-as-prop component", async () => {
		function RefAsPropStable({
			ref,
			label,
		}: {
			ref?: React.Ref<HTMLDivElement>;
			label: string;
		}) {
			return (
				<div ref={ref} data-testid="r19-stable-ref">
					{label}
				</div>
			);
		}

		const { rerender } = render(
			<SmartSkeleton
				loading={true}
				element={<RefAsPropStable label="first" />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("r19-stable-ref")).toHaveClass(
				"loaded-skeleton-mode",
			);
		});

		rerender(
			<SmartSkeleton
				loading={true}
				element={<RefAsPropStable label="second" />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("r19-stable-ref")).toHaveTextContent("second");
		});
	});

	it("does not add wrapper for React.memo(forwardRef(...)) component", async () => {
		const MemoForwardRef = memo(
			forwardRef<HTMLDivElement>((_, ref) => {
				return (
					<div ref={ref} data-testid="memo-forward-ref">
						Memo forwardRef
					</div>
				);
			}),
		);
		MemoForwardRef.displayName = "MemoForwardRef";

		render(
			<SmartSkeleton
				loading={true}
				element={<MemoForwardRef />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("memo-forward-ref")).toHaveClass(
				"loaded-skeleton-mode",
			);
		});
	});

	it("keeps direct ref flow stable in StrictMode for React 19 ref-as-prop", async () => {
		function StrictRefAsProp({
			ref,
			label,
		}: {
			ref?: React.Ref<HTMLDivElement>;
			label: string;
		}) {
			return (
				<div ref={ref} data-testid="r19-strict-ref">
					{label}
				</div>
			);
		}

		render(
			<StrictMode>
				<SmartSkeleton
					loading={true}
					element={<StrictRefAsProp label="strict-mode" />}
					suppressRefWarning={true}
				/>
			</StrictMode>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("r19-strict-ref")).toHaveClass(
				"loaded-skeleton-mode",
			);
		});
	});

	it("cancels deferred wrapper fallback across a rapid loading toggle", async () => {
		function ToggleRefAsProp({
			ref,
			mode,
		}: {
			ref?: React.Ref<HTMLDivElement>;
			mode: "ignore" | "forward";
		}) {
			return (
				<div ref={mode === "forward" ? ref : undefined} data-testid={mode}>
					Toggle ref
				</div>
			);
		}

		const { rerender } = render(
			<SmartSkeleton
				loading={true}
				element={<ToggleRefAsProp mode="ignore" />}
				suppressRefWarning={true}
			/>,
		);

		rerender(
			<SmartSkeleton
				loading={false}
				element={<ToggleRefAsProp mode="ignore" />}
			>
				<div data-testid="loaded-fast">Loaded</div>
			</SmartSkeleton>,
		);

		rerender(
			<SmartSkeleton
				loading={true}
				element={<ToggleRefAsProp mode="forward" />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("forward")).toHaveClass("loaded-skeleton-mode");
		});
	});

	it("does not add wrapper for React 19 ref-as-prop component rendering antd Button", async () => {
		function AntdUserButton({
			ref,
			username,
		}: {
			ref?: React.Ref<HTMLButtonElement>;
			username: string;
		}) {
			return (
				<Button type="text" ref={ref}>
					{username}
				</Button>
			);
		}

		render(
			<SmartSkeleton
				loading={true}
				element={<AntdUserButton username="username" />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByRole("button")).toBeInTheDocument();
		});
	});

	it("retries direct ref attachment on next loading cycle for same component type", async () => {
		function MaybeRefAsProp({
			ref,
			mode,
		}: {
			ref?: React.Ref<HTMLDivElement>;
			mode: "ignore" | "forward";
		}) {
			return (
				<div ref={mode === "forward" ? ref : undefined} data-testid={mode}>
					Maybe ref
				</div>
			);
		}

		const { rerender } = render(
			<SmartSkeleton
				loading={true}
				element={<MaybeRefAsProp mode="ignore" />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
		});

		rerender(
			<SmartSkeleton loading={false} element={<MaybeRefAsProp mode="ignore" />}>
				<div data-testid="loaded">Loaded</div>
			</SmartSkeleton>,
		);

		expect(screen.getByTestId("loaded")).toBeInTheDocument();

		rerender(
			<SmartSkeleton
				loading={true}
				element={<MaybeRefAsProp mode="forward" />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).not.toBeInTheDocument();
			expect(screen.getByTestId("forward")).toHaveClass("loaded-skeleton-mode");
		});
	});

	it("keeps wrapper when switching non-ref component to another non-ref component while loading", async () => {
		function NoRefFirst() {
			return <div data-testid="no-ref-first">No ref first</div>;
		}

		function NoRefSecond() {
			return <div data-testid="no-ref-second">No ref second</div>;
		}

		const { rerender } = render(
			<SmartSkeleton
				loading={true}
				element={<NoRefFirst />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
		});

		rerender(
			<SmartSkeleton
				loading={true}
				element={<NoRefSecond />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
			expect(screen.getByTestId("no-ref-second")).toBeInTheDocument();
		});
	});

	it("falls back to wrapper when component ignores ref (like Storybook Story)", async () => {
		// Simulates <Story /> — a component that renders children but ignores ref entirely
		function StoryLike({ children }: { children?: React.ReactNode }) {
			return <div data-testid="story-output">{children}</div>;
		}

		render(
			<SmartSkeleton
				loading={true}
				element={<StoryLike>Card content</StoryLike>}
				suppressRefWarning
			/>,
		);

		await waitFor(() => {
			// A wrapper IS expected since StoryLike ignores the ref
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
			// But skeleton classes should still be applied via the wrapper's ref
			const output = screen.getByTestId("story-output");
			expect(output).toBeTruthy();
		});
	});

	it("handles nativeElement that is not a valid DOM element", async () => {
		const InvalidNativeElement = forwardRef<{ nativeElement: object }>(
			(_, ref) => {
				useImperativeHandle(ref, () => ({
					nativeElement: { invalid: true },
				}));
				return <span>Invalid native</span>;
			},
		);

		render(
			<SmartSkeleton
				loading={true}
				element={<InvalidNativeElement />}
				suppressRefWarning={true}
			/>,
		);

		await waitFor(() => {
			expect(
				document.querySelector(".loaded-skeleton-wrapper"),
			).toBeInTheDocument();
		});
	});
});
