# QVM World Service ABI 2

Legacy services 0-3 remain defined. RC-PW uses capability-gated service IDs 16-31.

| SVC | Name | Inputs | Outputs |
|---:|---|---|---|
| 16 | WORLD_INIT | R0 seed | R0 digest prefix |
| 17 | WORLD_ADVANCE | R0 ticks | R0 canonical tick |
| 18 | WORLD_MOVE_REFERENCE | R0-R2 signed64 xyz | R0 canonical tick |
| 19 | WORLD_SPAWN | R0 kind, R1-R3 xyz, R4 region | R0 entity id |
| 20 | WORLD_ENTITY_VIEW | R0 entity id | R0-R2 folded xyz, R3 shell, R4 LOD, R5 canonical distance |
| 21 | WORLD_EXPAND_FRONTIER | R0 anchor region | R0 new region id |
| 22 | WORLD_ARCHIVE_REGION | R0 region | R0 semantic digest prefix |
| 23 | WORLD_REHYDRATE_REGION | R0 region | R0 semantic digest prefix |
| 24 | WORLD_AUTHORITY_WELL | R0-R2 xyz, R3 priority, R4 radius | R0 well id |
| 25 | WORLD_DIGEST | none | R0 state digest prefix, R1 ledger head prefix |
| 26 | WORLD_INVARIANTS | none | R0 invariant-error count |
| 27 | WORLD_KNOWLEDGE | R0 observer, R1 fact id, R2 integer value | R0 1 |
| 28 | WORLD_SUCCESSION | R0 role code, R1 successor entity | R0 1 |
| 29 | WORLD_PARTITION_MIGRATE | R0 region, R1 partition number | R0 1 |
| 30 | WORLD_INVENTORY_TRANSFER | R0 tx id, R1 src, R2 dst, R3 item code, R4 quantity | R0 applied(1)/duplicate(0) |
| 31 | WORLD_SUMMARY | none | R0 regions, R1 entities, R2 ledger events, R3 archived regions |

Coordinates use signed 64-bit two's-complement values inside the QVM's wider unsigned registers. All services must be granted in the signed image capability manifest. World services trap if used before WORLD_INIT or when semantic preconditions fail.

## 26-blocker remediation hosted services

The hosted reference layer now includes non-guest qualification authorities for:

- deterministic resource governance;
- deterministic authority-well arbitration;
- headless verification/replay;
- spawned-process fold/LOD/materialization conformance;
- presentation-only hot reload/rollback;
- transition-format migration;
- historical archive/reconstruction.

These are host-reference qualification services and do not claim new native LCTL opcodes.

## Operational-reference service extension — semantic ABI 3

The QVM image ABI remains compatible with ABI 2. The hosted world-service semantic layer is extended to ABI 3 with capability-gated services 32–47:

| SVC | Name | Qualification purpose |
|---:|---|---|
| 32 | WORLD_CANONICAL_VERIFY | canonical invariants/revisions |
| 33 | WORLD_COHERENT_SNAPSHOT | coherent authoritative snapshot |
| 34 | WORLD_SCHEDULER_TRACE | deterministic scheduler phase evidence |
| 35 | WORLD_RESOURCE_GOVERNOR | replayable degradation policy |
| 36 | WORLD_ATOMIC_REFERENCE_UPDATE | typed/atomic reference movement |
| 37 | WORLD_ENTITY_VIEW_C2 | C2 folded reference view |
| 38 | WORLD_ECONOMIC_TRANSITION | auditable settlement/economy transition |
| 39 | WORLD_CRIME_LAW | persistent crime/law/reputation transition |
| 40 | WORLD_MATERIALIZE | dependency/readiness materialization |
| 41 | WORLD_FRAME_VIEW | coherent immutable presentation view |
| 42 | WORLD_CHECKPOINT | canonical checkpoint/save evidence |
| 43 | WORLD_TRANSITION | versioned representation transition |
| 44 | WORLD_TRAVERSAL_PLAN | route-aware traversal/prewarm planning |
| 45 | WORLD_PENTERACT | typed extended-state projection/validation |
| 46 | WORLD_HISTORY_ARCHIVE | causal archival/history operation |
| 47 | WORLD_SEMANTIC_GRAPH | canonical semantic graph view |

These services remain hosted-reference authority unless separately demonstrated as native upstream LCTL primitives. They do not create new QVM opcodes.
