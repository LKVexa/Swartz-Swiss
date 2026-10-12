# JA21 JA Test, Simulation, and Proof Language Suite 1.0.0

## Verification engineering, deterministic simulation, formal proof, and evidence

This release turns the uploaded JA Test, Simulation, and Proof Language corpus into a standalone, air-gap-safe language product. It preserves all 10,000 source-linked technical records and adds a curated 1,000-program laboratory library, a 22-chapter textbook, education materials, specifications, contracts, conformance assets, offline tools, publication guidance, source preservation, and integrity evidence.

## Primary products

1. `corpus/technical/JA21_JATP_TECHNICAL_CORPUS_10000.jsonl.gz`
2. `scripts/` and `catalogs/SCRIPT_CATALOG.csv`
3. `textbook/JA21_JA_TEST_SIMULATION_PROOF_LANGUAGE_TEXTBOOK.md`

## Corpus profile

- 10,000 records
- 32 verification features
- 10 proficiency levels
- 10 validation classes
- 7,500 expected-pass records
- 2,500 expected-fail records
- 10,000 verified source hashes

## Curated script profile

- 1,000 `.jap` programs
- 100 per proficiency level
- Exact 400/150/100/100/75/50/50/25/25/25 validation-class composition
- All 32 features represented

## Five analytical roles

- SOPHIA — semantic and systemic coherence
- CHARLOTTE — verification information architecture and diagnostic clarity
- LANDON — compiler, simulator, proof checker, runtime, sandbox, and replay feasibility
- Professor — pedagogy, counterexamples, and proof obligations
- Podium — publication, integrity, limitations, and certification

These roles organize review guidance and are not inserted into JA source programs.

## Evidence boundary

No production JA Test/Simulation/Proof compiler or runtime was supplied. This suite does not claim native parsing, simulation, proof checking, model checking, benchmarking, coverage collection, replay, or signing. Structural validation checks counts, hashes, source fidelity, declarations, balance, catalogs, feature coverage, textbook structure, paths, and package integrity.

```text
python tools/validate_suite.py .
python tools/inspect_corpus.py corpus/technical/JA21_JATP_TECHNICAL_CORPUS_10000.jsonl.gz --feature temporal_property
```
