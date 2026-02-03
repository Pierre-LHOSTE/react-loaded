import { render, screen, waitFor } from "@testing-library/react";
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
});
