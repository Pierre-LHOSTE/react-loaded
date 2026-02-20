# Changelog

## 1.0.0-beta.0

Complete rewrite. Skeletons are now **auto-generated at dev time** from the live DOM instead of being applied at runtime via refs. Zero runtime overhead in production.

### Breaking Changes

- `SmartSkeleton` → `AutoSkeleton` — uses `children` instead of `element` prop; requires an `id` prop.
- `SmartSkeletonList` → `AutoSkeletonList` — same rename; requires an `id` prop.
- `SkeletonContext.Provider` → `LoadedProvider` — provides both the skeleton registry and an optional SSR snapshot.
- `seed` and `suppressRefWarning` props removed.
- CSS variables renamed (`--loaded-bg-wrapper` → `--loaded-bg`, `--loaded-bg-content` → `--loaded-content`, `--loaded-border-radius` → `--loaded-radius`). Added `--loaded-shimmer-duration`.
- localStorage schema v2 — stores counts, widths, heights, and distributions with shortened keys (`c`, `w`, `h`, `wd`, `hd`). Incompatible with v1; old data is discarded on next write.

### Added

- **`autoskeleton` CLI** — dev server that captures the DOM and generates static `.tsx` skeleton components + a `registry.ts`.
- **Next.js SSR integration** — `react-loaded/next` (`getServerSnapshot`) and `react-loaded/next/client` (`SkeletonCookieSync`) for cookie-based snapshot hydration.
- **Dimension persistence** — text widths/heights are measured from real content and persisted to localStorage, so skeletons match actual dimensions.
- **Statistical distributions for lists** — skeleton rows get naturally-varied dimensions based on `{ avg, dev }` stats from real items.
- **`defineConfig()`** — typed CLI configuration (`port`, `outDir`, `allowedHosts`).
- **Dev toast notifications** — in-browser feedback when skeletons are generated or updated.

### Removed

- Runtime DOM traversal system (`applySkeletonClasses`, `refUtils`, wrapper fallback).

## [0.2.0] - 2026-02-08

### Added

- Added `variant` support on `SmartSkeleton` and `SmartSkeletonList` with `filled` (default) and `ghost` modes.
- Exported `SmartSkeletonVariant` from the public entrypoint.

### Changed

- Simplified background switching logic: `filled` adds `loaded-skeleton-bg`, `ghost` removes it.
- Kept wrapper fallback support while applying/removing background on the wrapped first child to preserve border radius behavior.

### Tests

- Added coverage for `ghost` mode and explicit wrapper behavior in both `filled` and `ghost` variants.

## [0.1.2] - 2026-02-08

### Changed

- Refactored `SmartSkeleton` internals into focused modules: `applySkeletonClasses.ts` and `refUtils.ts`.
- Removed deferred wrapper detection (`setTimeout`) and kept fallback decisions synchronous in layout effects.

### Fixed

- Force-hide descendants inside button-like elements (`button`, inputs, links, `role="button"`) to prevent inner content flashes.
- Improved wrapper fallback behavior during element identity changes and ref cleanup (`ref(null)`) transitions.

### Tests

- Expanded coverage for React 19 `props.ref` usage (without destructuring), `memo(forwardRef(...))`, and loading-time component swaps between ref-compatible and no-ref components.

## [0.1.1] - 2026-02-07

### Fixed

- Improved React 19 ref handling for function components using `ref` as a prop (without unnecessary wrapper fallback).
- Avoided `element.ref` access on React 19+ to prevent development warnings while preserving React 18 fallback behavior.
- Made wrapper fallback detection more resilient when refs are attached later in the same tick.
- Reset wrapper decision correctly across loading cycles and element identity changes (`type` / `key`).

### Tests

- Added coverage for React 19 ref-as-prop flows, delayed ref callbacks, rerender stability, and wrapper fallback retry behavior.
- Added a real-world integration case with Ant Design `Button` and a Story-like component that ignores refs.

## [0.1.0] - 2026-02-04

### Added

- `SmartSkeleton` component for zero-layout-shift skeleton screens
- `SmartSkeletonList` component for lists with persistent skeleton counts
- `useIsSkeletonMode` hook to detect skeleton context in child components
- `usePersistedCount` hook for custom persistence logic
- CSS custom properties for theming (`--loaded-bg-wrapper`, `--loaded-bg-content`, `--loaded-border-radius`, `--loaded-text-inset`)
- Shimmer animation with `animate` prop
- Deterministic text widths with `seed` prop
- Support for React 18 and React 19
- SSR-safe (no server crash) with isomorphic layout effects; skeleton classes are applied on the client after hydration via refs
- Automatic wrapper fallback for components that don't forward refs
- localStorage persistence with versioned schema and legacy migration
- Accessibility features: `aria-hidden` and `tabindex="-1"` on skeleton elements
