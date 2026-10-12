# QUORUM Reference-Centric Penteract World
## Prompt & Workflow Series 7.0.0

**Mission:** Build and qualify a persistent folded-world simulation in which the canonical world remains authoritative and continuously existent while distance from one or more reference points changes spatial projection, simulation fidelity, materialization, and rendering cost.

**Experience benchmark:** A dense, continuous, reactive open-world experience comparable in continuity and systemic persistence to modern large-scale open-world simulators. This specification does not claim or require access to any proprietary implementation.

## Global invariants

1. **Distance changes representation, not existence.**
2. **Canonical identity does not depend on render visibility.**
3. **Canonical coordinates do not depend on reference-space folding.**
4. **Folded entities retain state, history, causality, and future evolution.**
5. **Optimization may be lossy only in derived representation, never in canonical truth.**
6. **Simulation promotion/demotion is deterministic or records sufficient evidence for exact authoritative replay.**
7. **Reference-space state is reconstructible from canonical state plus reference selection.**
8. **Rendering, physics, AI, audio, navigation, and caches are consumers of authority, not silent authorities themselves.**
9. **No placeholder/mock/documentation-only PASS can qualify runtime behavior.**
10. **Operational claims require fresh reproducible evidence from the modified repository.**
11. **Resource exhaustion degrades derived fidelity before authoritative state.**
12. **Unsupported or unverifiable authority fails closed.**

# 18 — Multiple Reference Points / Authority Wells

## Mission

Support multiple important observers, missions, companions, battles, or simulation centers without duplicating authoritative world evolution.

## Dependencies

02, 04, 09, 13, 17

## QUORUM Execution Prompt

Using **QUORUM**, apply this work package to the target LCTL/MSSL virtual-world repository and implement, integrate, test, and qualify **Multiple Reference Points / Authority Wells**. Use the MSSL → typed semantic graph/schema → Columned LCTL → canonical LCTL → evidence/qualification source-authority chain defined by this series. Treat the 8S Penteract–S³ mathematics as a mapped mathematical authority candidate, never as an automatic substitute for implementation evidence. Preserve all global RC-PW invariants. Do not label a requirement OPERATIONAL unless a fresh runnable evidence path demonstrates it.

### Primary objective

Support multiple important observers, missions, companions, battles, or simulation centers without duplicating authoritative world evolution.

### Atomic requirements

- **RCPW-18-R01:** Each authority well has identity, priority, radius, budget, owner, and lifecycle.
- **RCPW-18-R02:** Overlapping wells never double-apply mutable world simulation.
- **RCPW-18-R03:** Canonical mutation ownership is singular or transactionally coordinated.
- **RCPW-18-R04:** Wells can merge, split, migrate, expire, and hand off without state loss.
- **RCPW-18-R05:** Resource allocation across wells is bounded and starvation-aware.
- **RCPW-18-R06:** The model can extend to multiplayer semantics without requiring multiplayer implementation.

- **RCPW-18-R07:** Authority-well membership changes are ledgered and replayable.
- **RCPW-18-R08:** Overlapping wells use deterministic conflict arbitration independent of thread timing.
- **RCPW-18-R09:** Per-well budgets include reserve and eviction policy so one well cannot monopolize all simulation capacity.
- **RCPW-18-R10:** Well retirement drains or transfers unresolved obligations before deallocation.

- **RCPW-18-R11:** Authority wells distinguish observation authority, simulation priority, canonical mutation ownership, and presentation ownership instead of conflating them.
- **RCPW-18-R12:** Conflicting observers of the same remote event receive causally consistent outcomes even if presentation fidelity differs.
- **RCPW-18-R13:** Shared ecology/economy/systemic processes are simulated once canonically even when covered by multiple wells.
- **RCPW-18-R14:** Speculative local work created for a temporary well is commit-gated or rollback-capable when the well expires or loses arbitration.

- **RCPW-18-R15:** Multiple authority wells are scheduled by a global ownership/arbitration service with deterministic priority, reserve budgets, and starvation bounds.
- **RCPW-18-R16:** Remote simulation wells may persist without any camera/renderer consumer when canonical events require continued fidelity.
- **RCPW-18-R17:** Authority-well creation and retirement are transactional with event reservations and canonical ownership transfer.
- **RCPW-18-R18:** Presentation-only observers cannot acquire canonical mutation authority by merely increasing priority.
- **RCPW-18-R19:** Qualification includes dozens of simultaneous wells, overlapping moving transport, remote battles/events, settlement simulations, and recovery from abrupt well loss.

