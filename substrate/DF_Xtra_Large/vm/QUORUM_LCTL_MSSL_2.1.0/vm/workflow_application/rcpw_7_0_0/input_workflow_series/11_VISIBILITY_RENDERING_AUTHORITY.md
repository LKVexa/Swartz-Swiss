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

# 11 — Visibility / Rendering Authority

## Mission

Present the folded world as a seamless continuous environment while concealing compactification, LOD transitions, origin rebasing, and materialization.

## Dependencies

02, 03, 04, 10

## QUORUM Execution Prompt

Using **QUORUM**, apply this work package to the target LCTL/MSSL virtual-world repository and implement, integrate, test, and qualify **Visibility / Rendering Authority**. Use the MSSL → typed semantic graph/schema → Columned LCTL → canonical LCTL → evidence/qualification source-authority chain defined by this series. Treat the 8S Penteract–S³ mathematics as a mapped mathematical authority candidate, never as an automatic substitute for implementation evidence. Preserve all global RC-PW invariants. Do not label a requirement OPERATIONAL unless a fresh runnable evidence path demonstrates it.

### Primary objective

Present the folded world as a seamless continuous environment while concealing compactification, LOD transitions, origin rebasing, and materialization.

### Atomic requirements

- **RCPW-11-R01:** Render visibility is never used as persistent existence authority.
- **RCPW-11-R02:** Folded rendering is coherent with canonical direction, landmarks, routes, and horizon semantics.
- **RCPW-11-R03:** Temporal transitions are stable and free of visible popping/jitter within declared thresholds.
- **RCPW-11-R04:** Rendering overload sheds visual quality before simulation authority.
- **RCPW-11-R05:** Long-distance silhouettes, lighting, atmospheric effects, shadows/reflections, and audio landmarks have declared fidelity policies.
- **RCPW-11-R06:** Visual regression and frame-budget evidence are generated from repeatable traversal traces.

- **RCPW-11-R07:** Rendering exposes a fold-artifact detector for scale discontinuity, horizon inversion, repeated landmarks, and topology leaks.
- **RCPW-11-R08:** Temporal history buffers are invalidated/rebased correctly when origin or fold parameters change.
- **RCPW-11-R09:** Render culling cannot suppress simulation events or event ledger emission.
- **RCPW-11-R10:** Quality degradation is ordered and measurable, with simulation truth protected above visual fidelity.

- **RCPW-11-R11:** Visibility uses fold-aware hierarchical occlusion while acoustics uses canonical propagation rules or an explicitly qualified approximation.
- **RCPW-11-R12:** Weather, fog, smoke, cloud cover, night lighting, and atmospheric perspective may mask streaming but cannot become correctness dependencies.
- **RCPW-11-R13:** Temporal rendering history is invalidated or transformed correctly when fold parameters, reference origins, portals, or shell representations change.
- **RCPW-11-R14:** Long-distance landmarks have canonical identity and visibility policy so folding cannot create duplicate or contradictory silhouettes.

- **RCPW-11-R15:** Visibility/rendering consumes a world-compiler-produced hierarchy of regions, visibility cells, portals, landmarks, and fold-safe representation tiers.
- **RCPW-11-R16:** Rendering and audio use separate fidelity/budget policies while sharing canonical identity and event timing.
- **RCPW-11-R17:** Temporal effects have explicit reset/reprojection rules for portal transitions, fold-parameter changes, origin rebases, teleports, and moving-frame handoffs.
- **RCPW-11-R18:** Visual landmark substitution at extreme fold distance records canonical identity so materialization cannot swap one landmark for another.
- **RCPW-11-R19:** Qualification includes automated image/telemetry comparison for seam popping, landmark duplication, horizon inversion, temporal ghosting, and frame-time spikes.

- **RCPW-11-R20:** Rendering consumes immutable per-frame world-view snapshots or equivalent coherent views so parallel canonical updates cannot tear a visible frame.
- **RCPW-11-R21:** Render workers may be decoupled from simulation workers, but presentation lag is measured and cannot be mistaken for canonical state.
- **RCPW-11-R22:** Fold/LOD/reference metadata carried into rendering is version stamped so mixed-frame state is detected.
- **RCPW-11-R23:** Asset/visual hot reload supports transactional frame-boundary activation and rollback without changing canonical identity.
- **RCPW-11-R24:** Rendering qualification includes worker restart, asset version rollback, fold-policy change, origin rebase, portal crossing, and presentation backlog.

- **RCPW-11-R25:** Visibility/rendering represents world age and historical change through canonical condition/state rather than static content assumptions.
- **RCPW-11-R26:** Folded horizon rendering can summarize newly expanded world extent without exposing undefined or not-yet-canonical geography as interactable fact.
- **RCPW-11-R27:** Long-distance landmark replacement reflects canonical construction/destruction/abandonment history and never resurrects obsolete landmarks from stale caches.
- **RCPW-11-R28:** Historical presentation layers such as weathering, vegetation succession, infrastructure decay, and settlement growth remain derived from authoritative state/provenance.
- **RCPW-11-R29:** Qualification compares pre/post-era visual state, expansion-horizon continuity, archive rehydration, and stale-cache rejection.

## Stage-Specific Engineering Workflow

