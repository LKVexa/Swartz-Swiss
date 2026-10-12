# DF_Medium -- the embedded VM as measured on the assembly host

> Produced while profiling `Medium.zip` before translation (DF-PA21.2-1.0.0). Paths like `/home/claude/work/...` are the assembly host's scratch copies of the package; every claim below was observed there, and the reproducible parts are re-run by `./VERIFY` (gates N1, A1-A9) from the delivered bytes.

---

# Profile: Medium — BOTTLE ROCKET 5.0.0 Columned-LCTL VM (qualification candidate over frozen 4.7.0 core)

Profiled in the cloud sandbox on 2026-08-16. Source (read-only, untouched — SHA256SUMS re-verified 240/240 OK after all steps):
`/home/claude/work/vms/Medium/BOTTLE_ROCKET_5.0.0_VM_110K_RC`.
Built + measured in: `/home/claude/work/build/Medium/BOTTLE_ROCKET_5.0.0_VM_110K_RC` (+ hand-run scratch in `/home/claude/work/build/Medium/handrun`).
Logs: `/home/claude/work/profiles/Medium_gates/` (raw `*.log` are verbatim; `*.compact.log` truncate the 35 KB minified-source lines that GCC echoes in its notes).

## Identity
- **Package**: `BOTTLE_ROCKET_5.0.0_VM_110K_RC` — PACKAGE_INFO: "BOTTLE ROCKET 5.0.0 Columned LCTL Fully Operational VM Qualification Candidate", release `5.0.0-qualification-candidate`, distribution `RELEASE_CANDIDATE`. 241 files, 1,513,315 bytes.
- **VM name / versions**: **BOTTLE ROCKET**. The *package* is 5.0.0; the *executable contract* is the frozen **4.7.0** core (`BR_VERSION 4.7.0`, `BR_CORE_ABI 0x00040700`, native image version 9; MANIFEST.json still says `release: 4.9.0`, `version: 4.7.0`). 4.8/4.9/5.0 are qualification/release-engineering overlays; no executable format changed after 4.7.
- **What it is**: an offline, deterministic, capability-gated **classical integer VM written in C11**, with a native **Columned LCTL (LCTLC/1.1) compiler**, an independent BRIM verifier, Ed25519 image signing, a BRTM/1 Root→Issuer→Release→Image trust chain, transactional persistence (BRCR/1, BRGD/1), an APDU protocol, and a Device ABI 1.0 (8 device classes). 1,048,576-bit registers. No qubits, no network, no floating point.
- **Self-reported status**: `strict_gate: BLOCKED` — **88/96** BR-500 atomic requirements OPERATIONAL, **8 BLOCKED** (all external evidence: independent machine/operator replay + rebuild, 72-hour soak, AArch64/Windows, and the dependent 100% ledger item). Repository-local qualification is claimed PASS. Release manifest is Ed25519-signed by a qualification key (private half not packaged).
- **Audit context**: `AUDIT_ERRATA.md` (F9–F12) — "ISA 4.1" here = the 32-opcode/20-service set (NOT binary compatible with Large.zip's 41-opcode "BR/1.1"; LCTLC/1.1 vs 1.2 reject each other on line 1); sources are minified (single 35,170-char line in brvm.c); evidence ledgers are toolchain-bound (GCC 13.3/OpenSSL 3.0.13 — exactly this sandbox's toolchain, which is why everything reproduced bit-for-bit here).