- **RCPW-18-R20:** Authority-well arbitration is a first-class runtime service with deterministic global ordering and partition-independent canonical ownership.
- **RCPW-18-R21:** Authority wells may move between workers without ending the underlying canonical event or resetting simulation fidelity debt.
- **RCPW-18-R22:** Global reserve budgets protect canonical/event-barrier work when many wells compete.
- **RCPW-18-R23:** Well state is checkpointed and recoverable so worker loss does not silently dismiss remote high-priority events.
- **RCPW-18-R24:** Qualification includes large well counts, cross-worker overlap, event reservations, transport wells, recovery, and deterministic replay.

- **RCPW-18-R25:** Authority wells may be created by world-evolution processes such as migration crises, settlement founding, major ecological events, institutional conflict, or infrastructure failure even without player proximity.
- **RCPW-18-R26:** Autonomous world wells have strict budgets, expiration/escalation rules, and cannot monopolize simulation indefinitely.
- **RCPW-18-R27:** Historical or generational events spanning many agents/regions use hierarchical wells or equivalent aggregation rather than materializing every participant.
- **RCPW-18-R28:** Well state survives era transition, archive/rehydration, repartition, and worker recovery when unresolved obligations remain.
- **RCPW-18-R29:** Qualification includes simultaneous autonomous world events, multi-generation succession, player-created wells, and deterministic arbitration across archival boundaries.

## Stage-Specific Engineering Workflow

1. Define P1..Pn authority-well records including type, owner, priority, radius, budget, persistence, and expiration.
2. Define overlap detection and arbitration.
3. Assign canonical mutable responsibility to one owner or a transactional coordination protocol for each entity/event.
4. Share derived/materialized assets across wells where safe while preserving viewpoint-specific presentation.
5. Integrate narrative gravity, mission state, remote battle state, and companion autonomy into well creation.
6. Define merge/split/migration/handoff and failure rollback.
7. Stress overlapping settlements, two high-priority battles, independently traveling companions, and rapid reference transfers.
8. Audit for double simulation, duplicated events, starvation, deadlocks, divergent representations, and budget overruns.

## Mandatory QUORUM Q0–Q12 Application

Execute the master Q0–Q12 contract in `00_QUORUM_EXECUTION_CONTRACT.md` in addition to the stage-specific workflow above. At Q1, map every atomic requirement in this file to concrete source files, MSSL clauses, schemas, LCTL rows/modules, tests, commands, outputs, and evidence hashes.

### Minimum positive verification
- nominal scenario;
- zero/empty boundary where meaningful;
- minimum legal value;
- maximum legal configured value;
- transition at every relevant shell/LOD boundary;
- save/reload or replay where this authority owns durable state.

### Minimum negative/fault verification
- malformed state;
- unsupported version;
- stale/replayed input where applicable;
- truncated/partial data;
- duplicate identity or conflicting ownership where applicable;
- resource exhaustion;
- interrupted transition;
- corrupted evidence/ledger/checkpoint where applicable;
- dependency unavailable;
- deterministic replay mismatch.

## LCTL/MSSL implementation contract

For runtime-affecting behavior, provide semantic authority in MSSL and executable authority through Columned LCTL that lowers to canonical LCTL and passes the governing verifier. If a requirement is implemented in a hosted adapter or legacy layer, declare that boundary explicitly and do not mislabel it as native LCTL authority.

## 8S/Penteract contract

If this work package uses any term from the supplied 8S Penteract–S³ Master Coupled Mechanics Law, the term must appear in `EIGHT_S_MAPPING_MATRIX.md` with project meaning, units/domain, runtime binding, approximation/error regime, and verification evidence. Unmapped terms cannot control OPERATIONAL gate decisions.

## Required evidence record

For every atomic requirement emit a record containing at least:

- `requirement_id`
- `status`
- `source_paths`
- `semantic_contract`
- `test_command`
- `exit_code`
- `evidence_path`
- `sha256`
- `deterministic_replay`
- `resource_profile`
- `blocker`
- `notes`

## Required deliverables

