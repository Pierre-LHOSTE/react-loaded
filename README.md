# react-loaded

> Loading should feel loaded before it actually loads.

[![npm](https://img.shields.io/npm/v/react-loaded)](https://www.npmjs.com/package/react-loaded)
[![license](https://img.shields.io/npm/l/react-loaded)](./LICENSE)
[![CI](https://github.com/vingt-douze/react-loaded/actions/workflows/ci.yml/badge.svg)](https://github.com/vingt-douze/react-loaded/actions)

**react-loaded** captures your real UI in the browser and generates matching `.tsx` skeleton components automatically — no manual skeleton authoring needed.

## Features

- **Zero-config capture** — wrap content with `<AutoSkeleton>`, run the CLI, and skeletons are generated from your live DOM
- **Pixel-accurate text bars** — text widths and heights are measured and persisted in localStorage so skeletons match the user's actual content dimensions
- **List intelligence** — `AutoSkeletonList` persists item counts and computes width/height distributions, then uses a seeded PRNG to generate varied, realistic skeletons
- **SSR-ready** — on return visits, a cookie snapshot carries previously measured data to the server so skeletons match real content dimensions without layout shift
- **Auto dark mode** — respects `prefers-color-scheme` out of the box, fully customizable via CSS variables
- **`useIsSkeletonMode`** — lets child components know they're inside a skeleton and skip side effects accordingly
- **React 18 & 19 support**

## Installation

```bash
pnpm add react-loaded
```

**Peer dependencies**: `react` ≥ 18, `react-dom` ≥ 18. `next` ≥ 14 is optional (for SSR helpers).

## Quick Start

### 1. Import the stylesheet and wrap your app

```tsx
// main.tsx / layout.tsx
import "react-loaded/style.css";
import { registry } from "./generated/skeletons/registry";
import { LoadedProvider } from "react-loaded";

export default function App({ children }) {
  return <LoadedProvider registry={registry}>{children}</LoadedProvider>;
}
```

### 2. Wrap content with `AutoSkeleton`

```tsx
import { AutoSkeleton } from "react-loaded";

function UserCard({
  user,
  loading,
}: {
  user?: { avatar: string; name: string; bio: string };
  loading: boolean;
}) {
  return (
    <AutoSkeleton id="user-card" loading={loading}>
      <div className="card">
        <img src={user?.avatar ?? ""} alt="" />
        <h2>{user?.name ?? "Loading name"}</h2>
        <p>{user?.bio ?? "Loading biography"}</p>
      </div>
    </AutoSkeleton>
  );
}
```

### 3. Run the dev server

```bash
npx autoskeleton dev
```

Navigate to the page in your browser. The CLI captures the DOM and generates `src/generated/skeletons/user-card.tsx` and `registry.ts` automatically.

---

## Components

### `AutoSkeleton`

Wraps content and renders a generated skeleton while `loading` is true.

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | Unique identifier. Used to look up the generated skeleton and persist text dimensions. |
| `loading` | `boolean` | `false` | Renders the skeleton when true. |
| `animate` | `boolean` | `true` | Enables the shimmer animation. |
| `variant` | `"filled" \| "ghost"` | `"filled"` | `filled` adds a background color to the skeleton root. `ghost` renders the skeleton structure without fill — useful for interactive elements. |
| `className` | `string` | — | Applied to the skeleton root (loading) or the child (not loading). |

```tsx
<AutoSkeleton id="post-card" loading={isLoading} variant="ghost">
  <PostCard post={post} />
</AutoSkeleton>
```

### `AutoSkeletonList`

Renders a list with skeleton placeholders. Persists item count and text dimension distributions across visits.

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | Skeleton ID shared across all list items. |
| `loading` | `boolean` | `false` | Show skeletons when true. |
| `items` | `T[] \| undefined` | — | Data items. |
| `renderItem` | `(item, index) => ReactElement` | — | Renders a real item. |
| `renderSkeleton` | `(index) => ReactElement` | — | Renders a skeleton item. |
| `defaultCount` | `number` | `3` | Skeleton count when no persisted count exists. |
| `minCount` | `number` | `1` | Minimum skeleton count. |
| `maxCount` | `number` | — | Maximum skeleton count. |
| `storageKey` | `string` | — | localStorage key for count/distribution persistence. If omitted, list still renders but count and distribution persistence are disabled. |
| `keyExtractor` | `(item, index) => string \| number` | `index` | Key function for rendered items. |

```tsx
<AutoSkeletonList
  id="user-card"
  loading={isLoading}
  items={users}
  renderItem={(user) => <UserCard user={user} />}
  renderSkeleton={() => (
    <div className="card">
      <div style={{ width: 40, height: 40 }} />
      <h2>Loading name</h2>
      <p>Loading bio text</p>
    </div>
  )}
  defaultCount={4}
/>
```

### `LoadedProvider`

Provides the skeleton registry and SSR snapshot to the component tree. Place it at the root of your app.

| Prop | Type | Default | Description |
|---|---|---|---|
| `registry` | `SkeletonRegistry` | `{}` | Map of generated skeleton components. Import from your generated `registry.ts`. |
| `snapshot` | `PersistedSkeletonSnapshot \| null` | `null` | Server-side snapshot for SSR hydration (see [SSR section](#nextjs--ssr)). |

### `useIsSkeletonMode`

Returns `true` when the component is rendered inside a skeleton. Use it in child components to skip side effects or rendering during skeleton mode.

```tsx
function Avatar({ src }) {
  const isSkeleton = useIsSkeletonMode();
  if (isSkeleton) return null;
  return <img src={src} />;
}
```

---

## CLI

### `autoskeleton dev`

Starts the capture dev server (default port `7331`). `AutoSkeleton` components automatically POST their DOM structure to this server while in development mode. Skeletons are generated or updated on each capture.

```bash
autoskeleton dev
autoskeleton dev --config ./my-config.ts
```

### `autoskeleton reset`

Removes all generated `.tsx` skeleton files and resets `registry.ts` to empty.

```bash
autoskeleton reset
```

### Configuration

Optionally, create a config file at the root of your project (auto-detected):

- `react-loaded.config.ts` / `.js` / `.mjs`
- `loaded.config.ts` / `.js` / `.mjs`

```ts
// react-loaded.config.ts
import { defineConfig } from "react-loaded";

export default defineConfig({
  port: 7331,
  outDir: "src/generated/skeletons",
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `port` | `number` | `7331` | Dev server port. |
| `outDir` | `string` | `"src/generated/skeletons"` | Output directory for generated skeleton files. |
| `allowedHosts` | `string[]` | `["localhost", "127.0.0.1", "::1"]` | Hosts allowed to connect to the dev server. |

---

## Next.js / SSR

react-loaded can hydrate skeletons server-side so the correct skeleton dimensions are rendered on the first request.

### App Router setup

Because `LoadedProvider` uses client hooks, it must live behind a `"use client"` boundary. The recommended pattern is a thin client wrapper that receives the snapshot from the server.

```tsx
// app/skeleton-providers.tsx
"use client";

import { LoadedProvider, type PersistedSkeletonSnapshot } from "react-loaded";
import { SkeletonCookieSync } from "react-loaded/next/client";
import { registry } from "@/generated/skeletons/registry";

export function SkeletonProviders({
  children,
  snapshot,
}: {
  children: React.ReactNode;
  snapshot: PersistedSkeletonSnapshot;
}) {
  return (
    <LoadedProvider registry={registry} snapshot={snapshot}>
      <SkeletonCookieSync />
      {children}
    </LoadedProvider>
  );
}
```

```tsx
// app/layout.tsx
import { getServerSnapshot } from "react-loaded/next";
import { SkeletonProviders } from "./skeleton-providers";
import "react-loaded/style.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getServerSnapshot();

  return (
    <html>
      <body>
        <SkeletonProviders snapshot={snapshot}>{children}</SkeletonProviders>
      </body>
    </html>
  );
}
```

`getServerSnapshot()` reads the `react-loaded-snapshot` cookie (written by `SkeletonCookieSync` on the client) and returns the persisted data for SSR.

See [docs/nextjs.md](./docs/nextjs.md) for the full guide.

---

## Customization

Import `react-loaded/style.css` and override CSS variables to match your design:

```css
:root {
  --loaded-bg: #e5e7eb;                         /* skeleton root background (filled variant) */
  --loaded-content: rgba(156, 163, 175, 0.6);   /* text bars, media and interactive placeholders */
  --loaded-radius: 4px;                         /* border-radius on text bars */
  --loaded-text-inset: 0.3em;                   /* top/bottom inset on text bars */
  --loaded-shimmer-duration: 1.5s;              /* shimmer animation duration */
}
```

Dark mode values are set automatically via `@media (prefers-color-scheme: dark)`.

---

## How It Works

1. **Capture** — In dev mode, `AutoSkeleton` serializes its children's DOM tree and POSTs it to the CLI dev server.
2. **Generate** — The CLI generates a `.tsx` skeleton component and updates `registry.ts`.
3. **Render** — When `loading=true`, `AutoSkeleton` looks up the generated component in the registry and renders it. Text dimensions are applied via CSS custom properties (`--sk-w-*`, `--sk-h-*`).
4. **Measure & persist** — When content loads, text widths and heights are measured using the Range API and stored in localStorage.
5. **SSR** — `SkeletonCookieSync` writes a compacted snapshot to a cookie. On the next server render, `getServerSnapshot()` reads it so the skeleton matches the user's previously measured dimensions without waiting for client data.

---

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Next.js / SSR](./docs/nextjs.md)
- [Architecture](./docs/architecture.md)

## License

MIT © [Pierre-LHOSTE](https://github.com/vingt-douze)
