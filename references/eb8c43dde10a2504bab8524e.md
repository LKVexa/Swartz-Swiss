# QUORUM Stage 06 Master Remediation — Causal Ledger Authority

**PARTIAL requirements in this stage:** 13

## Engineering focus

causal event schema, ordering, conflict resolution, compaction, replay, cycle control and forensic slices.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/persistence_ledger.mssl`
- `vm/world/qualification/headless_verify.py`
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

- `RCPW-06-R01` — Durable world mutations emit causally linked events with deterministic IDs.
- `RCPW-06-R02` — Events record time, actor/entity, canonical location, cause, pre-state/post-state references, authority level, seed, and dependencies.
- `RCPW-06-R04` — Conflicting concurrent mutations are detected and resolved by an explicit policy.
- `RCPW-06-R06` — Ephemeral telemetry is separated from durable causal history.
- `RCPW-06-R09` — Compaction/aggregation cannot sever causal parents required by live unresolved obligations.
- `RCPW-06-R11` — Causal graphs detect or explicitly model cycles and prevent accidental recursive event amplification.
- `RCPW-06-R14` — Debugging can produce a minimal causal slice showing why a selected entity or region reached its current authoritative state.
- `RCPW-06-R17` — Remote abstract resolutions record the model/version and fidelity class that produced the outcome.
- `RCPW-06-R21` — Event sequence/causal ordering remains reconstructible even when simulation work executes concurrently.
- `RCPW-06-R22` — Ledger replication or redundant persistence, where configured, uses explicit quorum/commit semantics and never treats an uncommitted replica as canonical.
- `RCPW-06-R26` — Historical compaction records uncertainty and aggregation class rather than presenting compressed history as exact event detail.
- `RCPW-06-R27` — Counterfactual/debug branches are isolated from canonical history and cannot leak mutations into the authoritative timeline.
- `RCPW-06-R28` — Causal queries can identify both direct causes and historically inherited causes across generational/organizational succession.