- `MULTI_REFERENCE.mssl`
- `multi_reference.lctlc`
- `AUTHORITY_WELL_SCHEMA.json`
- `OVERLAP_ARBITRATION.md`
- `OWNERSHIP_PROTOCOL.md`
- `MULTI_REFERENCE_QUALIFICATION.json`
- `RCPW-18_requirements.json`
- `RCPW-18_tests.log`
- `RCPW-18_audit.md`
- `RCPW-18_manifest.sha256`
- `QUALIFICATION_REPORT.md`

## Gate decision

- **OPERATIONAL** — every atomic requirement passes with fresh evidence; all relevant negative, replay, persistence, stress, regression, and integrity gates pass; no unresolved critical/high correctness defect remains.
- **PARTIAL** — implementation exists but one or more required proofs or non-critical behaviors remain incomplete.
- **BLOCKED** — required source authority, dependency, hardware/external adapter, verifier capability, independent evidence, or prerequisite package is unavailable.
- **REGRESSED** — a previously required passing behavior now fails.

Do not convert PARTIAL/BLOCKED/REGRESSED into OPERATIONAL through prose.

## Acceptance ledger

| ID | Requirement | Initial Status | Evidence |
|---|---|---|---|
| RCPW-18-R01 | Each authority well has identity, priority, radius, budget, owner, and lifecycle. | NOT_STARTED | — |
| RCPW-18-R02 | Overlapping wells never double-apply mutable world simulation. | NOT_STARTED | — |
| RCPW-18-R03 | Canonical mutation ownership is singular or transactionally coordinated. | NOT_STARTED | — |
| RCPW-18-R04 | Wells can merge, split, migrate, expire, and hand off without state loss. | NOT_STARTED | — |
| RCPW-18-R05 | Resource allocation across wells is bounded and starvation-aware. | NOT_STARTED | — |
| RCPW-18-R06 | The model can extend to multiplayer semantics without requiring multiplayer implementation. | NOT_STARTED | — |
| RCPW-18-R07 | Authority-well membership changes are ledgered and replayable. | NOT_STARTED | — |
| RCPW-18-R08 | Overlapping wells use deterministic conflict arbitration independent of thread timing. | NOT_STARTED | — |
| RCPW-18-R09 | Per-well budgets include reserve and eviction policy so one well cannot monopolize all simulation capacity. | NOT_STARTED | — |
| RCPW-18-R10 | Well retirement drains or transfers unresolved obligations before deallocation. | NOT_STARTED | — |

| RCPW-18-R11 | Authority wells distinguish observation authority, simulation priority, canonical mutation ownership, and presentation ownership instead of conflating them. | NOT_STARTED | — |
| RCPW-18-R12 | Conflicting observers of the same remote event receive causally consistent outcomes even if presentation fidelity differs. | NOT_STARTED | — |
| RCPW-18-R13 | Shared ecology/economy/systemic processes are simulated once canonically even when covered by multiple wells. | NOT_STARTED | — |
| RCPW-18-R14 | Speculative local work created for a temporary well is commit-gated or rollback-capable when the well expires or loses arbitration. | NOT_STARTED | — |

| RCPW-18-R15 | Multiple authority wells are scheduled by a global ownership/arbitration service with deterministic priority, reserve budgets, and starvation bounds. | NOT_STARTED | — |
| RCPW-18-R16 | Remote simulation wells may persist without any camera/renderer consumer when canonical events require continued fidelity. | NOT_STARTED | — |
| RCPW-18-R17 | Authority-well creation and retirement are transactional with event reservations and canonical ownership transfer. | NOT_STARTED | — |
| RCPW-18-R18 | Presentation-only observers cannot acquire canonical mutation authority by merely increasing priority. | NOT_STARTED | — |
| RCPW-18-R19 | Qualification includes dozens of simultaneous wells, overlapping moving transport, remote battles/events, settlement simulations, and recovery from abrupt well loss. | NOT_STARTED | — |

| RCPW-18-R20 | Authority-well arbitration is a first-class runtime service with deterministic global ordering and partition-independent canonical ownership. | NOT_STARTED | — |
| RCPW-18-R21 | Authority wells may move between workers without ending the underlying canonical event or resetting simulation fidelity debt. | NOT_STARTED | — |
| RCPW-18-R22 | Global reserve budgets protect canonical/event-barrier work when many wells compete. | NOT_STARTED | — |
| RCPW-18-R23 | Well state is checkpointed and recoverable so worker loss does not silently dismiss remote high-priority events. | NOT_STARTED | — |
| RCPW-18-R24 | Qualification includes large well counts, cross-worker overlap, event reservations, transport wells, recovery, and deterministic replay. | NOT_STARTED | — |

