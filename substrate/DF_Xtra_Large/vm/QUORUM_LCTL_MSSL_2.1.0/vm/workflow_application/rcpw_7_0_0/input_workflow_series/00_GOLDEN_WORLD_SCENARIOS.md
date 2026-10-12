# QUORUM RC-PW 7.0.0 — Golden World Scenarios

Every integrated build must support reproducible seeded scenarios.

## GW-01 Fold Circuit
Character traverses a closed route crossing every shell twice. Verify no entity identity loss, no route topology corruption, bounded fold error, and identical final canonical digest on replay.

## GW-02 Remote Ecology
Predator/prey/resource interactions execute remotely, then the player enters the region. Verify population accounting and materialized consequences.

## GW-03 Settlement Shock
A remote supply interruption propagates through transport and economy with canonical delay. Verify prices/inventory/population outcomes and causal trace.

## GW-04 Narrative Well
An active remote mission/companion retains higher fidelity while the player moves away. Verify bounded priority and continuity.

## GW-05 Materialization Storm
Rapid traversal approaches a dense settlement. Verify admission control, no duplicate embodiment, and bounded frame/resource spikes.

## GW-06 Teleport
Teleport across the world. Verify destination staging, collision/occupancy validation, causal time reconciliation, and no stale reference-space state.

## GW-07 Multi-Well Conflict
Two authority wells overlap a moving event. Verify singular canonical mutation ownership and deterministic arbitration.

## GW-08 Crash/Recovery
Interrupt during canonical mutation, ledger commit, checkpoint, and materialization. Verify recovery to a valid state.

## GW-09 Save Migration
Save under prior schema, migrate, replay, and compare canonical semantic equivalence.

## GW-10 Long Soak
Run extended simulation with recurring fold/unfold, ecology, economy, saves, and replay checkpoints. Verify bounded resource growth and no cumulative state drift.

## GW-11 Portal / Interior Continuity
Move repeatedly between exterior, nested interiors, tunnels, and portals while shells adapt. Verify no fold distortion leaks into canonical topology or interaction.

## GW-12 Law and Reputation Persistence
Commit a witnessed crime, leave the region until it is folded/abstract, return later, and verify law/reputation consequences from causal history.

## GW-13 Weather Front Crossing
A weather front traverses multiple folded regions while the player travels in the opposite direction. Verify canonical propagation time and coherent local materialization.

## GW-14 Logistics Chain
Disrupt a bridge or transport link feeding a settlement. Verify delayed shortages, substitution, recovery, and eventual local evidence.

## GW-15 Persistent Companion
A companion travels independently through multiple shells and authority wells. Verify identity, schedule, inventory, route, and relationship continuity.

## GW-16 Fold-Horizon Interaction Safety
Place many canonical landmarks/entities near the projected fold horizon. Verify no duplicate silhouettes or ambiguous interaction targets.

## GW-17 Oscillation Torture
Move/camera-oscillate repeatedly across shell/fold thresholds. Verify hysteresis, no thrash, bounded queues, and stable canonical state.

## GW-18 Event Barrier
Trigger a remote situation that cannot safely resolve abstractly. Verify escalation/defer behavior and no fabricated outcome.

## GW-19 Content Pack Degradation
Remove/corrupt an optional world-content region and verify unrelated canonical regions remain valid while affected content fails explicitly.

## GW-20 Full World Day
Run a content-scale simulated day with settlements, ecology, weather, logistics, agents, narrative wells, folding, saves, and checkpoint replay. Compare canonical digests and bounded resource growth.

## GW-21 World Package Rebuild
Compile identical source world content twice. Compare canonical identities, topology, provenance, seeds, manifests, and semantic digests.

## GW-22 Nested Moving Frames
Player boards moving transport, moves inside it, crosses a fold shell, disembarks at a portal-connected destination. Verify transform, velocity, and identity continuity.

## GW-23 Pursuit Across Fold Shells
Two persistent agents pursue one another across multiple shells and a settlement boundary. Verify route time, intent, promotion debt, and no teleport shortcuts.

## GW-24 Rail/Route Continuity
A train-like transport crosses distant regions while player changes direction repeatedly. Verify phase, passengers, cargo, stations, timing, and unfolding.

## GW-25 Combat at Fold Boundary
A combat encounter begins near a transition shell. Verify event barrier escalation, unique targeting, inventory use, damage, law/reputation consequences, and replay.

