import { bench, describe } from "vitest";
import { SmartSkeleton } from "../components/SmartSkeleton/SmartSkeleton";
import { renderWithProfiler } from "./renderWithProfiler";

const skeletonElement = (
  <div className="skeleton-card">
    <div className="skeleton-title">Loading</div>
    <div className="skeleton-meta">Placeholder meta</div>
    <button type="button">Action</button>
  </div>
);

const contentElement = (
  <div className="content-card">
    <div className="content-title">Loaded title</div>
    <div className="content-meta">Loaded meta</div>
    <button type="button">Action</button>
  </div>
);

const heavyRowCount = 200;

const renderRows = (count: number, label: string) => (
  <div className="rows">
    {Array.from({ length: count }, (_, index) => (
      <div className="row" key={`${label}-${index}`}>
        <div className="row-title">
          {label} title {index + 1}
        </div>
        <div className="row-meta">
          {label} meta {index + 1}
        </div>
        <button type="button">Action</button>
      </div>
    ))}
  </div>
);

const heavySkeletonElement = (
  <div className="skeleton-card">
    <div className="skeleton-title">Loading</div>
    <div className="skeleton-meta">Placeholder meta</div>
    {renderRows(heavyRowCount, "Loading")}
  </div>
);

const heavyContentElement = (
  <div className="content-card">
    <div className="content-title">Loaded title</div>
    <div className="content-meta">Loaded meta</div>
    {renderRows(heavyRowCount, "Loaded")}
  </div>
);

describe("SmartSkeleton", () => {
  bench("mount loading skeleton", () => {
    renderWithProfiler({
      id: "SmartSkeleton:mount",
      element: <SmartSkeleton loading={true} element={skeletonElement} />,
    });
  });

  bench("update loading to content", () => {
    renderWithProfiler({
      id: "SmartSkeleton:update",
      element: <SmartSkeleton loading={true} element={skeletonElement} />,
      update: (
        <SmartSkeleton loading={false} element={skeletonElement}>
          {contentElement}
        </SmartSkeleton>
      ),
    });
  });

  bench("mount loading skeleton (heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:mount:heavy",
      element: <SmartSkeleton loading={true} element={heavySkeletonElement} />,
    });
  });

  bench("update loading to content (heavy)", () => {
    renderWithProfiler({
      id: "SmartSkeleton:update:heavy",
      element: <SmartSkeleton loading={true} element={heavySkeletonElement} />,
      update: (
        <SmartSkeleton loading={false} element={heavySkeletonElement}>
          {heavyContentElement}
        </SmartSkeleton>
      ),
    });
  });
});