## Runtime contract
- **Chain**: `LCTLC/1.1 -> BRIR/1.1 -> BRIM/1+BRPV/1 -> BRTM/1; ISA 4.1; ABI 1.0; Device ABI 1.0; BRCR/1; BRGD/1; core ABI 0x00040700` (PACKAGE_INFO/RELEASE_FREEZE_5_0.json/adapter all agree).
- **Word**: **1,048,576 bits** = 16,384 × u64 limbs = 131,072 bytes; descriptor-backed (ZERO/SMALL/SPARSE/DENSE/CONST, copy-on-write, lazy allocation — a fresh VM struct is 22,304 bytes, no 128 KiB preallocation). Per-VM wide-byte ceiling 4,194,304; stack-byte ceiling 1,048,576; scratch 262,144.
- **Registers**: 16 (R0–R15), 16 capability registers (C0–C15; LCTLC only allows `C0` — dynamic C is rejected), 8-entry immutable constant pool. **Stack** 256 words. **Call stack** 64. **Memory** 4,096 bytes (LOAD/STORE/LDX/STX move 64-bit scalars, 8-byte aligned, `SCALAR64` width).
- **ISA 4.1 — 32 opcodes**: NOP MOVI MOV JMP JZ JNZ HALT | ADD SUB MUL DIVU MODU AND OR XOR NOT SHL SHR CMP | LOAD STORE | PUSH POP | SVC | CALL RET | YIELD TRAP CAPQ CHECKPOINT | LDX STX. Feature flags CALL_RET=1 INDEXED_MEMORY=2 SYSTEM=4 STRICT_ALIGN=8 SERVICE_ABI=16 TRAP_TABLE=32 (all=63). 4 arithmetic modes: WRAP, CHECKED, SATURATE, TRAPPING. CMP sets ZERO/LESS/GREATER flags; JZ/JNZ branch on ZERO.
- **Capabilities (8 bits)**: CONTROL=1 ARITH=2 MEMORY=4 STACK=8 SERVICE=16 STATE=32 UPDATE=64 DIAG=128. Opcode class → required cap; a unit's `requested_caps` must **exactly equal** the derived set (both "cap excess" and "caps mismatch" are compile-time rejections).
- **ABI 1.0 / 20 services** (SVC): YIELD STATUS REVOKE DELEGATE CONFIGURE COMMIT DIAG_EVENT SHA256 ED25519_VERIFY DEVICE_CALL CONSOLE_READ CONSOLE_WRITE STORAGE_READ STORAGE_WRITE ENTROPY MONOTONIC TIMER DIAGNOSTIC MAILBOX DEVICE_ENUM. R0–R3 args, R0–R1 returns, R2–R7 scratch, R8–R15 preserved.
- **Traps**: 32 typed IDs (0 = none); 14 required classes (illegal_opcode, malformed_instruction, invalid_register, invalid_memory, access_violation, capability_violation, divide_by_zero, arithmetic_overflow, stack_overflow, stack_underflow, resource_exhaustion, execution_budget, device_error, signature_failure). Observed: DIVU/0 → `trap=6`; budget exhaustion → `trap=24` (EXEC_BUDGET); untrusted BRTM bundle → `trap=14` (TRUST). Status: READY 0, RUNNING 1, HALTED 2, TRAPPED 3, CANCELLED 4, SUSPENDED 5.
- **Instruction encoding**: 16 bytes — `op, mode, rd, ra, rb, cap, flags(u16), imm(u64)` little-endian.
- **Image format BRIM/1 (+BRPV/1)**: 80-byte header `"BRIM"|isa_major=4|isa_minor=1|abi_major=1|flags(1=FACTORY,2=SIGNED,4=PROVENANCE)|image_abi=1|20|16|16|32|4|hdr=80(u16)|image_version(u32)|requested_caps(u32)|ext_len(u32)=96|code_count(u16)|data_len(u16)|SHA-256(payload)[32]|"Q17-BRVM-ISA41"`; payload = code (16 B × n) + data (≤4096) + **BRPV/1 96-byte provenance** (`"BRPV"`, compiler/verifier 0x00040700, `max_steps`, derived caps, **sha256(source)**, **sha256(BRIR)**, image_version, features|isa_minor<<16|abi_major<<24); optional trailing 64-byte Ed25519 signature. Ceilings: 51,200 bytes (BRIM-51, enforced by writer, inspector and loader), 51,616 for secure images. **Largest image the native compiler can emit is 8,368 B (8,432 signed)** — measured here with 256 instructions + 4,096 data bytes.
- **BRIR/1.1**: text; header `BRIR/1.1`, `unit=…|language=LCTLC/1.1|isa=4.1|abi=1.0|features=0x..|image=9|max_steps=N|declared=0x..|derived=0x..`, optional `data=HEX`, then rows `idx|ID|OP|MODE|Rd|Ra|Rb|Cn|imm|need=0x..|succ=..|line=..|stack=..|call=..`. `brverify --disasm` reproduces the semantic columns (roundtrip gate).
- **BRTM/1 secure bundle (.brsb)**: 416-byte trust trailer, Root→Issuer→Release→Image, anti-rollback, revocation, expiry, capability binding. Root public key is compiled into `src/brtrust.c`; recovery needs a signed BRCT/1 control (128 B). Production `brctl` runs **only** .brsb bundles (`brctl run` does not exist; `secure-run` only).
- **Device ABI 1.0**: console 0x4701, block 0x4702, monotonic 0x4703, entropy 0x4704, clock 0x4705, mailbox 0x4706, diagnostics 0x4707, network 0x4708 (optional, absent by default, never implicit). Per-run quotas 64 calls / 8,192 B / 16 writes / 8 entropy / mailbox depth 4; packet 256 B (net 512 B). Deterministic replay substitutes entropy, monotonic/wall time, mailbox; console read → empty.
- **Guest language — Columned LCTL, LCTLC/1.1** (`src/brlctlc.c`, native C, 20,283 B). Exact grammar accepted by the parser:
  - line 1: `LCTLC/1.1` (LCTLC/1.0 → "language version" reject); `#` comments and blank lines allowed; no leading/trailing whitespace; **no tabs, no CR/CRLF**; only ASCII plus `│` (U+2502) and `›` (U+203A) — ASCII `|` and `>` are accepted as equivalents (the shipped semantic tests use them).
  - `@unit id=<id> version=4.7.0 profile=brvm-native [entry=..] [target=..] [backend=..] [network=deny] [replay=..] image_version=<1..2^32-1> requested_caps=A|B|.. max_steps=<1..1e9> termination=bounded` — only those keys are allowed; `version` must be `4.7.0`; `profile` must be `brvm-native`; `termination` must be `bounded`; `network`, if present, must be `deny`.
  - `@defaults mode=WRAP|CHECKED|SATURATE|TRAPPING width=WIDE` (width must be WIDE), then `@frame id=.. parent=.. module=..`, then the canonical header row `ID│LANE│OP│OUT│CTRL│IN│ARG│META`, then rows, then `@end`.
  - Row: 8 non-empty whitespace-free columns. `ID` starts uppercase/`_` (≤31 chars, unique), `LANE` starts lowercase/`_`. `CTRL` must be `C0`. `IN` is `_`, `Ra`, or `Ra›Rb`. `ARG` typed: `u64:N` (MOVI; supports one `+ * & | ^` fold, e.g. `u64:40+2`), `u32:N` (SHL/SHR/TRAP/LDX/STX), `label:ID` (JMP/JZ/JNZ/CALL/RET — RET names the instruction after its CALL), `mem:N` (LOAD/STORE; 8-aligned ≤ 4088), `svc:NAME`, `cap:Cn`, `hex:..` (DATA rows: `DATA│MEMORY[off]│_│_│hex:AABB..│_`, uppercase hex, before any executable row). `META`: `_` for control ops (NOP/JMP/JZ/JNZ/HALT/CALL/RET/YIELD/TRAP/CHECKPOINT); `width=SCALAR64` for LOAD/STORE/LDX/STX; `width=WIDE` (+ optional `mode=…` only on ADD/SUB/MUL/DIVU/MODU/SHL/SHR, and `mode` must come before `width`) for everything else.
  - Static verification before emission: CFG targets in range, every instruction reachable, **every path reaches HALT/TRAP** ("no terminal" — an unconditional infinite loop cannot compile), consistent data/call-stack depth at merges, RET site validity, shift < 2^20, service id < 20, requested caps == derived caps.
  - Bounds: **256 instructions** (N05; 257 → "row limit"), **512 source lines** (ALINES), **512 chars/line** (LLEN; longer → "line size"), 256 labels, 4,096 data bytes.

