# DF_Xtra_Large -- the embedded VM as measured on the assembly host

> Produced while profiling `Xtra_Large.zip` before translation (DF-PA21.2-1.0.0). Paths like `/home/claude/work/...` are the assembly host's scratch copies of the package; every claim below was observed there, and the reproducible parts are re-run by `./VERIFY` (gates N1, A1-A9) from the delivered bytes.

---

# Xtra_Large — QUORUM Generic Project LCTL/MSSL 2.1.0 (L4–L9 Open) + QUORUM Virtual Machine 5.0.0-candidate (QVM) + RC-PW 7.0 world

Profiled 2026-08-17 in the cloud sandbox (Linux 6.18.5-fc-v20 x86_64, Python 3.11.15, OpenJDK 21.0.10, `cryptography` 46.0.7, 2 vCPU).
Source (read-only): `/home/claude/work/vms/Xtra_Large` (5,513 files, 20,528,603 bytes content / ~42 MB on disk).
Gates were run in a copy at `/home/claude/work/build/Xtra_Large`; tree-mutating gates in a second copy `/home/claude/work/build/Xtra_Large_operational`.
Raw logs: `/home/claude/work/profiles/Xtra_Large_gates/*.log` (18 files, numbered in run order).

---

## 1. Identity

This container is **two things stacked**:

| Layer | Self-declared name / version | What it is |
|---|---|---|
| A. Repository | **QUORUM Generic Project — LCTL/MSSL L4–L9 Open 2.1.0 Candidate** (`MANIFEST.json` schema `QUORUM-GENERIC-PROJECT-L4-L9-OPEN/2.1`, release class `L4_L9_OPEN_QUALIFICATION_CANDIDATE`; release name `QUORUM_GENERIC_PROJECT_LCTL_MSSL_VIRTUAL_MACHINE_5.0.0_CANDIDATE_RCPW_7.0.0_582_OPERATIONAL_HOSTED_REFERENCE`) | A "reimagined" 66-module / 12-plane software repository expressed as **MSSL sealed semantic-authority documents** + **Columned LCTL-C execution plans**, with a Python **reference executor** that produces hash-derived deterministic receipts to declare qualification levels L0–L9 "OPEN". No domain code runs; the 612 legacy files (`legacy/source_repository/`, JA/DeepML/DMK material) are frozen evidence only. |
| B. `vm/` | **QUORUM Generic VM 5.0.0-candidate** ("QVM", `runtime_class HOSTED_REFERENCE_VM`), ISA 1 (24 opcodes), ABI 2, image format **QBRIM 2**, plus the **RC-PW 7.0 Reference-Centric Penteract World** hosted world subsystem (`world_extension_version 7.0.0-operational-reference-315`, world service semantic ABI 3) | A **hosted Python VM** (`vm/toolchain/quorum_vm.py`, 646 lines, stdlib + optional `cryptography`) that compiles Columned LCTL-C `.lctlc` guests (after passing them through the bundled **LCTL 1.6.1-RC1 Java column verifier**), signs canonical-JSON images with Ed25519, verifies them against a dev trust store, and executes them deterministically with per-step state hashing. World services 16–47 bridge guests to a deterministic "folded world" simulation in `vm/world/`. |

Lineage: the AUDIT_ERRATA and toolchain provenance (`registry/input_authorities.json`) show this was assembled from `project.zip` (generic project), `LCTL_1.6.1_RC1_...zip` (LCTL toolchain), `COLUMNED_LCTL_CORPUS_1.0.0.zip`, `MSSL_WRITERS_CORPUS_1.0.0.zip`, and the BOTTLE ROCKET 4.0.1→5.0.0 work-package series adapted into `vm/`. **The QVM is not binary- or source-compatible with the BOTTLE ROCKET VMs (Small/Medium/Large)** — see §4 and §9.

## 2. Runtime contract of the QVM (measured against `vm/toolchain/quorum_vm.py`, `vm/spec/*`)

**ISA 1, 24 opcodes** (ids 0..23): `NOP MOVI MOV ADD SUB MUL DIVU MODU AND OR XOR NOT SHL SHR LOAD STORE PUSH POP JMP JZ JNZ CMP SVC HALT`.
Per-instruction arithmetic mode `mode=modular|checked|saturating|exact` (default modular). Measured semantics: `modular` wraps negatives and >1,048,576-bit results mod 2^1048576; `saturating` clamps only over-wide results to `2^1048576-1` and **traps `TRAP_OVERFLOW "negative"` on negative results** (does not clamp to 0); `checked`/`exact` trap on both. `DIVU/MODU` by zero → `TRAP_DIV_ZERO`. `SHL/SHR` immediate > 1,048,576 → `TRAP_RESOURCE`.

**ABI 2 state**: `PC` (instruction index) + 16 unsigned registers `R0..R15` of **max 1,048,576 bits** (Python ints, lazily wide) + **4,096-byte memory** (little-endian `LOAD/STORE`, `width` 1..4096 bytes, address from register `a` or `imm`, value from `b`) + **256-word stack** (`PUSH a` / `POP dst`; over/underflow trap) + compare flag (`CMP a b` → -1/0/+1, **not consumed by any branch**; `JZ/JNZ` test a register) + virtual step clock + LCG PRNG state + optional world runtime. `entry` is always 0. Result convention: **R0 is the primary result register**; guest console output = SVC 1 appends low byte of R0 to a ≤4,096-byte buffer.

