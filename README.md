# React Loaded

> Loading should feel loaded before it actually loads.

Smart skeleton screens that mirror your actual components. No layout shift. No visual jumps.


## The Problem

Traditional skeleton screens create a disconnect between loading and loaded states:

- Generic gray boxes do not match your actual UI
- Lists show arbitrary counts (3 skeletons -> 47 items = jarring jump)
- Building custom skeletons for every component is tedious and fragile

## The Solution

**React Loaded** renders your real components in "skeleton mode" using CSS masking. The skeleton is your component, just with content hidden. This guarantees:

- **Zero layout shift** between loading and loaded states
- **Pixel-perfect structure** that matches the final render
- **Persistent list counts** that remember how many items to show

## Installation

```bash
pnpm add react-loaded
```

Required: import the stylesheet once in your app:

```tsx
import "react-loaded/style.css";
```

## Quick Start

### Single Component

```tsx
import { SmartSkeleton } from "react-loaded";

function UserProfile({ userId }) {
  const { data: user, isLoading } = useQuery(["user", userId], fetchUser);

  return (
    <SmartSkeleton
      loading={isLoading}
      element={<ProfileCard user={{ name: "Loading...", avatar: "" }} />}
    >
      <ProfileCard user={user} />
    </SmartSkeleton>
  );
}
```

Or with conditional rendering:

```tsx
if (isLoading) {
  return (
    <SmartSkeleton
      loading
      element={<ProfileCard user={{ name: "Loading...", avatar: "" }} />}
    />
  );
}

return <ProfileCard user={user} />;
```

### Lists with Persistence

```tsx
import { SmartSkeletonList } from "react-loaded";

function ProductList() {
  const { data: products, isLoading } = useQuery(["products"], fetchProducts);

  return (
    <SmartSkeletonList
      loading={isLoading}
      items={products}
      storageKey="product-list"
      defaultCount={6}
      renderItem={(product) => <ProductCard product={product} />}
      renderSkeleton={(index) => (
        <ProductCard product={{ id: index, name: "Product", price: 0 }} />
      )}
      keyExtractor={(product) => product.id}
    />
  );
}
```

**How persistence works:**
1. First visit: shows `defaultCount` skeletons (6)
2. Data loads: renders 42 products, saves count to localStorage
3. Next visit: shows 42 skeletons -> loads 42 products -> no jump

## API Reference

### `<SmartSkeleton>`

Wraps a single component to display it in skeleton mode while loading.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `element` | `ReactElement` | *required* | The skeleton version with mock or placeholder data |
| `children` | `ReactElement` | - | The real content when loaded. Returns `null` if omitted |
| `loading` | `boolean` | `false` | Whether to show the skeleton |
| `animate` | `boolean` | `true` | Enable shimmer animation |
| `variant` | `"filled" \| "ghost"` | `"filled"` | Skeleton background style (`ghost` disables wrapper/card background) |
| `className` | `string` | - | Additional CSS classes |
| `seed` | `string \| number` | - | Stable seed for text width randomness |
| `suppressRefWarning` | `boolean` | `false` | Suppress console warning when auto-wrapper is needed |

### `<SmartSkeletonList>`

Renders a list with skeleton placeholders and optional count persistence.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[] | undefined` | *required* | Array of items, `undefined` while loading |
| `renderItem` | `(item: T, index: number) => ReactElement` | *required* | Render function for loaded items |
| `renderSkeleton` | `(index: number) => ReactElement` | *required* | Render function for skeleton placeholders |
| `loading` | `boolean` | `false` | Whether to show skeletons |
| `storageKey` | `string` | - | localStorage key for count persistence |
| `defaultCount` | `number` | `3` | Initial skeleton count |
| `minCount` | `number` | `1` | Minimum skeletons to display |
| `maxCount` | `number` | - | Maximum skeletons to display |
| `animate` | `boolean` | `true` | Enable shimmer animation |
| `variant` | `"filled" \| "ghost"` | `"filled"` | Skeleton background style for each list placeholder |
| `seed` | `string \| number` | - | Stable seed for text width randomness |
| `suppressRefWarning` | `boolean` | `false` | Suppress console warning when auto-wrapper is needed |
| `keyExtractor` | `(item: T, index: number) => string | number` | `index` | Extract unique key for each item |

### `useIsSkeletonMode()`

Hook to detect if a component is rendered inside a skeleton.

```tsx
import { useIsSkeletonMode } from "react-loaded";

