# DF node specification -- `N_XLARGE` (QUORUM VM 5.0.0-candidate inside QUORUM LCTL/MSSL 2.1.0)

Document: `spec/DF_NODE_SPEC.md` · Release: DF-PA21.2-1.0.0
Authority: `adapter/dfabric/nodes.py` (`XLargeNodeAdapter`), `adapter/dfabric/witness.py`,
`node/NODE_DESCRIPTOR.json`, `node/NODE.pal`; the corpora's `PA_LCTL_TARGET_ADAPTER_SPEC.md`,
`PA_LCTL_BOTTLE_ROCKET_BACKEND.md`, `PA_LCTL_FABRIC_SPEC.md`.

RFC 2119 keywords apply. Where this document and the adapter code disagree, the code is
correct and this document is a defect (the corpora's own precedence rule).

---

## 1. What is being translated

The container VM `Xtra_Large.zip` -- 5,513 files: a Python-hosted VM (QVM ISA 1 / ABI 2, QBRIM 2 signed JSON images, LCTLC/1.0 with the bundled LCTL 1.6.1-RC1 Java column verifier) inside the L4-L9 Open 2.1.0 qualification repository (438 kappa-sealed MSSL documents, 133 Columned-LCTL plans).

Runtime contract (from the package, restated): `QVM ISA 1 (24 opcodes) / ABI 2; PC + 16 registers up to 1,048,576 bits; 4096-byte memory; 256-word stack; QBRIM 2 signed images; step budget default 1,000,000; program <= 65,535 instructions`.

## 2. Its place in the fabric (translation rule T2)

| fabric object (`pacore.fabric`) | value | derivation |
|---|---|---|
| `Federation.federation_id` | `DF0` | the set of four containers |
| `ExecutionDomain.domain_id` | `D_QVM` | vendor lineage (QUORUM_VM) |
| `WorkerGroup.group_id` | `G_QVM1` | ISA lineage; images do not cross groups (see s6) |
| `Worker.worker_id` | `W_XLARGE` | one worker == one running instance of this VM |
| `Worker.failure_domain` | `FD_XLARGE` | the VM is its own OS process |
| `Worker.capabilities` | `classical`, `row_sequence_witness`, `quorum_vm`, dialect token | measured, not declared |
| `Worker.limits` | `cpu_slots=1`, `memory_bytes=60000000`, `qpu_slots=0`, `ebit_budget=0` | memory measured per live VM |
| `Worker.trust` | `LOCAL_TRUSTED` | never `PHYSICAL_TARGET_AUTHENTICATED` |
| migration / replication | classical migration allowed, quantum migration/replication structurally refused | fabric spec s3.1 defaults |

`node/NODE.pal` states the same facts as a PA-LCTL bundle (`DECLARE_FEDERATION`,
`DECLARE_DOMAIN`, `DECLARE_NODE`, `DECLARE_TOPOLOGY`, `CLAIM`, `NOTE`, `EMIT_LEDGER` rows,
faces FEDERATION / TOPOLOGY / RESOURCE / EVIDENCE / MODEL / LEDGER). It parses and verifies
under `pacore.lang`, seals to `node/NODE_SEAL.json`, and its witness is executed on this VM
by `./RUN node/NODE.pal` and by gate `A3`.

## 3. The adapter ABI (translation rule T3)

`PA_LCTL_TARGET_ADAPTER_SPEC.md` s2, member by member:

| member | this node |
|---|---|
| `target_id` | `quorum-vm-5.0.0-candidate-local` |
| `authority` | `local-operator` |
| `trust_domain` | `LOCAL_TRUSTED` |
| `attest()` | schema `DF/ADAPTER_ATTESTATION/1`: adapter ABI/version, runtime contract, toolchain digests, the target's **own** self-report restated verbatim, physical outputs BLOCKED_EXTERNAL_AUTHORITY |
| `topology()` | one classical node, `quantum_capacity 0`, registers/word bits/opcodes/memory measured -- deliberately not a `planner.Topology` |
| `feature_class(f)` | s3 vocabulary; unstated features are `UNSUPPORTED` (table in s4) |
| `native_gate_set()` | **empty** |
| `calibration()` | `applicable: False` -- a deterministic VM has no calibration epoch |
| `limits()` | `max_rows_per_lowering=21843`, `instruction_ceiling=65535`, `qubits=0`, `shots=1`, `cli_step_budget=1000000` |
| `submit(program, qcir_p2, shots, seed)` | lowers, compiles, verifies, signs, executes the whole-bundle witness; refuses `shots != 1`, a non-`PA-LCTL/QCIR-P2/1` schema, and any bundle over the bound |
| `submit_words(words, acc_in)` (DF extension) | one witness **segment** starting from `acc_in`; this is what the fabric schedules |
| `result()` | the last `DF/NODE_SEGMENT_RESULT/1` or `DF/ADAPTER_RESULT/1` |
| `provenance()` | `ledgers.PROVENANCE_FIELDS`-shaped; `physical_*` all False; `quantum_boundary NOT_CROSSED`; `target_verified` true only when the differential agreed |
| refusal | every method returns a complete, evidenced answer or raises `AdapterRefusal` with a stated reason (s2.4) |

## 4. Feature classes (adapter spec s3)

| feature | class |
|---|---|
| `CX` | `UNSUPPORTED` |
| `ENTANGLE_LINK` | `UNSUPPORTED` |
| `H` | `UNSUPPORTED` |
| `MEASURE` | `UNSUPPORTED` |
| `PREP0` | `UNSUPPORTED` |
| `TELEPORT` | `UNSUPPORTED` |
| `bounded_termination` | `SUPPORTED` |
| `classical_face_execution` | `UNSUPPORTED` |
| `compile_from_source` | `SUPPORTED` |
| `declared_step_budget` | `SUPPORTED` |
| `deterministic_replay` | `SUPPORTED` |
| `external_column_verifier_jvm` | `SUPPORTED_WITH_LIMITS` |
| `image_signing` | `SUPPORTED` |
| `independent_image_verification` | `UNSUPPORTED` |
| `integer_arithmetic` | `SUPPORTED` |
| `quantum_face_execution` | `UNSUPPORTED` |
| `row_sequence_witness` | `SUPPORTED_WITH_LIMITS` |
| `segmented_row_sequence_witness` | `SUPPORTED` |
| `signature_checked_execution` | `SUPPORTED` |
| `state_hash_trace` | `SUPPORTED` |
| `trust_store_rollback_floor` | `SUPPORTED` |
| `wide_word_arithmetic_1048576` | `SUPPORTED` |

`SUPPORTED_WITH_LIMITS` on `row_sequence_witness` means: at most 21843 rows per
lowering; the fabric chains longer bundles through segments (`segmented_row_sequence_witness`
is `SUPPORTED`).

## 5. The lowering (translation rule T4)

Schema `DF/ROW_WITNESS_LOWERING/1`. For rows r_0..r_(n-1) in sealed order, with
`w(r) = low 64 bits of sha256(r)` and the FNV-1a constants:

```
acc_0     = acc_in                      (1469598103934665603 for the first segment)
acc_(i+1) = ((acc_i * 1099511628211) mod 2^64) XOR w(r_i)
witness   = acc_n
```

On this node the program is emitted in **LCTLC/1.0 (COLUMNED LCTL QVM Profile 1; vm-lane REG rows)** and reads back
`R0`. A 3-row lowering as actually emitted:

```
LCTLC/1.0
@unit id=df.example version=1.0.0 profile=native program_version=1
@defaults qspace=H basis=computational regime=exact assume=finite_dimension error=exact conf=1.0
@frame id=F0000 parent=ROOT module=df.example
ID│LANE│OP│OUT│CTRL│IN│ARG│META
D0001│alloc│Q│q│_│_│1│res="logical_qubits=1";p=lctl:1.2
D0002│alloc│C│c│_│_│1│res="classical_bits=1";p=lctl:1.2
V00001│vm│REG│_│_│_│vm.op=MOVI;dst=R0;imm=1469598103934665603;mode=modular│p=quorum:vm5
V00002│vm│REG│_│_│_│vm.op=MOVI;dst=R1;imm=1099511628211;mode=modular│p=quorum:vm5
V00003│vm│REG│_│_│_│vm.op=MUL;dst=R0;a=R0;b=R1;mode=modular│p=quorum:vm5
V00004│vm│REG│_│_│_│vm.op=MOVI;dst=R3;imm=8701260594087458703;mode=modular│p=quorum:vm5
V00005│vm│REG│_│_│_│vm.op=XOR;dst=R0;a=R0;b=R3;mode=modular│p=quorum:vm5
V00006│vm│REG│_│_│_│vm.op=MUL;dst=R0;a=R0;b=R1;mode=modular│p=quorum:vm5
V00007│vm│REG│_│_│_│vm.op=MOVI;dst=R3;imm=15039870754224043385;mode=modular│p=quorum:vm5
V00008│vm│REG│_│_│_│vm.op=XOR;dst=R0;a=R0;b=R3;mode=modular│p=quorum:vm5
V00009│vm│REG│_│_│_│vm.op=MUL;dst=R0;a=R0;b=R1;mode=modular│p=quorum:vm5
V00010│vm│REG│_│_│_│vm.op=MOVI;dst=R3;imm=5535257408846457961;mode=modular│p=quorum:vm5
V00011│vm│REG│_│_│_│vm.op=XOR;dst=R0;a=R0;b=R3;mode=modular│p=quorum:vm5
V00012│vm│REG│_│_│_│vm.op=MOV;dst=R2;a=R0;mode=modular│p=quorum:vm5
V00013│vm│REG│_│_│_│vm.op=HALT│p=quorum:vm5
C9999│terminal│.│_│_│_│terminal=sealed_graph_end;justification=canonical_entry_sentinel│p=lctl:nop
@end
```

Because every embedded VM has 1,048,576-bit registers, the product's low 64 bits are
preserved whatever the wrap width, and the low 64 bits of the accumulator equal the 64-bit
witness exactly. The same rows therefore produce the same number on all four nodes and in
CPython, which is what the fabric's cross-node differential check compares.

**What the witness proves.** That the sealed row sequence survived lowering, compilation,
image construction, signing, signature check and native execution intact, under a declared
step budget, on this machine's own ISA. Any change to any cell, any reordering, insertion or
deletion of a row changes it (gate `A4`).

**What it does not prove.** Anything about quantum semantics. It does not simulate a
circuit, compute an amplitude, or produce a measurement distribution. A caller SHALL NOT
present it as an execution result for the quantum face of a bundle.

## 6. Bounds are refusals (translation rule T5)

| bound | value | source |
|---|---|---|
| instructions per image | 65535 | measured from the toolchain |
| rows per lowering | 21843 | (ceiling - 4) / 3 |
| step budget | 1000000 | the VM's CLI |
| shots | 1 | the witness is deterministic |
| qubits | 0 | the machine |

Gate `A5` shows `max_rows + 1` refused (with `feature_class: SUPPORTED_WITH_LIMITS` in the
detail) and `max_rows` executing.

Images are **not portable across nodes** (measured in the fabric container, gate `F7`); the
fabric distributes rows and lowers per node.

## 7. The physical firewall (translation rule T9)

`assert_not_physical()` runs in the constructor: trust domain outside
`(LOCAL_TRUSTED, LOCAL_UNTRUSTED)`, an execution label not beginning `CLASSICAL_`, a label
containing `QPU` / `HARDWARE` / `PHYSICAL` / `DEVICE` / `QUANTUM_EXECUTION`, or any
`physical_*` flag set to True is refused. Gate `A2` attacks it three ways.

## 8. Inherited blockers (translation rule T8)

Restated from README_START_HERE.md, CLAIM_BOUNDARY.md, vm/evidence/QUALIFICATION_REPORT.md, vm/world/spec/WORLD_CLAIM_BOUNDARY.md; binding this VM to the fabric closes none of them:

* physical distributed L9 subprofile CONDITIONAL_EXTERNAL_AUTHORITY (authenticated external adapter authority and physical receipts)
* production-domain fidelity and executable legacy-runtime equivalence not claimed (B001-B003)
* QVM production 5.0.0 gate PARTIAL: not self-hosted/native, key custody unaudited, no cross-platform, no 72-hour soak, no independent rebuild/replay
* world QP3/QP4/WQ4/AW4/production fabric BLOCKED

## 9. Ladders

`parallel_state NOT_CLAIMED`, `distributed_state NOT_CLAIMED` at node level (a node is one
worker); the fabric container reports at most `PARALLEL_EMULATION` and
`DISTRIBUTED_CLASSICAL_EMULATION`; `quantum_boundary NOT_CROSSED`; `physical_qpu`,
`physical_parallel`, `physical_distributed` False.

## 10. Roadmap (not implemented; stated so it is scope, not omission)

* **Classical-face execution.** The witness attests to the presence of the sealed rows; lowering the
  genuinely classical rows (measurement-feedback control flow, bit arithmetic, budget accounting)
  would let the VM execute the classical part of a bundle rather than checksum it
  (`BLOCKED_CAPABILITY_ABSENT`).
* **Loop-based lowering** to lift the 21843-row bound by orders of magnitude.
* **Bundle-driven fabric programs**: interpreting SPAWN / BARRIER / collective rows of a bundle
  as the fabric schedule (today `FABRIC.pal` is declarative and the three fabric programs are
  fixed).

## 11. Implementation status

| element | status |
|---|---|
| node declaration (NODE.pal verifies and seals) | `OPERATIONAL` |
| adapter ABI over this VM | `OPERATIONAL` (gates A1-A9) |
| row-sequence witness, native, differential-checked | `OPERATIONAL` (gate A3) |
| segmented witness | `OPERATIONAL` (fabric gate F6) |
| bounds as refusals | `OPERATIONAL` (gate A5) |
| physical firewall | `OPERATIONAL` (gate A2) |
| classical-face execution | `BLOCKED_CAPABILITY_ABSENT` |
| quantum-face execution | `UNSUPPORTED` (the machine has no qubit) |
| cross-machine federation | `BLOCKED` (`NETWORK=deny`) |
| physical quantum outputs | `BLOCKED_EXTERNAL_AUTHORITY` |