**Traps (16)**: BAD_IMAGE 1, SIGNATURE 2, ROLLBACK 3, BAD_OPCODE 4, BAD_REGISTER 5, DIV_ZERO 6, OVERFLOW 7, OOB_MEMORY 8, CAPABILITY 9, STACK_OVERFLOW 10, STACK_UNDERFLOW 11, BAD_BRANCH 12, RESOURCE 13, BAD_SERVICE 14, MALFORMED_SOURCE 15, VERIFY 16. CLI exit code = trap code; JSON `{"status":"TRAP","trap":..,"code":..,"detail":..}` on stderr. Non-trap exceptions → `{"status":"ERROR",...}` exit 70.

**Services (Device/Service ABI 2, semantic world ABI 3)** — `SVC svc=<id>`, capability-gated by the image's `capabilities.services` list; unknown/unauthorized → `TRAP_BAD_SERVICE`/`TRAP_CAPABILITY`:
- 0 noop; 1 console-byte (R0 low byte → output); 2 virtual clock → R0; 3 deterministic LCG → R0.
- 16–31 RC-PW world (init/advance/move-reference/spawn/entity-view/expand-frontier/archive/rehydrate/authority-well/digest/invariants/knowledge/succession/partition-migrate/inventory-transfer/summary); 32–47 operational-reference extension (canonical-verify/coherent-snapshot/scheduler-tick/resource-govern/atomic-reference/c2-entity-view/economic-transition/crime-law/materialize/frame-view/checkpoint/transition/traversal-plan/penteract/history-archive/semantic-graph). Inputs/outputs in R0–R5 (see `vm/world/spec/WORLD_SERVICE_ABI.md`); coordinates are signed-64 two's-complement inside the wide registers; world services before SVC 16 (WORLD_INIT) trap; per-call tick bound 100,000.
- No network device; no host file/env/socket/pointer access from guests. Separate bounded APDU reference endpoint (`quorum_vm.py apdu <hex>`: 00 ping→"PONG", 01 sha256, 02 version; ≤4,096 bytes).

**Resource limits**: program ≤ 65,535 instructions; default step budget **1,000,000** (`--max-steps`); output ≤ 4,096 bytes; memory 4,096; stack 256; APDU 4,096. **Note: the compiler grants every image full memory `[[0,4096]]` and all 36 services** (0–3, 16–47) — capabilities are not derived from source; to restrict them you must edit the payload before signing.

**Image format — QBRIM 2** (`vm/spec/BRIM_2.md`): a **canonical-JSON text document** `{"payload":{...},"signature":{...}}`. Payload fields: `magic:"QBRIM"`, `version:2`, `vm_version:"5.0.0-candidate"`, `isa_version:1`, `abi_version:2`, `word_bits`, `memory_bytes`, `stack_depth`, `program_version` (from `@unit program_version=`, default 1; rollback floor compares against it), `entry:0`, `instructions:[{op,dst,a,b,imm,width,svc,target,mode,source_row}]`, `source_sha256` (of the .lctlc bytes), `capabilities:{memory:[[base,len]],services:[...]}`. Signature: `{algorithm:"Ed25519", key_id, public_key(hex), signature(hex)}` over `json.dumps(payload, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode()`. Intermediate **QVM-BRIR/1** JSON (`--brir`) carries the same instruction list plus `source_unit`. Loader checks (fail-closed): payload+signature present, magic/version, ISA/ABI, key id in trust store and not revoked, public key equality, signature, `program_version >= --rollback-floor`, instruction count. Trust store `vm/keys/TRUST_STORE.json` (`QVM-TRUST/1`, profile `DEVELOPMENT_ONLY`, single key `dev-root` = `72cfd316…f5b5`); the **private seed ships in the package** (`vm/keys/DEV_ONLY_private_seed.hex`).

**How QBRIM differs from BOTTLE ROCKET BRIM/1**: BRIM/1 (Small/Medium/Large) is a binary 80-byte header (`BRIM` magic bytes, 16-byte instruction records, SHA-256 seal, optional 64-byte Ed25519 trailer, size ceilings ~51,200 B); QBRIM 2 is JSON with a symbolic instruction list and a detached-in-document Ed25519 signature over canonical JSON. Feeding a BOTTLE ROCKET `.brimg` (4.7.0 or 5.0.0) to the QVM fails with a generic `UnicodeDecodeError` (exit 70) rather than a clean `TRAP_BAD_IMAGE` (log 11). Non-QBRIM JSON → `TRAP_BAD_IMAGE`.

