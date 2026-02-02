import { bench, describe } from "vitest";
import { SmartSkeletonList } from "../components/SmartSkeletonList/SmartSkeletonList";
import { renderWithProfiler } from "./renderWithProfiler";

type ListItem = {
  id: number;
  label: string;
};

const items: ListItem[] = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  label: `Item ${index + 1}`,
}));

const heavyItems: ListItem[] = Array.from({ length: 200 }, (_, index) => ({
  id: index,
  label: `Item ${index + 1}`,
}));

const ultraItems: ListItem[] = Array.from({ length: 1000 }, (_, index) => ({
  id: index,
  label: `Item ${index + 1}`,
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

describe("SmartSkeletonList", () => {
  bench("mount loading list", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:mount",
      element: (
        <SmartSkeletonList
          loading={true}
          items={undefined}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          defaultCount={12}
          storageKey="bench-smart-skeleton-list"
        />
      ),
    });
  });

  bench("update loading to items", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:update",
      element: (
        <SmartSkeletonList
          loading={true}
          items={undefined}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          defaultCount={12}
          storageKey="bench-smart-skeleton-list"
        />
      ),
      update: (
        <SmartSkeletonList
          loading={false}
          items={items}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          storageKey="bench-smart-skeleton-list"
        />
      ),
    });
  });

  bench("mount loading list (heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:mount:heavy",
      element: (
        <SmartSkeletonList
          loading={true}
          items={undefined}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          defaultCount={200}
          storageKey="bench-smart-skeleton-list-heavy"
        />
      ),
    });
  });

  bench("update loading to items (heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:update:heavy",
      element: (
        <SmartSkeletonList
          loading={true}
          items={undefined}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          defaultCount={200}
          storageKey="bench-smart-skeleton-list-heavy"
        />
      ),
      update: (
        <SmartSkeletonList
          loading={false}
          items={heavyItems}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          storageKey="bench-smart-skeleton-list-heavy"
        />
      ),
    });
  });

  bench("mount loading list (ultra)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:mount:ultra",
      element: (
        <SmartSkeletonList
          loading={true}
          items={undefined}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          defaultCount={1000}
          storageKey="bench-smart-skeleton-list-ultra"
        />
      ),
    });
  });

  bench("update loading to items (ultra)", () => {
    renderWithProfiler({
      id: "SmartSkeletonList:update:ultra",
      element: (
        <SmartSkeletonList
          loading={true}
          items={undefined}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          defaultCount={1000}
          storageKey="bench-smart-skeleton-list-ultra"
        />
      ),
      update: (
        <SmartSkeletonList
          loading={false}
          items={ultraItems}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          storageKey="bench-smart-skeleton-list-ultra"
        />
      ),
    });
  });
});
