# React Loaded

> Loading should feel loaded before it actually loads.

Build-time skeleton generation that captures your real DOM and produces zero-runtime-cost skeleton components.

## The Problem

Traditional skeleton screens create a disconnect between loading and loaded states:

- Generic gray boxes do not match your actual UI
- Building custom skeletons for every component is tedious and fragile
- Lists show arbitrary counts (3 skeletons -> 47 items = jarring jump)
- Runtime skeleton approaches add overhead and break SSR

## The Solution

**React Loaded** captures your rendered components at development time and generates static skeleton components. This guarantees:

- **Zero runtime cost** — skeletons are pre-generated React components
- **SSR-ready** — works out of the box with server-side rendering
- **Pixel-perfect fidelity** — captures real DOM structure, styles, and proportions
- **Persistent list counts** — remembers how many items to show across sessions

## Installation

**Requirements:** React 18 or 19, React DOM 18 or 19.

```bash
pnpm add react-loaded
```

Import the stylesheet once in your app:

```tsx
import "react-loaded/style.css";
```

## Quick Start

### Single Component

```tsx
import { AutoSkeleton, LoadedProvider } from "react-loaded";
import { registry } from "./generated/skeletons/registry";

function App() {
  const { data: user, isLoading } = useQuery(["user"], fetchUser);

  return (
    <LoadedProvider registry={registry}>
      <AutoSkeleton id="user-card" loading={isLoading}>
        <UserCard
          name={user?.name ?? "Placeholder Name"}
          avatar={user?.avatar ?? ""}
          bio={user?.bio ?? "Placeholder bio text here."}
        />
      </AutoSkeleton>
    </LoadedProvider>
  );
}
```

### List

```tsx
import { AutoSkeletonList, LoadedProvider } from "react-loaded";
import { registry } from "./generated/skeletons/registry";

function NotificationFeed() {
  const { data: items, isLoading } = useQuery(["notifications"], fetchNotifs);

  return (
    <LoadedProvider registry={registry}>
      <AutoSkeletonList
        id="notification-item"
        loading={isLoading}
        items={items}
        renderItem={(item) => <NotificationItem {...item} />}
        renderSkeleton={(index) => (
          <NotificationItem
            title="Loading..."
            description="Placeholder"
            time="--"
          />
        )}
        storageKey="notification-count"
      />
    </LoadedProvider>
  );
}
```

## Next.js Integration (SSR with Cookie Persistence)

For Next.js apps, **React Loaded** provides seamless SSR support with cookie-based snapshot persistence. This eliminates layout shift on first render by pre-rendering skeletons with the correct dimensions server-side.

### Setup

**1. Create a client component wrapper** (`app/providers.tsx`):

```tsx
"use client";
import { LoadedProvider } from "react-loaded";
import { SkeletonCookieSync } from "react-loaded/next/client";
import { registry } from "@/generated/skeletons/registry";
import type { PersistedSkeletonSnapshot } from "react-loaded";

export function SkeletonProviders({
  children,
  snapshot,
}: {
  children: React.ReactNode;
  snapshot: PersistedSkeletonSnapshot;
}) {
  return (
    <LoadedProvider registry={registry} persistedSnapshot={snapshot}>
      <SkeletonCookieSync />
      {children}
    </LoadedProvider>
  );
}
```

**2. Use it in your root layout** (`app/layout.tsx`):

```tsx
import { getServerSnapshot } from "react-loaded/next";
import { SkeletonProviders } from "./providers";
import "react-loaded/style.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = await getServerSnapshot();

  return (
    <html lang="en">
      <body>
        <SkeletonProviders snapshot={snapshot}>
          {children}
        </SkeletonProviders>
      </body>
    </html>
  );
}
```

### How it Works

1. **Client-side measurement**: When your app loads, `AutoSkeleton` and `AutoSkeletonList` measure text widths, item counts, and distributions. These values are saved to `localStorage`.

2. **Cookie synchronization**: `SkeletonCookieSync` automatically copies the snapshot from `localStorage` to a cookie (`react-loaded-snapshot`) on every update.

3. **Server-side rendering**: On the next page load, `getServerSnapshot()` reads the cookie server-side and passes the snapshot to `LoadedProvider`. Skeletons render immediately with the correct dimensions—no flash, no layout shift.

### API

#### `getServerSnapshot(options?)`

Reads the persisted snapshot from cookies (server-side only).

**Options:**
- `cookieName?: string` — Custom cookie name (default: `"react-loaded-snapshot"`)

**Returns:** `Promise<PersistedSkeletonSnapshot>`

#### `<SkeletonCookieSync>`

Client component that syncs `localStorage` to cookies. Renders nothing.

**Props:**
- `options?: { cookieName?: string, path?: string, maxAge?: number, compact?: CompactOptions }`

