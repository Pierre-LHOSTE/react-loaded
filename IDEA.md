# Loaded

> Résumé
Une librairie React qui affiche des skeletons basés sur les vrais composants en masquant leur contenu via CSS, avec gestion optionnelle des listes et persistance du nombre d’éléments pour éviter les jumps visuels.
>

## 1. Pourquoi ce projet existe

- Problème ou besoin initial:
  - Les skeletons génériques ne respectent pas la vraie structure visuelle du composant.
  - Les listes affichent souvent un nombre arbitraire de skeletons (ex: 3) sans lien avec le rendu réel.
  - Lorsqu’une liste charge 20, 42 ou 100 items, le skeleton ne reflète pas ce nombre, ce qui crée du jump au moment où la data arrive.
  - Beaucoup de projets recréent des skeletons à la main pour chaque composant, ce qui est répétitif et fragile.

- Pourquoi ça mérite d’exister maintenant:
  - Les libs de data (React Query, SWR…) ont amélioré le fetch, mais pas la continuité visuelle entre “loading” et “loaded”.
  - Les UIs modernes affichent de plus en plus de listes paginées, filtrées ou dynamiques.
  - Les devs cherchent des skeletons plus réalistes sans devoir refaire chaque composant en version skeleton.
  - Le skeleton doit anticiper le rendu final plutôt que bloquer visuellement avec 3 blocs gris.

## 2. Objectif & fin claire

- Objectif concret recherché:
  - Afficher un skeleton qui conserve la vraie forme du composant via masking CSS.
  - Pour les listes, aligner le nombre de skeletons sur le nombre réel d’éléments.
  - Supprimer les jumps visuels au moment où la data arrive.

- Le projet est considéré comme terminé quand:
  - Un composant SmartSkeleton permet de skeletonner un seul composant.
  - Un composant SmartSkeletonList gère les listes et la persistance du nombre d’items.
  - La lib fonctionne sans mesurer le DOM et sans recréer de skeletons manuellement.
  - L’implémentation est stable avec des UI kits et des composants maison.

## 3. Périmètre

Ce que le projet fait volontairement, et ce qu’il ne fera pas.

- Inclus:
  - Skeleton basé sur le composant réel (masking CSS).
  - Support des composants simples et des listes.
  - Persistance du nombre d’éléments via localStorage si storageKey est fourni.
  - Warning dev si l’usage est incomplet (ex: liste sans storageKey).
  - API explicite, non-magique.

- Exclu:
  - Fetch de données.
  - Gestion du loading state (fourni par le dev).
  - Lecture ou mesure de layout depuis le DOM.
  - Couplage à React Query / SWR / MUI / AntD.
  - Auto-détection du skeleton ou génération heuristique.

## 4. Idée centrale

Le cœur de l’idée, sans parler d’implémentation.

- Principe clé:
  - Le skeleton n’est pas une imitation : c’est le composant réel rendu vide via CSS.

- Logique générale / règles importantes:
  - Aucun élément visuel ajouté, aucun placeholder text inventé.
  - Le layout ne change pas entre skeleton et rendu final.
  - Pour les listes, le nombre de skeletons reflète le dernier items.length connu.
  - storageKey active la persistance du nombre, sinon fallback local simple.

- Cible ou usage principal:
  - Projets React affichant des listes dynamiques (catalogues, dashboards, timelines, etc.)
  - Composants avec structure complexe ou variable.

## 5. Fonctionnement réel

Comment ça se passe concrètement.

- Entrées:
  - loading: boolean
  - element: ReactElement (version vide du composant)
  - items?: any[] (mode liste)
  - storageKey?: string
  - defaultCount?: number

- Transformation:
  - Application d’un “skeleton mode” via CSS sur le subtree.
  - En mode liste:
    - lecture du stockage persistant si storageKey fourni
    - fallback sur defaultCount sinon
    - quand loading === false, écriture de items.length en storage

- Sorties:
  - Avant data: skeleton identique en structure
  - Après data: rendu final sans jump ni reflow

- Exemple simple d’usage:
  - Liste de 42 produits
  - Première visite: skeleton x 3
  - Data arrive: rendu x 42 → persistence
  - Visite suivante: skeleton x 42

## 6. Contenu attendu (MVP)

Le minimum nécessaire pour que le projet soit “utile”.

- Élément 1:
  - SmartSkeleton pour un composant unique

- Élément 2:
  - SmartSkeletonList pour les listes avec persistance

- Élément 3:
  - Mode skeleton via CSS (texte masqué, surfaces neutres)

- Limite volontaire du MVP:
  - Pas de thèmes ni presets UI kit
  - Pas de SSR-specific logic

## 7. Évolutions possibles (hors MVP)

Ce que le projet pourrait devenir, sans engagement.

- Fonctionnalités envisagées:
  - ~~Animation (shimmer / pulse / none)~~ ✓ Shimmer implémenté (prop `animate`)
  - Storage custom (sessionStorage, memory)
  - Presets pour AntDesign/MUI/Chakra

- Variantes ou extensions possibles:
  - Playground pour visualiser le skeleton vs rendu final
  - Debug mode pour voir les valeurs persistées

- Ce que ça apporterait de plus:
  - Intégration plus rapide dans des UIs existantes
  - Meilleure adoption sans surcoût UX

## 8. Contraintes

Règles non négociables.

- Type de projet:
  - Librairie UI React, agnostique

- Contraintes techniques ou de format:
  - Aucun DOM read ni auto-measure
  - API déclarative
  - Layout strictement préservé

- Contraintes pratiques (temps, perf, taille, coût):
  - Bundle léger
  - Coût runtime faible
  - Warnings uniquement en mode dev

## 9. Notes

Exemples d'utilisations

### Composant simple

```ts
<SmartSkeleton
  loading={loading}
  element={<UserCard user={{ name: "username", age: 1 }} />}
>
  <UserCard user={user} />
</SmartSkeleton>
```

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

### Liste

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
    return <MemberCard member={{ id: "skel-" + index, name: "name", age: 0 }} />;
  }}
  keyExtractor={(member) => {
    return member.id;
  }}
/>
```