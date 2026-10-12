# QUORUM Stage 04 Master Remediation — Simulation LOD Authority

**PARTIAL requirements in this stage:** 17

## Engineering focus

LOD representation ladders, promotion/demotion conservation, hysteresis, timing integration, debt and overload governance.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/agents_narrative.mssl`
- `vm/world/spec/RESOURCE_BUDGETS.md`
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

- `RCPW-04-R01` — Every persistent entity class has a declared simulation representation ladder.
- `RCPW-04-R02` — Promotion/demotion preserves identity, causal obligations, and gameplay-significant state.
- `RCPW-04-R03` — Hysteresis prevents transition thrashing.
- `RCPW-04-R05` — Resource exhaustion degrades fidelity without silently erasing authoritative state.
- `RCPW-04-R08` — Update cadence changes preserve time integration and do not create energy/state jumps when promoted.
- `RCPW-04-R10` — Mass promotion storms are rate-limited without erasing unresolved authoritative obligations.
- `RCPW-04-R12` — Remote AI schedule, intent, movement, and social-state integration account for elapsed canonical time when update cadence changes.
- `RCPW-04-R13` — Promotion debt is tracked so repeatedly deferred high-value entities receive bounded service without creating an uncontrolled promotion storm.
- `RCPW-04-R14` — LOD approximation error is measured per subsystem and incorporated into qualification rather than treated as visually acceptable by default.
- `RCPW-04-R15` — Simulation LOD authority defines subsystem-specific fidelity contracts for AI, ecology, economy, weather, navigation, combat, transport, and narrative events.
- `RCPW-04-R18` — Approximation debt is accumulated and repaid when an entity or region returns to higher fidelity, with bounded reconciliation work.
- `RCPW-04-R23` — Approximation debt and promotion debt survive worker restart, checkpoint/recovery, and partition migration.
- `RCPW-04-R25` — Simulation LOD includes ultra-long-horizon demographic, institutional, ecological, economic, and infrastructure representations for generational world evolution.
- `RCPW-04-R26` — Long-horizon abstraction cannot resolve events whose outcome depends on unknown player-local information or unresolved high-fidelity barriers.
- `RCPW-04-R27` — LOD models expose temporal validity windows so coarse long-horizon predictions are invalidated/recomputed when canonical shocks exceed assumptions.
- `RCPW-04-R28` — Approximation debt includes historical uncertainty and is reduced through re-simulation or evidence-backed reconstruction when a region becomes relevant again.
- `RCPW-04-R29` — Qualification compares short-step and long-horizon simulations over selected reference regions to quantify drift and acceptable semantic error.