## Capabilities matrix
| Capability | Present | Evidence measured here |
|---|---|---|
| Compile source | **YES** | `bradmin/brctl verify-lctlc`, `lctl-to-brir`, `compile-lctlc` on hand-written units and on brlower output; 40-case semantic suite PASS; deterministic (`repro` gate `cmp` identical; GCC/Clang O0/O2/O3 emit the same BRIM sha `7cfd6d6c…`). |
| Sign images | **YES** | `bradmin keygen` (Ed25519 via OpenSSL, 32-B raw keys), `sign-image` (+64 B), `verify-image`, `run-signed` — all PASS on hand-built image and in gates. Admin/host-evaluation keys only. |
| Trust chain | **YES, root not mintable here** | BRTM/1 chain enforced: shipped `.brsb` → `brctl verify-secure/secure-run` PASS `R2.low64=42`; a bundle built with fresh root/issuer/release keys is rejected `trap=14` (TRUST). Root private key is deliberately not packaged, so **new production bundles cannot be created from this package**; only the two shipped bundles (4.7.0 image, 4.6.0 legacy) run under production `brctl`. |
| Device ABI | **YES** | 66-requirement Device-I/O conformance PASS (also under ASan/UBSan); static boundary audit PASS; APDU `serve` loop exercised (HELLO/STATUS/EXEC/STATE) on a POSIX state adapter; network absent by default. |
| Deterministic replay | **YES** | Deterministic HAL adapter is what `bradmin run/run-signed` use; replay substitution requirements PASS (BR-470-05/06/07/13-R04); byte-identical rebuilds of BRIR/BRIM/provenance/brctl/brverify/core objects vs shipped. |
| Step bound | **YES (fixed at CLI)** | `br_vm_run(vm, budget)`; CLI `run`/`run-signed`/`secure-run` hard-code **4096** (6,005-step program → `status=3 trap=24 result=FAIL`, exit 1); APDU EXEC accepts a u32 budget. Unit `max_steps` is recorded in BRPV provenance but **not enforced at runtime by the CLI** (305-step program with `max_steps=8` ran to completion). Bounded termination is additionally enforced statically ("no terminal"). |