**Guest language — Columned LCTL-C 1.0 with the "COLUMNED LCTL QVM Profile 1"** (`vm/spec/LCTL_VM_PROFILE.md`), header exactly:
```
LCTLC/1.0
@unit id=<dotted.id> version=<x.y.z> profile=native [program_version=N] [entry=... target=... error_budget=... resource_ceiling=... proof=...]
@defaults qspace=H basis=computational regime=exact assume=finite_dimension error=exact conf=1.0      (optional)
@frame id=F0000 parent=ROOT module=<dotted.id>
ID│LANE│OP│OUT│CTRL│IN│ARG│META
D0001│alloc│Q│q│_│_│1│res="logical_qubits=1";p=lctl:1.2        (REQUIRED by the Java verifier: "no quantum register declared" otherwise)
D0002│alloc│C│c│_│_│1│res="classical_bits=1";p=lctl:1.2
V0001│vm│REG│_│_│_│vm.op=MOVI;dst=R1;imm=40│p=quorum:vm5
V0002│vm│REG│_│_│_│vm.op=MOVI;dst=R2;imm=2│p=quorum:vm5
V0003│vm│REG│_│_│_│vm.op=ADD;dst=R0;a=R1;b=R2;mode=exact│p=quorum:vm5
V0004│vm│REG│_│_│_│vm.op=HALT│p=quorum:vm5
C9999│terminal│.│_│_│_│terminal=sealed_graph_end;justification=canonical_entry_sentinel│p=lctl:nop   (optional for QVM)
@end
```
Columns are the LCTL-C 1.0 eight (`ID│LANE│OP│OUT│CTRL│IN│ARG│META`, U+2502 box-drawing separators — the same 8 column names as BOTTLE ROCKET's LCTLC/1.1–1.2, **but the magic must be `LCTLC/1.0`**; `LCTLC/1.1` and `LCTLC/1.2` are rejected on line 1 by both the QVM parser ("missing LCTLC/1.0") and the Java verifier ("bad magic; expected LCTLC/1.0")). VM instructions are rows with `LANE=vm`, `OP=REG` (canonical `REGION`) and the instruction encoded as `;`-separated key/values in `ARG`: `vm.op=`, `dst= a= b=` (R0–R15), `imm=` (int, `0x` ok), `width=` (LOAD/STORE bytes), `svc=`, `target=<label|index>`, `mode=`, `label=NAME` (a row with only `label=` is a pure label). All other lanes are ignored by the QVM compiler but must satisfy the canonical LCTL verifier. Non-vm rows lower to LCTL/1.3 canonical 18-cell QTUPLEs (`ROW¦FACE¦LANE¦QSPACE¦OP¦OUT¦CTRL¦A¦B¦PARAM¦TYPE¦BASIS¦REGIME¦ASSUME¦ERROR¦RESOURCE¦CONF¦PROOF`).

**Persistence** (library only, not on the CLI): dual-slot authenticated state (`save_state_dual/load_state_dual`, keyed BLAKE2s MAC, generation counter, atomic replace, corrupt-newest fallback).

## 3. The MSSL / κ-seal / Columned-LCTL plan machinery (what VERIFY_ALL checks)

- **MSSL** ("semantic authority") documents: 438 `*.mssl` files (2 `authority/`, 12 `planes/*/plane.mssl`, 66×6 = 396 `modules/*/authority/{module,io_contract,state_contract,operator_contract,policy_contract,invariants}.mssl`, 7 `vm/authority/`, 21 `vm/world/authority/`). Shape: `MSSL{\n α≡{format 0.3, profile basic_mssl.executable.3, record MSSL.Document}, ι≡"<id>", λ≡"<module>", ℛ≡{"0001":"module(..)","0002":"learn(\"k\",literal(..))",…}, π≡[], δ≡N, τ≡0, μ≡{learn.k: v}, ρ≡{assertions,emissions,prints}, χ≡[], η≡{events,state}, ν≡{}\n,κ≡"sha256:<hex>"\n}⇒⊤`. They are declarative fact records ("learn" statements: purpose, plane, legacy SHA-256, maturity, claim boundary, capability policy) — **not code**.
- **κ seal** = `sha256(bytes from 'α≡' up to ',κ≡')`; `validation/verify_repository.py` recomputes it for every `.mssl`, checks the envelope (`MSSL{\n` … `}⇒⊤\n`) and the presence of the 13 field tokens, then checks every line of the root `SHA256SUMS.txt`. `validation/reseal_tree.py` rewrites stale κ values and regenerates `SHA256SUMS.txt`.
- **Columned-LCTL plans**: 138 `.lctlc` sources (1 `execution/repository_fanout.lctlc` = 12 plane REGION rows + 10 scenario DEPENDENCY edges; 66 `modules/*/execution/module.lctlc` = 8–9 stage nodes `SOURCE→INSPECT→NORMALIZE→…→EVIDENCE` as `semantic│REG` rows + `control│DEP` edges + a `security│REG` policy row + `evidence│REG` receipt row + `C9999 terminal .` NOP sentinel; 66 `optimized.lctlc`; 4 `vm/src/*.lctlc`; 1 `vm/examples/all_opcodes.lctlc`) with 133 pre-lowered canonical `.lctl` (LCTL/1.3, `BUNDLE`/`QFRAME`/`QTUPLE` sections, deterministic frame/bundle seals). They are **execution-topology contracts** (typed graph rows), not executable programs; every one carries a dummy 1-qubit/1-bit allocation to satisfy the quantum verifier.
- **VERIFY_ALL.sh** = `verify_repository.py` (438 κ seals + 5,512 hashes) then one JVM `column-verify` per plan for `execution/*.lctlc` and `modules/*/execution/*.lctlc` (133 JVM launches; the LCTL 1.6.1-RC1 jar lowers 8-column → 18-cell canonical LCTL and runs its ownership/no-cloning/measurement-causality verifier). **`vm/src/*.lctlc` are NOT covered by VERIFY_ALL** (they are verified by `make -C vm qualify`/`test`).
- **VERIFY_DEEP_2_0_0.sh** = `run_qualification.py` (66 module packages have the 16 required files, graph manifest ≥8 nodes with n-1 edges, exactly one `│.│` NOP row with `justification=canonical_entry_sentinel`, MSSL seals, `evidence/LCTL_VERIFICATION_LEDGER.json` count 133 all_pass) + `verify_repository.py`.
- **VERIFY_L4_L9_OPEN_GATES.sh** = `qualification/verify_open_gate_evidence.py`: checks the shipped JSON evidence (`OPEN_GATE_SUMMARY_2.1.0.json` = 66/66/66/66/66 + 5/5; matrix; per-module `evidence/open_gate_2_1_0/{l4_nominal(PASS),l4_negative(DENIED),l4_edge,l5_source_differential(PASS),l6_replay(exact),l7_security(PASS),l8_performance(deterministic_result_hash),qualification_2_1_0}.json`; native index 66; 5 L9 scenarios PASS+exact_replay). It **does not execute anything** — the executor is `qualification/open_gate_runtime.py` (`REGENERATE_L4_L9_EVIDENCE.sh`), a Python "reference domain profile" that, per plane, derives outputs from SHA-256 digests of the fixture payload (e.g. `media_visual` renders an 8×8 PGM from digest bytes; `intent_reasoning` confidence = `(d[0]+1)/256`). "L4–L9 OPEN" therefore means "a runnable, deterministic, hash-bound reference path exists" — the package says so itself (CLAIM_BOUNDARY.md).

## 4. Capabilities matrix (QVM as a fabric target)

| Capability | Verdict | Evidence / notes |
|---|---|---|
| Compile source | **YES** — `.lctlc` (LCTLC/1.0 QVM profile) → QVM-BRIR/1 → QBRIM 2 payload; Java canonical verify optional (`--skip-lctl-verify` really skips the JVM; payload byte-identical either way) | logs 10, 12, 18 |
| Sign images | **YES** — Ed25519 (`cryptography` backend, or pure-Python RFC 8032 with `QVM_PURE_PYTHON_ED25519=1`; signatures byte-identical) with the shipped dev seed or `keygen` keys | logs 10, 11-I |
| Trust chain | **PARTIAL** — flat trust store (key_id → public key, `revoked` flag, `production:false`), rollback floor, tamper/unknown-key/revoked rejection all measured; **no** root→issuer→release chain, no HSM, dev private key is in the package | logs 11-C/D/E, `vm/spec/SECURITY.md` |
| Device ABI / services | **YES (virtual only)** — 4 legacy services + 32 world services, capability-gated; no network/file/clock/entropy devices | log 06/07, `vm/spec/DEVICE_ABI.md` |
| Deterministic replay | **YES** — per-step `state_sha256` trace, snapshot `state_sha256`/`trace_sha256`; RUN_VM/RUN_WORLD_FULL/`make verify` reproduced shipped artifacts byte-for-byte; L4–L7/L9 reference evidence regenerated byte-identical (log 16) | logs 04, 05, 07, 16 |
| Step bound | **YES** — `--max-steps` (default 1,000,000) → `TRAP_RESOURCE "step limit"`; measured 50-step cutoff and 1e6-step cutoff (28.7 s) | log 11-F/G |
| Persistence | library-only dual-slot authenticated state (tested by test_17) | `vm/tests/test_vm.py` |
| Multi-instance isolation | yes (separate `VM` objects; test_19) | |
| Network | none (deny-by-default, `network_boundary.json` scans for socket/urllib/requests) | |

## 5. Toolchain + dependencies

- **Python 3** (tested 3.11.15), stdlib only for `quorum_vm.py`; **optional `cryptography`** (46.0.7 here; ~5× faster sign/verify per CLI call, ~1000× in-process).
- **Java 21** JRE for `toolchain/lctl_1_6_1_rc1/runtime/bin/lctl-hyperfederated.jar` (151,094 B, `Main-Class: LctlHyperFederatedMain`, built 2026-08-11 with JDK 21.0.11; 43 classes: LctlColumnMain, LctlFabricMain, LctlFederatedMain, LctlHyperFederatedMain, LctlMain, LctlMeshMain). Launcher `toolchain/lctl_1_6_1_rc1/START_LCTL_1_6_1.sh <cmd> [args]`; the QVM calls it via `sh START_LCTL_1_6_1.sh column-verify <abs path>` with `cwd` = tool dir, 60 s timeout, and requires exit 0. `column-selftest` → 512/512 PASS in 0.25 s. Only needed for `compile` without `--skip-lctl-verify`, `VERIFY_ALL.sh`, `RESEAL_AFTER_VM_GATE.sh`, `make -C vm verify|test|qualify|operational` (the Makefile's compile step does not pass `--skip-lctl-verify`; `tests/test_vm.py` test_01/02/16 call the verifier), `RUN_WORLD*.sh`; NOT needed for `RUN_VM.sh`, `verify`, `run`, or `compile --skip-lctl-verify`. No license was supplied with the LCTL toolchain (`toolchain/lctl_1_6_1_rc1/LICENSE`).
- `make` (GNU) for `vm/Makefile`; POSIX `sh`; `sha256sum` for manual integrity.
- Sandbox note: `JAVA_TOOL_OPTIONS` proxy settings print one stderr line per JVM launch (removed from logs; harmless).

## 6. Entry points and exact commands (sensible order; all relative to package root)

1. `sha256sum -c SHA256SUMS.txt` — 5,512-entry root manifest (covers every file except itself).
2. `sh validation/VERIFY_ALL.sh` — κ seals + hashes + 133 JVM plan verifications (≈25 s here).
3. `sh validation/VERIFY_DEEP_2_0_0.sh` — 66 module package structure + NOP policy + ledgers.
4. `sh validation/VERIFY_L4_L9_OPEN_GATES.sh` — checks the shipped L4–L9 evidence JSON (no execution).
5. `make -C vm verify test` — compile CORE.lctlc (JVM) → sign → verify → 20 unit/adversarial tests. (`make -C vm world-test` adds 25+15 world tests; `python3 vm/world/tests/test_operational_reference.py` adds 30.)
6. `sh vm/RUN_VM.sh` — verify+run `vm/deploy/CORE.signed.brimg`, write `vm/evidence/last_run_{snapshot,trace}.json`.
7. `sh vm/RUN_WORLD.sh` — compile+sign+run `vm/src/WORLD_DEMO.lctlc` (world services 16–26). **Mutates 4 manifest-bound files** (see §9).
8. `sh vm/RUN_WORLD_FULL.sh` — same for `WORLD_FULL.lctlc` (services 32–47).
9. `sh vm/RUN_REMEDIATE_26.sh` (= `remediate_26.py` + `qualify_world.py`) and `sh vm/RUN_REMEDIATE_315.sh` (= `qualify_315.py`, MANIFEST "operational_entrypoint") — regenerate world qualification evidence (tree-mutating).
10. `make -C vm operational` (verify test world-test sanitize world-qualify qualify) then **`sh validation/RESEAL_AFTER_VM_GATE.sh`** (runs `make operational`, `reseal_tree.py`, `VERIFY_ALL.sh`, `VERIFY_L4_L9_OPEN_GATES.sh`) — the only supported way to run the full VM gate and keep the tree consistent. `sh validation/REGENERATE_L4_L9_EVIDENCE.sh` regenerates the module reference evidence (needs reseal afterwards).
Toolchain direct: `sh toolchain/lctl_1_6_1_rc1/START_LCTL_1_6_1.sh column-verify|column-compile|column-stats|column-selftest ...`.
QVM CLI (`python3 vm/toolchain/quorum_vm.py`): `compile SRC OUT --brir BRIR [--skip-lctl-verify]`, `keygen --private P --public Q [--seed HEX]`, `sign PAYLOAD --key SEEDFILE [--key-id ID] --out IMG`, `verify IMG --trust TS [--rollback-floor N]`, `run IMG --trust TS [--rollback-floor N] [--max-steps N] [--trace T] [--snapshot S]`, `apdu HEX`, `selftest`, `inspect SRC [--skip-lctl-verify]`, `--version`.

## 7. Gate results measured here (build copy; exit codes / wall time; see logs)

| # | Command | Exit | Time | Result |
|---|---|---|---|---|
| 01 | `timeout 1200 sh validation/VERIFY_ALL.sh` | 0 | 24.8 s | `PASS: MSSL seals and repository hashes verified (438 MSSL documents)`; `PASS: all Columned LCTL plans lowered and canonical-verified` (133 JVM launches) — **claim reproduced** |
| 02 | `sh validation/VERIFY_L4_L9_OPEN_GATES.sh` | 0 | 0.05 s | `PASS: L4-L9 gates OPEN; L4-L8 module reference profiles 66/66; L9 local/offline scenarios 5/5; native core index 66/66` |
| 03 | `sh validation/VERIFY_DEEP_2_0_0.sh` | 0 | 0.42 s | PASS 66 packages / MSSL seals / NOP policy / 133-source ledger + PASS hashes |
| 04 | `make -C vm verify test` | 0 | 1.36 s | compile PASS (lctl PASS, source sha b823da05…), sign PASS (image sha cfcc20cd…), verify PASS (12 insns), **20/20 tests OK (0.78 s)**; `deploy/CORE.*` regenerated **byte-identical** — claim reproduced |
| 05 | `sh vm/RUN_VM.sh` | 0 | 0.11 s | HALTED pc=12 steps=12, R0=0x41, R3=R4=R6=0xc, output "A", state_sha256 `2b0de78c…`; outputs byte-identical to shipped evidence |
| 06 | `sh vm/RUN_WORLD.sh` | 0 | 0.51 s | compile/sign PASS, run HALTED 18 steps, world tick 20 / 4 regions / 7 entities / 6 ledger events; **but overwrote 4 stale manifest-bound files → `verify_repository.py` FAILS afterwards** (log 06b) |
| 07 | `sh vm/RUN_WORLD_FULL.sh` | 0 | 0.52 s | HALTED 36 steps, world regions 3 / entities 7; outputs byte-identical to shipped |
| 08 | `make -C vm world-test` | 0 | 1.34 s | 25 + 15 tests OK |
| 09 | `python3 vm/world/tests/test_operational_reference.py` | 0 | 0.16 s | 30 tests OK |
| 10 | programmatic 40+2 (compile→sign→verify→run) | 0 | 0.27/0.10/0.10/0.10 s per CLI step | **R0 = 42** (`registers_hex[0]="0x2a"`, 4 steps, HALTED); `--skip-lctl-verify` 0.10 s vs 0.27 s with JVM, payload identical |
| 11 | negatives / interop | as expected | — | BR BRIM binaries → ERROR 70; tamper → TRAP_SIGNATURE 2; unknown key → 2; rollback → 3; wrong version → TRAP_BAD_IMAGE 1; step limit → 13; LCTLC/1.1,1.2 rejected; pure-Python Ed25519 sign 0.43 s / verify 0.51 s vs 0.10 s |
| 12 | in-process library drive | 0 | compile 0.194 s (JVM) / ~0 (skip); sign 4 ms; verify 0.3 ms; run 0.3 ms | R0 = 42; wide-word 2^1001 exact OK; VMTrap surfaces as exception |
| 13 | `sha256sum -c SHA256SUMS.txt` (source dir) | 0 | 0.10 s | **5,512 OK / 0 FAILED**; manifest complete (5,513 files = 5,512 + itself) — claim reproduced |
| 14 | 2nd copy: `make -C vm operational` | 0 | 12.1 s | all sub-gates PASS (qualify: OPERATIONAL, production_gate PARTIAL, 15 checks, 957 reqs 928/13/16; qualify_world 267/315/0); **24 files changed** (evidence with timings/logs) → root manifest FAIL until reseal |
| 15 | 2nd copy: `sh validation/RESEAL_AFTER_VM_GATE.sh` | 0 | 36.1 s | `SHA256SUMS.txt regenerated: 5512 entries; MSSL seals repaired: 0` → VERIFY_ALL PASS, L4-L9 PASS, `PASS: VM gate, MSSL seals, root manifest, L4-L9 evidence all consistent` |
| 16 | 2nd copy: `sh validation/REGENERATE_L4_L9_EVIDENCE.sh` | 0 | 0.95 s | 66/66 ×5 + 5/5 again; **67 files changed = 66 `l8_performance.json` (timing fields only; `deterministic_result_hash` unchanged) + the matrix**; all L4/L5/L6/L7/L9 evidence byte-identical |
| 17 | 2nd copy: `sh vm/RUN_REMEDIATE_315.sh` | 0 | 5.6 s | `{"counts":{"OPERATIONAL":582,"PARTIAL":0,"BLOCKED":0,"REGRESSED":0},"families_pass":20,"golden":80,"promoted":315,"status":"PASS"}`; rewrites `world/evidence/qualification_summary.json` |
| 18 | dialect probes | — | — | alloc rows required by JVM verifier; terminal row optional; `saturating` traps on negative |
| — | `START_LCTL_1_6_1.sh column-selftest` | 0 | 0.25 s | 512/512 PASS |

Prior-audit claims checked: "5,512/5,512 hashes" ✔; "VERIFY_ALL passes (438 κ seals + Columned-LCTL plans, one JVM per plan)" ✔; "`make -C vm verify test` = 20 tests" ✔; "`--skip-lctl-verify` avoids the JVM" ✔ (0.10 s, `lctl: SKIPPED`); "Ed25519 via cryptography, pure-Python fallback with `QVM_PURE_PYTHON_ED25519=1`" ✔ (identical signatures); "`make operational` regenerates deploy/evidence and requires RESEAL" ✔ (24 files, reseal restores PASS); "needs Java + Python 3 (+ optional cryptography)" ✔.

## 8. How to drive it programmatically as a fabric target

CLI pipeline (each step ≈0.1 s process overhead; JVM verify adds ≈0.17 s):
```
python3 vm/toolchain/quorum_vm.py compile job.lctlc job.payload.json --brir job.brir.json [--skip-lctl-verify]
python3 vm/toolchain/quorum_vm.py sign job.payload.json --key vm/keys/DEV_ONLY_private_seed.hex --key-id dev-root --out job.signed.brimg
python3 vm/toolchain/quorum_vm.py verify job.signed.brimg --trust vm/keys/TRUST_STORE.json [--rollback-floor N]
python3 vm/toolchain/quorum_vm.py run job.signed.brimg --trust vm/keys/TRUST_STORE.json --max-steps 1000000 --snapshot job.snapshot.json --trace job.trace.json
```
Result parse: stdout (and `--snapshot` file) is JSON `{"status":"HALTED"|"RUNNING","pc","steps","state_sha256","registers_hex":[16 hex strings],"memory_sha256","stack_depth","output_b64","trace_sha256"[,"world":{...}]}` → `int(snapshot["registers_hex"][0],16)` is R0 (42 in the probe); console bytes in `output_b64`; `--trace` file = list of `{step,pc,op,next_pc,state_sha256}`. Traps: non-zero exit = trap code, JSON on stderr. In-process: `importlib` `quorum_vm.py`, `compile_source(Path, VM_ROOT, require_lctl)` → `sign_payload(payload, seed, key_id)` → `verify_image(img, trust, rollback_floor)` → `VM(payload, max_steps).run()` → `vm.regs[0]` (log 12). Note the in-process `VM()` accepts any payload dict (verification is a separate call) — the fabric must call `verify_image` itself.
Bounds: ≤65,535 instructions; ≤1,000,000 steps default (≈35 k steps/s in this sandbox because every step SHA-256-hashes the whole state into the trace; a 1e6-step run took 28.7 s and produced a trace list of 1e6 entries in memory); registers up to 2^1048576 (a full-width register serialises to a 262,146-char hex string in the snapshot); memory 4,096 B; stack 256; output 4,096 B; world tick ≤100,000 per SVC 17. Guests must be `LCTLC/1.0` with at least the two `alloc` rows if the JVM verifier is used; QVM guests written for BOTTLE ROCKET (`LCTLC/1.1`/`1.2`) will not parse. Java is only required on the compile path with verification.

## 9. Self-reported status / blockers (verbatim)

- Root README: "L4: **OPEN** — 66/66 … L9: **OPEN** — 5/5 local/offline cross-plane scenarios PASS with exact replay; distributed simulator profile retained. The physical distributed L9 subprofile remains conditional on authenticated external adapter authority and physical receipts. Production-domain fidelity and executable legacy-runtime equivalence are not claimed."
- CLAIM_BOUNDARY.md: "These claims do **not** assert production-domain fidelity, executable legacy-runtime equivalence, physical multi-QPU execution, or external production certification. The physical distributed subprofile remains conditional on authenticated external adapters and receipts."
- `qualification/UNRESOLVED_BLOCKER_LEDGER.json`: B001 "Domain-specific operators are semantically modeled but not implemented as native runtime effects." (blocks L4/L8/L9); B002 "No executable runtimes for preserved DeepML/JA/DMK legacy sources are bundled." (L5); B003 "Cross-plane scenarios are typed topology contracts, not full domain execution." (L9).
- `qualification/open_gates/L4_L9_OPEN_GATE_MATRIX_2.1.0.json` L9: `"physical_distributed_profile": "CONDITIONAL_EXTERNAL_AUTHORITY"`, `"production_domain_operational_certification": "NOT_CLAIMED"`; L5 `"runtime_differential_profile": "UNAVAILABLE_NO_LEGACY_EXECUTABLE"`.
- QVM `vm/evidence/QUALIFICATION_REPORT.md`: "Local hosted VM status: **OPERATIONAL** / Production 5.0.0 final gate: **PARTIAL**" — unresolved blockers: "QVM ISA semantics are not upstream-native LCTL primitives/self-hosted; production cryptography/key custody not independently audited; cross-platform qualification not run; 72-hour soak not run; independent rebuild not run; independent replay not run." Workflow application: 138 work packages, 957 atomic requirements, "Status counts: {'OPERATIONAL': 928, 'PARTIAL': 13, 'BLOCKED': 16}".
- `vm/spec/CLAIM_BOUNDARY.md` "Not claimed": bare-metal/UEFI boot; self-hosted LCTL/MSSL compiler; production HSM key custody / audited crypto; physical power-loss guarantees; 72-hour soak; independent clean-room rebuild/replay; Windows/macOS/bare-metal qualification; physical distributed/QPU authority.
- `vm/spec/SECURITY.md`: "The bundled Ed25519 implementation … is **not constant-time and is not an independently audited production cryptographic implementation**. The included private key is explicitly development-only".
- World (`vm/world/evidence/qualification_summary.json` as shipped): `full_rcpw_7_application_gate: PARTIAL`, `local_hosted_world_status: OPERATIONAL`, profiles QP0/QP1 OPERATIONAL, QP2 PARTIAL, QP3/QP4 BLOCKED, WQ3 PARTIAL, WQ4 BLOCKED, AW2/AW3 PARTIAL, AW4 BLOCKED, MULTI_WORKER PARTIAL, PRODUCTION_DISTRIBUTED_FABRIC BLOCKED; golden worlds 21/80 executed; workflow 267 OPERATIONAL / 315 PARTIAL. After `RUN_REMEDIATE_315.sh` (log 17): 582/0/0, 80/80 golden, profile `QP1/WQ3/AW3/WP4_HOSTED_REFERENCE_OPERATIONAL`, and the claim boundary "does not assert QP3 production target-hardware scale, production multi-host deployment, WQ4/AW4 production-world qualification, complete native upstream-LCTL self-hosting, or QP4 external-party certification."
- LCTL toolchain README: "The 1-hour, 8-hour, and 24-hour soak gates remain `NOT_RUN`. Physical parallel/distributed QPU execution and physical multi-QPU federation remain `BLOCKED_EXTERNAL_AUTHORITY`."
- AUDIT_ERRATA.md (Aug 2026): F9 two "ISA 4.1" lineages in BOTTLE ROCKET; F12 corpus negatives; "No VM in this set can execute the Columned-LCTL corpus … Each VM accepts only its own dialect."

## 10. Files of note

`README_START_HERE.md`, `MANIFEST.json`, `SHA256SUMS.txt`, `AUDIT_ERRATA.md`, `CLAIM_BOUNDARY.md`, `QUALIFICATION_MODEL.md`, `ARCHITECTURE.md`; `validation/{VERIFY_ALL.sh,verify_repository.py,reseal_tree.py,RESEAL_AFTER_VM_GATE.sh,VERIFY_L4_L9_OPEN_GATES.sh,VERIFY_DEEP_2_0_0.sh,REGENERATE_L4_L9_EVIDENCE.sh,LCTL_VERIFICATION_LEDGER.json,MSSL_VERIFICATION_LEDGER.json}`; `qualification/{open_gate_runtime.py,verify_open_gate_evidence.py,run_qualification.py,UNRESOLVED_BLOCKER_LEDGER.json,open_gates/*}`; `toolchain/lctl_1_6_1_rc1/{START_LCTL_1_6_1.sh,runtime/bin/lctl-hyperfederated.jar,language/LCTL_C_1_0_SPEC.md,LICENSE}`; `registry/{modules.json,planes.json,CAPABILITY_GRAPH.json,input_authorities.json}`; `execution/repository_fanout.lctlc`; `modules/NN_name/{authority/*.mssl,execution/module.lctlc,evidence/open_gate_2_1_0/*}`; `vm/{README_START_HERE.md,Makefile,CHANGELOG.md,RUN_VM.sh,RUN_WORLD.sh,RUN_WORLD_FULL.sh,RUN_REMEDIATE_26.sh,RUN_REMEDIATE_315.sh}`; `vm/toolchain/quorum_vm.py`; `vm/spec/{VM_SPEC.json,ISA.md,ABI.md,BRIM_2.md,DEVICE_ABI.md,LCTL_VM_PROFILE.md,SECURITY.md,PERSISTENCE.md,CLAIM_BOUNDARY.md}`; `vm/src/{BOOT,CORE,WORLD_DEMO,WORLD_FULL}.lctlc` (BOOT and CORE are byte-identical); `vm/examples/all_opcodes.lctlc`; `vm/deploy/{CORE.brir.json,CORE.payload.json,CORE.signed.brimg}`; `vm/keys/{TRUST_STORE.json,DEV_ONLY_private_seed.hex,DEV_ONLY_public_key.hex}`; `vm/tests/test_vm.py`; `vm/qualification/qualify.py`; `vm/evidence/{QUALIFICATION_REPORT.md,qualification_summary.json,RELEASE_MANIFEST.json,determinism.json,benchmark.json}`; `vm/world/{world_runtime.py,operational_reference.py,spec/WORLD_SERVICE_ABI.md,spec/WORLD_CLAIM_BOUNDARY.md,qualification/{qualify_world.py,qualify_315.py,remediate_26.py,headless_verify.py},evidence/qualification_summary.json}`; `vm/workflow_application/WORKFLOW_APPLICATION_REPORT.md`.

## 11. Surprises / inconsistencies found

1. **`vm/RUN_WORLD.sh` breaks the root manifest on a pristine tree**: shipped `vm/world/evidence/WORLD_DEMO.{payload.json,signed.brimg,snapshot.json,trace.json}` are stale (payload grants services 0–3,16–31 = 20; current compiler grants 36; snapshot world version `7.0.0-applied` vs runtime `7.0.0-operational-reference-315`), so the README-recommended demo rewrites 4 files that `SHA256SUMS.txt` binds and `verify_repository.py`/`VERIFY_ALL.sh` fail until `reseal_tree.py` is run. Same defect class as audit finding F3 (fixed for `deploy/CORE.*` but not for `WORLD_DEMO.*`). `RUN_VM.sh`, `RUN_WORLD_FULL.sh` and `make -C vm verify` regenerate byte-identical files.
2. **Two qualifiers fight over `vm/world/evidence/qualification_summary.json` and `QUALIFICATION_REPORT.md`**: `qualify_world.py` (run by `make operational`/`RESEAL`) writes 267 OPERATIONAL/315 PARTIAL, golden 21/80, `7.0.0-applied-remediated-26`; `qualify_315.py` (`RUN_REMEDIATE_315.sh`) writes 582/0, golden 80/80. The shipped tree carries the former, while `MANIFEST.json`, `README_START_HERE.md`'s "…267 OPERATIONAL, 315 PARTIAL…" paragraph, `QUORUM_RCPW_7_315_PARTIAL_REMEDIATION_REPORT.md` and `world/spec/WORLD_CLAIM_BOUNDARY.md` describe the latter. README itself contradicts MANIFEST (267/315 vs 582/0).
3. **QVM workflow counts disagree**: `vm/workflow_application/WORKFLOW_APPLICATION_REPORT.md` and `MANIFEST.json.vm_extension` say OPERATIONAL 531 / PARTIAL 410 / BLOCKED 16; `WORKFLOW_APPLICATION_LEDGER.json`, `vm/evidence/QUALIFICATION_REPORT.md` and a fresh `make operational` say 928 / 13 / 16.
4. **Spec docs lag the code**: `vm/spec/VM_SPEC.json`, `ABI.md`, `DEVICE_ABI.md` list world services 16–31 and world_extension `7.0.0-applied`; the compiler/VM implement 16–47 and report `7.0.0-operational-reference-315` (documented only in `WORLD_SERVICE_ABI.md`'s ABI-3 section). `SECURITY.md` still describes only the pure-Python Ed25519.
5. `vm/src/BOOT.lctlc` and `CORE.lctlc` are byte-identical; `deploy/` only holds CORE.
6. `L4–L9 OPEN` rests on a hash-derived reference executor (`open_gate_runtime.py`) — outputs like "render_artifact" 8×8 PGM pixels or "decision confidence" are functions of SHA-256 digests of the fixture, by design ("reference domain profile"). The package states this boundary repeatedly; a fabric should not read L4–L9 OPEN as executable domain behaviour.
7. `evidence/environment.json` (shipped) records `Linux-6.18.5-fc-v20-x86_64`, Python 3.11.15 — the same kernel/Python as this sandbox, i.e. the shipped VM evidence was regenerated in an environment like this one during the audit remediation.
8. Compiler ignores `@unit entry=` (payload `entry` is always 0), grants all 36 services and full memory to every image, and accepts a `HALT` in mid-program silently; `CMP` sets a flag no branch reads. `saturating` mode traps on negative results instead of clamping to 0.
9. Loader is not fully "fail-closed by trap": a binary (non-UTF-8) image raises a generic `UnicodeDecodeError` (exit 70) rather than `TRAP_BAD_IMAGE`.
10. `verify_repository.py` and `sha256sum -c` cover every file except `SHA256SUMS.txt`; `RESEAL_AFTER_VM_GATE.sh` reported "MSSL seals repaired: 0" — the seven stale κ seals from audit finding F2 are already fixed in this shipped tree.
11. `vm/src/*.lctlc` are not part of `VERIFY_ALL.sh`'s JVM loop (they are covered by `make -C vm test/qualify`).
12. Content size is 20.5 MB (not 42 MB; the latter is on-disk usage from 5,513 small files).
