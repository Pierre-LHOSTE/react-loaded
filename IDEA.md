# SmartSkeleton

> Résumé
Une librairie React qui affiche des skeletons intelligents basés sur les vrais composants, avec persistance automatique du nombre d’éléments pour les listes afin d’éviter tout jump visuel.
>

## 1. Pourquoi ce projet existe

- Problème ou besoin initial:
  - Les skeletons actuels sont soit génériques, soit recréés manuellement.
  - Les listes ont souvent un nombre d’éléments inconnu à l’avance, ce qui provoque des jumps visuels.
  - Les solutions existantes ne synchronisent pas le skeleton avec le rendu réel final.

- Pourquoi ça mérite d’exister maintenant:
  - Les apps React modernes misent fortement sur l’UX perçue.
  - Le CLS (layout shift) est devenu un vrai problème visible.
  - Les data-fetchers (SWR, react-query) n’adressent pas le rendu visuel.

## 2. Objectif & fin claire

- Objectif concret recherché:
  - Fournir un skeleton qui garde exactement le layout final du composant.
  - Synchroniser automatiquement le nombre de skeletons avec les données réelles pour les listes.

- Le projet est considéré comme terminé quand:
  - Un composant `SmartSkeleton` unique existe.
  - Il supporte un mode simple et un mode liste.
  - Le nombre d’items d’une liste est persisté automatiquement via `localStorage`.
  - Aucun DOM read ni auto-measure n’est utilisé.

## 3. Périmètre

Ce que le projet fait volontairement, et ce qu’il ne fera pas.

- Inclus:
  - Skeleton par masquage CSS du composant réel.
  - Répétition automatique pour les listes.
  - Persistance automatique du count.
  - Warning dev pour mauvaises pratiques.

- Exclu:
  - Fetch de données.
  - Gestion du loading state.
  - Mesure du DOM ou analyse du layout.
  - Couplage à un UI kit ou data-fetcher.

## 4. Idée centrale

Le cœur de l’idée, sans parler d’implémentation.

- Principe clé:
  - Le skeleton n’est pas une imitation, c’est le composant réel rendu vide et masqué.

- Logique générale / règles importantes:
  - Même composant = même layout avant et après chargement.
  - Pour les listes, le nombre de skeletons doit refléter le dernier rendu réel connu.
  - La persistance est implicite mais contrôlée par le dev via une clé.

- Cible ou usage principal:
  - Applications React avec composants complexes et listes dynamiques.

## 5. Fonctionnement réel

Comment ça se passe concrètement.

- Entrées:
  - `loading: boolean`
  - `element: ReactElement` (composant de référence avec données vides)
  - `items?: any[]` (mode liste uniquement)
  - `storageKey?: string`
  - `defaultCount?: number`

- Transformation:
  - Application d’un mode CSS skeleton sur tout le subtree.
  - En mode liste:
    - lecture de `localStorage[storageKey]` si présent
    - fallback sur `defaultCount`
    - quand `loading === false`, écriture automatique de `items.length` en storage

- Sorties:
  - Un rendu skeleton visuellement identique au layout final.
  - Un rendu réel sans changement de taille ni structure.

- Exemple simple d’usage:
  - Une page catalogue affiche 42 produits.
  - La première visite montre 3 skeletons.
  - Le nombre 42 est sauvegardé.
  - La visite suivante affiche directement 42 skeletons.

## 6. Contenu attendu (MVP)

Le minimum nécessaire pour que le projet soit “utile”.

- Élément 1:
  - Composant `SmartSkeleton` supportant mode simple et mode list.

- Élément 2:
  - Mode CSS skeleton (texte masqué, surfaces grises, shimmer optionnel).

- Élément 3:
  - Persistance automatique du count en `localStorage`.

- Limite volontaire du MVP:
  - Pas de presets UI kit.
  - Pas de thème avancé.
  - Pas de SSR-specific logic.

## 7. Évolutions possibles (hors MVP)

Ce que le projet pourrait devenir, sans engagement.

- Fonctionnalités envisagées:
  - Presets CSS pour AntDesign, MUI, Chakra.
  - Animation configurable (shimmer, pulse, none).
  - Storage custom (sessionStorage, memory).

- Variantes ou extensions possibles:
  - Support d’un cache global par page.
  - Outils dev pour visualiser les counts persistés.

- Ce que ça apporterait de plus:
  - Intégration plus rapide dans des stacks existantes.
  - Meilleure cohérence visuelle cross-app.

## 8. Contraintes

Règles non négociables.

- Type de projet:
  - Librairie React UI, agnostique.

- Contraintes techniques ou de format:
  - Aucun DOM read.
  - Aucun effet de bord caché.
  - API déclarative et explicite.

- Contraintes pratiques (temps, perf, taille, coût):
  - Bundle léger.
  - Coût runtime négligeable.
  - Warnings uniquement en mode dev.

## 9. Notes

- Décisions importantes prises:
  - Le count est toujours déduit de `items.length`.
  - La persistance est automatique mais opt-in via `storageKey`.
  - Les collisions de clés génèrent un warning, pas une erreur.

- Idées futures possibles:
  - Documentation orientée UX plutôt que technique.
  - Playground visuel.

- Liens ou références utiles:
  - CLS (Cumulative Layout Shift)
  - Skeleton loading patterns