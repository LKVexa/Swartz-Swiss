
# JA21 DeepML Core Language Suite 1.0.0

A standalone, publication-grade suite for the **DeepML Core 0.3** portion of JA21.

## Primary deliverables

- **Technical corpus:** 10,000 normalized records, twenty navigable shards, schema, and full index.
- **1,000-script example pack:** source-faithful `.deepml` programs covering every topic, tier, class, and all 139 certification records.
- **Technical textbook:** 22 chapters with corpus-derived programs, laboratories, review questions, implementation checklists, and a standalone-toolchain capstone.

## Full suite

The release also includes a twelve-week curriculum, student workbook, instructor guide, topic atlas, grammar, language specification, compiler and runtime contracts, semantic operators, R12/MCRT schema, conformance cases, starter project, original reconstructed source assets, offline inspection and validation tools, release notes, governance charter, manifests, and validation evidence.

## Corpus profile

| Measure | Value |
|---|---:|
| Technical records | 10,000 |
| Topics | 48 |
| Tiers | 6 |
| Positive | 7,875 |
| Negative | 1,986 |
| Certification | 139 |
| Curated scripts | 1,000 |

## Start here

1. Read `SUITE_CATALOG.md`.
2. Open `textbook/JA21_DEEPML_CORE_LANGUAGE_TEXTBOOK.md`.
3. Browse `catalogs/SCRIPT_CATALOG.csv` and `script_pack_1000/`.
4. Inspect `corpus/technical/TECHNICAL_CORPUS_GUIDE.md`.
5. Run `python tools/validate_suite.py` from the suite root.

## Evidence boundary

The suite validates structure, identity, source hashes, policies, catalogs, and package integrity. No native DeepML Core compiler/runtime executable was included in the attachment, so native compilation and device execution are not claimed.
