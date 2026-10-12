# QUORUM Stage 08 Master Remediation — Civilization / Economy Authority

**PARTIAL requirements in this stage:** 16

## Engineering focus

settlement/economy authority, population aggregation, logistics, prices/inventory, law/crime and conservation-auditable flows.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/ecology_economy.mssl`
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

- `RCPW-08-R01` — Settlements retain authoritative economic and social state when outside local rendering range.
- `RCPW-08-R02` — Individual citizens and aggregate households/cohorts convert without duplicating or erasing population.
- `RCPW-08-R03` — Production, consumption, inventory, transport, scarcity, pricing, labor, migration, crime, and law have explicit state transitions.
- `RCPW-08-R04` — Remote shocks propagate causally through connected trade/transport networks.
- `RCPW-08-R05` — Aggregate history materializes into locally coherent inventories, prices, NPC schedules, prosperity/damage, law state, and migration.
- `RCPW-08-R06` — Economic abstraction error is measured against a smaller high-fidelity reference simulation.
- `RCPW-08-R08` — Transport latency and capacity remain canonical and are not shortened merely because geography is visually folded.
- `RCPW-08-R10` — Remote shocks include causal delay, substitution, and recovery rather than instantaneous global propagation.
- `RCPW-08-R11` — Settlement economies include explicit production chains, storage, transport dependency, labor allocation, demand substitution, and recovery after shocks.
- `RCPW-08-R12` — Law, reputation, faction control, crime, policing, and social response remain causally active outside the local render shell.
- `RCPW-08-R15` — Civilization/economy authority includes household, workplace, production-site, merchant, transport, and jurisdiction relationships in the canonical world graph.
- `RCPW-08-R16` — Economic transactions are double-entry or equivalently conservation-auditable for money/inventory/value flows where applicable.
- `RCPW-08-R22` — Economic worker restart cannot duplicate money, inventory, population, deliveries, or outstanding obligations.
- `RCPW-08-R24` — Economy scale qualification includes concurrent settlements, partition migration, route disruption, worker loss, recovery, and ledger reconciliation.
- `RCPW-08-R26` — Demographics include household formation/dissolution, migration, births/creations, deaths/retirement, occupation transfer, and role succession with conservation/accounting rules.
- `RCPW-08-R29` — Qualification includes multi-generation town growth/decline, migration waves, infrastructure change, route-network evolution, and economic continuity after archival/rehydration.
