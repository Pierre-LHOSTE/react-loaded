# Changelog

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
