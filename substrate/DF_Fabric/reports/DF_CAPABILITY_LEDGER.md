# DF_Fabric (DF0) -- capability ledger

Release DF-PA21.2-1.0.0. Rule: No item is operational because its source file exists. Operational status requires native executable evidence satisfying that item's promotion gate.

Distribution: BLOCKED 2, BLOCKED_EXTERNAL_AUTHORITY 1, OPERATIONAL 12, SPECIFIED 2, VERIFIED 1. `operational_without_evidence`: []; `operational_without_passing_gate`: [].

| item | title | status | statement | gates |
|---|---|---|---|---|
| `DFF-01` | container integrity | `VERIFIED` | hashes, manifest, one pinned core, schemas, citations, core selfcheck | `G0.1`=SKIPPED, `G0.2`=SKIPPED, `G0.4`=PASS, `G2`=PASS, `G3`=PASS, `G1`=PASS |
| `DFF-02` | node registry | `OPERATIONAL` | the four node containers are located beside this one and match their pinned SHA256SUMS digests; every present node binds | `F0`=PASS, `F1`=PASS |
| `DFF-03` | the fabric bundle | `OPERATIONAL` | fabric/FABRIC.pal parses, verifies and seals to the pinned seal | `F2`=PASS |
| `DFF-04` | federation object model | `OPERATIONAL` | Federation DF0 (2 domains, 4 groups, 4 workers) rebuilds from the node descriptors and equals fabric/FEDERATION.json | `F3`=PASS |
| `DFF-05` | replica program | `OPERATIONAL` | four independent implementations agree with the CPython reference on every shipped bundle (CROSS_NODE_DIFFERENTIAL_AGREEMENT) | `F4`=PASS |
| `DFF-06` | pipeline program | `OPERATIONAL` | a 240-row bundle runs as a chain of 84-row segments placed on distinct nodes (static and dynamic) and reaches the reference witness | `F6`=PASS |
| `DFF-07` | BSP program + collectives | `OPERATIONAL` | two supersteps (compute, exchange+vote) with a federation barrier; ALLGATHER and ALLREDUCE(min,max) over explicit transfer schedules chosen by select_algorithm (rule id recorded) | `F4`=PASS |
| `DFF-08` | event log and replay | `OPERATIONAL` | one append-only log per run, sealed; reconstruction and replay self-check PASS; identical hash across two runs in every deterministic profile | `F4`=PASS, `F5`=PASS |
| `DFF-09` | execution profiles | `OPERATIONAL` | single_process_deterministic, multi_thread_deterministic, multi_process_deterministic executed and reproducible; multi_process_throughput executed, reproducibility not claimed | `F5`=PASS |
| `DFF-10` | no image portability | `OPERATIONAL` | a 5.0.0 image traps 17 on the 4.7.0 VM and is rejected by the QVM loader: the fabric moves rows, not images | `F7`=PASS |
| `DFF-11` | provenance ladders | `OPERATIONAL` | distributed_state <= DISTRIBUTED_CLASSICAL_EMULATION, quantum boundary NOT_CROSSED, physical flags False, NETWORK=deny | `F8`=PASS |
| `DFF-12` | dialect bridge | `OPERATIONAL` | tools/mssl_to_lctlc.py carries a Small MSSL witness program to Medium with the same result | `F9`=PASS |
| `DFF-20` | load balancing | `OPERATIONAL` | static (weighted round-robin) and dynamic (decomposed score) placement of segments with a full LOAD_BALANCE_LEDGER | `F6`=PASS |
| `DFF-30` | work stealing, straggler mitigation, elasticity, grain adaptation, deadlock detection | `SPECIFIED` | present in the carried core (pacore.fabric) but not exercised by the DF fabric programs | - |
| `DFF-31` | bundle-driven fabric programs | `SPECIFIED` | FABRIC.pal is declarative; SPAWN/BARRIER/collective rows are not yet interpreted as the schedule | - |
| `DFF-32` | cross-machine federation | `BLOCKED` | NETWORK=deny; local processes on one host | - |
| `DFF-33` | physical quantum outputs | `BLOCKED_EXTERNAL_AUTHORITY` | PHYSICAL_PARALLEL_QPU_EXECUTION, PHYSICAL_DISTRIBUTED_QPU_EXECUTION | - |
| `DFF-34` | quantum-face execution on any node | `BLOCKED` | no node has a qubit; qcapacity=0 | - |

Statuses follow the corpora's vocabulary. `VERIFIED` is used for exactly one item -- container integrity -- whose hash gates can only run after the seal and therefore cannot be cited from inside the container (they passed in the post-seal `./VERIFY`, recorded in the delivery's `_assembly/` folder, and run first in every `./VERIFY`). `IMPLEMENTED` means the code exists but its gate did not pass or could not run on the assembly host; `SPECIFIED` means stated but not exercised; `BLOCKED*` means what it says, with the reason in `DF_BLOCKED_REGISTER.md`.
