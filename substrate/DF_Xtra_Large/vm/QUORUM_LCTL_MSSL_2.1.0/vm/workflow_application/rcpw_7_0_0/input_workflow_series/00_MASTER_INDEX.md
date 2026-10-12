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

# Start Here

Read these control documents before running any stage:

1. `00_RELEASE_NOTES.md`
2. `00_QUORUM_EXECUTION_CONTRACT.md`
3. `00_LCTL_MSSL_SOURCE_AUTHORITY.md`
4. `00_8S_PENTERACT_INTEGRATION.md`
5. `00_PRODUCTION_EXECUTION_AUTHORITY.md`
6. `00_DETERMINISTIC_SCHEDULER_AND_TIME.md`
7. `00_RESOURCE_GOVERNOR.md`
8. `00_THREAT_AND_FAILURE_MODEL.md`
9. `00_QUALIFICATION_PROFILES.md`
10. `00_GOLDEN_WORLD_SCENARIOS.md`
11. `00_TRACEABILITY_AND_EVIDENCE.md`

# Series Index

| Stage | Work package | Dependencies | Principal result |
|---:|---|---|---|
| 01 | [Canonical World Authority](01_CANONICAL_WORLD_AUTHORITY.md) | — | Establish the immutable persistent source of truth for world coordinates, entity identity, terrain, settlements, ecology, inventories, economy, environment, time, and historical state. |
| 02 | [Reference Frame Authority](02_REFERENCE_FRAME_AUTHORITY.md) | 01 | Create a moving computational frame centered on the active character or other reference entity while preserving exact canonical world identity. |
| 03 | [Fold Geometry Authority](03_FOLD_GEOMETRY_AUTHORITY.md) | 01, 02 | Implement the compactification mechanism by which remote map space collapses inward toward the reference point while the world remains logically resident. |
| 04 | [Simulation LOD Authority](04_SIMULATION_LOD_AUTHORITY.md) | 01, 02, 03 | Replace binary loaded/unloaded behavior with continuous simulation-detail states so remote entities remain alive at reduced computational fidelity. |
| 05 | [Entity Persistence Authority](05_ENTITY_PERSISTENCE_AUTHORITY.md) | 01, 04 | Guarantee that leaving the local area changes an entity's representation rather than its existence. |
| 06 | [Causal Ledger Authority](06_CAUSAL_LEDGER_AUTHORITY.md) | 01, 05 | Create an append-only world event ledger that records why the world changed, not merely what its current values are. |
| 07 | [Ecology Authority](07_ECOLOGY_AUTHORITY.md) | 01, 04, 05, 06 | Simulate ecosystems continuously across folded space using fidelity appropriate to distance and causal importance. |
| 08 | [Civilization / Economy Authority](08_CIVILIZATION_ECONOMY_AUTHORITY.md) | 01, 04, 05, 06, 07 | Keep settlements, households, labor, trade, crime, law, production, and resource flows alive beyond the player's immediate vicinity. |
| 09 | [Narrative Gravity Authority](09_NARRATIVE_GRAVITY_AUTHORITY.md) | 04, 05, 06 | Retain greater simulation authority for important remote entities/events than for irrelevant background activity when appropriate. |
| 10 | [Materialization Authority](10_MATERIALIZATION_AUTHORITY.md) | 02, 03, 04, 05, 09 | Rehydrate folded/abstract entities into complete local actors, geometry, physics, animation, audio, AI, and interaction without visible discontinuity. |
| 11 | [Visibility / Rendering Authority](11_VISIBILITY_RENDERING_AUTHORITY.md) | 02, 03, 04, 10 | Present the folded world as a seamless continuous environment while concealing compactification, LOD transitions, origin rebasing, and materialization. |
| 12 | [Save / Replay Authority](12_SAVE_REPLAY_AUTHORITY.md) | 01, 05, 06 | Make the folded-world simulation persistable, crash-recoverable, replayable, migratable, and independently verifiable. |
| 13 | [Reference-Centric World Shells](13_REFERENCE_CENTRIC_WORLD_SHELLS.md) | 02, 03, 04, 10, 11 | Coordinate folding, simulation fidelity, physics, AI, rendering, audio, persistence, and materialization through concentric authority shells. |
| 14 | [No-Unload Representation Transitions](14_NO_UNLOAD_REPRESENTATION_TRANSITIONS.md) | 04, 05, 13 | Replace destructive unloading with controlled representation transitions that preserve identity and ongoing evolution. |
| 15 | [High-Speed Traversal Fold / Unfold](15_HIGH_SPEED_TRAVERSAL_FOLD_UNFOLD.md) | 03, 10, 13, 14 | Guarantee stable unfolding ahead of the reference point and folding behind it during rapid movement and instantaneous relocation. |
| 16 | [Penteract World Coordinate Model](16_PENTERACT_WORLD_COORDINATE_MODEL.md) | 01, 02, 04, 06 | Represent each entity with extended world-state coordinates combining space, time, simulation fidelity, authority, causal significance, and reference proximity. |
| 17 | [QUORUM Fold Operator](17_FOLD_OPERATOR.md) | 02, 03, 16 | Formalize the transformation that maps canonical persistent reality into a finite reference-relative folded projection. |
| 18 | [Multiple Reference Points / Authority Wells](18_MULTI_REFERENCE_AUTHORITY_WELLS.md) | 02, 04, 09, 13, 17 | Support multiple important observers, missions, companions, battles, or simulation centers without duplicating authoritative world evolution. |
| 19 | [World-State Ledger](19_WORLD_STATE_LEDGER.md) | 06, 07, 08, 09, 12 | Implement durable queryable world history so folded regions continue producing meaningful consequences outside full local simulation. |
| 20 | [Core Architecture + System Invariants](20_CORE_ARCHITECTURE_AND_INVARIANTS.md) | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 | Integrate all authorities into one executable folded-world architecture with explicit contracts, dependency order, security/resource boundaries, qualification profiles, and evidence-backed operational readiness. |

