# DF_Medium -- START HERE

**DF-PA21.2-1.0.0** · fabric node **`N_MEDIUM`** · BOTTLE ROCKET 5.0.0 (frozen 4.7.0 core, ISA 4.1)

## What this is

This is the user's `Medium.zip` container VM -- the reference: LCTLC/1.1 front end, native semantic verifier, independent BRIM verifier, Ed25519 signing, BRTM/1 trust chain, Device ABI 1.0, 88/96 requirements OPERATIONAL with 8 external blockers named --
**translated into a distributed-fabric container VM** in the language defined by
the PA21.2 corpora (PA-LCTL 1.6.x, the *hyperfederated execution fabric*).

The VM package itself is embedded **byte-identical** under `vm/BOTTLE_ROCKET_5.0.0_VM_110K_RC/`
(pinned by `node/PAYLOAD_DIGEST.json`; nothing inside it was edited). Around it, this
container adds what the fabric needs to treat the VM as a **node**:

* `node/NODE.pal` -- the node declared as a PA-LCTL bundle (federation `DF0`, domain
  `D_BR`, worker group `G_ISA41`, node `N_MEDIUM`), which parses, verifies
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
| compile source | yes -- Columned LCTL, LCTLC/1.1 (`bradmin verify-lctlc` / `lctl-to-brir` / `compile-lctlc`) |
| sign images | yes -- Ed25519 (`bradmin keygen` / `sign-image` / `verify-image` / `run-signed`) |
| trust chain | yes -- BRTM/1 Root -> Issuer -> Release -> Image (root private key not packaged; secure bundles cannot be minted here) |
| device ABI | Device ABI 1.0, 8 device classes, per-run quotas; no network device by default |
| deterministic replay | yes (release/bin rebuilt bit-identical; replay/EXPECTED checked) |
| step bound | 4096 steps in the CLI (trap 24); `max_steps` in the unit header is provenance |
| guest dialect | LCTLC/1.1 (Columned LCTL, native C compiler brlctlc) |
| result register | `R2` (low 64 bits) |
| rows per witness lowering | **84** (256-instruction image ceiling; 3 instructions per row + 4) -- exceeding it is a refusal |
| qubits | **0** -- every quantum feature classifies `UNSUPPORTED`; `native_gate_set()` is empty |
| trust domain | `LOCAL_TRUSTED` (never `PHYSICAL_TARGET_AUTHENTICATED`) |
| execution label | `CLASSICAL_NATIVE_VM_BOUNDED_EXECUTION` |

## The three entry points

