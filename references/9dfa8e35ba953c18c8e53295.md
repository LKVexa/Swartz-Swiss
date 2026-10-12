# QUORUM Stage 03 Master Remediation — Fold Geometry Authority

**PARTIAL requirements in this stage:** 7

## Engineering focus

fold continuity/topology, inverse targeting, singularity safety, route/structure semantics and frontier admission.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/spec/WORLD_RUNTIME.md`
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

- `RCPW-03-R05` — Roads, rivers, terrain, rail, navigation links, settlements, and long structures have declared fold semantics.
- `RCPW-03-R06` — Singularities, self-intersections, discontinuities, and invalid inverse regions are detected and fail safely.
- `RCPW-03-R07` — The fold transform is at least C1 continuous everywhere visible and C2 where camera/physics interpolation requires it.
- `RCPW-03-R09` — Collision, picking, navigation, audio propagation, and landmark targeting use explicit canonical/reference conversion rules.
- `RCPW-03-R13` — Picking, ray tests, interaction traces, projectile traces, and navigation targets always resolve to canonical objects through an unambiguous inverse mapping.
- `RCPW-03-R24` — Fold qualification includes partition-boundary traversal, policy hot-swap rollback, acceleration-structure rebuild, and worker-loss recovery.
- `RCPW-03-R27` — World expansion beyond the current horizon is admitted only through canonical world-generation transactions, never by render-time improvisation.
