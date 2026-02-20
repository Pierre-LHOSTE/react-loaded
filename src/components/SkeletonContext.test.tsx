import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonContext, useIsSkeletonMode } from "./SkeletonContext";

function Consumer() {
	const isSkeletonMode = useIsSkeletonMode();
	return <div data-testid="skeleton-mode">{isSkeletonMode ? "yes" : "no"}</div>;
}

describe("SkeletonContext", () => {
	it("defaults to false", () => {
		render(<Consumer />);
		expect(screen.getByTestId("skeleton-mode")).toHaveTextContent("no");
	});

	it("exposes provider value to descendants", () => {
		render(
			<SkeletonContext.Provider value={true}>
				<Consumer />
			</SkeletonContext.Provider>,
		);

		expect(screen.getByTestId("skeleton-mode")).toHaveTextContent("yes");
	});
});
