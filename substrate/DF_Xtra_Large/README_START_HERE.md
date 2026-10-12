# DF_Xtra_Large -- START HERE

**DF-PA21.2-1.0.0** · fabric node **`N_XLARGE`** · QUORUM VM 5.0.0-candidate inside QUORUM LCTL/MSSL 2.1.0

## What this is

This is the user's `Xtra_Large.zip` container VM -- 5,513 files: a Python-hosted VM (QVM ISA 1 / ABI 2, QBRIM 2 signed JSON images, LCTLC/1.0 with the bundled LCTL 1.6.1-RC1 Java column verifier) inside the L4-L9 Open 2.1.0 qualification repository (438 kappa-sealed MSSL documents, 133 Columned-LCTL plans) --
**translated into a distributed-fabric container VM** in the language defined by
the PA21.2 corpora (PA-LCTL 1.6.x, the *hyperfederated execution fabric*).

The VM package itself is embedded **byte-identical** under `vm/QUORUM_LCTL_MSSL_2.1.0/`
(pinned by `node/PAYLOAD_DIGEST.json`; nothing inside it was edited). Around it, this
container adds what the fabric needs to treat the VM as a **node**:

* `node/NODE.pal` -- the node declared as a PA-LCTL bundle (federation `DF0`, domain
  `D_QVM`, worker group `G_QVM1`, node `N_XLARGE`), which parses, verifies
  and seals under the reference core, and whose own witness the node computes on itself;
* `node/NODE_DESCRIPTOR.json` -- the fabric-facing description: worker, resource limits,
  feature classes (adapter spec s3 vocabulary), bounds, self-reported blockers;
* `adapter/dfabric/` -- the PA-LCTL target adapter (`PA-LCTL/TARGET_ADAPTER/1`) that binds
  this VM as a **classical** target, in the shape of the corpora's own
  `pacore.adapters.bottlerocket`, failing closed;
* `core/` -- the PA-LCTL reference core, spec set and examples, carried byte-identically
  from the corpora and pinned by `core/PACORE_DIGEST.json` (the same digest appears in all
  five DF containers);
* `BUILD` / `VERIFY` / `RUN` -- the three entry points every DF container exposes.

The governing rule, inherited from the corpora:

> No item is operational because its source file exists. Operational status requires native executable evidence satisfying that item's promotion gate.

## Capability matrix

| capability | this node |
|---|---|
| compile source | yes -- LCTLC/1.0 QVM profile (`quorum_vm.py compile`, JVM column-verify by default, `--skip-lctl-verify` without Java) |
| sign images | yes -- Ed25519 QBRIM 2 (`sign` with the shipped DEV_ONLY key, `verify` against TRUST_STORE.json with a rollback floor) |
| trust chain | flat trust store (key_id -> public key) with rollback floor; dev key ships in the package |
| device ABI | services 0-3 legacy + 16-47 RC-PW world (semantic world ABI 3); no network device |
| deterministic replay | yes (every step SHA-256-hashes the VM state into the trace; runs byte-identical to shipped evidence) |
| step bound | `--max-steps` (default 1,000,000; TRAP_RESOURCE beyond) |
| guest dialect | LCTLC/1.0 (COLUMNED LCTL QVM Profile 1; vm-lane REG rows) |
| result register | `R0` (low 64 bits) |
| rows per witness lowering | **21843** (65535-instruction image ceiling; 3 instructions per row + 4) -- exceeding it is a refusal |
| qubits | **0** -- every quantum feature classifies `UNSUPPORTED`; `native_gate_set()` is empty |
| trust domain | `LOCAL_TRUSTED` (never `PHYSICAL_TARGET_AUTHENTICATED`) |
| execution label | `CLASSICAL_HOSTED_VM_BOUNDED_EXECUTION` |

## The three entry points

```
./BUILD                 compile the embedded VM in place (vm/<package>/.build); no-op where nothing compiles
./VERIFY [--full]       hashes, manifest, schemas, citations, core selfcheck, the VM's own gate (in a scratch copy),
                        then the adapter battery; exit non-zero on any FAIL; a missing dependency is SKIPPED with a reason
./RUN <program>         a .pal bundle -> its row-sequence witness executed natively on this VM (and checked against
                        the CPython reference); a native LCTLC/1.0 program -> compiled, signed, verified, run
```

Windows twins: `BUILD.cmd`, `VERIFY.cmd`, `RUN.cmd` (the C toolchain gates then report
SKIPPED unless `make`/`cc`/OpenSSL are on the PATH). Everything is offline; nothing opens a
socket (`NETWORK=deny`, `BACKEND=none`).

Examples:

```
./RUN examples/01_bell_pair.pal          # witness of the corpora's Bell-pair example on this VM
./RUN examples/add42.lctlc                # a native guest program: result register = 42
./RUN node/NODE.pal                      # this node witnesses its own declaration
python3 -B adapter/dfabric/cli.py node-attest
```

