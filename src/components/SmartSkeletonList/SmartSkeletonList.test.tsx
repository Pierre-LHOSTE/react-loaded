import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SmartSkeletonList } from "./SmartSkeletonList";

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

describe("SmartSkeletonList", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders skeletons while loading", () => {
    render(
      <SmartSkeletonList
        loading={true}
        items={undefined}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        defaultCount={2}
        storageKey="smart-skeleton-list-test"
      />,
    );

    expect(screen.getAllByTestId("skeleton-item")).toHaveLength(2);
  });

  it("clamps skeleton count by maxCount", () => {
    render(
      <SmartSkeletonList
        loading={true}
        items={undefined}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        defaultCount={10}
        maxCount={4}
        storageKey="smart-skeleton-list-max"
      />,
    );

    expect(screen.getAllByTestId("skeleton-item")).toHaveLength(4);
  });

  it("clamps skeleton count by minCount", () => {
    render(
      <SmartSkeletonList
        loading={true}
        items={undefined}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        defaultCount={0}
        minCount={2}
        storageKey="smart-skeleton-list-min"
      />,
    );

    expect(screen.getAllByTestId("skeleton-item")).toHaveLength(2);
  });

  it("renders items when loaded", () => {
    render(
      <SmartSkeletonList
        loading={false}
        items={items}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        storageKey="smart-skeleton-list-test"
      />,
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton-item")).not.toBeInTheDocument();
  });

  it("persists skeleton count from loaded items", () => {
    const { rerender } = render(
      <SmartSkeletonList
        loading={false}
        items={[...items, { id: 3, label: "Item 3" }]}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        storageKey="smart-skeleton-list-persist"
      />,
    );

    rerender(
      <SmartSkeletonList
        loading={true}
        items={undefined}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        storageKey="smart-skeleton-list-persist"
      />,
    );

    expect(screen.getAllByTestId("skeleton-item")).toHaveLength(3);
  });

  it("returns null when not loading and items are empty", () => {
    const { container } = render(
      <SmartSkeletonList
        loading={false}
        items={[]}
        renderItem={renderItem}
        renderSkeleton={renderSkeleton}
        storageKey="smart-skeleton-list-empty"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
