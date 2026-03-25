import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AutoSkeletonList } from "./AutoSkeletonList";
import { LoadedProvider } from "./LoadedProvider";

vi.mock("./AutoSkeleton", () => ({
	AutoSkeleton: ({
		id,
		loading,
		animate = true,
		variant = "filled",
		frozen,
		_textWidths,
		_textHeights,
		children,
	}: {
		id: string;
		loading: boolean;
		animate?: boolean;
		variant?: "filled" | "ghost";
		frozen?: boolean;
		_textWidths?: Record<string, number>;
		_textHeights?: Record<string, number>;
		children: ReactNode;
	}) => (
		<div
			data-testid="auto-skeleton"
			data-id={id}
			data-loading={String(loading)}
			data-animate={String(animate)}
			data-variant={variant}
			data-frozen={frozen !== undefined ? String(frozen) : undefined}
			data-text-widths={_textWidths ? JSON.stringify(_textWidths) : undefined}
			data-text-heights={
				_textHeights ? JSON.stringify(_textHeights) : undefined
			}
		>
			{children}
		</div>
	),
}));

type ListItem = {
	id: number;
	label: string;
};

const items: ListItem[] = [
	{ id: 1, label: "Item 1" },
	{ id: 2, label: "Item 2" },
];

const renderItem = (item: ListItem) => (
	<div data-testid={`item-${item.id}`}>
		<span>{item.label}</span>
	</div>
);

const renderSkeleton = (index: number) => (
	<div data-testid="skeleton-item" data-index={index}>
		<span>Loading</span>
	</div>
);

