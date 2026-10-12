# JA21 JA Operations Language Suite 1.0.0

## Reproducible builds, governed deployment, reliable recovery

This release turns the uploaded JA Operations Language corpus into a standalone, air-gap-safe language product. It preserves all 10,000 source-linked technical records and adds a curated 1,000-program laboratory library, a 22-chapter textbook, education materials, specifications, contracts, conformance assets, offline tools, publication guidance, source preservation, and integrity evidence.

## Primary products

1. **Technical corpus** — `corpus/technical/JA21_JAOPS_TECHNICAL_CORPUS_10000.jsonl.gz`
2. **1,000-script pack** — `scripts/` with `catalogs/SCRIPT_CATALOG.csv`
3. **Textbook** — `textbook/JA21_JA_OPERATIONS_LANGUAGE_TEXTBOOK.md`

## Corpus profile

- 10,000 records
- 32 operations features
- 10 proficiency levels
- 10 validation classes
- 7,500 expected-pass records
- 2,500 expected-fail records
- 10,000 verified source hashes

## Curated script profile

- 1,000 `.jaops` programs
- 100 programs per proficiency level
- Positive 400; negative 150; boundary 100; integration 100; security 75; performance 50; determinism 50; interoperability 25; recovery 25; certification 25
- All 32 features represented
- Exact source linkage through record ID and SHA-256

## Five analytical roles

- **SOPHIA** — semantic and systemic coherence
- **CHARLOTTE** — operational information architecture and usability
- **LANDON** — compiler, executor, scheduler, platform, and recovery feasibility
- **Professor** — pedagogy, counterexamples, and proof obligations
- **Podium** — publication, release, integrity, and certification readiness

The roles organize review guidance. They are not inserted into language source.

## Evidence boundary

The source corpus models compiler and runtime expectations and states that no production compiler was available. This suite preserves that boundary. It does not claim native parsing, compilation, deployment, installation, runtime execution, rollback, or certification. The validator checks package structure, counts, hashes, source fidelity, required declarations, brace balance, catalog consistency, feature coverage, and textbook structure.

## Offline validation

```text
python tools/validate_suite.py .
python tools/inspect_corpus.py corpus/technical/JA21_JAOPS_TECHNICAL_CORPUS_10000.jsonl.gz --feature rollback_rule
```

Both tools use only the Python standard library.
