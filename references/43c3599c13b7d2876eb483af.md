# QUORUM Stage 18 Master Remediation — Multiple Reference Points / Authority Wells

**PARTIAL requirements in this stage:** 17

## Engineering focus

multiple authority wells, deterministic arbitration, ownership, budgets, reservations, migration/recovery and autonomous world wells.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/authority_well_arbitration_remediation.mssl`
- `vm/world/authority/fabric.mssl`
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

- `RCPW-18-R02` — Overlapping wells never double-apply mutable world simulation.
- `RCPW-18-R04` — Wells can merge, split, migrate, expire, and hand off without state loss.
- `RCPW-18-R05` — Resource allocation across wells is bounded and starvation-aware.
- `RCPW-18-R06` — The model can extend to multiplayer semantics without requiring multiplayer implementation.
- `RCPW-18-R09` — Per-well budgets include reserve and eviction policy so one well cannot monopolize all simulation capacity.
- `RCPW-18-R10` — Well retirement drains or transfers unresolved obligations before deallocation.
- `RCPW-18-R12` — Conflicting observers of the same remote event receive causally consistent outcomes even if presentation fidelity differs.
- `RCPW-18-R14` — Speculative local work created for a temporary well is commit-gated or rollback-capable when the well expires or loses arbitration.
- `RCPW-18-R18` — Presentation-only observers cannot acquire canonical mutation authority by merely increasing priority.
- `RCPW-18-R21` — Authority wells may move between workers without ending the underlying canonical event or resetting simulation fidelity debt.
- `RCPW-18-R22` — Global reserve budgets protect canonical/event-barrier work when many wells compete.
- `RCPW-18-R23` — Well state is checkpointed and recoverable so worker loss does not silently dismiss remote high-priority events.
- `RCPW-18-R24` — Qualification includes large well counts, cross-worker overlap, event reservations, transport wells, recovery, and deterministic replay.
- `RCPW-18-R26` — Autonomous world wells have strict budgets, expiration/escalation rules, and cannot monopolize simulation indefinitely.
- `RCPW-18-R27` — Historical or generational events spanning many agents/regions use hierarchical wells or equivalent aggregation rather than materializing every participant.
- `RCPW-18-R28` — Well state survives era transition, archive/rehydration, repartition, and worker recovery when unresolved obligations remain.
- `RCPW-18-R29` — Qualification includes simultaneous autonomous world events, multi-generation succession, player-created wells, and deterministic arbitration across archival boundaries.
