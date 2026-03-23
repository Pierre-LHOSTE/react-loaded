# Next.js integration

`react-loaded` supports SSR via a cookie-based snapshot loop:

1. The client measures skeleton-relevant data (text dimensions, list counts) and stores it in localStorage
2. `SkeletonCookieSync` copies that data into a cookie
3. On the next request, the server reads the cookie
4. `LoadedProvider` receives the snapshot and can render more accurate skeletons on subsequent visits — using dimensions the client measured previously

## Entry points

Use the split entry points to keep server-only imports out of the client bundle:

- `react-loaded/next` — server utilities (`getServerSnapshot`)
- `react-loaded/next/client` — client-only cookie sync (`SkeletonCookieSync`)

## App Router setup

`LoadedProvider` uses `useEffect` and `useRef`, so it must live behind a `"use client"` boundary. The recommended pattern is a client wrapper that receives the snapshot from the server as a prop.

### `app/skeleton-providers.tsx`

```tsx
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

### `app/layout.tsx`

```tsx
import { getServerSnapshot } from "react-loaded/next";
import { SkeletonProviders } from "./skeleton-providers";
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
        <SkeletonProviders snapshot={snapshot}>{children}</SkeletonProviders>
      </body>
    </html>
  );
}
```

## Why the snapshot matters

Without a snapshot, the server renders generated skeletons but doesn't know the user's previously observed text widths, heights, or list counts. Skeletons still work — they just use default/average dimensions.

With a snapshot:

- list placeholders match the previously seen item count
- text bars match previously measured widths and heights
- the first paint is more stable across navigations and refreshes

## Customizing the cookie

`SkeletonCookieSync` accepts an optional `options` prop:

```tsx
<SkeletonCookieSync
  options={{
    cookieName: "app-skeleton-snapshot", // default: "react-loaded-snapshot"
    maxAge: 60 * 60 * 24 * 7,            // default: 1 year
    path: "/",
    compact: {
      maxSkeletons: 10,
      maxTextKeysPerSkeleton: 5,
      decimals: 1,
    },
  }}
/>
```

Pass the same `cookieName` to `getServerSnapshot` if you change it:

```tsx
const snapshot = await getServerSnapshot({ cookieName: "app-skeleton-snapshot" });
```

If the cookie is missing or invalid, `getServerSnapshot` returns an empty snapshot rather than throwing — so first-visit SSR always works gracefully.

## Key rules

- Always import `SkeletonCookieSync` from `react-loaded/next/client`
- Always import `getServerSnapshot` from `react-loaded/next`
- Keep `LoadedProvider` in a `"use client"` component — never directly in a Server Component
- Commit the generated registry and skeleton files to source control
