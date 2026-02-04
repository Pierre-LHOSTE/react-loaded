# Loaded - Specification

## 1. Surface publique et integration

- Package: `react-loaded`.
- Exports: composants React, hooks utilitaires et fichier CSS publie via `./style.css`.
- Integration CSS (obligatoire pour le rendu):

```ts
import "react-loaded/style.css";
```

## 2. Exportables (API publique)

- Composants
  - SmartSkeleton - affiche un composant skeletonne (via CSS) pendant le chargement
  - SmartSkeletonList - liste qui skeletonne chaque item et persiste le nombre d'elements
- Contexte
  - SkeletonContext - contexte interne expose pour detecter le mode skeleton
- Hooks
  - useIsSkeletonMode() - hook pour savoir si l'arbre est en mode skeleton
  - usePersistedCount() - hook de persistance du nombre d'elements pour les listes

## 3. Composant SmartSkeleton (API)

Props:

- `element: ReactElement` (obligatoire)
  - Version "mock" du composant, avec des données factices.
- `children?: ReactElement`
  - Rendu final (optionnel). Si omis, retourne `null` quand loading = false.
- `loading?: boolean` (defaut: `false`)
  - Seule condition pour afficher le skeleton. Quand `true`, rendu skeletonne.
- `animate?: boolean` (defaut: `true`)
  - Active l'animation shimmer.
- `className?: string`
  - Classes additionnelles appliquees au wrapper.
- `seed?: string | number`
  - Seed stable pour l'aleatoire des largeurs de texte.
- `suppressRefWarning?: boolean` (defaut: `false`)
  - Desactive le warning si un wrapper auto est applique.

Comportement attendu:

- Si la ref DOM ne peut pas etre attachee:
  - Un wrapper DOM est ajoute automatiquement pour recuperer une ref.
  - Warning en dev pour signaler la modification de structure DOM, desactivable via `suppressRefWarning`.

## 4. Composant SmartSkeletonList (API)

Props:

- `loading?: boolean` (defaut: `false`)
- `items: T[] | undefined` (obligatoire)
  - `undefined` pendant le chargement, tableau charge ensuite.
- `renderItem: (item: T, index: number) => ReactElement` (obligatoire)
- `renderSkeleton: (index: number) => ReactElement` (obligatoire)
- `storageKey?: string`
  - Active la persistance du nombre d'elements.
- `defaultCount?: number` (defaut: `3`)
- `minCount?: number` (defaut: `1`)
- `maxCount?: number`
  - Limite superieure pour le nombre de skeletons.
- `animate?: boolean` (defaut: `true`)
- `seed?: string | number`
  - Seed stable pour l'aleatoire des largeurs de texte.
- `suppressRefWarning?: boolean` (defaut: `false`)
  - Desactive le warning si un wrapper auto est applique.
- `keyExtractor?: (item: T, index: number) => string | number` (defaut: `index`)

Comportement attendu:

- En chargement, rendu de `skeletonCount` items via `renderSkeleton`.
- Une fois charge, rendu des items via `renderItem` et save du nombre via `.length` en localstorage.
- Si `items` est vide apres chargement, retourne `null`.
- Si la ref DOM ne peut pas etre attachee a un skeleton:
  - Un wrapper DOM est ajoute automatiquement pour recuperer une ref.
  - Warning en dev pour signaler la modification de structure DOM, desactivable via `suppressRefWarning`.

## 5. Persistance du nombre (lists)

- Le nombre est persiste uniquement si `storageKey` est fourni.
- Le stockage utilise `localStorage` avec la cle racine `react-loaded`.
- Format stocke (schema versionne):
  - `{ v: 1, counts: Record<string, number> }`
  - `counts[storageKey] = items.length` (clamp avec `minCount` et `maxCount` si fourni).
- Si pas de `storageKey`, le nombre revient a `defaultCount` a chaque remount.
- Warning en dev si `storageKey` est absent.

## 6. Styles et tokens CSS

Classes appliquees en mode skeleton:

- `loaded-skeleton-mode`, `loaded-skeleton-wrapper`, `loaded-skeleton-bg`
- `loaded-text-skeleton`, `loaded-skeleton-content`, `loaded-skeleton-media`
- `loaded-animate` (animation)

Tokens CSS exposes:

- `--loaded-bg-wrapper`
- `--loaded-bg-content`
- `--loaded-border-radius`
- `--loaded-text-inset`

## 7. Regles d'experience visuelle

- Layout strictement preserve entre skeleton et rendu final.
- Aucun texte fictif ajoute par la lib.
- Les textes sont masques via pseudo-element pour conserver la hauteur.
- Les medias (img, svg, video, canvas) sont neutralises sans changer leur taille.

Heuristique de largeur des textes (sans mesure):

- La largeur du pseudo-element texte est basee sur la longueur du texte factice rendu.
- Unite: `ch` (caracteres), avec `max-width: 90%` pour ne jamais depasser le conteneur.
- Clamp: min `6ch`, max `40ch`.
- Regle continue (pas d'intervalles fixes):
  - `widthCh = clamp(6, 40, len + 2 + jitter)`
  - `jitterRange = max(4, 0.8 * len)`
  - `jitter` deterministe base sur un seed, dans `[-jitterRange, +jitterRange]`
  - Si `len` est tres grand, le clamp force `40ch`.

## 8. Exemples d'usage

Composant simple:

```ts
<SmartSkeleton
  loading={loading}
  element={<UserCard user={{ name: "username", age: 1 }} />}
>
  <UserCard user={user} />
</SmartSkeleton>
```

Ou :


```ts
if (loading) {
  return (
    <SmartSkeleton
      element={<UserCard user={{ name: "username", age: 1 }} />}
    />
  );
}

return <UserCard user={user} />;
```

Liste avec persistance:

```ts
<SmartSkeletonList
  storageKey="team-members"
  loading={loading}
  items={members}
  defaultCount={6}
  renderItem={(member) => {
    return <MemberCard member={member} />;
  }}
  renderSkeleton={(index) => {
    return (
      <MemberCard member={{ id: "skel-" + index, name: "name", age: 0 }} />
    );
  }}
  keyExtractor={(member) => {
    return member.id;
  }}
/>
```

## 9. Notes de mise en oeuvre (hors specification)

Ces notes servent a guider la mise a jour du projet sans modifier l'intention fonctionnelle.

- La prop `wrapWhenNoRef` est supprimee (API nettoyee).
- Le mode fallback "simple" et la classe `loaded-skeleton-simple` sont supprimes.
- La ref est toujours obtenue via wrapper auto si l'attache directe echoue.
- Le warning est emis uniquement quand le wrapper auto est applique (sauf `suppressRefWarning`).
- Le skeleton n'apparait que si `loading` est `true` (defaut `false`).
- Les lectures de layout/DOM (ex: `getComputedStyle`, `offsetHeight`, `querySelectorAll`) sont retirees.
- `maxCount` est ajoute a la logique de persistance et au clamp du nombre de skeletons.
- `withSkeletonRoot` est retire de l'API publique.