## Toolchain + dependencies
- **Requires**: POSIX/Linux, C11 compiler (`cc`), GNU make, **OpenSSL 3 libcrypto** (`-lcrypto`: EVP SHA-256, EVP Ed25519 raw keys, `RAND_bytes`, `OPENSSL_cleanse`), Python 3 (provenance tool, all qualification/evidence scripts, spec-sync), binutils (`strip`, `nm`), `awk/sed/grep/cmp/sh/bash`; `br490-memory` additionally needs **GNU `/usr/bin/time`** (undocumented — absent in this sandbox, so that one target fails). Optional: clang (cross_platform_repro), valgrind (environment probe only).
- **Measured against**: gcc 13.3.0 (Ubuntu 13.3.0-6ubuntu2~24.04.1), clang 18.1.3, OpenSSL 3.0.13, GNU Make 4.3, Python 3.11.15, x86-64 Linux 6.18.5 — the same toolchain the evidence ledgers were sealed with (`evidence/ENVIRONMENT_5_0.json`).
- **Stock flags** (no overrides used): `CFLAGS = -std=c11 -O2 -Wall -Wextra -Werror -fno-common -fstack-protector-strong`, `CPPFLAGS = -Isrc -Ihost`, core objects add `-DBR_PRODUCTION -ffreestanding`; sanitizer targets `-O1 -g -fsanitize=address,undefined -fno-omit-frame-pointer`; Core-61 measurement `-Os … -ffreestanding` + `strip --strip-unneeded`. Build is warning-clean under `-Werror`; GCC only prints notes that column tracking was disabled for the minified lines.
- **Boundary**: `src/brvm.c` (freestanding core) must not reference stdio/openssl/sockets — enforced by the `boundary` gate (grep + `nm`).

## Entry points and exact commands
- **Build**: `make` (target `all`) → `.build/brvm-core.o .build/brtrust-core.o .build/brctl .build/bradmin .build/brverify .build/br_tests .build/br_sizes` (12.3 s here). `.build/bradmin` and `.build/brverify` — the two files the PA-LCTL adapter needs — are produced by the default target.
- **Package acceptance gate**: `make operational` = `acceptance` (test image boundary repro roundtrip compatibility signed-smoke semantic-test spec-sync isa-conformance wide-conformance constant-fold secure-acceptance device-conformance device-audit + `bradmin run` R2=42) + `size`. Full REPRODUCE_5_0.md sequence: `make clean operational; make sanitize; make br500-local; python3 qualification/br500_acceptance.py; python3 evidence/verify_br500.py; python3 qualification/br500_release_bundle.py --verify`.
- **Other make targets**: `bench`; `sanitize wide-sanitize device-sanitize` (ASan/UBSan); `qualification` (needs fixtures segregated out of this lean RC → fails); `br480-independent br480-differential br480-opcode br480-property br480-fuzz br480-image-attacks br480-cross br480-soak-fast br480-security`; `br490-freeze br490-profiles br490-hardening br490-core61 br490-brim51 br490-memory br490-performance br490-manifest br490-docs br490-replay-check br490-local-conformance br490-rc-local`; `profile-{development,testing,production,constrained,diagnostic,recovery}`; `br500-environment br500-local br500-acceptance br500-evidence br500-release-check`; `clean`.
- **`bradmin`** (development/admin CLI, `host/bradmin.c`, non-production build; exit 0 ok / 1 fail / 2 usage):
  ```
  bradmin verify-lctlc SRC | lctl-to-brir SRC BRIR | compile-lctlc SRC IMAGE [--image-version N] |
          inspect-image IMAGE | run IMAGE |
          keygen PRIVATE PUBLIC | sign-image INPUT OUTPUT PRIVATE |
          secure-sign INPUT OUTPUT ROOT_PRIV ISSUER_PRIV RELEASE_PRIV EPOCH GENERATION TXSEQ [EXPIRY] |
          trust-control OUTPUT rotate|revoke-issuer|revoke-image|recovery TX EPOCH ISSUER_ID IMAGE_VERSION PRIVATE |
          verify-image FILE PUBLIC | run-signed FILE PUBLIC |
          update SIGNED PUBLIC --state STATE | save-state STATE | recover-state STATE [PUBLIC] |
          status --state STATE | serve --state STATE [--issuer-public-key PUBLIC]
  ```
  `run`/`run-signed` print `status=<u> trap=<u> ip=<u> image_version=<u> result=PASS|FAIL` and, on success, `R2.low64=<u64>`. `inspect-image` prints JSON `{"version","flags","code","data","caps","signed","bytes","digest"}`. `--image-version N` must equal the unit's `image_version` (source authority wins).
- **`brctl`** (production CLI, `-DBR_PRODUCTION`, `host/brctl.c`): `verify-lctlc | lctl-to-brir | compile-lctlc | inspect-image | verify-secure BRSB | secure-run BRSB` (no raw-image run, no keygen/sign).
- **`brverify`** (independent verifier, `host/brverify.c`, 6,266 B source, no compiler data structures): `brverify [--disasm] IMAGE [SOURCE BRIR]` → `independent BRIM verifier: PASS|FAIL`; with SOURCE+BRIR it also checks the BRPV-embedded sha256s; `--disasm` prints `idx|OP|MODE|Rd|Ra|Rb|Cn|imm|need=..|succ=..`.
- **APDU (via `serve`, one hex frame per line)**: request `01 <cmd> <flags> 00 <txid u32 LE> <seq u16> <len u16> <payload>`, response `<sw u16 BE> 00 00 <txid u32 LE> <payload>`. Commands: INIT 1, STATUS 2, LOAD 3 (denied in production), EXEC 4 (payload = optional u32 budget), STATE 5 (payload `{kind u8: 0=reg/1=mem/2=stack, index u8, offset u32, length u16 ≤512}`; empty payload → ip/status/trap/flags/R0/R1), INPUT 6, UPDATE 7 (chunked signed image), RECOVER 8 (BRCT/1 control), DIAG 9, RESET 10, CAPS 11, HELLO 12, ABI 13. Status words 0x9000 OK, 0x6100 more, 0x6700 length, 0x6982 security, 0x6985 replay, 0x6a80 data, 0x6d00 bad INS.