# Recommended promotion sequence

Execute 01→20 in numeric order unless a stage explicitly supports independent reference-profile testing. A downstream stage may be developed while a prerequisite is incomplete, but its final status must reflect unresolved prerequisites.

## Final promotion rule

Stage 20 may mark the integrated RC-PW architecture **OPERATIONAL** only if all required prerequisite atomic requirements are OPERATIONAL in the claimed certification profile. Hardware/external/distributed/production evidence that does not exist must remain explicitly BLOCKED rather than inferred.

# 3.0 release promotion

Use the claimed qualification profile explicitly:

- QP0 reference model
- QP1 hosted operational
- QP2 native VM authority
- QP3 production-scale
- QP4 independently qualified

The release may carry different statuses at different profiles. Never flatten a QP1 PASS into a QP2/QP3/QP4 claim.

# 4.0 Continuous-World Control Plane

Before implementation, also read:

1. `00_WORLD_BUILDING_AUTHORITY.md`
2. `00_WORLD_TOPOLOGY_AND_PORTALS.md`
3. `00_AGENT_LIFE_SIMULATION.md`
4. `00_ENVIRONMENTAL_SYSTEMS.md`
5. `00_EVENT_ORCHESTRATION.md`
6. `00_INTERACTION_CAUSALITY.md`
7. `00_STREAMING_MEMORY_AND_IO.md`
8. `00_FORMAL_PROPERTIES_AND_MODEL_CHECKING.md`
9. `00_OBSERVABILITY_DEBUGGER.md`
10. `00_RELEASE_ACCEPTANCE.md`

Version 4.0.0 contains 282 atomic requirements. Final release status must be reported as `QP#/WQ#`, not as an unqualified OPERATIONAL label.

# 5.0 Operational Runtime + World Compiler Control Plane