`REQUIREMENTS.txt` declares the toolchain; `VERIFY` checks it **first**.

## Measured on the assembly host, from the delivered bytes

`conformance/DF_GATE_RESULTS.json` (logs in `conformance/logs/`):

| gate | statement | result | time |
|---|---|---|---|
| `G0.1` | container SHA256SUMS.txt verifies (every delivered byte) | **SKIPPED** | 0.0s |
| `G0.2` | MANIFEST.json inventory matches disk (paths, sizes, digests; no extras) | **SKIPPED** | 0.0s |
| `G0.3` | embedded VM payload byte-identical to the pinned digest (source zip content) | **PASS** | 0.272s |
| `G0.4` | core/pacore tree digest equals the pinned digest (one core, many consumers) | **PASS** | 0.003s |
| `G2` | every JSON artifact validates against the schema shipped beside it | **PASS** | 0.003s |
| `G3` | every evidence citation in the capability ledger resolves to a delivered path | **PASS** | 0.0s |
| `G1` | reference core selfcheck (python3 -B -m reference.pacore.cli selfcheck) -> SELFCHECK_PASS | **PASS** | 0.582s |
| `N0` | toolchain preflight against REQUIREMENTS.txt | **PASS** | 0.0s |
| `N1` | the VM's own build (stock flags) and its own acceptance gate reproduce | **PASS** | 25.319s |
| `A1` | adapter attestation (PA-LCTL/TARGET_ADAPTER/1): LOCAL_TRUSTED, CLASSICAL_ label, no physical flag, empty gate set | **PASS** | 0.001s |
| `A2` | physical-evidence firewall: three physical claims are refused at construction | **PASS** | 0.0s |
| `A3` | row-sequence witness executes natively and agrees with the CPython reference on 7 bundles | **PASS** | 4.193s |
| `A4` | witness sensitivity: cell change, row reorder, row delete, row insert each change the native witness | **PASS** | 3.074s |
| `A5` | stated bounds are refusals: max_rows+1 refused (SUPPORTED_WITH_LIMITS), max_rows executes | **PASS** | 0.658s |
| `A6` | declared step budget is enforced: an unbounded loop traps (BUDGET / TRAP_RESOURCE) instead of running | **PASS** | 0.58s |
| `A7` | deterministic replay: the same rows lower to the same source and image and produce the same witness twice | **PASS** | 1.258s |
| `A8` | shots > 1, a wrong QCIR-P2 schema and an empty row list are refused, never answered | **PASS** | 0.001s |
| `A9` | a native LCTLC/1.0 program (examples/add42.lctlc) runs and returns 42 | **PASS** | 0.605s |
| `A12` | the bundled LCTL 1.6.1-RC1 column verifier (JVM) verified the lowered unit before compilation | **PASS** | 0.0s |

**17 passed, 0 failed, 2 skipped** in 37.201 s on `Linux-6.18.5-fc-v20-x86_64-with-glibc2.39` (Python 3.11.15, `/usr/bin/cc`).

`G0.1`/`G0.2` cannot run before the seal (this results file is part of what they hash); they passed in the
post-seal `./VERIFY` recorded in the delivery's `_assembly/` folder, and they run first in every `./VERIFY` on your machine.

The VM's own build and acceptance gate, run with its stock flags in a scratch copy of the
embedded payload (`sh validation/VERIFY_ALL.sh ; sh validation/VERIFY_L4_L9_OPEN_GATES.sh ; make -C vm verify test`; 5,512/5,512 hashes, 438 MSSL kappa seals, 133 JVM plan verifications; L4-L9 evidence 66/66 x5 + 5/5; QVM compile/sign/verify + 20 tests):

| step | result | time |
|---|---|---|
| `own_gate` | exit 0 | 23.72s |
| `own_gate_l4_l9` | exit 0 | 0.051s |
| `vm_verify_test` | exit 0 | 1.456s |
| `own_sums` | exit 0 | 0.092s |

Row-sequence witnesses executed natively on this VM and compared with the CPython reference
(`pacore.adapters.brlower.reference_witness`):

| bundle | rows | native witness (`R0` low 64) | differential |
|---|---|---|---|
| `01_bell_pair.pal` | 12 | `17360368901394384785` | agree |
| `02_ghz3.pal` | 15 | `6735235137199922533` | agree |
| `03_two_lane_parallel.pal` | 16 | `2035133056847448988` | agree |
| `04_distributed_teleport.pal` | 15 | `11114974373231215855` | agree |
| `05_measurement_feedback.pal` | 14 | `1825703198280153005` | agree |
| `06_noise_density.pal` | 14 | `725229432034669365` | agree |
| `NODE.pal` | 18 | `5900255704340570516` | agree |

Native guest program `examples/add42.lctlc`: `R0` = **42**.

## What is not claimed