## Build & gate results measured here (all with stock flags; see `Medium_gates/`)
| Step | Command | Exit | Time | Result |
|---|---|---|---|---|
| build | `make` | 0 | 12.26 s | all 7 artifacts built; `-Werror` clean (GCC notes only) |
| operational gate | `timeout 900 make operational` | **0** | 10.11 s | test 0 failures; image+provenance PASS; boundary PASS; repro `cmp` identical; roundtrip identical; compatibility 4.1.0/4.2.0/4.6.0 R2=42 + 4.6.0 .brsb secure PASS; signed-smoke PASS R2=42; semantic tests **40 cases PASS**; spec-sync PASS (isa 4.1, abi 1.0, 8 devices, 32 opcodes, 20 services, 14 traps); ISA/ABI conformance PASS; wide-state **59/59**; constant-fold `u64:40+2 -> 42`; secure-acceptance PASS + raw BRIM refused by brctl; device-I/O **66/66**; device audit PASS; size: brim 272/51,200, production source **107,675/110,000**, stripped brctl 112,856 B, debug 641,624 B |
| bench | `make bench` | 0 | 9.69 s | in-process: NOP 85.7 M insn/s, small ADD 37.0 M/s, load/store 45.0 M/s, branch 82.3 M/s, mixed 27.1 M/s (evidence file: 118/50.8/62.4/103.9/38.8 M) |
| sanitize | `timeout 900 make sanitize` | 0 | 11.72 s | ASan/UBSan br_tests + ISA/ABI conformance: 0 failures |
| wide-/device-sanitize | `make wide-sanitize`, `make device-sanitize` | 0 / 0 | 4.8 s / 4.1 s | 59/59 and 66/66 under sanitizers (leak detection on for device) |
| BR-490 measurements | `make br490-core61 br490-brim51 br490-performance br490-freeze br490-profiles br490-hardening br490-docs br500-environment` | 0 each | ≤12.6 s | **Core-61 stripped = 48,264 B ≤ 61,000** (sha `998744e7…` == `release/bin/brvm-core61.stripped.o`); BRIM-51 PASS incl. 51,201-byte oversize rejection by inspector and loader; performance 8/8 PASS; freeze 6, profiles 6, hardening 7 (0 private-key fixtures, 0 bypass tokens), docs 12 PASS |
| br490-memory | `make br490-memory` | **2 (FAIL)** | 0.07 s | `FileNotFoundError: /usr/bin/time` — sandbox lacks GNU time; environment prerequisite, not a VM defect (RSS measured manually below instead) |
| br500-local | `timeout 900 make br500-local` | **2** | 28.3 s | ran to completion and PASSED: operational, independent parser compare, brim_ref, differential arithmetic **169 vectors @1,048,576 bits**, opcode edges 11/11, property 6/6, C fuzz **25,000** cases, Python parser fuzz **19,700** cases (=44,700 total), image attacks 9/9, accelerated soak 20,000 cycles, security review 8/8, core61, brim51 — then stopped at `br490-memory` (same `/usr/bin/time` cause) |
| br480-cross | `make br480-cross` | 0 | 25.5 s | gcc & clang × O0/O2/O3 all produce BRIM sha `7cfd6d6c…`, conformance PASS; AArch64/Windows rows BLOCKED (unavailable) |
| qualification | `make qualification` | 2 | 0.6 s | stops at `tests/trust_conformance.c` — trust/persistence conformance fixtures + `qualification_keys.h` are segregated into the QUALIFIED candidate (documented in README 4.8 section) |
| release check | `make br500-release-check`; `python3 evidence/verify_br500.py`; `openssl pkeyutl -verify …` | 0 / 0 / 0 | <0.1 s | manifest verify PASS (sha `0ffff663…`), tree hashes src/host/spec/tests match, no private key in release/; evidence verifier PASS `requirements=96 operational=88 blocked=8`; "Signature Verified Successfully" |
| stale verifier | `python3 evidence/verify_br490.py` | 1 | — | `requirement count/uniqueness failure 0/0` — expects `evidence/br490/` which is not shipped |
| replay package | `python3 replay/run.py --check-only` | 0 | — | PASS, `independence_claimed:false` |
| reproducibility | sha256 compare | — | — | rebuilt `deploy/*.brimg/.brir/.provenance.json/.brsb`, `.build/brctl` (121,800 B), `.build/brverify` (21,232 B), `.build/brvm-core.o`, core61 stripped object — **all byte-identical to the shipped `release/bin/*` and manifest hashes** |
| integrity | `sha256sum -c SHA256SUMS` (source dir) | 0 | — | **240 OK / 0 FAILED**; the only uncovered file is `SHA256SUMS` itself |

