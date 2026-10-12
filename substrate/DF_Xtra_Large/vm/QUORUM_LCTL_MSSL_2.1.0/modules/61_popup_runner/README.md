# 61. Popup Runner — QUORUM LCTL/MSSL Reimagination

**Plane:** `interfaces_services`  
**Semantic authority:** `authority/module.mssl`  
**Execution plan:** `execution/module.lctlc`  
**Legacy evidence:** `evidence/legacy_map.json`

## Reimagined role

Seven independent JA Interface Language scripts define a focused desktop launch surface for approved jobs. The popup exposes selection, typed parameters, policy preview, confirmation, bounded output, results, and recovery without exposing an unrestricted shell, command line, executable picker, or arbitrary working-directory control.

The MSSL document is the sealed declarative contract for this suite. The Columned LCTL plan is the compact execution-facing contract and is only authoritative after lowering to canonical LCTL and passing the supplied canonical verifier. The original repository sources are retained under `legacy/source_repository/` for traceability and differential testing.

## Qualification boundary

This package proves repository structure, MSSL seal integrity, LCTL-C lowering, and canonical LCTL verification for the generated execution skeleton. It does **not** claim behavioral equivalence between every legacy JA/DeepML artifact and the new dual-language contract until suite-specific behavioral fixtures are supplied and pass.