describe("AutoSkeletonList", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("renders defaultCount skeletons while loading", () => {
		render(
			<AutoSkeletonList
				id="notification-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={2}
			/>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(2);
		expect(screen.getAllByTestId("skeleton-item")).toHaveLength(2);
	});

	it("defaults to 3 skeletons when defaultCount is not specified", () => {
		render(
			<AutoSkeletonList
				id="default-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
			/>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(3);
	});

	it("passes id, variant and animate props to skeleton wrappers", () => {
		render(
			<AutoSkeletonList
				id="comment-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={1}
				animate={false}
				variant="ghost"
			/>,
		);

		const skeleton = screen.getByTestId("auto-skeleton");
		expect(skeleton).toHaveAttribute("data-id", "comment-item");
		expect(skeleton).toHaveAttribute("data-animate", "false");
		expect(skeleton).toHaveAttribute("data-variant", "ghost");
	});

	it("clamps skeleton count by maxCount", () => {
		render(
			<AutoSkeletonList
				id="product-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={10}
				maxCount={4}
			/>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(4);
	});

	it("clamps skeleton count by minCount", () => {
		render(
			<AutoSkeletonList
				id="message-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={0}
				minCount={2}
			/>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(2);
	});

	it("renders items when loaded", () => {
		render(
			<AutoSkeletonList
				id="user-item"
				loading={false}
				items={items}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
			/>,
		);

		expect(screen.getByText("Item 1")).toBeInTheDocument();
		expect(screen.getByText("Item 2")).toBeInTheDocument();
		expect(screen.queryByTestId("auto-skeleton")).not.toBeInTheDocument();
	});

	it("returns null when not loading and items are empty", () => {
		const { container } = render(
			<AutoSkeletonList
				id="empty-item"
				loading={false}
				items={[]}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("returns null when not loading and items is undefined", () => {
		const { container } = render(
			<AutoSkeletonList
				id="undef-item"
				loading={false}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("uses custom keyExtractor for rendered items", () => {
		render(
			<AutoSkeletonList
				id="keyed-item"
				loading={false}
				items={items}
				renderItem={(item) => (
					<div data-testid={`item-${item.id}`}>{item.label}</div>
				)}
				renderSkeleton={renderSkeleton}
				keyExtractor={(item) => item.id}
			/>,
		);

		expect(screen.getByTestId("item-1")).toBeInTheDocument();
		expect(screen.getByTestId("item-2")).toBeInTheDocument();
	});

	it("persists skeleton count from loaded items via storageKey", async () => {
		const { rerender } = render(
			<AutoSkeletonList
				id="feed-item"
				loading={false}
				items={[...items, { id: 3, label: "Item 3" }]}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="feed-persist"
				defaultCount={1}
			/>,
		);

		rerender(
			<AutoSkeletonList
				id="feed-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="feed-persist"
				defaultCount={1}
			/>,
		);

		await waitFor(() => {
			expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(3);
		});
	});

	it("uses defaultCount when no persisted count exists", () => {
		render(
			<AutoSkeletonList
				id="no-persist-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="no-persist"
				defaultCount={5}
			/>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(5);
	});

	it("propagates variant to each skeleton wrapper", () => {
		render(
			<AutoSkeletonList
				id="variant-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={2}
				variant="ghost"
			/>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		for (const s of skeletons) {
			expect(s).toHaveAttribute("data-variant", "ghost");
		}
	});

	it("propagates animate=false to each skeleton wrapper", () => {
		render(
			<AutoSkeletonList
				id="anim-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={2}
				animate={false}
			/>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		for (const s of skeletons) {
			expect(s).toHaveAttribute("data-animate", "false");
		}
	});

	it("clamps persisted count within minCount/maxCount", async () => {
		const { rerender } = render(
			<AutoSkeletonList
				id="clamp-item"
				loading={false}
				items={[{ id: 1, label: "A" }]}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="clamp-persist"
				defaultCount={3}
				minCount={2}
			/>,
		);

		// items.length = 1 but minCount = 2, so skeleton count should be clamped to 2
		rerender(
			<AutoSkeletonList
				id="clamp-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="clamp-persist"
				defaultCount={3}
				minCount={2}
			/>,
		);

		await waitFor(() => {
			expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(2);
		});
	});

	it("passes loading=true to AutoSkeleton wrappers during loading", () => {
		render(
			<AutoSkeletonList
				id="loading-prop"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={1}
			/>,
		);

		const skeleton = screen.getByTestId("auto-skeleton");
		expect(skeleton).toHaveAttribute("data-loading", "true");
	});

	it("passes _textWidths and _textHeights from distributions to each AutoSkeleton", () => {
		// Pre-populate localStorage with distributions
		const STORAGE_KEY = "react-loaded";
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				h: {},
				wd: {
					"dist-key": {
						t0: { avg: 100, dev: 10 },
						t1: { avg: 200, dev: 20 },
					},
				},
				hd: {
					"dist-key": {
						t0: { avg: 24, dev: 2 },
					},
				},
			}),
		);

		render(
			<AutoSkeletonList
				id="dist-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="dist-key"
				defaultCount={2}
			/>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		expect(skeletons).toHaveLength(2);

		// Each skeleton should have _textWidths and _textHeights
		for (const s of skeletons) {
			const widths = s.dataset.textWidths;
			const heights = s.dataset.textHeights;
			expect(widths).toBeDefined();
			expect(heights).toBeDefined();

			// Widths should have t0 and t1 keys
			const parsed = JSON.parse(widths as string);
			expect(parsed).toHaveProperty("t0");
			expect(parsed).toHaveProperty("t1");
			expect(typeof parsed.t0).toBe("number");
		}
	});

	it("generates deterministic widths from distributions (same seed = same result)", () => {
		const STORAGE_KEY = "react-loaded";
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				v: 2,
				c: {},
				w: {},
				h: {},
				wd: {
					"det-key": {
						t0: { avg: 100, dev: 10 },
					},
				},
				hd: {},
			}),
		);

		const { unmount } = render(
			<AutoSkeletonList
				id="det-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="det-key"
				defaultCount={3}
			/>,
		);

		const first = screen
			.getAllByTestId("auto-skeleton")
			.map((s) => s.dataset.textWidths);

		unmount();

		// Render again with same seed — should get same values
		render(
			<AutoSkeletonList
				id="det-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="det-key"
				defaultCount={3}
			/>,
		);

		const second = screen
			.getAllByTestId("auto-skeleton")
			.map((s) => s.dataset.textWidths);

		expect(first).toEqual(second);
	});

	it("uses initialCount from SSR snapshot via LoadedProvider", () => {
		render(
			<LoadedProvider snapshot={{ v: 1, c: { "ssr-key": 5 } }}>
				<AutoSkeletonList
					id="ssr-item"
					loading={true}
					items={undefined}
					renderItem={renderItem}
					renderSkeleton={renderSkeleton}
					storageKey="ssr-key"
					defaultCount={2}
				/>
			</LoadedProvider>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(5);
	});

	it("uses initialDistributions from SSR snapshot to generate widths", () => {
		render(
			<LoadedProvider
				snapshot={{
					v: 1,
					wd: {
						"ssr-dist-key": {
							t0: { avg: 150, dev: 15 },
						},
					},
				}}
			>
				<AutoSkeletonList
					id="ssr-dist-item"
					loading={true}
					items={undefined}
					renderItem={renderItem}
					renderSkeleton={renderSkeleton}
					storageKey="ssr-dist-key"
					defaultCount={2}
				/>
			</LoadedProvider>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		expect(skeletons).toHaveLength(2);

		// Should have generated widths from the snapshot distributions
		for (const s of skeletons) {
			const widths = s.dataset.textWidths;
			expect(widths).toBeDefined();
			const parsed = JSON.parse(widths as string);
			expect(parsed).toHaveProperty("t0");
			expect(typeof parsed.t0).toBe("number");
		}
	});

	it("propagates frozen prop to AutoSkeleton children", () => {
		render(
			<AutoSkeletonList
				id="frozen-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={2}
				frozen={true}
			/>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		expect(skeletons).toHaveLength(2);
		for (const s of skeletons) {
			expect(s.dataset.frozen).toBe("true");
		}
	});
});
