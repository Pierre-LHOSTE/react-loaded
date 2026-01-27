import type { ReactElement } from "react";
import { usePersistedCount } from "../hooks/usePersistedCount";
import { SmartSkeleton } from "./SmartSkeleton";

export interface SmartSkeletonListProps<T> {
  loading: boolean;
  items: T[] | undefined;
  renderItem: (item: T, index: number) => ReactElement;
  renderSkeleton: (index: number) => ReactElement;
  storageKey?: string;
  defaultCount?: number;
  animate?: boolean;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function SmartSkeletonList<T>({
  loading,
  items,
  renderItem,
  renderSkeleton,
  storageKey,
  defaultCount = 3,
  animate = true,
  keyExtractor = (_, index) => index,
}: SmartSkeletonListProps<T>): ReactElement {
  const skeletonCount = usePersistedCount({
    storageKey,
    defaultCount,
    currentCount: items?.length,
    loading,
  });

  if (loading || !items) {
    return (
      <>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SmartSkeleton
            key={`skeleton-${index}`}
            loading={true}
            animate={animate}
          >
            {renderSkeleton(index)}
          </SmartSkeleton>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((item, index) => (
        <SmartSkeleton
          key={keyExtractor(item, index)}
          loading={false}
          animate={animate}
        >
          {renderItem(item, index)}
        </SmartSkeleton>
      ))}
    </>
  );
}
