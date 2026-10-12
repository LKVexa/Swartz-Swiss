# JA21 DeepML Animation VFX Language Suite 1.0.0

> A standalone, air-gapped, code-first language suite for particles, fields, fluids, cloth, destruction, shaders, materials, lighting, render graphs, caches, compositing, and Smithson 8S Coupled Mechanics.

## Suite at a glance

| Asset | Contents |
|---|---:|
| Normalized technical corpus | 10,000 records |
| Curated script pack | 1,000 `.deepml` files |
| Positive scripts | 850 |
| Negative diagnostic scripts | 85 |
| Certification scripts | 65 |
| Textbook | 18 chapters + appendices |
| Original source reconstruction | 102 files |
| Network requirement | None |

## Start here

1. Open `SUITE_CATALOG.md`, then read `textbook/DEEPML_VFX_TEXTBOOK.md`.
2. Open `script_pack_1000/catalog.csv` and filter by topic or class.
3. Copy a script from the relevant category into `starter_project`.
4. Run `python tools/validate_suite.py` to verify package integrity.
5. Use `corpus/technical/deepml_vfx_technical_corpus_10000.jsonl.gz` for training, retrieval, or analysis.

## Architecture

```text
corpus/             normalized 10,000-record technical corpus
script_pack_1000/   curated source examples and catalogs
textbook/           textbook, workbook, and instructor guide
language_reference/ suite specification, topics, semantic operators
grammar/            EBNF and grammar specification
compiler/           compiler and MCRT contracts
runtime/            runtime contract
tests/              conformance and coverage expectations
curriculum/         learning modules and course map
starter_project/    editable starting project
tools/              offline inspection and validation utilities
reference_source/   reconstructed source corpus and preserved source upload
governance/         editorial and engineering charter
```

## Design principles

- **Semantic before visual:** preserve language meaning independently from rendered appearance.
- **Deterministic by default:** stable seeds, ordering, IDs, hashes, and replay evidence.
- **Air-gapped:** no network access is required or admitted by the reference policy.
- **Evidence-bearing compilation:** AST, diagnostics, R12, MCRT, provenance, and expected runtime stage remain traceable.
- **Projection discipline:** 8S latent geometry, product-state separation, visible projection, and semantic distance remain independent measurements.
- **Path-safe publication:** compact folders and filenames reduce Windows path-length failures.

## Publication roles

SOPHIA governs semantic integrity; CHARLOTTE governs structure and discoverability; LANDON governs compiler/runtime validation; Professor governs pedagogy; Podium governs release presentation.
