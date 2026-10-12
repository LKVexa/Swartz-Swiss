# JA21 JAXD UI/UX Experience Design Language Suite 1.0.0 — Compact Edition

A standalone, air-gap-safe publication of JA Experience Design Language 0.1.0, repackaged below 25 MB without changing the technical corpus, script pack, textbook, specifications, or validation evidence.

## Core products

- 10,000-record normalized technical corpus
- 1,000 source-faithful `.jxd` programs
- 22-chapter technical textbook
- Twelve-week curriculum, workbook, and instructor guide
- Grammar, language specification, compiler/runtime contracts, semantic operators, R12/MCRT profile, conformance cases, certification framework, starter project, offline tools, and source preservation

## Compact-edition policy

The extracted canonical v0.1.0 source package remains included. The redundant nested copy of the original uploaded ZIP and a generated Python bytecode cache were removed solely to reduce archive size. The original upload SHA-256 remains documented in `PROVENANCE.md`.

## Corpus identity

- 40 features, 250 records each
- Ten proficiency levels, 1,000 records each
- Ten validation classes
- Canonical header: `ja experience.design 0.1`
- Canonical extension: `.jxd`

## Evidence boundary

The corpus contains modeled semantic, compiler, runtime, R12, and MCRT outcomes. The bundled bootstrap compiler was independently run against all 1,000 curated scripts and accepted 959 while rejecting 41. Agreement with corpus expected status was 816/1000; the 184 disagreements are preserved in `catalogs/BOOTSTRAP_COMPILER_AUDIT.csv` and primarily reflect modeled negative/security classifications that are not encoded as structural source mutations.

No production renderer or native JAXD runtime was supplied or executed.