Read these additional authorities before executing the 5.0 series:

1. `00_WORLD_COMPILER_AND_CONTENT_PIPELINE.md`
2. `00_RUNTIME_KERNEL_AND_SERVICE_ABI.md`
3. `00_DETERMINISTIC_RANDOMNESS.md`
4. `00_NAVIGATION_TRAVEL_AND_ROUTE_AUTHORITY.md`
5. `00_BEHAVIOR_GOALS_AND_SOCIAL_AI.md`
6. `00_COMBAT_DAMAGE_AND_PHYSICS_CAUSALITY.md`
7. `00_TRANSPORT_MOUNTS_AND_MOVING_FRAMES.md`
8. `00_PROCEDURAL_GENERATION_AND_PROVENANCE.md`
9. `00_CONTENT_BUDGETS_AND_DENSITY.md`
10. `00_LONG_SOAK_AND_CHAOS_QUALIFICATION.md`
11. `00_COMPATIBILITY_MIGRATION_AND_ROLLBACK.md`
12. `00_FINAL_OPERATIONAL_ACCEPTANCE_5_0.md`

5.0 contains 382 atomic requirements and 40 Golden World scenarios. It upgrades the series from a continuous-world design/qualification authority into a world-compiler + runtime-operational qualification program.

# 6.0 Sovereign World Fabric Control Plane

Read these additional authorities before executing 6.0:

1. `00_WORLD_FABRIC_ARCHITECTURE.md`
2. `00_DETERMINISTIC_PARALLEL_EXECUTION.md`
3. `00_WORLD_PARTITION_AND_OWNERSHIP.md`
4. `00_CROSS_PARTITION_TRANSACTIONS.md`
5. `00_REPLICATION_CHECKPOINT_AND_RECOVERY.md`
6. `00_HOT_PATCH_LIVE_CONTENT_AND_ROLLBACK.md`
7. `00_ASSET_VIRTUALIZATION_AND_RESIDENCY.md`
8. `00_CAUSAL_CONCURRENCY_MODEL.md`
9. `00_SECURITY_CAPABILITY_AND_SANDBOX.md`
10. `00_MULTI_WORKER_CONFORMANCE.md`
11. `00_WORLD_FABRIC_OBSERVABILITY.md`
12. `00_PRODUCTION_CAPACITY_PLANNING.md`
13. `00_FINAL_OPERATIONAL_ACCEPTANCE_6_0.md`

Version 6.0.0 contains **482 atomic requirements** and **60 Golden World scenarios**. Final qualification must state QP/WQ profile plus the tested worker/capacity profile.

# 7.0 Autonomous World Continuum Control Plane

Read these additional authorities before executing 7.0:

1. `00_AUTONOMOUS_WORLD_CONTINUUM.md`
2. `00_SEMANTIC_WORLD_GRAMMAR.md`
3. `00_WORLD_EXPANSION_AND_FRONTIER_SYNTHESIS.md`
4. `00_KNOWLEDGE_PERCEPTION_AND_INFORMATION.md`
5. `00_GENERATIONS_LINEAGE_AND_SUCCESSION.md`
6. `00_SETTLEMENT_GROWTH_AND_INFRASTRUCTURE.md`
7. `00_CULTURE_LAW_AND_INSTITUTIONS.md`
8. `00_CLIMATE_SEASONS_AND_SUCCESSION.md`
9. `00_EMERGENT_EVENT_SYNTHESIS.md`
10. `00_WORLD_AGE_ERAS_AND_HISTORY.md`
11. `00_ARCHIVAL_COMPACTION_AND_REHYDRATION.md`
12. `00_AUTONOMOUS_WORLD_CONFORMANCE.md`
13. `00_FINAL_OPERATIONAL_ACCEPTANCE_7_0.md`

Version 7.0.0 contains **582 atomic requirements** and **80 Golden World scenarios**. Final qualification must state the execution/world/fabric/autonomous-world profiles actually demonstrated.