**Compact options** (to reduce cookie size):
- `maxSkeletons?: number` — Limit number of skeleton IDs (default: `20`)
- `maxTextKeysPerSkeleton?: number` — Limit text keys per skeleton (default: `10`)
- `decimals?: number` — Round measurements to N decimals (default: `1`)

### Import Paths

- `react-loaded/next` — Server-side utilities (`getServerSnapshot`)
- `react-loaded/next/client` — Client-side utilities (`SkeletonCookieSync`)

> **Why separate imports?** Next.js requires strict separation between server and client code. `react-loaded/next` imports `next/headers` (server-only), so it cannot be imported by client components.

## CLI Usage

The `autoskeleton` CLI runs an HTTP server that listens for captures from your dev environment and generates skeleton components.

```bash
# Start the capture server
npx autoskeleton dev

# Start with a custom config file
npx autoskeleton dev --config ./custom-config.ts

# Reset all generated skeletons
npx autoskeleton reset
```

### Configuration

Create a `react-loaded.config.ts` (or `.js` / `.mjs`) at your project root:

```ts
import { defineConfig } from "react-loaded";

export default defineConfig({
  port: 7331,                                    // default: 7331
  outDir: "src/generated/skeletons",              // default: src/generated/skeletons
  allowedHosts: ["localhost", "127.0.0.1", "::1"] // default: localhost, 127.0.0.1, ::1
});
```

All fields are optional. Without a config file, defaults are used.

### Client Configuration

By default, the capture client sends data to `http://127.0.0.1:7331`. If you use a custom port in your config, configure the client to match:

```ts
import { configureCapture } from "react-loaded";

configureCapture({ port: 9000 });
// or
configureCapture({ url: "http://127.0.0.1:9000" });
```

### Security Model

- Capture server binds to `127.0.0.1` only
- Incoming `Host` must match the configured allowlist
- Capture payload `id` is validated against a strict pattern
- Request body size is capped (1 MB)

### How it works

1. In development, `AutoSkeleton` serializes its children's DOM and sends the capture via HTTP
2. The CLI receives the capture and generates a static React component (`.tsx`)
3. A `registry.ts` is auto-maintained, mapping skeleton IDs to generated components
4. In production, the pre-generated skeleton renders instantly with zero runtime overhead

## API Reference

### `<AutoSkeleton>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | Unique skeleton identifier |
| `children` | `ReactNode` | required | Source component to capture and show when loaded |
| `loading` | `boolean` | `true` | When `true`, show skeleton; when `false`, show children |
| `animate` | `boolean` | `true` | Enable shimmer animation |
| `variant` | `"filled" \| "ghost"` | `"filled"` | Visual variant for skeleton surface |
| `className` | `string` | — | Extra CSS classes applied to the skeleton root |

### `<AutoSkeletonList>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | Skeleton registry ID for each row |
| `loading` | `boolean` | `false` | Whether the list is loading |
| `items` | `T[] \| undefined` | required | Items to render (pass `undefined` while loading) |
| `renderItem` | `(item: T, index: number) => ReactElement` | required | Render function for loaded items |
| `renderSkeleton` | `(index: number) => ReactElement` | required | Render function for skeleton rows |
| `storageKey` | `string` | — | Key for `localStorage` persistence |
| `defaultCount` | `number` | `3` | Initial skeleton count |
| `minCount` | `number` | `1` | Minimum skeletons to show |
| `maxCount` | `number` | — | Maximum skeletons to show |
| `animate` | `boolean` | `true` | Enable shimmer animation |
| `variant` | `"filled" \| "ghost"` | `"filled"` | Visual variant |
| `keyExtractor` | `(item: T, index: number) => string \| number` | index | Key function for items |

### `<LoadedProvider>`

Wraps your app (or a subtree) to provide the skeleton registry via context.

| Prop | Type | Description |
|------|------|-------------|
| `registry` | `SkeletonRegistry` | The auto-generated registry object |
| `persistedSnapshot` | `PersistedSkeletonSnapshot` | Optional. Pre-loaded snapshot (for SSR, pass from `getServerSnapshot()`) |
| `children` | `ReactNode` | App content |

### `useIsSkeletonMode()`

Returns `true` when the current component tree is inside an active skeleton. Useful for hiding interactive elements or animations during loading.

## CSS Customization

Override CSS custom properties to match your design system:

```css
:root {
  --loaded-bg: rgba(229, 231, 235, 1);        /* skeleton container fill */
  --loaded-content: rgba(156, 163, 175, 0.6);  /* text/media/interactive fill */
  --loaded-radius: 4px;                        /* border radius for text bars */
  --loaded-text-inset: 0.3em;                  /* vertical inset for text bars */
  --loaded-shimmer-duration: 1.5s;             /* shimmer animation duration */
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --loaded-bg: rgba(55, 65, 81, 1);
    --loaded-content: rgba(107, 114, 128, 0.6);
  }
}
```

## License

MIT
