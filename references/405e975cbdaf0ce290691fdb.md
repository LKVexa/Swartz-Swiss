# QUORUM Stage 15 Master Remediation — High-Speed Traversal Fold / Unfold

**PARTIAL requirements in this stage:** 18

## Engineering focus

route-aware high-speed fold/unfold, teleport staging, backpressure, moving phenomena, transport and overload recovery.

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

- `RCPW-15-R04` — Teleportation has a deterministic destination-staging protocol.
- `RCPW-15-R05` — Missed prewarm deadlines degrade presentation safely.
- `RCPW-15-R06` — High-speed traversal remains within declared frame, memory, and I/O budgets.
- `RCPW-15-R07` — Traversal prediction has bounded speculation windows and backpressure.
- `RCPW-15-R09` — Teleport destination staging validates canonical time, occupancy, collision, and active mission constraints.
- `RCPW-15-R11` — High-speed traversal predicts movement and camera look-ahead separately to reduce over-prefetch and preserve directional uncertainty.
- `RCPW-15-R12` — Transport networks, tunnels, bridges, portals, and interiors receive route-aware prewarm rather than distance-only prewarm.
- `RCPW-15-R14` — Emergency degradation exposes a measurable recovery path back to target fidelity after overload ends.
- `RCPW-15-R15` — High-speed traversal integrates route-aware prediction from canonical navigation graphs, not only velocity extrapolation.
- `RCPW-15-R17` — Traversal prewarm treats portals, tunnels, bridges, stations, dense settlements, and scripted/event barriers as high-cost milestones.
- `RCPW-15-R18` — Backpressure can reduce speculative look-ahead without delaying canonical transport or world time.
- `RCPW-15-R19` — Qualification covers mounts, fast ground transport, rail-like transport, vertical transport, portal travel, teleportation, and rapid reference switching.
- `RCPW-15-R21` — Route milestones carry predicted arrival windows and priority classes for deterministic cross-worker prewarm.
- `RCPW-15-R22` — Transport/reference wells can migrate execution ownership ahead of the player while preserving canonical route phase and passenger state.
- `RCPW-15-R23` — Speculative prewarm is cancellable and resource-bounded; canonical simulation never waits on cosmetic asset fetch.
- `RCPW-15-R24` — Traversal qualification includes cross-partition rail/road/portal travel, worker migration, packet/message delay simulation, and sudden direction reversal.
- `RCPW-15-R25` — High-speed traversal into newly generated or long-archived regions triggers semantic validation/rehydration ahead of ordinary visual prewarm.
- `RCPW-15-R27` — Long-distance transport remains governed by canonical route history, including routes built, destroyed, abandoned, or restored across eras.