## GW-26 Remote Combat Resolution
A remote battle uses the qualified abstract model. Player later arrives. Verify participants, casualties, inventory, damage, evidence, and model provenance.

## GW-27 Persistent Merchant Day
Merchant follows schedule, trades, restocks via logistics, leaves local shell, and rematerializes. Verify inventory/money conservation and schedule continuity.

## GW-28 Household and Occupation
Household members work/travel/sleep/socialize across a full canonical day. Verify roles, routes, relationships, and materialization consistency.

## GW-29 Dynamic Blockage
Destroy/block a bridge, force navigation/logistics reroutes, then repair it. Verify route graph mutation, travel delay, economy effects, and causal ledger.

## GW-30 Procedural Region Regeneration
Regenerate a seeded optional region and prove stable canonical provenance without duplicating existing persistent entities.

## GW-31 Generated/Authored Override
Apply an authored override to generated content, save, migrate, and regenerate. Verify override precedence and historical provenance.

## GW-32 Materialization Dependency Failure
Remove one derived asset/dependency and verify explicit partial readiness, no canonical state loss, and safe recovery when dependency returns.

## GW-33 Moving Weather + Fire
Weather changes wind while a fire propagates across folded regions. Verify canonical propagation time and local materialized evidence.

## GW-34 Law Pursuit and Jurisdiction
Crime occurs near a jurisdiction boundary. Player travels far away and returns. Verify witness, reputation, pursuit, jurisdiction, and elapsed-time semantics.

## GW-35 Event Reservation Conflict
Two narrative/systemic events request the same exclusive actor. Verify deterministic reservation/arbitration and no duplicated actor role.

## GW-36 Multi-Well Transport Crisis
Several remote wells surround moving transport, settlement response, weather, and narrative events. Verify one canonical mutation authority per responsibility.

## GW-37 Checkpoint Under Load
Checkpoint while materialization, ecology, economy, route travel, and ledger commits are active. Crash and recover. Compare canonical digest.

## GW-38 Runtime ABI Upgrade
Load/migrate a compatible world/save under a new runtime ABI version. Reject an incompatible variant and preserve last known-good state.

## GW-39 Headless Replay
Run the world without full rendering and reproduce canonical checkpoint digests for a complex Golden World trace.

## GW-40 Operational World Soak
Execute a content-scale persistent world with continuous travel, folding, agents, ecology, economy, weather, events, transport, saves, faults, compaction, and replay. Verify bounded growth and no canonical drift.

## GW-41 Single-vs-Multi Worker Equivalence
Run the same seeded world trace on one worker and multiple worker layouts. Compare canonical checkpoint and causal semantic digests.

## GW-42 Repartition While Traveling
Move the active reference through a region while runtime ownership migrates between workers. Verify no canonical, fold, route, or interaction discontinuity.

## GW-43 Worker Loss During Fold
Terminate a worker responsible for a folded remote region. Recover and verify identities, ecology/economy obligations, and ledger continuity.

## GW-44 Worker Loss During Materialization
Fail a worker during dense-region hydration. Verify no duplicate embodiment and deterministic recovery/readiness.

## GW-45 Cross-Partition Inventory Transfer
Trade/move an owned item across partition boundaries with injected retries and duplicate messages. Verify exactly-once canonical result.

## GW-46 Cross-Partition Combat
Combatants and witnesses begin under different partition owners. Verify deterministic damage, death/injury, law/reputation, and causal ordering.

## GW-47 Concurrent Route Mutation
A bridge closes while agents/transport on multiple workers are routing through it. Verify deterministic replan and no impossible traversal.

## GW-48 Settlement Transaction Storm
Execute heavy concurrent trade/logistics across settlements. Verify conservation, no duplicate delivery, bounded lag, and recovery.

## GW-49 Ecology Boundary Migration
A herd/cohort crosses partition ownership during remote simulation. Verify conservation and deterministic split/merge.

## GW-50 Authority-Well Reassignment
Migrate a high-priority remote event well between workers during active simulation. Verify reservation, fidelity debt, and event continuity.

## GW-51 Hot Fold-Policy Patch
Activate a new fold-policy version at the declared barrier, verify no mixed-policy frame, then roll back.

## GW-52 Presentation Hot Reload
Replace visual assets while world simulation continues. Verify canonical identity and interaction targets remain unchanged.

## GW-53 Canonical Content Patch
Apply a valid world-content patch with migration and then an invalid patch. Verify atomic activation and rollback.

