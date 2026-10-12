# QUORUM Stage 09 Master Remediation — Narrative Gravity Authority

**PARTIAL requirements in this stage:** 21

## Engineering focus

narrative gravity, reservations, bounded priority, event orchestration, knowledge-locality and canonical-fact separation.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/agents_narrative.mssl`
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

- `RCPW-09-R02` — Narrative significance changes priority, update frequency, and representation only within bounded resource policy.
- `RCPW-09-R04` — Narrative gravity decays or transitions according to explicit lifecycle rules.
- `RCPW-09-R05` — Narrative gravity cannot mutate canonical story truth by itself.
- `RCPW-09-R06` — Priority manipulation and starvation attacks are bounded and testable.
- `RCPW-09-R07` — Narrative gravity is signed/typed so urgency, relevance, threat, and authored importance are distinguishable.
- `RCPW-09-R08` — Priority escalation has hard caps and reserve budgets for non-narrative systemic simulation.
- `RCPW-09-R10` — No narrative-gravity rule may fabricate outcomes for events that require canonical simulation evidence.
- `RCPW-09-R11` — Narrative gravity integrates with an event-orchestration authority that distinguishes authored beats, systemic events, optional encounters, and emergent consequences.
- `RCPW-09-R12` — Off-screen event resolution declares whether the outcome was fully simulated, abstractly resolved, deferred, or blocked awaiting higher fidelity.
- `RCPW-09-R13` — Narrative priority cannot violate canonical travel time, ownership, death, destruction, or other established causal facts without an explicit authored override event.
- `RCPW-09-R14` — Competing narrative wells use deterministic arbitration and expose why one event received higher simulation authority.
- `RCPW-09-R15` — Narrative gravity consumes explicit story/event metadata but does not own canonical facts such as death, travel, inventory, location, or destruction.
- `RCPW-09-R16` — Narrative authority supports event reservation so two authored/systemic events cannot simultaneously claim an exclusive actor/resource without arbitration.
- `RCPW-09-R17` — Story/event conditions are evaluated against canonical state and ledger history rather than render presence.
- `RCPW-09-R18` — Deferred narrative events carry expiration, escalation, and fallback semantics so off-screen blocking cannot deadlock the world.
- `RCPW-09-R20` — Narrative reservations and authority wells are globally arbitrated even when actors/events are simulated on different workers.
- `RCPW-09-R21` — Exclusive actor/resource reservations use deterministic conflict resolution and survive partition migration/recovery.
- `RCPW-09-R22` — Narrative state read from a lagging partition is revision-checked before committing canonical story consequences.
- `RCPW-09-R23` — Authored live-content updates cannot rewrite completed canonical history unless delivered as explicit versioned migration/retcon events.
- `RCPW-09-R24` — Narrative qualification includes hot content patch, worker restart, competing reservations, long off-screen deferral, and rollback.
- `RCPW-09-R25` — Narrative gravity distinguishes world-history significance from immediate player-story relevance so historically important remote changes may remain durable without consuming high local fidelity indefinitely.