| RCPW-18-R25 | Authority wells may be created by world-evolution processes such as migration crises, settlement founding, major ecological events, institutional conflict, or infrastructure failure even without player proximity. | NOT_STARTED | — |
| RCPW-18-R26 | Autonomous world wells have strict budgets, expiration/escalation rules, and cannot monopolize simulation indefinitely. | NOT_STARTED | — |
| RCPW-18-R27 | Historical or generational events spanning many agents/regions use hierarchical wells or equivalent aggregation rather than materializing every participant. | NOT_STARTED | — |
| RCPW-18-R28 | Well state survives era transition, archive/rehydration, repartition, and worker recovery when unresolved obligations remain. | NOT_STARTED | — |
| RCPW-18-R29 | Qualification includes simultaneous autonomous world events, multi-generation succession, player-created wells, and deterministic arbitration across archival boundaries. | NOT_STARTED | — |


## QUORUM 3.0 Production-Execution Overlay

This stage is governed by the 3.0 production-execution controls in:

- `00_PRODUCTION_EXECUTION_AUTHORITY.md`
- `00_DETERMINISTIC_SCHEDULER_AND_TIME.md`
- `00_RESOURCE_GOVERNOR.md`
- `00_THREAT_AND_FAILURE_MODEL.md`
- `00_QUALIFICATION_PROFILES.md`
- `00_GOLDEN_WORLD_SCENARIOS.md`
- `00_TRACEABILITY_AND_EVIDENCE.md`

### Required gate separation

A stage must track these gates independently:

1. **DESIGN PASS** — contracts, schemas, invariants, units, and ownership are complete.
2. **IMPLEMENTATION PASS** — executable source exists and builds/lowers/verifies through the declared toolchain.
3. **FUNCTIONAL PASS** — positive and boundary behavior works.
4. **ADVERSARIAL PASS** — malformed, stale, conflicting, interrupted, exhaustion, and corruption paths fail safely.
5. **DETERMINISM PASS** — replay/checkpoint digests match within the declared equivalence model.
6. **PERFORMANCE PASS** — the claimed qualification profile meets measured resource/time budgets.
7. **RECOVERY PASS** — save/replay/crash/rollback behavior is demonstrated where applicable.
8. **INTEGRATION PASS** — upstream/downstream contracts and scheduler ordering are verified.
9. **EVIDENCE PASS** — evidence is fresh, hash-bound, reproducible, and not a prewritten success artifact.
10. **PROMOTION PASS** — all mandatory gates for the claimed profile pass and no inherited blocker is unresolved.

A single overall `OPERATIONAL` label is forbidden unless every mandatory gate for the claimed profile is PASS.

### World-folding correctness properties

Where applicable, test the following as property-level invariants rather than single examples:

- canonical identity preservation;
- canonical coordinate preservation;
- causal-order preservation;
- no distance-triggered existence loss;
- no duplicate materialization;
- no fold aliasing of interactable entities;
- bounded fold/LOD transition error;
- bounded resource consumption;
- deterministic recovery from the same authoritative inputs;
- stable behavior under rapid oscillation at shell boundaries;
- graceful degradation before canonical-state loss.

### Required evidence bundle extension

In addition to existing deliverables, emit:

- `GATE_MATRIX.json`
- `TRACEABILITY.csv`
- `COMMAND_TRANSCRIPT.log`
- `RESOURCE_PROFILE.json`
- `FAILURE_INJECTION_REPORT.json`
- `REPLAY_DIGESTS.json`
- `RISK_REGISTER.md`
- `ROLLBACK_PLAN.md`

## Handoff

Return the modified repository or patch set, exact reproduction commands, all generated evidence, unresolved blockers, resource/performance deltas, and final gate decision. Downstream packages may consume this stage only according to the dependency/status rules in the master execution contract.


## QUORUM 4.0 Continuous-World / Worldbuilding Overlay

This stage must also satisfy the 4.0 control plane:

- `00_WORLD_BUILDING_AUTHORITY.md`
- `00_WORLD_TOPOLOGY_AND_PORTALS.md`
- `00_AGENT_LIFE_SIMULATION.md`
- `00_ENVIRONMENTAL_SYSTEMS.md`
- `00_EVENT_ORCHESTRATION.md`
- `00_INTERACTION_CAUSALITY.md`
- `00_STREAMING_MEMORY_AND_IO.md`
- `00_FORMAL_PROPERTIES_AND_MODEL_CHECKING.md`
- `00_OBSERVABILITY_DEBUGGER.md`
- `00_RELEASE_ACCEPTANCE.md`