## GW-54 Partition Checkpoint Barrier
Checkpoint a busy multi-worker world. Restore under a different partition layout and compare canonical digests.

## GW-55 Replica Staleness
Inject a stale replica/read. Verify revision checks prevent stale canonical mutation.

## GW-56 Duplicate Transaction Delivery
Deliver the same cross-partition transaction multiple times. Verify idempotent exactly-once canonical meaning.

## GW-57 Causal Ordering Race
Generate concurrent events with shared participants/resources. Verify deterministic arbitration and causal replay.

## GW-58 Resource Saturation Across Workers
Overload one worker and then the entire fabric. Verify backpressure, workload migration, derived-fidelity degradation, and canonical safety.

## GW-59 Security/Capability Abuse
Attempt malformed package, unauthorized mutation, invalid patch, recursive dependency, and oversized input. Verify fail-closed boundaries.

## GW-60 Sovereign World Fabric Soak
Run a content-scale persistent folded world through repartition, worker loss/recovery, patch/rollback, saves, compaction, traversal, events, ecology, economy, and replay. Verify bounded growth and canonical equivalence.

## GW-61 Frontier Admission
Generate and atomically admit a new frontier region. Verify topology, identities, seeds, provenance, budgets, and no mutation of pre-existing canonical digests outside declared dependencies.

## GW-62 Frontier Rejection
Submit invalid generated terrain/topology/content. Verify rejection before canonical admission and unchanged world state.

## GW-63 Expansion Horizon
Approach a newly admitted region through the fold horizon. Verify stable summaries, no undefined-world interaction, and correct progressive materialization.

## GW-64 Deep-Time Settlement Growth
Advance a settlement through multiple growth phases. Verify housing, production, population, infrastructure, route topology, and historical provenance.

## GW-65 Settlement Decline and Reclamation
Simulate economic/ecological shock causing decline or abandonment, followed by later reclamation. Verify causal continuity and no stale visual resurrection.

## GW-66 Generational Household
Run household lineage across multiple generations/role successions. Verify identity uniqueness, inheritance, relationships, and historical queryability.

## GW-67 Institutional Succession
Replace a leader/office holder multiple times while institution persists. Verify role continuity, ownership, laws/policies, knowledge, and causal history.

## GW-68 Information Delay
A remote event occurs; rumors and official information travel at different rates. Verify NPC/institution knowledge differs from global truth until informed.

## GW-69 False Rumor
Inject a false or uncertain rumor. Verify belief propagation without corrupting canonical event truth.

## GW-70 Historical Narrative Hook
A decades-old equivalent event creates a current narrative opportunity. Verify causal hook survives compaction/archive and eligibility uses appropriate knowledge.

## GW-71 Ecology Succession
Simulate habitat change, resource depletion, migration, recovery, and species succession across multiple eras.

## GW-72 Infrastructure Era Change
Build, damage, abandon, and restore a major route. Verify canonical travel/logistics history and folded summaries update transactionally.

## GW-73 Archive Region
Archive a long-unvisited region. Verify retained conserved state, identities, obligations, compact causal proof, and storage reduction metrics.

## GW-74 Rehydrate Region
Return to the archived region. Verify semantic-first rehydration, provenance classes, reconstructed microdetails, and canonical digest continuity.

## GW-75 Archive During Active Obligation
Attempt archival while unresolved quest/law/ownership/event obligations exist. Verify protected information is retained or archival is rejected/deferred.

## GW-76 Old Save into Expanded World
Load a historical save after the base world has been expanded. Verify historical cut preservation, compatibility policy, and deterministic continuation.

## GW-77 Long-Horizon vs Fine-Step
Run a reference region under fine stepping and qualified long-horizon abstraction. Compare conserved quantities, major outcomes, and declared drift envelope.

## GW-78 Autonomous Event Cascade
Allow economy, ecology, infrastructure, law, and institutions to create a multi-region causal cascade without player presence. Verify bounded event synthesis and replay.

## GW-79 Player Reentry After Era
Player leaves a region for a long world-age interval and returns after succession, construction, ecological change, and institutional turnover. Verify coherent local embodiment.

## GW-80 Autonomous World Continuum Soak
Run world expansion, generations, settlements, institutions, ecology, economy, weather, narrative synthesis, archive/rehydration, repartition, saves, faults, and replay through a prolonged multi-era simulation. Verify bounded growth, declared drift, and canonical historical continuity.
