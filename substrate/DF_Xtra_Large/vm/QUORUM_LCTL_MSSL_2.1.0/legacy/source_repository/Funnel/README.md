# 09. Funnel — JA Data Language

`09_funnel.jad` converts broad repository recall results into a compact, relevant, deduplicated working set.

## Processing contract

1. Load local recall results from `broad_repository_recall_results.json`.
2. Validate every row against `FunnelRecallRecord`.
3. Enforce one row per `canonical_id` through the primary-key schema contract.
4. Partition into one deterministic shard keyed by `canonical_id`.
5. Retain only rows with a non-null `podium_admission` value.
6. Project the admitted rows to the columns required by downstream work.
7. Preserve source-to-working-set lineage.
8. Emit the resulting working set as JSON.

## Suite roles

| Layer | Funnel responsibility |
|---|---|
| SOPHIA | Produces the semantic relevance vector |
| CHARLOTTE | Produces the canonical deduplication key |
| LANDON | Carries recall and retrieval metrics |
| Professor | Carries provenance and evidence vectors |
| Podium | Admits relevant rows to the final working set |

## Deduplication rule

The attached corpus does not define a source-level `distinct` operator. Funnel therefore uses the corpus-native primary-key validation rule: upstream recall must assign the same `canonical_id` to equivalent results, and duplicate canonical IDs fail schema validation instead of silently surviving into the working set.

## Determinism

The module uses no network access, a primary canonical identifier, a single shard, a fixed predicate, a fixed projection, and explicit lineage. A conforming JA Data Engine should retain stable AST, R12, and MCRT identities while applying predicate pushdown or projection pruning.