Claims reproduced: BRIM 272 B, production source boundary 107,675 B, secure `R2.low64=42`, ISA/wide/device conformance counts, 44,700 fuzz cases, 169 differential vectors, 20,000 soak cycles, Core-61 ≤ 61,000, release manifest signature. **Not reproduced as stated**: the README/PACKAGE_INFO/MANIFEST figure "Core-61 49,072 bytes" — the measured (and re-sealed evidence `CORE61_5_0.json`) figure is **48,264**. Per-process peak RSS ≈ 10.5 MiB and 2–4 ms wall per CLI invocation (`probe_memory_timing.log`).

## PA-LCTL adapter results measured here
(`/home/claude/work/corpora/PA_Language_PA21.2`, `PA_LCTL_BOTTLE_ROCKET_ROOT=/home/claude/work/build/Medium/BOTTLE_ROCKET_5.0.0_VM_110K_RC`)
- `python3 -B -m reference.pacore.cli adapter-check --target bottle-rocket` → exit 0, `outcome: OK`; attestation `target_id bottle-rocket-5.0.0-local`, `trust_domain LOCAL_TRUSTED`, `target_class CLASSICAL_LOCAL_VM`, `native_gate_set []`, limits `{instruction_ceiling 256, max_rows_per_lowering 84, source_line_ceiling 512, shots 1, qubits 0}`, `bradmin_sha256 64fe6f6d…`, `brverify_sha256 93146cd2…` (== shipped release/bin/brverify), self-reported gate restated (BLOCKED 88/8).
- `… backend-run examples/01_bell_pair.pal` → exit 0, `outcome OK`; 12 rows lowered → 40 instructions; all 8 native stages returncode 0; **native_witness = 17360368901394384785 = reference_witness; differential_agreement = true**; run-signed stdout `status=2 trap=0 ip=40 image_version=9 result=PASS / R2.low64=17360368901394384785`.
- All six shipped examples agree (02_ghz3 6735235137199922533, 03 2035133056847448988, 04 11114974373231215855, 05 1825703198280153005, 06 725229432034669365; 46–52 instructions each).
- `python3 -B pamath/tests/test_bottlerocket_backend.py` → **TOTAL 30 PASS 30 FAIL 0**, exit 0 ("ALL CHECKS PASS").

## How to drive it programmatically as a fabric target
1. Emit an LCTLC/1.1 unit exactly as `brlower.lower()` does (template used here, computes 40+2 into R2):
   ```
   LCTLC/1.1
   @unit id=fabric.hand.add version=4.7.0 profile=brvm-native entry=W00001 target=local-reference backend=brir network=deny replay=deterministic image_version=9 requested_caps=CONTROL|ARITH max_steps=8 termination=bounded
   @defaults mode=WRAP width=WIDE
   @frame id=F0000 parent=ROOT module=fabric.hand.add
   ID│LANE│OP│OUT│CTRL│IN│ARG│META
   W00001│w│MOVI│R0│C0│_│u64:40│width=WIDE
   W00002│w│MOVI│R1│C0│_│u64:2│width=WIDE
   W00003│w│ADD│R3│C0│R0›R1│_│mode=WRAP;width=WIDE
   W00004│w│MOV│R2│C0│R3│_│width=WIDE
   W00005│w│HALT│_│C0│_│_│_
   @end
   ```
   Put the result in **R2** (only its low 64 bits are printed). `requested_caps` must equal what the opcodes need (MOVI/MOV/HALT/JMP → CONTROL; ALU/CMP → ARITH; LOAD/STORE → MEMORY; PUSH/POP → STACK; SVC → SERVICE(+STATE/DIAG/UPDATE); CHECKPOINT → STATE). Every path must end in HALT.