function Avatar({ src }) {
  const isSkeleton = useIsSkeletonMode();

  // Skip expensive operations during skeleton render
  if (isSkeleton) {
    return <div className="avatar-placeholder" />;
  }

  return <img src={src} onLoad={trackAnalytics} />;
}
```

### `usePersistedCount()`

Low-level hook for custom persistence logic.

```tsx
import { usePersistedCount } from "react-loaded";

const count = usePersistedCount({
  storageKey: "my-list",
  defaultCount: 5,
  currentCount: items?.length,
  loading: isLoading,
  minCount: 1,
  maxCount: 20,
});
```

## Customization

Override CSS custom properties to match your design system:

```css
:root {
  --loaded-bg-wrapper: rgba(229, 231, 235, 1);   /* Skeleton background */
  --loaded-bg-content: rgba(156, 163, 175, 0.6); /* Content block color */
  --loaded-border-radius: 4px;                   /* Border radius */
  --loaded-text-inset: 0.3em;                    /* Text bar vertical padding */
}
```

### Dark Mode Example

```css
@media (prefers-color-scheme: dark) {
  :root {
    --loaded-bg-wrapper: rgba(55, 65, 81, 1);
    --loaded-bg-content: rgba(107, 114, 128, 0.6);
  }
}
```

## How It Works

1. **Render phase:** Your component renders with mock data
2. **CSS masking:** Text becomes transparent, backgrounds neutralized
3. **Visual overlay:** Skeleton bars appear over text, media gets placeholder backgrounds
4. **Transition:** When `loading` becomes `false`, your real component renders in place

**SSR note:** React Loaded is primarily designed for client-side loading states (navigation/refetch).
If you render skeletons during SSR, the full overlay (text widths, media/content classes) is applied on the client via refs.
For best SSR results, ensure your skeleton `element` forwards `className` and `ref` to a DOM node.

The skeleton preserves:
- Exact dimensions and spacing
- Text alignment (left, center, right)
- Responsive behavior
- Component hierarchy

## Ref Handling

React Loaded supports both React ref models:

- **React 19+:** `ref` can be passed as a regular prop.
- **React 18:** function components should use `forwardRef`.

For best rendering, your skeleton `element` should expose a DOM ref. If it does not, React Loaded automatically wraps it in a `div` and logs a development warning.

To suppress the warning:

```tsx
<SmartSkeleton
  suppressRefWarning
  element={<ThirdPartyComponent />}
/>
```

Or better, wrap third-party components so a DOM ref is always available:

```tsx
const WrappedComponent = forwardRef((props, ref) => (
  <div ref={ref}>
    <ThirdPartyComponent {...props} />
  </div>
));
```

## Stable Text Widths with `seed`

By default, skeleton text bars have slightly randomized widths to look more natural. If you need consistent widths across renders (useful for tests or SSR hydration), pass a `seed`:

```tsx
<SmartSkeleton
  loading={isLoading}
  seed="user-profile"
  element={<ProfileCard user={mockUser} />}
>
  <ProfileCard user={user} />
</SmartSkeleton>
```

The same seed always produces the same text widths, making skeleton output deterministic.

## Notes

- **React 18 and 19** are supported.
- Persistence uses `localStorage` under the root key `react-loaded` with a versioned schema.
- In skeleton mode, the library applies CSS classes on the subtree. Components should accept `className` and expose a usable ref (React 19 `ref` prop or React 18 `forwardRef`).
- Dev warnings are enabled when `NODE_ENV !== "production"`. If your environment doesn’t inject `NODE_ENV`, you can force them with `globalThis.__REACT_LOADED_DEV__ = true`.
- SSR: the library uses an isomorphic layout effect to avoid server warnings and keep hydration stable.
- JSR/Deno: CSS module imports aren’t supported. For Node/bundlers, import `react-loaded/style.css`. For Deno, you’ll need to copy the CSS into your app (or recreate the styles).

## License

MIT
