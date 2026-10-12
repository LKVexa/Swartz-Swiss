# QUORUM Stage 02 Master Remediation — Reference Frame Authority

**PARTIAL requirements in this stage:** 21

## Engineering focus

canonical↔reference transforms, precision, atomic frame updates, moving/nested frames and consumer separation.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/tests/test_world_runtime.py`

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

- `RCPW-02-R01` — Canonical↔reference transforms are explicit, deterministic, bounded, and round-trip tested.
- `RCPW-02-R04` — Precision error remains below declared limits at all supported canonical distances.
- `RCPW-02-R05` — Physics, rendering, audio, navigation, and interaction consume reference state without becoming canonical authority.
- `RCPW-02-R06` — Reference state can be discarded and reconstructed entirely from canonical truth plus current reference selection.
- `RCPW-02-R07` — Reference-frame updates are atomic with respect to physics/render/navigation consumers for each simulation tick.
- `RCPW-02-R09` — Reference switches preserve momentum/orientation semantics and do not create one-frame spatial discontinuities.
- `RCPW-02-R10` — A deterministic trace can reconstruct every origin rebase and reference handoff.
- `RCPW-02-R11` — Reference-frame motion preserves camera, animation, locomotion, projectile, and vehicle continuity across origin rebases.
- `RCPW-02-R12` — Reference transforms expose stable previous/current transforms suitable for temporal rendering and motion-vector reconstruction.
- `RCPW-02-R14` — Reference-frame diagnostics expose rebase frequency, maximum observed transform error, and all continuity violations.
- `RCPW-02-R17` — Camera-relative, actor-relative, vehicle-relative, and world-relative transforms are separately typed so accidental frame mixing is rejected.
- `RCPW-02-R18` — Reference-frame handoff across portals, moving platforms, and transport vehicles preserves velocity and interaction continuity according to declared frame semantics.
- `RCPW-02-R19` — Reference diagnostics provide deterministic transform traces sufficient to reproduce any visible discontinuity.
- `RCPW-02-R20` — Reference frames remain deterministic when their source entities are simulated on different execution partitions or worker lanes.
- `RCPW-02-R21` — Nested moving frames carry explicit tick/epoch stamps so stale frame transforms are rejected rather than interpolated as current truth.
- `RCPW-02-R22` — Reference-frame consumers can recover after worker/partition restart from canonical state plus deterministic scheduler history.
- `RCPW-02-R23` — Rebasing is coordinated with temporal render history, physics broadphase state, navigation caches, audio spatialization, and interaction targeting through explicit invalidation contracts.
- `RCPW-02-R24` — Reference qualification includes adversarial handoff during partition migration, checkpointing, high-speed travel, and nested moving-frame transitions.
- `RCPW-02-R26` — Reference transforms support astronomical/planetary-scale coordinate magnitudes through declared precision-tier or hierarchical-coordinate policy without changing local interaction precision.
- `RCPW-02-R27` — Reference-local observations expose only information physically or narratively available to the observer rather than globally omniscient canonical state.
- `RCPW-02-R28` — Reference transitions between surface, interior, underground, elevated, or other world layers use explicit topology and gravity/frame semantics.
