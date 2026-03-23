import { Component, forwardRef, memo, type Ref } from "react";
import { describe, expect, it } from "vitest";
import { shouldUseWrapper } from "./refCompatibility";

class ClassComponent extends Component {
	render() {
		return <div />;
	}
}

function PlainFunctionComponent() {
	return <div />;
}

function RefPropComponent({ ref }: { ref?: Ref<HTMLDivElement> }) {
	return <div ref={ref} />;
}

const ForwardRefComponent = forwardRef<HTMLDivElement>(
	function ForwardRefComponent(_props, ref) {
		return <div ref={ref} />;
	},
);

const MemoForwardRefComponent = memo(ForwardRefComponent);

describe("shouldUseWrapper", () => {
	it("returns false for intrinsic elements", () => {
		expect(shouldUseWrapper(<div />)).toBe(false);
	});

	it("returns false for forwardRef components", () => {
		expect(shouldUseWrapper(<ForwardRefComponent />)).toBe(false);
	});

	it("returns false for memo(forwardRef(...)) components", () => {
		expect(shouldUseWrapper(<MemoForwardRefComponent />)).toBe(false);
	});

	it("returns false for class components", () => {
		expect(shouldUseWrapper(<ClassComponent />)).toBe(false);
	});

	it("returns true for plain function components in React 18 mode", () => {
		expect(
			shouldUseWrapper(<PlainFunctionComponent />, { reactMajorVersion: 18 }),
		).toBe(true);
	});

	it("returns false for plain function components in React 19 mode", () => {
		expect(
			shouldUseWrapper(<PlainFunctionComponent />, { reactMajorVersion: 19 }),
		).toBe(false);
	});

	it("returns true for ref-prop function components in React 18 mode", () => {
		expect(
			shouldUseWrapper(<RefPropComponent />, { reactMajorVersion: 18 }),
		).toBe(true);
	});

	it("returns false for ref-prop function components in React 19 mode", () => {
		expect(
			shouldUseWrapper(<RefPropComponent />, { reactMajorVersion: 19 }),
		).toBe(false);
	});

	it("returns true for fragment", () => {
		expect(
			shouldUseWrapper(
				<>
					<span />
					<span />
				</>,
			),
		).toBe(true);
	});

	it("returns true for text nodes", () => {
		expect(shouldUseWrapper("hello")).toBe(true);
	});

	it("returns true when children are multiple nodes", () => {
		expect(
			shouldUseWrapper(
				<>
					<div />
					<div />
				</>,
			),
		).toBe(true);
	});
});
