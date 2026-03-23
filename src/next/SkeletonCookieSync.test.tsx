import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkeletonCookieSync } from "./SkeletonCookieSync";

const { mockUseSkeletonCookieSync } = vi.hoisted(() => ({
	mockUseSkeletonCookieSync: vi.fn(),
}));

vi.mock("../cookie/useSkeletonCookieSync", () => ({
	useSkeletonCookieSync: mockUseSkeletonCookieSync,
}));

describe("SkeletonCookieSync", () => {
	it("renders nothing", () => {
		const { container } = render(<SkeletonCookieSync />);

		expect(container.firstChild).toBeNull();
	});

	it("calls useSkeletonCookieSync with no options by default", () => {
		render(<SkeletonCookieSync />);

		expect(mockUseSkeletonCookieSync).toHaveBeenCalledWith(undefined);
	});

	it("passes options through to useSkeletonCookieSync", () => {
		const options = {
			cookieName: "custom-snap",
			path: "/app",
			maxAge: 3600,
			compact: {
				maxSkeletons: 5,
				maxTextKeysPerSkeleton: 3,
				decimals: 0,
			},
		};

		render(<SkeletonCookieSync options={options} />);

		expect(mockUseSkeletonCookieSync).toHaveBeenCalledWith(options);
	});
});
