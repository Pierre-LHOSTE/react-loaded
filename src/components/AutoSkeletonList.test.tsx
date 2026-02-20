import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AutoSkeletonList } from "./AutoSkeletonList";
import { LoadedProvider } from "./LoadedProvider";

vi.mock("./AutoSkeleton", () => ({
	AutoSkeleton: ({
		id,
		animate = true,
		variant = "filled",
		_textWidths,
		_textHeights,
		children,
	}: {
		id: string;
		animate?: boolean;
		variant?: "filled" | "ghost";
		_textWidths?: Record<string, number>;
		_textHeights?: Record<string, number>;
		children: ReactNode;
	}) => (
		<div
			data-testid="auto-skeleton"
			data-id={id}
			data-animate={String(animate)}
			data-variant={variant}
			data-w={JSON.stringify(_textWidths ?? null)}
			data-h={JSON.stringify(_textHeights ?? null)}
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
	<div>
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

	it("renders skeletons while loading", () => {
		render(
			<AutoSkeletonList
				id="notification-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				defaultCount={2}
				storageKey="auto-skeleton-list-test"
			/>,
		);

		expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(2);
		expect(screen.getAllByTestId("skeleton-item")).toHaveLength(2);
	});

	it("passes id, variant and animate props to item skeleton wrappers", () => {
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
				storageKey="auto-skeleton-list-ghost"
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
				storageKey="auto-skeleton-list-max"
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
				storageKey="auto-skeleton-list-min"
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
				storageKey="auto-skeleton-list-loaded"
			/>,
		);

		expect(screen.getByText("Item 1")).toBeInTheDocument();
		expect(screen.getByText("Item 2")).toBeInTheDocument();
		expect(screen.queryByTestId("auto-skeleton")).not.toBeInTheDocument();
	});

	it("persists skeleton count from loaded items", async () => {
		const { rerender } = render(
			<AutoSkeletonList
				id="feed-item"
				loading={false}
				items={[...items, { id: 3, label: "Item 3" }]}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="auto-skeleton-list-persist"
			/>,
		);

		rerender(
			<AutoSkeletonList
				id="feed-item"
				loading={true}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="auto-skeleton-list-persist"
			/>,
		);

		await waitFor(() => {
			expect(screen.getAllByTestId("auto-skeleton")).toHaveLength(3);
		});
	});

	it("returns null when not loading and items are empty", () => {
		const { container } = render(
			<AutoSkeletonList
				id="empty-item"
				loading={false}
				items={[]}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="auto-skeleton-list-empty"
			/>,
		);

		expect(container).toBeEmptyDOMElement();
	});

	it("uses custom keyExtractor for rendered items", () => {
		const { container } = render(
			<AutoSkeletonList
				id="keyed-item"
				loading={false}
				items={items}
				renderItem={(item) => (
					<div data-testid={`item-${item.id}`}>{item.label}</div>
				)}
				renderSkeleton={renderSkeleton}
				keyExtractor={(item) => item.id}
				storageKey="auto-skeleton-list-keyed"
			/>,
		);

		expect(screen.getByTestId("item-1")).toBeInTheDocument();
		expect(screen.getByTestId("item-2")).toBeInTheDocument();
		// Items are wrapped in a display:contents measure div
		expect(container.firstElementChild?.children).toHaveLength(2);
	});

	it("returns null when not loading and items is undefined", () => {
		const { container } = render(
			<AutoSkeletonList
				id="undef-item"
				loading={false}
				items={undefined}
				renderItem={renderItem}
				renderSkeleton={renderSkeleton}
				storageKey="auto-skeleton-list-undef"
			/>,
		);

		expect(container).toBeEmptyDOMElement();
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
				storageKey="auto-skeleton-list-variant"
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
				storageKey="auto-skeleton-list-anim"
			/>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		for (const s of skeletons) {
			expect(s).toHaveAttribute("data-animate", "false");
		}
	});

	it("uses persisted snapshot count and wd immediately", () => {
		render(
			<LoadedProvider
				registry={{}}
				persistedSnapshot={{
					c: { "feed-list": 4 },
					wd: {
						"feed-list": {
							t0: { avg: 110, dev: 20 },
							t1: { avg: 210, dev: 40 },
						},
					},
				}}
			>
				<AutoSkeletonList
					id="feed-item"
					loading={true}
					items={undefined}
					renderItem={renderItem}
					renderSkeleton={renderSkeleton}
					storageKey="feed-list"
					defaultCount={1}
				/>
			</LoadedProvider>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		expect(skeletons).toHaveLength(4);
		for (const skeleton of skeletons) {
			const w = JSON.parse(skeleton.getAttribute("data-w") ?? "null");
			expect(w).not.toBeNull();
			expect(typeof w.t0).toBe("number");
			expect(typeof w.t1).toBe("number");
		}
	});

	it("uses persisted snapshot height wd immediately", () => {
		render(
			<LoadedProvider
				registry={{}}
				persistedSnapshot={{
					c: { "feed-list": 3 },
					wd: {
						"feed-list": {
							t0: { avg: 110, dev: 20 },
						},
					},
					hd: {
						"feed-list": {
							t0: { avg: 20, dev: 3 },
						},
					},
				}}
			>
				<AutoSkeletonList
					id="feed-item"
					loading={true}
					items={undefined}
					renderItem={renderItem}
					renderSkeleton={renderSkeleton}
					storageKey="feed-list"
					defaultCount={1}
				/>
			</LoadedProvider>,
		);

		const skeletons = screen.getAllByTestId("auto-skeleton");
		expect(skeletons).toHaveLength(3);
		for (const skeleton of skeletons) {
			const h = JSON.parse(skeleton.getAttribute("data-h") ?? "null");
			expect(h).not.toBeNull();
			expect(typeof h.t0).toBe("number");
		}
	});

	it("generates deterministic w for the same seed", () => {
		const snapshot = {
			c: { "det-list": 3 },
			wd: {
				"det-list": {
					t0: { avg: 100, dev: 15 },
					t1: { avg: 200, dev: 30 },
				},
			},
		};

		const { unmount } = render(
			<LoadedProvider registry={{}} persistedSnapshot={snapshot}>
				<AutoSkeletonList
					id="det-item"
					loading={true}
					items={undefined}
					renderItem={renderItem}
					renderSkeleton={renderSkeleton}
					storageKey="det-list"
					defaultCount={1}
				/>
			</LoadedProvider>,
		);

		const firstWidths = screen
			.getAllByTestId("auto-skeleton")
			.map((el) => el.getAttribute("data-w"));

		unmount();

		render(
			<LoadedProvider registry={{}} persistedSnapshot={snapshot}>
				<AutoSkeletonList
					id="det-item"
					loading={true}
					items={undefined}
					renderItem={renderItem}
					renderSkeleton={renderSkeleton}
					storageKey="det-list"
					defaultCount={1}
				/>
			</LoadedProvider>,
		);

		const secondWidths = screen
			.getAllByTestId("auto-skeleton")
			.map((el) => el.getAttribute("data-w"));

		expect(firstWidths).toEqual(secondWidths);
	});
});
