# Benchmarks de performance

Ce dossier documente les benchmarks de performance pour les composants UI.

## Commandes

```bash
pnpm run bench
```

Baseline locale (stockee en `.benchmarks/`, ignoree par Git) :

```bash
pnpm run bench:baseline
```

Comparer a la baseline locale :

```bash
pnpm run bench:compare
```

## Structure

- Les benchmarks sont dans `src/perf/**/*.bench.tsx`.
- Chaque bench utilise React Profiler pour mesurer les temps de rendu.
