# QUORUM Stage 17 Master Remediation — QUORUM Fold Operator

**PARTIAL requirements in this stage:** 13

## Engineering focus

formal Fold Operator domain/codomain, continuity/boundedness, inverse targeting, composition/versioning and frontier/archive classes.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/tests/`

## Stage workflow

1. Freeze stage-specific baseline state, tests, requirement statuses, and canonical digests.
2. Convert each PARTIAL requirement into an explicit semantic assertion and direct executable evidence contract.
3. Extend the implementation rather than only the documentation when current fidelity is insufficient.
4. Add deterministic positive, boundary, negative, property, replay/recovery, and resource tests applicable to the stage.
5. Use requirement IDs in test output and the evidence registry so status can be derived mechanically.
6. Run the stage in isolation, then in integrated world scenarios, then with all prior stages.
7. Execute worker/fabric, rendering/physics, scale/soak, or production qualification when the exact requirement calls for it.
8. Preserve every existing OPERATIONAL requirement and canonical invariant.
9. Emit per-requirement receipts and stage summary with evidence hashes.
10. Promote only requirements whose exact acceptance predicates pass.

## Requirements in this stage

- `RCPW-17-R01` — F_P(W_C)=W_P has explicit domain, codomain, parameters, and reference authority.
- `RCPW-17-R03` — Visible-domain components are continuous and bounded.
- `RCPW-17-R04` — Lossy presentation components are explicitly identified and never treated as canonical inverse authority.
- `RCPW-17-R05` — Changing reference points does not alter canonical world identity.
- `RCPW-17-R06` — Singularities and unsupported domains are explicit and fail closed.
- `RCPW-17-R08` — Interaction targeting round-trips to one canonical entity or fails explicitly; ambiguous aliases are forbidden.
- `RCPW-17-R09` — The near-field identity transform has measurable error bounds approaching numerical precision.
- `RCPW-17-R10` — Operator composition order is fixed and verified; reordering operators requires a versioned migration.
- `RCPW-17-R15` — Fold-operator implementation exposes a canonical targeting service shared by interaction, navigation, audio landmarks, and debug tooling.
- `RCPW-17-R19` — Qualification includes randomized reference paths, moving landmarks, topology changes, portal crossings, and extreme entity density near fold horizons.
- `RCPW-17-R20` — Fold-operator policy is distributed as immutable versioned configuration so all workers evaluating one canonical epoch use the same operator version.
- `RCPW-17-R22` — Canonical targeting never depends on which worker produced the visible representation.
- `RCPW-17-R24` — Operator qualification includes heterogeneous workload placement, worker restart, policy rollback, and deterministic seam reconstruction.
