import { bench, describe } from "vitest";
import { AutoSkeletonList } from "../components/AutoSkeletonList";
import { LoadedProvider } from "../components/LoadedProvider";
import { renderWithProfiler } from "./renderWithProfiler";

type ListItem = {
	id: number;
	label: string;
};

const items20: ListItem[] = Array.from({ length: 20 }, (_, i) => ({
	id: i,
	label: `Item ${i + 1}`,
}));

const items200: ListItem[] = Array.from({ length: 200 }, (_, i) => ({
	id: i,
	label: `Item ${i + 1}`,
}));

const renderItem = (item: ListItem) => (
	<div className="list-row">
		<div className="list-label">{item.label}</div>
		<button type="button">Action</button>
	</div>
);

const renderSkeleton = (index: number) => (
	<div className="list-row" data-index={index}>
		<div className="list-label">Loading</div>
		<button type="button" disabled>
			Action
		</button>
	</div>
);

describe("AutoSkeletonList", () => {
	bench("mount loading list (20 items)", () => {
		renderWithProfiler({
			id: "AutoSkeletonList:mount:20",
			element: (
				<LoadedProvider registry={{}}>
					<AutoSkeletonList
						id="bench-list"
						loading={true}
						items={undefined}
						renderItem={renderItem}
						renderSkeleton={renderSkeleton}
						defaultCount={20}
						storageKey="bench-list-20"
					/>
				</LoadedProvider>
			),
		});
	});

	bench("update loading to items (20 items)", () => {
		renderWithProfiler({
			id: "AutoSkeletonList:update:20",
			element: (
				<LoadedProvider registry={{}}>
					<AutoSkeletonList
						id="bench-list"
						loading={true}
						items={undefined}
						renderItem={renderItem}
						renderSkeleton={renderSkeleton}
						defaultCount={20}
						storageKey="bench-list-20-update"
					/>
				</LoadedProvider>
			),
			update: (
				<LoadedProvider registry={{}}>
					<AutoSkeletonList
						id="bench-list"
						loading={false}
						items={items20}
						renderItem={renderItem}
						renderSkeleton={renderSkeleton}
						storageKey="bench-list-20-update"
					/>
				</LoadedProvider>
			),
		});
	});

	bench("mount loading list (200 items)", () => {
		renderWithProfiler({
			id: "AutoSkeletonList:mount:200",
			element: (
				<LoadedProvider registry={{}}>
					<AutoSkeletonList
						id="bench-list"
						loading={true}
						items={undefined}
						renderItem={renderItem}
						renderSkeleton={renderSkeleton}
						defaultCount={200}
						storageKey="bench-list-200"
					/>
				</LoadedProvider>
			),
		});
	});

	bench("update loading to items (200 items)", () => {
		renderWithProfiler({
			id: "AutoSkeletonList:update:200",
			element: (
				<LoadedProvider registry={{}}>
					<AutoSkeletonList
						id="bench-list"
						loading={true}
						items={undefined}
						renderItem={renderItem}
						renderSkeleton={renderSkeleton}
						defaultCount={200}
						storageKey="bench-list-200-update"
					/>
				</LoadedProvider>
			),
			update: (
				<LoadedProvider registry={{}}>
					<AutoSkeletonList
						id="bench-list"
						loading={false}
						items={items200}
						renderItem={renderItem}
						renderSkeleton={renderSkeleton}
						storageKey="bench-list-200-update"
					/>
				</LoadedProvider>
			),
		});
	});
});
