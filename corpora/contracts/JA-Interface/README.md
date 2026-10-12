# JA21 JA Interface Language Suite 1.0.0

## Typed surfaces, governed interaction, deterministic targets

This release turns the uploaded JA Interface Language corpus into a standalone,
air-gap-safe language product. It preserves all 10,000 source-linked technical
records and adds a curated 1,000-program laboratory library, a 22-chapter textbook,
education materials, specifications, contracts, conformance assets, offline tools,
publication guidance, source preservation, and integrity evidence.

## Primary products

1. **Technical corpus** — `corpus/technical/JA21_JAUI_TECHNICAL_CORPUS_10000.jsonl.gz`
2. **1,000-script pack** — `scripts/` with `catalogs/SCRIPT_CATALOG.csv`
3. **Textbook** — `textbook/JA21_JA_INTERFACE_LANGUAGE_TEXTBOOK.md`

## Corpus profile

- 10,000 records
- 32 interface features
- 10 proficiency levels
- 10 validation classes
- 7,500 expected-pass records
- 2,500 expected-fail records
- 10,000 verified source hashes

## Curated script profile

- 1,000 `.jaui` programs
- 100 programs per proficiency level
- Positive 400; negative 150; boundary 100; integration 100; security 75;
  performance 50; determinism 50; interoperability 25; recovery 25; certification 25
- All 32 features represented
- Exact source linkage through record ID and SHA-256

## Five analytical roles

- **SOPHIA** — semantic and systemic coherence
- **CHARLOTTE** — information architecture, usability, and accessibility
- **LANDON** — compiler, runtime, target, and operational feasibility
- **Professor** — pedagogy, counterexamples, and proof obligations
- **Podium** — publication, release, integrity, and certification readiness

These roles organize review guidance. They are not inserted into the language source.

## Evidence boundary

The source corpus explicitly models compiler and runtime expectations and states that
no production compiler was available. This suite preserves that boundary. It does not
claim native parsing, compilation, rendering, target lowering, runtime execution, or
certification. The included validator checks package structure, counts, hashes,
source fidelity, required declarations, brace balance, catalog consistency, feature
coverage, and textbook structure.

## Start here

- `SUITE_CATALOG.md`
- `corpus/technical/TECHNICAL_CORPUS_GUIDE.md`
- `catalogs/FEATURE_ATLAS.md`
- `catalogs/INTERFACE_ARCHITECTURE.md`
- `textbook/JA21_JA_INTERFACE_LANGUAGE_TEXTBOOK.md`
- `education/12_WEEK_CURRICULUM.md`
- `specification/LANGUAGE_SPECIFICATION.md`
- `VALIDATION_REPORT.md`

## Offline validation

```text
python tools/validate_suite.py .
python tools/inspect_corpus.py corpus/technical/JA21_JAUI_TECHNICAL_CORPUS_10000.jsonl.gz --feature accessibility
```

Both tools use only the Python standard library.
