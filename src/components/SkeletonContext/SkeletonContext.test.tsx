import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonContext, useIsSkeletonMode } from "./SkeletonContext";

function TestConsumer() {
  const isSkeletonMode = useIsSkeletonMode();
  return (
    <div data-testid="result">{isSkeletonMode ? "skeleton" : "normal"}</div>
  );
}

describe("SkeletonContext", () => {
  it("returns false by default (outside provider)", () => {
    render(<TestConsumer />);
    expect(screen.getByTestId("result")).toHaveTextContent("normal");
  });

  it("returns true when inside provider with value true", () => {
    render(
      <SkeletonContext.Provider value={true}>
        <TestConsumer />
      </SkeletonContext.Provider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("skeleton");
  });

  it("returns false when inside provider with value false", () => {
    render(
      <SkeletonContext.Provider value={false}>
        <TestConsumer />
      </SkeletonContext.Provider>,
    );
    expect(screen.getByTestId("result")).toHaveTextContent("normal");
  });
});
