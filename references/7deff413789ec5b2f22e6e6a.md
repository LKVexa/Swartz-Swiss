# QUORUM Stage 05 Master Remediation — Entity Persistence Authority

**PARTIAL requirements in this stage:** 12

## Engineering focus

persistent identity, ownership, lifecycle, references, retention, partition-safe mutation and historical lineage.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/persistence_ledger.mssl`
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

- `RCPW-05-R01` — Gameplay-significant entities are not deleted because of distance or invisibility.
- `RCPW-05-R02` — Identity, ownership, health, inventory, relationships, goals, schedule, and causal obligations survive abstraction.
- `RCPW-05-R03` — Creation, destruction, death, consumption, transfer, and retirement are explicit world events rather than streaming side effects.
- `RCPW-05-R04` — Parent/child and container/member relationships remain referentially valid through every representation transition.
- `RCPW-05-R10` — Entity histories remain queryable after retirement/destruction according to retention policy.
- `RCPW-05-R14` — Selective persistence policies are explicit for debris, tracks, corpses, temporary props, transient crowds, and other high-volume world evidence.
- `RCPW-05-R16` — Persistent entities expose capability/ownership tokens or equivalent guards for mutation by AI, combat, inventory, transport, and mission systems.
- `RCPW-05-R21` — Entity references crossing partitions use stable canonical IDs and never rely on process-local pointers as authority.
- `RCPW-05-R22` — Worker failure cannot orphan canonical ownership; recovery deterministically re-establishes authoritative ownership from committed state.
- `RCPW-05-R23` — High-volume transient evidence uses bounded retention/compaction without reusing canonical identities in a way that breaks historical references.
- `RCPW-05-R24` — Persistence qualification includes forced worker loss during migration, ownership transfer, materialization, save, and ledger commit.
- `RCPW-05-R27` — Persistent identity never gets recycled after archival/death in a way that could collide with historical references.