```
./BUILD                 compile the embedded VM in place (vm/<package>/.build); no-op where nothing compiles
./VERIFY [--full]       hashes, manifest, schemas, citations, core selfcheck, the VM's own gate (in a scratch copy),
                        then the adapter battery; exit non-zero on any FAIL; a missing dependency is SKIPPED with a reason
./RUN <program>         a .pal bundle -> its row-sequence witness executed natively on this VM (and checked against
                        the CPython reference); a native LCTLC/1.1 program -> compiled, signed, verified, run
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
| `G0.3` | embedded VM payload byte-identical to the pinned digest (source zip content) | **PASS** | 0.012s |
| `G0.4` | core/pacore tree digest equals the pinned digest (one core, many consumers) | **PASS** | 0.003s |
| `G2` | every JSON artifact validates against the schema shipped beside it | **PASS** | 0.002s |
| `G3` | every evidence citation in the capability ledger resolves to a delivered path | **PASS** | 0.0s |
| `G1` | reference core selfcheck (python3 -B -m reference.pacore.cli selfcheck) -> SELFCHECK_PASS | **PASS** | 0.586s |
| `N0` | toolchain preflight against REQUIREMENTS.txt | **PASS** | 0.0s |
| `N1` | the VM's own build (stock flags) and its own acceptance gate reproduce | **PASS** | 21.32s |
| `A1` | adapter attestation (PA-LCTL/TARGET_ADAPTER/1): LOCAL_TRUSTED, CLASSICAL_ label, no physical flag, empty gate set | **PASS** | 0.001s |
| `A2` | physical-evidence firewall: three physical claims are refused at construction | **PASS** | 0.0s |
| `A3` | row-sequence witness executes natively and agrees with the CPython reference on 7 bundles | **PASS** | 0.21s |
| `A4` | witness sensitivity: cell change, row reorder, row delete, row insert each change the native witness | **PASS** | 0.145s |
| `A5` | stated bounds are refusals: max_rows+1 refused (SUPPORTED_WITH_LIMITS), max_rows executes | **PASS** | 0.032s |
| `A6` | declared step budget is enforced: an unbounded loop traps (BUDGET / TRAP_RESOURCE) instead of running | **PASS** | 0.029s |
| `A7` | deterministic replay: the same rows lower to the same source and image and produce the same witness twice | **PASS** | 0.062s |
| `A8` | shots > 1, a wrong QCIR-P2 schema and an empty row list are refused, never answered | **PASS** | 0.001s |
| `A9` | a native LCTLC/1.1 program (examples/add42.lctlc) runs and returns 42 | **PASS** | 0.028s |
| `A10` | equivalence with the corpora's own adapter: lowering byte-identical to pacore.adapters.brlower and identical witness via pacore.adapters.bottlerocket | **PASS** | 0.062s |
| `A11` | the corpora's own backend suite (pamath/tests/test_bottlerocket_backend.py, 30 checks) passes against this node | **PASS** | 0.137s |

**18 passed, 0 failed, 2 skipped** in 22.667 s on `Linux-6.18.5-fc-v20-x86_64-with-glibc2.39` (Python 3.11.15, `/usr/bin/cc`).

`G0.1`/`G0.2` cannot run before the seal (this results file is part of what they hash); they passed in the
post-seal `./VERIFY` recorded in the delivery's `_assembly/` folder, and they run first in every `./VERIFY` on your machine.

The VM's own build and acceptance gate, run with its stock flags in a scratch copy of the
embedded payload (`make operational`; 40 semantic cases, ISA/ABI conformance (32 opcodes, 20 services, 14 traps), wide-state 59/59, device I/O 66/66, secure execution R2.low64=42, source boundary 107,675/110,000, BRIM 272/51,200):

| step | result | time |
|---|---|---|
| `build` | exit 0 | 11.887s |
| `own_gate` | exit 0 | 9.423s |
| `own_sums` | exit 0 | 0.009s |

Row-sequence witnesses executed natively on this VM and compared with the CPython reference
(`pacore.adapters.brlower.reference_witness`):

| bundle | rows | native witness (`R2` low 64) | differential |
|---|---|---|---|
| `01_bell_pair.pal` | 12 | `17360368901394384785` | agree |
| `02_ghz3.pal` | 15 | `6735235137199922533` | agree |
| `03_two_lane_parallel.pal` | 16 | `2035133056847448988` | agree |
| `04_distributed_teleport.pal` | 15 | `11114974373231215855` | agree |
| `05_measurement_feedback.pal` | 14 | `1825703198280153005` | agree |
| `06_noise_density.pal` | 14 | `725229432034669365` | agree |
| `NODE.pal` | 18 | `6166177028250500253` | agree |

Native guest program `examples/add42.lctlc`: `R2` = **42**.

## What is not claimed

* **Quantum execution.** The VM has no qubit. The witness proves that the sealed row
  sequence survived lowering, compilation, signing and native execution intact under a
  declared step budget; it proves nothing about quantum semantics (`spec/DF_NODE_SPEC.md` s5).
* **Physical anything.** `PHYSICAL_PARALLEL_QPU_EXECUTION` and
  `PHYSICAL_DISTRIBUTED_QPU_EXECUTION` remain `BLOCKED_EXTERNAL_AUTHORITY`; the adapter's
  constructor refuses any physical claim (gate `A2`).
* **Cross-machine federation.** `NETWORK=deny`: the fabric is a model of a federation
  executed on one host with local processes (`PA_LCTL_FABRIC_SPEC.md` s1).
* **The target's own blockers**, inherited verbatim from PACKAGE_INFO.json (`strict_gate: BLOCKED`, 88/96 OPERATIONAL, 8 BLOCKED) and not
  lifted by binding it to the fabric:
  * independent second-machine/operator replay
  * independent second-machine/operator rebuild
  * literal 72-hour native soak
  * AArch64 and Windows execution qualification
  * final 100% evidence ledger dependent on those proofs

`reports/DF_BLOCKED_REGISTER.md` lists everything else that is not operational, with a reason.

## Things worth knowing about this VM (measured)

* Units must declare `version=4.7.0` and `image_version=9`: 5.0.0 is a qualification overlay on the frozen 4.7.0 executable core.
* The Core-61 figure is 48,264 B in the re-sealed evidence and 49,072 B in the README (both under 61,000).
* This is the target the corpora's own adapter (`pacore.adapters.bottlerocket`) binds; the DF adapter reproduces its lowering byte for byte.

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
vm/BOTTLE_ROCKET_5.0.0_VM_110K_RC/
                        the original container VM, byte-identical
spec/                   DF_NODE_SPEC.md (this node in fabric terms), DF_LANGUAGE_MAP.md
examples/               the corpora's 6 .pal programs + native add42.lctlc / loop_forever.lctlc
schemas/                JSON schemas for every DF artifact (VERIFY validates against them)
conformance/            DF_GATE_RESULTS.json + logs/ (measured here)
reports/                DF_CAPABILITY_LEDGER.json/.md, DF_BLOCKED_REGISTER.md, VM_PROFILE_MEASURED.md, EVIDENCE_INDEX.md
corpus/                 DF_Medium_Translation_Corpus.jsonl.gz (+ CORPUS_NOTES.md): each translated claim as a record
authority/              DF_SOURCE_AUTHORITY.json: the corpora and the source zip, by digest, and the translation rules
provenance/             DF_PROVENANCE.json
```

## Provenance

| | |
|---|---|
| source container | `Medium.zip` -- sha256 `fcc7ec8e027d187fa00ab7bc7bb9e69a98f35c362931bc6a6b636541ce9f9c1a` (578137 bytes) |
| embedded payload | 241 files, 1513315 bytes, tree digest `887f41e99771bd09...` |
| language corpora | the 22 PA21.2 packages (+ PA21.2_EVIDENCE) as delivered on worklaptop1, digests in `authority/DF_SOURCE_AUTHORITY.json` |
| core carried | PA-LCTL 1.6.0-rc1 reference core from `PA_Language_PA21.2/reference` (identical in all 22 packages), digest `046a9930c61b1d5a...` |
| release | DF-PA21.2-1.0.0 |

The other three node containers and `DF_Fabric` (which federates all four) follow exactly the
same layout; `DF_Fabric/DF_INDEX.md` is the one-page index of the set.