2. Pipeline (all commands measured here, `hand_roundtrip_add42.log`):
   ```
   B=<root>/.build
   $B/bradmin verify-lctlc add42.lctlc                       # "Columned LCTL semantic verify: PASS" (exit 0)
   $B/bradmin lctl-to-brir add42.lctlc add42.brir            # "LCTL -> BRIR: PASS"
   $B/bradmin compile-lctlc add42.lctlc add42.brimg          # "Columned LCTL compile: PASS" (256-byte BRIM)
   $B/brverify add42.brimg add42.lctlc add42.brir            # "independent BRIM verifier: PASS"
   $B/bradmin keygen k.private k.public                      # once per node/session (0600 private, 32 B raw)
   $B/bradmin sign-image add42.brimg add42.signed.brimg k.private   # +64 B Ed25519 → 320 B
   $B/bradmin verify-image add42.signed.brimg k.public       # "status=0 trap=0 ip=0 image_version=9 result=PASS"
   $B/bradmin run-signed add42.signed.brimg k.public         # "status=2 trap=0 ip=5 image_version=9 result=PASS" / "R2.low64=42"
   ```
   Parse: exit code 0 AND a `status=2 trap=0 … result=PASS` line, then `R2.low64=<decimal u64>`. Failure → `result=FAIL` (+ `status=3 trap=<id>`), exit 1, no R2 line. Verification failures print `… FAIL — line N: <reason>` (bradmin) / `LCTL verify: line N: <reason>` (compile).
   The unsigned admin path `bradmin run IMG` gives the same output; the production path `brctl secure-run X.brsb` requires a BRTM bundle signed under the packaged root (not mintable here).
3. Results wider than 64 bits or in other registers/memory: run `bradmin update SIGNED PUB --state DIR` (stages; the CLI prints FAIL but the state is written), then `bradmin serve --state DIR --issuer-public-key PUB` and send APDUs `EXEC` (`01 04 00 00 <txid> 0000 0400 <budget u32>`) then `STATE` (`01 05 00 00 <txid> 0000 0800 00 <reg> <offset u32> <len u16>`) — measured: R2 → `2a00000000000000`. STATE returns ≤512 bytes per call from any register (131,072 B), memory (4,096 B) or stack word.
4. Bounds a fabric scheduler must respect: ≤256 instructions and ≤512 lines/≤512 chars per line per unit; runtime budget **4096 steps** on the CLI (trap 24 beyond; use APDU EXEC for a different u32 budget; unit `max_steps` is provenance only); memory 4,096 B; 16 registers × 1,048,576 bits; stack 256; call depth 64; service budget 64/run, host-call budget 128, device quotas 64 calls/8,192 B/16 writes/8 entropy; image ≤51,200 B (native max 8,368/8,432); each CLI process ≈10.5 MiB RSS, 2–4 ms; state directory files `<prefix>.image0/1 .state0/1 .issuer .lock .statekey`. Networking: none (offline by design; `network=deny` mandatory).

## Self-reported status / blockers (verbatim)
- PACKAGE_INFO.json: `"strict_gate": "BLOCKED"`, `"operational_requirements": 88`, `"blocked_requirements": 8`, `"workflow_requirements": 96`, `"strict_dependency_chain": "BLOCKED by inherited BR-490-11 external proofs and corresponding BR-500 gates"`, `"blockers": ["independent second-machine/operator replay", "independent second-machine/operator rebuild", "literal 72-hour native soak", "AArch64 and Windows execution qualification", "final 100% evidence ledger dependent on those proofs"]`, `"release_manifest_signature_role": "qualification/release-engineering; not production HSM/root"`, `"qualification_private_keys_included": false`.
- The 8 BLOCKED records (qualification/ACCEPTANCE_5_0.json): BR-500-10-R05 "Independent replay PASS" — "Independent second-machine/operator replay is unavailable in this execution environment."; BR-500-11-R01 "Independent rebuild passes" — "Independent rebuild on a genuinely separate machine/operator has not been performed."; BR-500-12-R05 "72-hour soak passes" — "Literal 72-hour native soak has not elapsed."; BR-500-15-R20 "Cross-platform qualification PASS" — "Cross-platform qualification is incomplete: AArch64 and Windows execution environments are unavailable."; BR-500-15-R21 "72-hour native soak PASS" — "Literal 72-hour native soak has not elapsed."; BR-500-15-R22 "Independent rebuild PASS" — "Independent rebuild on a separate machine/operator has not been performed."; BR-500-15-R23 "Independent replay PASS" — "Independent replay on a separate machine/operator has not been performed."; BR-500-15-R24 "Release evidence ledger 100% PASS" — "Release evidence ledger cannot be 100% PASS while required external qualification records remain BLOCKED."
- README: "Fresh measured gates: Core-61 49,072/61,000 bytes PASS, BRIM-51 272/51,200 bytes PASS, production runtime/authority source boundary 107,675/110,000 bytes PASS, secure execution R2.low64=42, unresolved CRITICAL/HIGH findings 0/0." and "The strict gate is therefore BLOCKED, not failed."
- Note: this session is a same-toolchain, single-machine rebuild by a non-independent operator, so it does **not** lift any of the 8 blockers (it is exactly the kind of "necessary but not sufficient" local replay `replay/README.md` describes).

