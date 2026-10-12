# QUORUM Stage 13 Master Remediation — Reference-Centric World Shells

**PARTIAL requirements in this stage:** 11

## Engineering focus

adaptive S0–S8 shells, content-aware budgets, interiors, backpressure, worker distribution and historical rehydration cost.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/authority/resource_governor_remediation.mssl`
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

- `RCPW-13-R12` — Shell adaptation considers world-content complexity, expected interaction density, portal/interior proximity, and materialization backlog in addition to distance and speed.
- `RCPW-13-R13` — Nested interior/portal spaces have explicit shell ownership and do not accidentally inherit exterior fold distortion.
- `RCPW-13-R15` — Reference-centric shells are emitted from or validated against world-compiler metadata for content density, portal complexity, route complexity, and expected materialization cost.
- `RCPW-13-R16` — Shell policies reserve dedicated capacity for portals/interiors, moving transport, combat/event barriers, and recovery operations.
- `RCPW-13-R19` — Shell qualification includes dense city, sparse wilderness, underground/interior, transport corridor, and rapid oscillation profiles.
- `RCPW-13-R20` — World-shell scheduling can distribute shell/region workloads across workers while preserving one canonical shell/LOD decision trace.
- `RCPW-13-R21` — Adaptive shell controllers consume globally coherent budget/backlog telemetry rather than inconsistent worker-local estimates for promotion decisions.
- `RCPW-13-R23` — Shell saturation triggers deterministic admission/backpressure policies across workers.
- `RCPW-13-R24` — Qualification includes asymmetric worker capacity, worker loss, hot addition/removal of workers, and reference travel across migrated shell workloads.
- `RCPW-13-R27` — Shell controllers reserve capacity for semantic rehydration before visual asset hydration when returning to historically evolved regions.
- `RCPW-13-R28` — Long-horizon world processes may remain outside geometric shells but retain scheduled canonical updates according to world-evolution policy.
