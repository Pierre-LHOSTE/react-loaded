import { cloneElement, type ReactElement } from "react";
import { usePersistedCount } from "../../hooks/usePersistedCount/usePersistedCount";
import { SmartSkeleton } from "../SmartSkeleton/SmartSkeleton";

export interface SmartSkeletonListProps<T> {
  /** Whether the list is currently loading. Default: false */
  loading?: boolean;
  /** The items to render. Pass undefined while loading. */
  items: T[] | undefined;
  /** Render function for each item when loaded */
  renderItem: (item: T, index: number) => ReactElement;
  /** Render function for skeleton placeholders */
  renderSkeleton: (index: number) => ReactElement;
  /** Key for localStorage persistence. Without it, count resets on remount. */
  storageKey?: string;
  /** Initial skeleton count before any data is known. Default: 3 */
  defaultCount?: number;
  /** Minimum skeletons to show. Default: 1 */
  minCount?: number;
  /** Maximum skeletons to show */
  maxCount?: number;
  /** Enable shimmer animation. Default: true */
  animate?: boolean;
  /** Suppress warning when auto-wrapper is applied. Default: false */
  suppressRefWarning?: boolean;
  /** Extract unique key for each item. Default: index */
  keyExtractor?: (item: T, index: number) => string | number;
}

export function SmartSkeletonList<T>({
  loading = false,
  items,
  renderItem,
  renderSkeleton,
  storageKey,
  defaultCount = 3,
  minCount = 1,
  maxCount,
  animate = true,
  suppressRefWarning = false,
  keyExtractor = (_, index) => index,
}: SmartSkeletonListProps<T>): ReactElement | null {
  const skeletonCount = usePersistedCount({
    storageKey,
    defaultCount,
    currentCount: items?.length,
    loading,
    minCount,
    maxCount,
  });

  if (loading) {
    return (
      <>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SmartSkeleton
            key={`skeleton-${index}`}
            loading={true}
            element={renderSkeleton(index)}
            animate={animate}
            suppressRefWarning={suppressRefWarning}
          />
        ))}
      </>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <>
      {items.map((item, index) =>
        cloneElement(renderItem(item, index), {
          key: keyExtractor(item, index),
        }),
      )}
    </>
  );
}
