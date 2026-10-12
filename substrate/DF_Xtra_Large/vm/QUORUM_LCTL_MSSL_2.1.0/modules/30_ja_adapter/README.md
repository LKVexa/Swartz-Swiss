# 30. JA Adapter — QUORUM LCTL/MSSL Reimagination

**Plane:** `translation_interop`  
**Semantic authority:** `authority/module.mssl`  
**Execution plan:** `execution/module.lctlc`  
**Legacy evidence:** `evidence/legacy_map.json`

## Reimagined role

Six independent JA Service and Protocol Language scripts that ingest, parse, normalize, and emit JA records for deterministic reconstruction, rendering, and storage workflows.

The MSSL document is the sealed declarative contract for this suite. The Columned LCTL plan is the compact execution-facing contract and is only authoritative after lowering to canonical LCTL and passing the supplied canonical verifier. The original repository sources are retained under `legacy/source_repository/` for traceability and differential testing.

## Qualification boundary

This package proves repository structure, MSSL seal integrity, LCTL-C lowering, and canonical LCTL verification for the generated execution skeleton. It does **not** claim behavioral equivalence between every legacy JA/DeepML artifact and the new dual-language contract until suite-specific behavioral fixtures are supplied and pass.