1. Build visibility sets from frustum, occlusion, terrain, interiors, weather, line of sight, distance, shell, and fold horizon.
2. Define render representations per shell: full geometry, hierarchical meshes, simplified geometry, impostors, analytic landmarks, atmospheric/horizon proxies, and hidden state-only regions.
3. Coordinate scale, perspective, landmark visibility, shadows, reflections, sky, and audio with fold geometry.
4. Implement temporally stable blending, cross-fade/morph rules, and subpixel-stable origin updates.
5. Define visual-budget arbitration that cannot demote authoritative simulation directly.
6. Instrument frame time, GPU memory, draw/dispatch counts, visible transition events, and missed materialization deadlines.
7. Capture deterministic visual regression traces across walking, riding, train-like traversal, extreme camera motion, and teleport staging.
8. Audit for topology leaks where folded geometry reveals impossible adjacency or scale.

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

- `VISIBILITY_RENDERING.mssl`
- `visibility_rendering.lctlc`
- `RENDER_TIER_SPEC.md`
- `VISIBILITY_POLICY.json`
- `FRAME_BUDGET.json`
- `VISUAL_REGRESSION_REPORT.md`
- `RCPW-11_requirements.json`
- `RCPW-11_tests.log`
- `RCPW-11_audit.md`
- `RCPW-11_manifest.sha256`
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
| RCPW-11-R01 | Render visibility is never used as persistent existence authority. | NOT_STARTED | — |
| RCPW-11-R02 | Folded rendering is coherent with canonical direction, landmarks, routes, and horizon semantics. | NOT_STARTED | — |
| RCPW-11-R03 | Temporal transitions are stable and free of visible popping/jitter within declared thresholds. | NOT_STARTED | — |
| RCPW-11-R04 | Rendering overload sheds visual quality before simulation authority. | NOT_STARTED | — |
| RCPW-11-R05 | Long-distance silhouettes, lighting, atmospheric effects, shadows/reflections, and audio landmarks have declared fidelity policies. | NOT_STARTED | — |
| RCPW-11-R06 | Visual regression and frame-budget evidence are generated from repeatable traversal traces. | NOT_STARTED | — |
| RCPW-11-R07 | Rendering exposes a fold-artifact detector for scale discontinuity, horizon inversion, repeated landmarks, and topology leaks. | NOT_STARTED | — |
| RCPW-11-R08 | Temporal history buffers are invalidated/rebased correctly when origin or fold parameters change. | NOT_STARTED | — |
| RCPW-11-R09 | Render culling cannot suppress simulation events or event ledger emission. | NOT_STARTED | — |
| RCPW-11-R10 | Quality degradation is ordered and measurable, with simulation truth protected above visual fidelity. | NOT_STARTED | — |

| RCPW-11-R11 | Visibility uses fold-aware hierarchical occlusion while acoustics uses canonical propagation rules or an explicitly qualified approximation. | NOT_STARTED | — |
| RCPW-11-R12 | Weather, fog, smoke, cloud cover, night lighting, and atmospheric perspective may mask streaming but cannot become correctness dependencies. | NOT_STARTED | — |
| RCPW-11-R13 | Temporal rendering history is invalidated or transformed correctly when fold parameters, reference origins, portals, or shell representations change. | NOT_STARTED | — |
| RCPW-11-R14 | Long-distance landmarks have canonical identity and visibility policy so folding cannot create duplicate or contradictory silhouettes. | NOT_STARTED | — |

| RCPW-11-R15 | Visibility/rendering consumes a world-compiler-produced hierarchy of regions, visibility cells, portals, landmarks, and fold-safe representation tiers. | NOT_STARTED | — |
| RCPW-11-R16 | Rendering and audio use separate fidelity/budget policies while sharing canonical identity and event timing. | NOT_STARTED | — |
| RCPW-11-R17 | Temporal effects have explicit reset/reprojection rules for portal transitions, fold-parameter changes, origin rebases, teleports, and moving-frame handoffs. | NOT_STARTED | — |
| RCPW-11-R18 | Visual landmark substitution at extreme fold distance records canonical identity so materialization cannot swap one landmark for another. | NOT_STARTED | — |
| RCPW-11-R19 | Qualification includes automated image/telemetry comparison for seam popping, landmark duplication, horizon inversion, temporal ghosting, and frame-time spikes. | NOT_STARTED | — |

| RCPW-11-R20 | Rendering consumes immutable per-frame world-view snapshots or equivalent coherent views so parallel canonical updates cannot tear a visible frame. | NOT_STARTED | — |
| RCPW-11-R21 | Render workers may be decoupled from simulation workers, but presentation lag is measured and cannot be mistaken for canonical state. | NOT_STARTED | — |
| RCPW-11-R22 | Fold/LOD/reference metadata carried into rendering is version stamped so mixed-frame state is detected. | NOT_STARTED | — |
| RCPW-11-R23 | Asset/visual hot reload supports transactional frame-boundary activation and rollback without changing canonical identity. | NOT_STARTED | — |
| RCPW-11-R24 | Rendering qualification includes worker restart, asset version rollback, fold-policy change, origin rebase, portal crossing, and presentation backlog. | NOT_STARTED | — |

| RCPW-11-R25 | Visibility/rendering represents world age and historical change through canonical condition/state rather than static content assumptions. | NOT_STARTED | — |
| RCPW-11-R26 | Folded horizon rendering can summarize newly expanded world extent without exposing undefined or not-yet-canonical geography as interactable fact. | NOT_STARTED | — |
| RCPW-11-R27 | Long-distance landmark replacement reflects canonical construction/destruction/abandonment history and never resurrects obsolete landmarks from stale caches. | NOT_STARTED | — |
| RCPW-11-R28 | Historical presentation layers such as weathering, vegetation succession, infrastructure decay, and settlement growth remain derived from authoritative state/provenance. | NOT_STARTED | — |
| RCPW-11-R29 | Qualification compares pre/post-era visual state, expansion-horizon continuity, archive rehydration, and stale-cache rejection. | NOT_STARTED | — |


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
