# 08. Tables — JA Data Language

This package contains six independent `.jad` scripts:

1. **Records** — typed, primary-keyed table records with explicit analytical and certification fields.
2. **Metrics** — metric names and role-separated numeric vectors for values, comparisons, observations, confidence, and scores.
3. **Schemas** — a versioned schema registry with meaning, shape, runtime binding, validation, and admission columns.
4. **Test matrices** — case-indexed inputs, expected values, observations, evidence, and verdicts.
5. **Ledgers** — sequence-indexed events with semantic identity, relations, runtime state, evidence hashes, and certification.
6. **Deterministic tabular outputs** — primary-keyed, single-shard output rows with replay and evidence columns.

## Suite roles

| Layer | Tabular responsibility |
|---|---|
| SOPHIA | Semantic meaning, source values, and test inputs |
| CHARLOTTE | Structure, comparison, projection, and expected values |
| LANDON | Runtime binding, observations, state, and replay |
| Professor | Evidence vectors, confidence, validation, and hashes |
| Podium | Status, verdict, admission, scoring, and certification |

## Corpus alignment

Every script follows the attached corpus pattern: `ja source 0.3`, `use Data`, `policy no_network`, typed schemas, local JSON datasets, validation, primary-key partitioning, filtered projections, lineage, a positive schema assertion, and deterministic JSON emission.

Single-shard partitioning and primary row identifiers provide the corpus-aligned basis for repeatable tabular output. A conforming JA Data Engine should retain stable source, AST, R12, and MCRT identities and must preserve lineage through projection or predicate optimization.

## Input files

Place the corresponding JSON input beside each script using the filename declared by its `dataset` block. The input objects must satisfy the script’s schema exactly.
