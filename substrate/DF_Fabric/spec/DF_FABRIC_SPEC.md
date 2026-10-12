# DF fabric specification -- `DF0`

Document: `spec/DF_FABRIC_SPEC.md` · Release DF-PA21.2-1.0.0
Authority: `adapter/dfabric/fabric_runtime.py`, `core/reference/pacore/fabric.py` (`PA_LCTL_FABRIC_SPEC.md`), `fabric/FABRIC.pal`.
Where this document and the code disagree, the code is correct.

## 1. Normative policy (inherited)

`NETWORK=deny`, `BACKEND=none`. The fabric is a **model of** a federation executed on one host: every "node" is
an embedded VM run as a local process by its adapter. A conforming run SHALL NOT report its results as distributed
execution across machines; `distributed_state` is capped at `DISTRIBUTED_CLASSICAL_EMULATION`.

## 2. The federation

`fabric.Federation("DF0")` -> `ExecutionDomain D_BR` (groups `G_BR3`, `G_ISA41`, `G_BR11`) and `ExecutionDomain D_QVM`
(group `G_QVM1`) -> one `Worker` per VM (`W_SMALL`, `W_MEDIUM`, `W_LARGE`, `W_XLARGE`) with `ResourceLimits(cpu_slots=1,
memory_bytes=<measured per live VM>, qpu_slots=0, ebit_budget=0)`, trust `LOCAL_TRUSTED`, one failure domain each.
`fabric/FEDERATION.json` is its `as_dict()`; gate `F3` rebuilds it and compares. `fabric/FABRIC.pal` states the same
federation as a PA-LCTL bundle (four `DECLARE_NODE`s, six `DECLARE_LINK classical_channel`s, `DECLARE_TOPOLOGY nodes=4
domains=2 qcapacity=0`), verifies under `pacore.lang`, and seals to `fabric/FABRIC_SEAL.json` (gate `F2`).

## 3. Unit of distribution: sealed rows, never images

The nodes are not binary compatible (gate `F7`: a 5.0.0 image traps 17 on the 4.7.0 VM; BRIM binaries are rejected by
the QVM). What the fabric moves between nodes is the **sealed PA-LCTL row sequence** (or a segment of it, with its
incoming accumulator); each node lowers it to its own dialect (`DF/ROW_WITNESS_LOWERING/1`) and executes natively.

## 4. The three fabric programs

| program | family | what runs | verdict |
|---|---|---|---|
| `replica` | `CLASSICAL_REPLICA_PARALLEL` | one `TaskRuntime` task per node, owner = that node's worker, each computing the whole-bundle witness (chained through its own <=84-row segments); federation `barrier`; `await_all` | `CROSS_NODE_DIFFERENTIAL_AGREEMENT` iff every native witness equals the CPython reference |
| `pipeline` | `TASK_PARALLEL` (a chain; span == work) | the row sequence cut into 84-row segments; segments placed by `LoadBalancer` (static weighted round-robin, or dynamic decomposed score) on the live workers; segment k+1 spawned with segment k's accumulator; each hand-off logged with an ownership `move` delta | final accumulator == reference |
| `bsp` | `CLASSICAL_REPLICA_PARALLEL` | `BSPEngine`: superstep 1 = local witness on every worker (worker_group barrier); superstep 2 = every worker sends its witness to every peer, votes (federation barrier); then `Collectives(4)`: `ALLGATHER` and `ALLREDUCE(max)`, `ALLREDUCE(min)` over explicit transfer schedules chosen by `select_algorithm` (rule `R5`, `recursive_doubling` for 4 workers, 8-byte messages) | unanimous votes, gathered vectors consistent, min == max == reference |

`./RUN [bundle.pal] [--profile P] [--placement static|dynamic] [--programs replica,pipeline,bsp]` writes the run
record (`DF/FABRIC_RUN/1`) to `_runs/`, and with `--event-log FILE` the canonical event log (`PA-LCTL/EVENTLOG/1`).

## 5. Execution profiles

All four `fabric.ExecutionProfile`s are exercised: `single_process_deterministic` (tasks in submission order, calling
thread), `multi_thread_deterministic` (thread pool with the submission-order turnstile), `multi_process_deterministic`
(`multiprocessing.Pool.map`; the four VMs genuinely run in four OS processes), `multi_process_throughput`
(`imap_unordered`; complete log, reproducibility not claimed).

