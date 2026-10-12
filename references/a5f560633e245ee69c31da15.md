# QUORUM Stage 01 Master Remediation — Canonical World Authority

**PARTIAL requirements in this stage:** 11

## Engineering focus

canonical truth, schema/revision authority, transactional mutation, snapshots, content graph and recovery.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/world_core.mssl`
- `vm/world/compiler/world_compiler.py`
- `vm/world/spec/WORLD_RUNTIME.md`

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

- `RCPW-01-R05` — Derived rendering, physics, cache, and reference-space systems cannot mutate canonical truth outside declared APIs.
- `RCPW-01-R06` — Schema migration and rollback preserve identity and causal history across versions.
- `RCPW-01-R08` — Canonical state exposes monotonic revision/epoch numbers for stale-read and stale-write detection.
- `RCPW-01-R09` — World-state snapshots are quiescent or use a documented consistency algorithm that proves cross-component coherence.
- `RCPW-01-R10` — Canonical state recovery is tested across power-loss-equivalent interruption at every write boundary.
- `RCPW-01-R11` — Canonical world state includes a versioned spatial-semantic region graph linking regions, biomes, routes, waterways, settlements, interiors, landmarks, and jurisdictional domains.
- `RCPW-01-R14` — Partial-region availability, damaged content packs, and missing optional content fail without invalidating unrelated canonical regions.
- `RCPW-01-R17` — Canonical revisions distinguish world-content revision, runtime-state revision, schema revision, and simulation epoch.
- `RCPW-01-R18` — Canonical authority provides a content-addressed lookup path for immutable authored assets and a revisioned lookup path for mutable world state.
- `RCPW-01-R24` — A canonical-state verifier can validate identity uniqueness, topology closure, revision consistency, ledger correspondence, and partition ownership without rendering the world.
- `RCPW-01-R26` — Canonical world history distinguishes world age, era, content generation epoch, and simulation epoch so later synthesis cannot silently rewrite earlier truth.
