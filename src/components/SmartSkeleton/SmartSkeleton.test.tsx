import { render, screen, waitFor } from "@testing-library/react";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  createRef,
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

  it("skips skeleton classes for descendants inside a button-like parent", () => {
    const root = document.createElement("div");
    root.innerHTML =
      "<button><span data-testid='inside'>Inside</span></button>";
    const inside = root.querySelector("span");
    if (!inside) throw new Error("Nested text not found");

    applySkeletonClasses(root);

    expect(inside).not.toHaveClass("loaded-text-skeleton");
  });

  it("treats role=button as button-like and skips its descendants", () => {
    const root = document.createElement("div");
    root.innerHTML =
      "<div role='button'><span data-testid='inside'>Inside</span></div>";
    const inside = root.querySelector("span");
    if (!inside) throw new Error("Nested text not found");

    applySkeletonClasses(root);

    expect(inside).not.toHaveClass("loaded-text-skeleton");
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
      expect(document.querySelector(".loaded-skeleton-wrapper")).toBeInTheDocument();
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
      <SmartSkeleton
        loading={true}
        element={<div key="a">Content A</div>}
      />,
    );

    const firstDiv = screen.getByText("Content A");
    expect(firstDiv).toHaveClass("loaded-skeleton-mode");

    rerender(
      <SmartSkeleton
        loading={true}
        element={<div key="b">Content B</div>}
      />,
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

    expect(root.querySelector("script")).not.toHaveClass("loaded-text-skeleton");
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
    expect(root.querySelector("textarea")).toHaveClass("loaded-skeleton-content");
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
        element={<div ref={callbackRef} data-testid="with-ref">Content</div>}
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
        element={<div ref={objectRef} data-testid="with-object-ref">Content</div>}
      />,
    );

    await waitFor(() => {
      expect(objectRef.current).toBeInstanceOf(HTMLDivElement);
      expect(objectRef.current?.dataset.testid).toBe("with-object-ref");
    });
  });

  it("handles forwardRef component with nativeElement pattern", async () => {
    const RefWithNativeElement = forwardRef<{ nativeElement: HTMLSpanElement }>(
      (_, ref) => {
        const spanRef = useRef<HTMLSpanElement>(null);
        useImperativeHandle(ref, () => ({
          nativeElement: spanRef.current!,
        }));
        return <span ref={spanRef}>Native element pattern</span>;
      },
    );

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