## 6. The event log

One `EventLog` per run, shared by the task runtime, the BSP engine and the collectives; inputs and outputs are hashed
(hole H7: wall-clock metrics never enter the hash); sealed at the end; `reconstruct()` and `verify_replay()` run as a
self-check. Gate `F5` runs each deterministic profile twice and requires identical hashes.

## 7. Measured on the assembly host (gate F4: every shipped bundle, single_process_deterministic)

| bundle | rows | reference witness | verdict | events | event-log hash | pipeline segments |
|---|---|---|---|---|---|---|
| `01_bell_pair.pal` | 12 | `17360368901394384785` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `e38b438e4d65a206...` | 1 |
| `02_ghz3.pal` | 15 | `6735235137199922533` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `60c2fc771474cc2f...` | 1 |
| `03_two_lane_parallel.pal` | 16 | `2035133056847448988` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `0447332486fe8181...` | 1 |
| `04_distributed_teleport.pal` | 15 | `11114974373231215855` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `6f77346541bb1282...` | 1 |
| `05_measurement_feedback.pal` | 14 | `1825703198280153005` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `7e2430872e11c53c...` | 1 |
| `06_noise_density.pal` | 14 | `725229432034669365` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `d9441685e5be7ba7...` | 1 |
| `df_long_chain_240.pal` | 240 | `4102983261209585326` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 43 | `da4b1f0549a1512a...` | 3 |
| `FABRIC.pal` | 34 | `9950524808862381976` | CROSS_NODE_DIFFERENTIAL_AGREEMENT | 41 | `dc7a9382ed2e5cf3...` | 1 |

Gate `F5` (determinism):

| profile | run 1 | run 2 | |
|---|---|---|---|
| `single_process_deterministic` | `e38b438e4d65a206...` | `e38b438e4d65a206...` | identical |
| `multi_thread_deterministic` | `e38b438e4d65a206...` | `e38b438e4d65a206...` | identical |
| `multi_process_deterministic` | `e38b438e4d65a206...` | `e38b438e4d65a206...` | identical |
| `multi_process_throughput` | `e38b438e4d65a206...` | -- | NOT_CLAIMED (may_reorder=True; the log is complete but its hash is not asserted) |

Gate `F6` (`examples/df_long_chain_240.pal`, `multi_process_deterministic`):

| placement | segments | chain (segment:node(rows)) | final witness | |
|---|---|---|---|---|
| static | 3 | 0:N_SMALL(84), 1:N_MEDIUM(84), 2:N_LARGE(72) | `4102983261209585326` | agree |
| dynamic | 3 | 0:N_LARGE(84), 1:N_MEDIUM(84), 2:N_SMALL(72) | `4102983261209585326` | agree |

## 8. What is not claimed

Cross-machine federation (`BLOCKED`, `NETWORK=deny`); parallel speedup of the pipeline chain (span == work); quantum
execution on any node (`qcapacity 0`); physical outputs (`BLOCKED_EXTERNAL_AUTHORITY`); the fabric spec's work stealing,
straggler mitigation, elasticity, grain adaptation and deadlock detection are carried in the core but not exercised by
these programs (`SPECIFIED`); interpretation of `FABRIC.pal`'s SPAWN/BARRIER/collective rows as the schedule (`SPECIFIED`).

## 9. Implementation status

| element | status |
|---|---|
| federation object model from node descriptors | `OPERATIONAL` (F3) |
| replica program, four-way differential agreement | `OPERATIONAL` (F4) |
| pipeline program, segments across nodes, static + dynamic placement | `OPERATIONAL` (F6) |
| BSP program + collectives with explicit schedules | `OPERATIONAL` (F4) |
| event log sealed, reconstructed, replayed; identical hash across runs in 3 profiles | `OPERATIONAL` (F5) |
| dialect bridge Small -> Medium | `OPERATIONAL` (F9) |
| no image portability (negative) | `OPERATIONAL` as a finding (F7) |
| honest ladders | `OPERATIONAL` (F8) |
| work stealing / stragglers / elasticity / grain / deadlock | `SPECIFIED` |
| bundle-driven schedules | `SPECIFIED` |
| cross-machine federation | `BLOCKED` |
| physical quantum outputs | `BLOCKED_EXTERNAL_AUTHORITY` |