### 4.0 execution doctrine

The world must be treated as a persistent causal simulation, not a collection of visibility-driven chunks. Geometry may fold, simulation fidelity may reduce, and presentation may disappear, but canonical topology, identity, travel time, ownership, and unresolved causal obligations remain authoritative.

For each stage:

1. declare the canonical facts owned by the stage;
2. declare which derived representations may be lossy;
3. declare the exact promotion/demotion or fold/unfold conservation vector;
4. declare event barriers that forbid low-fidelity approximation;
5. declare time, precision, resource, and recovery budgets;
6. provide deterministic property tests rather than only example tests;
7. provide failure-injection tests for interrupted transitions and corrupt/stale state;
8. provide provenance for reconstructed/materialized state;
9. provide runtime telemetry for backlog, distortion/error, and budget pressure;
10. state qualification separately for QP0–QP4 and WQ0–WQ4.

### Required 4.0 evidence additions

- `WORLD_CONTINUITY_PROPERTIES.json`
- `PROVENANCE_REPORT.json`
- `EVENT_BARRIER_TESTS.json`
- `TELEMETRY_SCHEMA.json`
- `CONTENT_SCALE_PROFILE.json`
- `WORLD_QUALITY_MATRIX.json`


## QUORUM 5.0 Operational Runtime + World Compiler Overlay

This stage is additionally governed by:

- `00_WORLD_COMPILER_AND_CONTENT_PIPELINE.md`
- `00_RUNTIME_KERNEL_AND_SERVICE_ABI.md`
- `00_DETERMINISTIC_RANDOMNESS.md`
- `00_NAVIGATION_TRAVEL_AND_ROUTE_AUTHORITY.md`
- `00_BEHAVIOR_GOALS_AND_SOCIAL_AI.md`
- `00_COMBAT_DAMAGE_AND_PHYSICS_CAUSALITY.md`
- `00_TRANSPORT_MOUNTS_AND_MOVING_FRAMES.md`
- `00_PROCEDURAL_GENERATION_AND_PROVENANCE.md`
- `00_CONTENT_BUDGETS_AND_DENSITY.md`
- `00_LONG_SOAK_AND_CHAOS_QUALIFICATION.md`
- `00_COMPATIBILITY_MIGRATION_AND_ROLLBACK.md`
- `00_FINAL_OPERATIONAL_ACCEPTANCE_5_0.md`

### 5.0 mandatory interpretation

The system is no longer qualified merely as a mathematical fold model or a set of world-system contracts. A 5.0 OPERATIONAL claim requires an executable, reproducible path from world content and semantic contracts through compilation, runtime boot, deterministic scheduling, persistent simulation, folding/materialization, save/replay, and evidence generation.

For every applicable stage:

1. identify the world-package/compiler inputs;
2. identify runtime ABI/service ownership;
3. define deterministic-random streams and replay metadata;
4. define canonical route/time semantics;
5. define content-scale resource budgets;
6. define exact/abstract/deferred event handling;
7. define state provenance and version compatibility;
8. define headless verification behavior;
9. run content-scale positive/failure/soak scenarios;
10. publish QP/WQ-qualified evidence and blockers.

### 5.0 evidence extension

- `WORLD_PACKAGE_MANIFEST.json`
- `WORLD_COMPILER_REPORT.json`
- `RUNTIME_ABI_COMPATIBILITY.json`
- `DETERMINISTIC_STREAMS.json`
- `HEADLESS_REPLAY_DIGESTS.json`
- `CONTENT_SCALE_BENCHMARK.json`
- `SOAK_AND_CHAOS_REPORT.json`
- `MIGRATION_ROLLBACK_REPORT.json`


## QUORUM 6.0 Sovereign World Fabric Overlay

This stage is additionally governed by:

- `00_WORLD_FABRIC_ARCHITECTURE.md`
- `00_DETERMINISTIC_PARALLEL_EXECUTION.md`
- `00_WORLD_PARTITION_AND_OWNERSHIP.md`
- `00_CROSS_PARTITION_TRANSACTIONS.md`
- `00_REPLICATION_CHECKPOINT_AND_RECOVERY.md`
- `00_HOT_PATCH_LIVE_CONTENT_AND_ROLLBACK.md`
- `00_ASSET_VIRTUALIZATION_AND_RESIDENCY.md`
- `00_CAUSAL_CONCURRENCY_MODEL.md`
- `00_SECURITY_CAPABILITY_AND_SANDBOX.md`
- `00_MULTI_WORKER_CONFORMANCE.md`
- `00_WORLD_FABRIC_OBSERVABILITY.md`
- `00_PRODUCTION_CAPACITY_PLANNING.md`
- `00_FINAL_OPERATIONAL_ACCEPTANCE_6_0.md`

### 6.0 mandatory interpretation

A folded world is qualified only if canonical results do not depend on the incidental execution layout. One process, multiple worker lanes, or repartitioned execution may change throughput and latency, but must not silently change identity, topology, committed causality, canonical time, ownership, or deterministic replay results in deterministic qualification profiles.

For each stage:

1. declare canonical ownership and partition transfer rules;
2. declare read/write conflict domains;
3. declare deterministic commit ordering;
4. declare recovery/retry/idempotence behavior;
5. declare hot-patch/version activation semantics;
6. declare worker-layout independence requirements;
7. declare partition-aware resource/backpressure behavior;
8. declare canonical-versus-derived replication rules;
9. run single-worker versus multi-worker conformance;
10. publish partition/recovery/hot-patch evidence with QP/WQ status.

### Required 6.0 evidence additions

- `PARTITION_OWNERSHIP_MAP.json`
- `CROSS_PARTITION_TRANSACTION_REPORT.json`
- `MULTI_WORKER_DIGEST_COMPARISON.json`
- `WORKER_RECOVERY_REPORT.json`
- `HOT_PATCH_ROLLBACK_REPORT.json`
- `REPARTITION_CONFORMANCE.json`
- `FABRIC_CAPACITY_PROFILE.json`
- `FABRIC_OBSERVABILITY_SCHEMA.json`


## QUORUM 7.0 Autonomous World Continuum Overlay

This stage is additionally governed by:

- `00_AUTONOMOUS_WORLD_CONTINUUM.md`
- `00_SEMANTIC_WORLD_GRAMMAR.md`
- `00_WORLD_EXPANSION_AND_FRONTIER_SYNTHESIS.md`
- `00_KNOWLEDGE_PERCEPTION_AND_INFORMATION.md`
- `00_GENERATIONS_LINEAGE_AND_SUCCESSION.md`
- `00_SETTLEMENT_GROWTH_AND_INFRASTRUCTURE.md`
- `00_CULTURE_LAW_AND_INSTITUTIONS.md`
- `00_CLIMATE_SEASONS_AND_SUCCESSION.md`
- `00_EMERGENT_EVENT_SYNTHESIS.md`
- `00_WORLD_AGE_ERAS_AND_HISTORY.md`
- `00_ARCHIVAL_COMPACTION_AND_REHYDRATION.md`
- `00_AUTONOMOUS_WORLD_CONFORMANCE.md`
- `00_FINAL_OPERATIONAL_ACCEPTANCE_7_0.md`

### 7.0 mandatory interpretation

The folded world is now treated as a long-lived autonomous continuum. It may grow, age, reorganize, archive distant history, and generate new canonical regions, but no synthesis or compaction operation may silently rewrite established canonical truth.

For each stage:

1. declare what may evolve autonomously;
2. declare world-age and era semantics;
3. declare authored versus generated provenance;
4. declare local knowledge versus omniscient canonical truth;
5. declare succession/lineage where identities or institutional roles change;
6. declare historical compaction and rehydration guarantees;
7. declare frontier generation admission/validation;
8. declare exact versus inferred/reconstructed historical state;
9. compare short-horizon and long-horizon evolution;
10. publish QP/WQ plus autonomous-world conformance evidence.

### Required 7.0 evidence additions

- `WORLD_ERA_SCHEMA.json`
- `SEMANTIC_GRAMMAR_REPORT.json`
- `FRONTIER_SYNTHESIS_MANIFEST.json`
- `KNOWLEDGE_LOCALITY_TESTS.json`
- `LINEAGE_SUCCESSION_REPORT.json`
- `ARCHIVE_REHYDRATION_DIGESTS.json`
- `LONG_HORIZON_DRIFT_REPORT.json`
- `AUTONOMOUS_WORLD_CONFORMANCE.json`
