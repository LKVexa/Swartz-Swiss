# 54. Local Model Provider and Health — QUORUM LCTL/MSSL Reimagination

**Plane:** `model_compute`  
**Semantic authority:** `authority/module.mssl`  
**Execution plan:** `execution/module.lctlc`  
**Legacy evidence:** `evidence/legacy_map.json`

## Reimagined role

Eight independent JA Service and Protocol Language scripts define the approved, local-only model-provider boundary and its routing, lifecycle, readiness, health, contract, dashboard, and reconciliation behavior.

The MSSL document is the sealed declarative contract for this suite. The Columned LCTL plan is the compact execution-facing contract and is only authoritative after lowering to canonical LCTL and passing the supplied canonical verifier. The original repository sources are retained under `legacy/source_repository/` for traceability and differential testing.

## Qualification boundary

This package proves repository structure, MSSL seal integrity, LCTL-C lowering, and canonical LCTL verification for the generated execution skeleton. It does **not** claim behavioral equivalence between every legacy JA/DeepML artifact and the new dual-language contract until suite-specific behavioral fixtures are supplied and pass.
