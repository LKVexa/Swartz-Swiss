# JA21 Repository 02 — Anthology

This package contains four individual JA Data Language scripts generated from the attached coupling-mechanics corpus.

## Corpus-grounded language profile

- Profile: `ja.data`
- Extension: `.jad`
- Source declaration: `ja source 0.3`
- Attached corpus SHA-256: `587861f8ebb4d38470488e5c93b75c748ca2302c3f9038bfd26370b67868fb98`
- Parsed language records: `10,000`

The scripts remain within the corpus-demonstrated surface:

- `schema`
- `dataset`
- JSON input
- schema validation
- primary sequence fields
- single-shard partitioning
- `query`
- `lineage`
- `assert schema.valid == true`
- JSON emission
- `policy no_network`

## Individual scripts

1. `02_Anthology/01_anthology_chronology.jad`
2. `02_Anthology/02_anthology_immutable_provenance.jad`
3. `02_Anthology/03_anthology_prior_artifacts.jad`
4. `02_Anthology/04_anthology_ordered_experience_records.jad`

## Suite responsibilities

Each schema carries explicit fields for:

- **SOPHIA** — semantic judgment and completeness review.
- **CHARLOTTE** — structural and presentation validation.
- **LANDON** — repository indexing, preservation, cataloging, and integration actions.
- **Professor** — human-readable explanation without silent mutation.
- **Podium** — job and evidence identifiers for queued processing.

## Ordering model

The corpus does not demonstrate an executable `ORDER BY` clause. To avoid inventing syntax, chronology and experience ordering are modeled through a `Count primary` sequence field and `shards 1`. Consumers should preserve ascending primary sequence when serializing or displaying results.

## Provenance boundary

The immutable-provenance script defines an append-only provenance record shape with content and parent SHA-256 fields. The `.jad` source alone does not prove storage immutability or validate a cryptographic hash. Those guarantees require a JA Data runtime and append-only storage implementation.

## Input templates

The `input_templates` directory contains one-record JSON examples matching each script. Replace all example identifiers, timestamps, statuses, and zero hashes with real repository data.

## Validation status

All four files passed package-level structural checks against the demonstrated corpus syntax. They were not executed because no production-certified JA Data Language compiler/runtime was included with the attachment.
