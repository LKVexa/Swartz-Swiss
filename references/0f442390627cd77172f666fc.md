# QUORUM Stage 20 Master Remediation — Core Architecture + System Invariants

**PARTIAL requirements in this stage:** 17

## Engineering focus

integrated service graph, scheduler/resource authority, compiler/runtime ABI, release qualification, Golden Worlds and end-to-end invariants.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/source_authority.mssl`
- `vm/world/authority/fabric.mssl`
- `vm/world/qualification/qualify_world.py`
- `vm/world/spec/`

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

- `RCPW-20-R05` — Global invariant: rendering/optimization cannot silently mutate canonical truth.
- `RCPW-20-R06` — Global invariant: no documentation-only, mock, placeholder, or self-declared PASS qualifies an operational gate.
- `RCPW-20-R09` — The integrated scheduler defines deterministic phase ordering for canonical mutation, remote simulation, folding, materialization, physics, rendering views, ledger commit, and checkpointing.
- `RCPW-20-R10` — A global resource governor protects canonical/persistence/ledger work before derived simulation and rendering quality.
- `RCPW-20-R12` — Release promotion requires a reproducible build manifest, test corpus digest, evidence digest, unresolved-risk register, and rollback plan.
- `RCPW-20-R15` — The final release gate executes the Golden World suite plus a content-scale worldbuilding scenario containing regions, settlements, interiors, ecology, economy, transport, weather, narrative wells, and persistent history.
- `RCPW-20-R16` — Release promotion requires a rollback-tested package, risk disposition, reproducible build/test manifest, compatibility matrix, and explicit statement of which qualification profiles are actually OPERATIONAL.
- `RCPW-20-R17` — The integrated architecture includes a deterministic world compiler that validates and emits canonical world metadata, dependency graphs, topology, content hashes, seeds, visibility/portal data, and runtime manifests.
- `RCPW-20-R18` — The runtime kernel has a versioned service ABI defining canonical mutation, scheduler phases, ledger commit, LOD/fold planning, materialization, navigation, AI, environment, rendering views, save/replay, and diagnostics.
- `RCPW-20-R19` — The final qualification executes a content-scale world containing wilderness, multiple settlements, interiors, transport networks, ecology, economy, law/reputation, weather, narrative events, persistent agents, and long-lived history under continuous folding.
- `RCPW-20-R21` — The 5.0 promotion gate requires all mandatory QP/WQ gates, 40 Golden World scenarios, long-soak stability, rollback proof, world-package reproducibility, runtime ABI compatibility, and an explicit blocker ledger.
- `RCPW-20-R22` — The integrated 6.0 architecture defines a sovereign world fabric that can run as one process or many deterministic workers without changing canonical world semantics.
- `RCPW-20-R23` — The runtime includes deterministic partitioning/ownership, transactional cross-partition mutation, global ledger ordering, coherent checkpointing, worker recovery, and headless verification contracts.
- `RCPW-20-R26` — The 6.0 promotion gate requires all mandatory QP/WQ gates, 60 Golden World scenarios, deterministic-parallel conformance, hot-patch/rollback qualification, re-partition recovery, long-soak/chaos evidence, and a complete unresolved-blocker ledger.
- `RCPW-20-R29` — The runtime includes knowledge-locality, generational agent/institution succession, settlement/infrastructure evolution, long-horizon world simulation, archival compaction, and causal rehydration services.
- `RCPW-20-R30` — The final qualification compares autonomous long-horizon evolution across deterministic worker layouts and validates that world expansion does not perturb prior canonical history outside declared mutations.
- `RCPW-20-R31` — The 7.0 promotion gate requires all mandatory QP/WQ gates, 80 Golden World scenarios, autonomous-world conformance, era/archive/rehydration qualification, knowledge-locality tests, multi-generation soak evidence, and an explicit blocker/risk ledger.
