# JA21 Repository 03 — Atlas

This package contains six individual JA Data Language scripts generated from the attached JA Data Language coupling-mechanics corpus.

## Corpus-grounded profile

- Language profile: `ja.data`
- File extension: `.jad`
- Source declaration: `ja source 0.3`
- Parsed language records: `10,000`
- Attached corpus SHA-256: `587861f8ebb4d38470488e5c93b75c748ca2302c3f9038bfd26370b67868fb98`

The scripts remain within the demonstrated JA Data Language surface:

- `schema`
- JSON-backed `dataset`
- `validate`
- primary sequence fields
- one-shard canonical partitioning
- `query`
- `lineage`
- `assert schema.valid == true`
- `emit json`
- `policy no_network`

## Individual scripts

1. `03_Atlas/01_atlas_entities.jad`
2. `03_Atlas/02_atlas_domains.jad`
3. `03_Atlas/03_atlas_files.jad`
4. `03_Atlas/04_atlas_feature_spaces.jad`
5. `03_Atlas/05_atlas_project_structure.jad`
6. `03_Atlas/06_atlas_coordinates.jad`

## Suite responsibilities

Every schema includes explicit fields for:

- **SOPHIA** — semantic judgment, completeness, and acceptance state.
- **CHARLOTTE** — structural, schema, and presentation validation.
- **LANDON** — repository indexing, cataloging, preservation, and integration actions.
- **Professor** — reviewable human-readable explanation without silent mutation.
- **Podium** — job and evidence identifiers for queued processing and audit.

## Design boundaries

- Repository ordering is represented through a `Count primary` sequence and `shards 1`; no unsupported `ORDER BY` form was invented.
- File and provenance hashes are modeled as text fields. Cryptographic correctness requires runtime-side validation.
- Coordinates support Cartesian and geographic fields in one record shape. Cross-field coordinate rules require runtime or policy validation beyond `assert schema.valid == true`.
- Project structure is represented as parent-linked nodes with explicit depth; cycle detection requires an implementation layer.

## Input templates

The `input_templates` directory contains one JSON example for each script. Replace all example identifiers, timestamps, values, statuses, and zero hashes before execution.

## Validation status

All six `.jad` files passed package-level structural checks against the corpus-demonstrated syntax. Runtime execution was not performed because the attachment did not include a production-certified JA Data Language compiler/runtime.