* **Quantum execution.** The VM has no qubit. The witness proves that the sealed row
  sequence survived lowering, compilation, signing and native execution intact under a
  declared step budget; it proves nothing about quantum semantics (`spec/DF_NODE_SPEC.md` s5).
* **Physical anything.** `PHYSICAL_PARALLEL_QPU_EXECUTION` and
  `PHYSICAL_DISTRIBUTED_QPU_EXECUTION` remain `BLOCKED_EXTERNAL_AUTHORITY`; the adapter's
  constructor refuses any physical claim (gate `A2`).
* **Cross-machine federation.** `NETWORK=deny`: the fabric is a model of a federation
  executed on one host with local processes (`PA_LCTL_FABRIC_SPEC.md` s1).
* **The target's own blockers**, inherited verbatim from README_START_HERE.md, CLAIM_BOUNDARY.md, vm/evidence/QUALIFICATION_REPORT.md, vm/world/spec/WORLD_CLAIM_BOUNDARY.md and not
  lifted by binding it to the fabric:
  * physical distributed L9 subprofile CONDITIONAL_EXTERNAL_AUTHORITY (authenticated external adapter authority and physical receipts)
  * production-domain fidelity and executable legacy-runtime equivalence not claimed (B001-B003)
  * QVM production 5.0.0 gate PARTIAL: not self-hosted/native, key custody unaudited, no cross-platform, no 72-hour soak, no independent rebuild/replay
  * world QP3/QP4/WQ4/AW4/production fabric BLOCKED

`reports/DF_BLOCKED_REGISTER.md` lists everything else that is not operational, with a reason.

## Things worth knowing about this VM (measured)

* `vm/RUN_WORLD.sh` rewrites four manifest-bound WORLD_DEMO.* files, so the repository's own VERIFY_ALL fails afterwards until `validation/reseal_tree.py`; the DF container never runs it against the sealed payload (VERIFY uses a scratch copy).
* Shipped world qualification counts disagree between files (267/315 vs 582/0); both are restated, neither is adjudicated here.
* The QVM rejects BOTTLE ROCKET BRIM/1 binaries and LCTLC/1.1-1.2 sources; it is a different machine.
* Execution is ~35k steps/s (each step hashes the state): the witness of a 240-row bundle takes ~0.7 s; a million steps ~29 s.

## Layout

```
README_START_HERE.md    this file
MANIFEST.json           DF/PACKAGE_MANIFEST/1: identity + full inventory with sha256
SHA256SUMS.txt          digest of every delivered file (sha256sum -c)
LICENSE                 as the corpora: all rights reserved, (c) Russell Philip Smithson
REQUIREMENTS.txt        declared toolchain; VERIFY checks it first
BUILD BUILD.cmd         VERIFY VERIFY.cmd         RUN RUN.cmd
node/                   NODE.pal, NODE_SEAL.json, NODE_DESCRIPTOR.json, PAYLOAD_DIGEST.json
adapter/dfabric/        the adapter + fabric runtime (identical in every DF container)
core/                   reference/pacore (PA-LCTL 1.6.x core), spec/ (30 documents), examples/, PACORE_DIGEST.json
vm/QUORUM_LCTL_MSSL_2.1.0/
                        the original container VM, byte-identical
spec/                   DF_NODE_SPEC.md (this node in fabric terms), DF_LANGUAGE_MAP.md
examples/               the corpora's 6 .pal programs + native add42.lctlc / loop_forever.lctlc
schemas/                JSON schemas for every DF artifact (VERIFY validates against them)
conformance/            DF_GATE_RESULTS.json + logs/ (measured here)
reports/                DF_CAPABILITY_LEDGER.json/.md, DF_BLOCKED_REGISTER.md, VM_PROFILE_MEASURED.md, EVIDENCE_INDEX.md
corpus/                 DF_Xtra_Large_Translation_Corpus.jsonl.gz (+ CORPUS_NOTES.md): each translated claim as a record
authority/              DF_SOURCE_AUTHORITY.json: the corpora and the source zip, by digest, and the translation rules
provenance/             DF_PROVENANCE.json
```

## Provenance

| | |
|---|---|
| source container | `Xtra_Large.zip` -- sha256 `cea7cb3704c24e89cc95470b721faaf38aa54ac597530a50e5a9ee0700e8d4ca` (8407854 bytes) |
| embedded payload | 5513 files, 20528603 bytes, tree digest `f782f75c8cd8d181...` |
| language corpora | the 22 PA21.2 packages (+ PA21.2_EVIDENCE) as delivered on worklaptop1, digests in `authority/DF_SOURCE_AUTHORITY.json` |
| core carried | PA-LCTL 1.6.0-rc1 reference core from `PA_Language_PA21.2/reference` (identical in all 22 packages), digest `046a9930c61b1d5a...` |
| release | DF-PA21.2-1.0.0 |

The other three node containers and `DF_Fabric` (which federates all four) follow exactly the
same layout; `DF_Fabric/DF_INDEX.md` is the one-page index of the set.