## Files of note
`README.md`, `PACKAGE_INFO.json`, `MANIFEST.json`, `SHA256SUMS`, `Makefile`, `AUDIT_ERRATA.md`, `REPRODUCE_5_0.md`; `src/brvm.c` (core, 56 KB, minified), `src/brvm.h` (all constants, compacted names — decode with `include/brvm_compat_names.h`), `src/brtrust.c` (BRTM/1, baked ROOT/RECOVERY keys), `src/brlctlc.c` (LCTLC/1.1 parser/compiler), `src/CORE.lctlc`, `examples/boot.lctlc`; `host/bradmin.c`, `host/brctl.c`, `host/brverify.c`, `host/br_host.c` (POSIX/memory/deterministic HAL adapters, image write/sign), `host/br_prod_host.c`, `host/brsign.c`, `host/br_bench.c`; `spec/BR_SPEC.json`, `spec/LCTLC_1_1.json`, `spec/DEVICE_IO_4_7.md`, `spec/WIDE_STATE_4_6.md`, `spec/PERSISTENCE_4_5.md`, `spec/RELEASE_FREEZE_5_0.json`, `spec/RELEASE_PROFILES_4_9.json`; `tests/semantic_tests.sh`, `tests/isa_abi_conformance.c`, `tests/wide_state_conformance.c`, `tests/device_io_conformance.c`, `tests/spec_sync.py`, `tests/br480_*.c`; `tools/provenance.py`; `independent/*.py` (pure-Python BRIM/BRPV/BRTM reference, fuzz, attacks); `qualification/*.py`, `evidence/BR500_ACCEPTANCE.json`, `evidence/BR500_FINAL_LOCAL_QUALIFICATION.log`, `evidence/CORE61_5_0.json`, `evidence/ENVIRONMENT_5_0.json`, `evidence/verify_br500.py`; `release/IMMUTABLE_RELEASE_MANIFEST.json/.sig`, `release/RELEASE_SIGNING_PUBLIC.pem`, `release/bin/{brctl,brverify,brvm-core.o,brvm-core61.stripped.o}`; `deploy/*` (4.7.0 BRIR/BRIM/BRSB/provenance), `compat/*` (4.1.0/4.2.0/4.6.0 images), `replay/run.py`, `security/*.md`, `workflows/5.0/*.md`, `docs/4.9/*.md`, `docs/5.0/*.md`.

## Surprises / inconsistencies
1. **Core-61 number**: README, PACKAGE_INFO.json and MANIFEST.json say 49,072 B; the re-sealed `evidence/CORE61_5_0.json`, the signed release manifest, `release/bin/brvm-core61.stripped.o` and my measurement all say **48,264 B**. (Both under 61,000; the prose was not updated after the audit re-seal.)
2. Version layering: package 5.0.0, MANIFEST.json `release 4.9.0` / `version 4.7.0`, guest units must say `version=4.7.0`, deploy artifacts are named 4.7.0 while `release/artifacts/` carries byte-identical copies named 5.0.0.
3. `qualification/br500_acceptance.py` *generates* the 88/96 ledger from a hard-coded BLOCKED dictionary + workflow-doc parsing; it runs no tests. `evidence/verify_br500.py` does check evidence-log hashes and exit codes and passes.
4. `evidence/verify_br490.py` is stale (needs `evidence/br490/`, not shipped) and fails; `replay/run.py --execute` would call it.
5. `make qualification` (advertised in the README 4.7 section) fails immediately in this lean RC — its trust/persistence fixtures are intentionally segregated.
6. `br490-memory` (and thus `br500-local`, `br490-rc-local`) needs GNU `/usr/bin/time`, which BUILD.md does not list.
7. `bradmin update … --state` prints `authorized APDU update: FAIL`/exit 1 even though the transactional update is written and recoverable (status/recover show image_version 9, and a subsequent `serve` EXEC yields R2=42) — apparently its trailing in-process `br_vm_run` executes before the staged candidate is loaded.
8. Unit `max_steps` is provenance metadata, not a runtime bound; the CLI's runtime budget is a hard-coded 4096. Unconditional infinite loops are rejected at compile time ("no terminal").
9. Least privilege is two-sided: over-requesting capabilities is rejected ("caps mismatch"), so a generic fabric template must compute `requested_caps` from the opcodes used.
10. Line length limit 512 means a single DATA row carries ≤ ~240 bytes; 4,096 data bytes need ~18–21 DATA rows.
11. The 51,200-byte BRIM ceiling is unreachable by the native compiler (max 8,368/8,432 B); it exists for the loader/inspector and for legacy images.
12. `AUDIT_ERRATA` F9: "ISA 4.1" is overloaded across the BOTTLE ROCKET packages — here it is the 32-opcode set (16-B instructions, ABI 1.0, LCTLC/1.1); Large.zip's "4.7.0" is a different, incompatible ISA/dialect.
13. Minified C: `src/brvm.c` is 82 lines with a 35,170-char line; identifiers like `N46`, `Z37`, `K0`; GCC disables column tracking; human review needs `include/brvm_compat_names.h`.
14. Bit-for-bit reproducibility on this toolchain is real: brctl/brverify/core objects and all deploy artifacts match the shipped binaries and manifest hashes exactly; the adapter's `brverify_sha256` equals the release manifest's.
