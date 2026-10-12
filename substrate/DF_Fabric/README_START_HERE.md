# DF_Fabric -- START HERE

**DF-PA21.2-1.0.0** · federation **`DF0`** · the four DF node containers federated under the PA-LCTL execution fabric.

## What this is

The four container VMs -- `DF_Small` (BOTTLE ROCKET 3.0.0-MODEL), `DF_Medium` (BOTTLE ROCKET 5.0.0, ISA 4.1),
`DF_Large` (BOTTLE ROCKET 4.7.0, BR/1.1) and `DF_Xtra_Large` (QUORUM VM 5.0.0-candidate) -- run together as one
**distributed fabric container VM**, in the language and on the runtime the PA21.2 corpora define
(`PA_LCTL_FABRIC_SPEC.md`, `pacore.fabric`). This container holds no VM of its own: it holds the federation
(`fabric/`), the fabric runtime (`adapter/dfabric/fabric_runtime.py`), the shared core (`core/`), the index of
the set (`DF_INDEX.md`) and the measured evidence that the four nodes agree.

Put all five containers in one folder:

```
DF_Small/  DF_Medium/  DF_Large/  DF_Xtra_Large/  DF_Fabric/
cd DF_Fabric
./BUILD            # builds the four nodes in place (their C toolchains; the QVM needs no build)
./VERIFY           # 16 gates: integrity, node registry, FABRIC.pal, federation, replica/pipeline/BSP over every shipped
                   #   bundle, determinism across profiles, 240-row chain across nodes, image-portability negative, ladders, dialect bridge
./RUN              # witness fabric/FABRIC.pal on all four nodes; or ./RUN examples/04_distributed_teleport.pal --profile multi_process_deterministic
```

The governing rule, inherited from the corpora:

> No item is operational because its source file exists. Operational status requires native executable evidence satisfying that item's promotion gate.

## What the fabric does with a bundle

1. `pacore.lang` parses and verifies it (a bundle that does not verify is not executed);
2. its sealed row sequence is lowered per node (`DF/ROW_WITNESS_LOWERING/1`) -- rows move, images never do (gate `F7`);
3. **replica**: every node computes the whole witness natively; unanimity with the CPython reference is
   `CROSS_NODE_DIFFERENTIAL_AGREEMENT` -- four independent implementations (three C machines of two ISA lineages and a
   Python-hosted machine) checked against a fifth;
4. **pipeline**: 84-row segments are placed on workers by the load balancer and chained through their accumulators;
5. **bsp**: two supersteps (compute; exchange + vote) with a federation barrier, then `ALLGATHER` / `ALLREDUCE(min,max)`
   over explicit transfer schedules (`select_algorithm` rule id recorded);
6. one append-only event log, sealed, reconstructed and replay-checked; identical hash across runs in every
   deterministic profile.

## Measured on the assembly host

| gate | statement | result | time |
|---|---|---|---|
| `G0.1` | container SHA256SUMS.txt verifies (every delivered byte) | **SKIPPED** | 0.0s |
| `G0.2` | MANIFEST.json inventory matches disk | **SKIPPED** | 0.0s |
| `G0.4` | core/pacore tree digest equals the pinned digest | **PASS** | 0.003s |
| `G2` | every JSON artifact validates against the schema shipped beside it | **PASS** | 0.0s |
| `G3` | every evidence citation in the capability ledger resolves to a delivered path | **SKIPPED** | 0.0s |
| `G1` | reference core selfcheck -> SELFCHECK_PASS | **PASS** | 0.562s |
| `F0` | the four node containers are present beside this container and match their pinned digests | **PASS** | 0.0s |
| `F1` | every present node binds (toolchain built) and attests | **PASS** | 0.0s |
| `F2` | fabric/FABRIC.pal parses, verifies (lang.verify) and its seal equals the pinned FABRIC_SEAL.json | **PASS** | 0.002s |
| `F3` | the federation object model rebuilds from the node descriptors and equals fabric/FEDERATION.json (4 workers, 2 domains) | **PASS** | 0.001s |
| `F4` | replica + pipeline + BSP fabric programs on 8 bundles: cross-node differential agreement, replay PASS | **PASS** | 16.724s |
| `F5` | deterministic profiles reproduce the event-log hash exactly across two runs (single/thread/process); throughput profile runs, reproducibility not claimed | **PASS** | 12.7s |
| `F6` | a 240-row bundle is executed as a chain of 84-row segments placed across distinct nodes (static and dynamic placement) and reaches the reference witness | **PASS** | 0.691s |
| `F7` | negative: a 5.0.0 image is rejected by the 4.7.0 VM (trap 17 UNSUPPORTED_ABI) and by the QVM loader -- the fabric moves rows, not images | **PASS** | 0.11s |
| `F8` | provenance ladders honest: distributed_state <= DISTRIBUTED_CLASSICAL_EMULATION, quantum boundary NOT_CROSSED, physical flags False, NETWORK=deny | **PASS** | 0.003s |
| `F9` | dialect bridge: N_SMALL's MSSL witness program translated by tools/mssl_to_lctlc.py (PA-LCTL/MSSL_TO_LCTLC/1) runs on N_MEDIUM and yields the same witness | **PASS** | 0.145s |

**13 passed, 0 failed, 3 skipped** in 30.947 s on `Linux-6.18.5-fc-v20-x86_64-with-glibc2.39` (Python 3.11.15, `/usr/bin/cc`).

Details: `spec/DF_FABRIC_SPEC.md` s7 (per-bundle witnesses, event-log hashes, the 240-row chain), `conformance/logs/fabric_run_*.json`.

## What is not claimed

* The fabric runs on **one host** with local processes: `distributed_state <= DISTRIBUTED_CLASSICAL_EMULATION`,
  cross-machine federation `BLOCKED` (`NETWORK=deny`).
* No node has a qubit; `qcapacity 0`; every quantum feature `UNSUPPORTED`; `PHYSICAL_*_QPU_EXECUTION`
  `BLOCKED_EXTERNAL_AUTHORITY`.
* The pipeline chain has span == work; no speedup is claimed.
* Every VM's own blockers are inherited verbatim (`DF_<node>/reports/DF_BLOCKED_REGISTER.md`).
* `reports/DF_BLOCKED_REGISTER.md` lists the rest.

## Layout

```
README_START_HERE.md  DF_INDEX.md  MANIFEST.json  SHA256SUMS.txt  LICENSE  REQUIREMENTS.txt  BUILD(.cmd) VERIFY(.cmd) RUN(.cmd)
fabric/               FABRIC.pal, FABRIC_SEAL.json, FEDERATION.json, TOPOLOGY.json, NODES.json
adapter/dfabric/      the adapters + fabric runtime + gates (identical in every DF container)
core/                 reference/pacore, spec/, examples/, pamath/tests/test_bottlerocket_backend.py, PACORE_DIGEST.json
tools/                mssl_to_lctlc.py (dialect bridge Small -> Medium)
examples/             the six corpora programs + df_long_chain_240.pal
spec/                 DF_FABRIC_SPEC.md, DF_LANGUAGE_MAP.md
schemas/              JSON schemas
conformance/          DF_GATE_RESULTS.json + logs/
reports/              DF_CAPABILITY_LEDGER.json/.md, DF_BLOCKED_REGISTER.md, EVIDENCE_INDEX.md
corpus/               DF_Fabric_Translation_Corpus.jsonl.gz
authority/            DF_SOURCE_AUTHORITY.json        provenance/  DF_PROVENANCE.json
```
