# Getting Started

This guide walks through a minimal `react-loaded` setup from scratch.

## Requirements

- React 18 or 19
- `react-loaded` installed

```bash
pnpm add react-loaded
```

## Step 1: Configure the generator (optional)

This step is optional — `react-loaded` works out of the box with sensible defaults. If you need to customize the port or output directory, create `react-loaded.config.ts` at the root of your project:

```ts
import { defineConfig } from "react-loaded";

export default defineConfig({
  port: 7331,
  outDir: "src/generated/skeletons",
});
```

All fields are optional — the values above are the defaults. If you can't load TypeScript config files directly, use `react-loaded.config.js` instead.

## Step 2: Start the capture server

```bash
npx autoskeleton dev
```

This starts a local server on port `7331` that listens for capture payloads and writes generated files into `outDir`.

Expected output:

- `src/generated/skeletons/<id>.tsx` — one file per captured component
- `src/generated/skeletons/registry.ts` — maintained automatically

## Step 3: Wrap your app with the registry

Import the stylesheet once, then wrap your app with `LoadedProvider`:

```tsx
// main.tsx or your root component
import "react-loaded/style.css";
import { LoadedProvider } from "react-loaded";
import { registry } from "./generated/skeletons/registry";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LoadedProvider registry={registry}>{children}</LoadedProvider>;
}
```

`registry.ts` is maintained by the CLI — treat it as generated source and commit it.

## Step 4: Add `AutoSkeleton`

Wrap the component you want to skeleton-ify:

```tsx
import { AutoSkeleton } from "react-loaded";

function ProfileCard(props: { name: string; bio: string }) {
  return (
    <article>
      <h2>{props.name}</h2>
      <p>{props.bio}</p>
    </article>
  );
}

export function ProfileSection({
  user,
  isLoading,
}: {
  user?: { name: string; bio: string };
  isLoading: boolean;
}) {
  return (
    <AutoSkeleton id="profile-card" loading={isLoading}>
      <ProfileCard
        name={user?.name ?? "Loading name"}
        bio={user?.bio ?? "Loading biography"}
      />
    </AutoSkeleton>
  );
}
```

Keep the children structurally valid even while loading — `AutoSkeleton` renders them off-screen in dev mode to capture the layout.

## Step 5: Capture the component

1. Run `autoskeleton dev` in one terminal, your app in another
2. Navigate to the page in your browser
3. `react-loaded` captures the DOM and writes `profile-card.tsx` + updates `registry.ts`
4. Switch the loading state to `true` — the generated skeleton renders

## Working with lists

Use `AutoSkeletonList` when the number of placeholders should track the previously seen item count:

```tsx
import { AutoSkeletonList } from "react-loaded";

export function Feed({
  posts,
  isLoading,
}: {
  posts?: Array<{ id: string; title: string; body: string }>;
  isLoading: boolean;
}) {
  return (
    <AutoSkeletonList
      id="feed-row"
      loading={isLoading}
      items={posts}
      storageKey="feed"
      renderItem={(post) => (
        <article>
          <h2>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      )}
      renderSkeleton={() => (
        <article>
          <h2>Loading title</h2>
          <p>Loading body copy</p>
        </article>
      )}
      keyExtractor={(post) => post.id}
    />
  );
}
```

Use `storageKey` if you want the skeleton count and text distributions to persist between sessions. Without it, list skeletons still render but always use `defaultCount`.

## Resetting generated files

```bash
npx autoskeleton reset
```

Removes all generated `.tsx` skeleton files and rewrites `registry.ts` to an empty registry.

## Recommended workflow

- Commit generated skeleton files — they're real source files, review them like any other
- Re-run capture whenever a component's structure changes significantly
- Use stable IDs that describe the component, not temporary state or route info

## Common pitfalls

**Nothing is generated** — check that `autoskeleton dev` is running, your component has an `id`, and the wrapped component actually renders in dev.

**The wrong port is used** — if you changed the port in the config, the dev server and client must match. Default: `http://127.0.0.1:7331`.

**The skeleton looks off** — the children passed to `AutoSkeleton` should be structurally close to the real component. If the component changed significantly, reset and recapture.

**Two different components share the same `id`** — changing what an ID refers to produces a stale skeleton and corrupts persisted measurements. Use distinct IDs for distinct layouts.
