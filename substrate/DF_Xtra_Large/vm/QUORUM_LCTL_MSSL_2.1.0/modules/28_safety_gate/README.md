# 28. Safety Gate — QUORUM LCTL/MSSL Reimagination

**Plane:** `security_authorization`  
**Semantic authority:** `authority/module.mssl`  
**Execution plan:** `execution/module.lctlc`  
**Legacy evidence:** `evidence/legacy_map.json`

## Reimagined role

Seven independent JA Security Policy Language scripts for AST, lint, archive, path, execution, network, and output validation.

The MSSL document is the sealed declarative contract for this suite. The Columned LCTL plan is the compact execution-facing contract and is only authoritative after lowering to canonical LCTL and passing the supplied canonical verifier. The original repository sources are retained under `legacy/source_repository/` for traceability and differential testing.

## Qualification boundary

This package proves repository structure, MSSL seal integrity, LCTL-C lowering, and canonical LCTL verification for the generated execution skeleton. It does **not** claim behavioral equivalence between every legacy JA/DeepML artifact and the new dual-language contract until suite-specific behavioral fixtures are supplied and pass.
