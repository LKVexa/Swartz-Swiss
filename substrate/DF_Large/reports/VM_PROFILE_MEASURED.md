# DF_Large -- the embedded VM as measured on the assembly host

> Produced while profiling `Large.zip` before translation (DF-PA21.2-1.0.0). Paths like `/home/claude/work/...` are the assembly host's scratch copies of the package; every claim below was observed there, and the reproducible parts are re-run by `./VERIFY` (gates N1, A1-A9) from the delivered bytes.

---

# Large — BOTTLE ROCKET 4.7.0 (Columned-LCTL Virtual Device / I/O / Service Architecture) — Fabric-Node Profile

Profiled on the cloud sandbox (Ubuntu, GCC 13.3.0, OpenSSL 3.0.13, Python 3.11, make 4.3) on 2026-08-16.
Source (read-only): `/home/claude/work/vms/Large/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE_61K`
Built at: `/home/claude/work/build/Large/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE_61K`
Gate logs: `/home/claude/work/profiles/Large_gates/*.log`

## Identity

- **Package**: BOTTLE ROCKET 4.7.0 — "COLUMNED LCTL Virtual Device, I/O & Service Architecture" (61K source-budget lineage).
- **VM / core name**: `brvm` (library `libbrvm_core.a`; reference core image `BOTTLE_ROCKET_SIM_CORE_4.7.0`).
- **Release/runtime version**: 4.7.0. **Semantic source stack**: LCTLC/1.2 = "columned-lctl/4.3" dialect, ISA **BR/1.1**, ABI **2**, Device ABI **1.0**.
- **Lineage**: This is the *divergent* 4.7.0 line. Header authority `src/brvm.h`: `BR_ISA_MAJOR=1, BR_ISA_MINOR=1, BR_ISA_MARKER=21, BR_ABI_VERSION=2, BR_OPCODES=41`. This is a different instruction set from the 5.0.0 line ("frozen 4.7 core", ISA 4.1 / 32 opcodes / ABI 1.0). See "Surprises" and the cross-lineage test below.
- **Scope (self-declared)**: "host-reference", status **OPERATIONAL** (`evidence/ACCEPTANCE.json`).

## Runtime contract

- **ISA**: BR/1.1, marker 21, ABI 2. **41 opcodes** (verified `opcode_positive 41/41`):
  `NOP MOVI MOV JMP JZ JNZ HALT ADD SUB MUL DIVU MODU AND OR XOR NOT SHL SHR CMP LOAD STORE PUSH POP SVC NEG BITTST ASHR ROL ROR LOADX STOREX BEQ CALL RET JMPR ENTER LEAVE TRAP CAPQ CHECKPOINT YIELD`.
- **Registers**: 16 wide registers (`R0..R15`), descriptor-only until a value needs storage. ABI: args R0–R5, returns R0–R1, scratch R0–R7, preserved R8–R13, FP R14, reserved R15.
- **Word width**: **1,048,576 bits** (2^20 = 131,072 bytes / 16,384 limbs) per register — arbitrary-width integer machine. Representations: zero-singleton / small-inline / single-limb-sparse / dense COW.
- **Arithmetic modes** (4): WRAP, CHECKED, SATURATE, TRAPPING. Optional signed flag per op.
- **Memory / stack**: 4096-byte linear MEM region; stack depth 256 words (2 MiB logical byte ceiling); scratch arena 256 KiB; per-VM heap ceiling 4 MiB; 8-entry immutable constant pool.
- **Services**: service ABI v2, **22 services** (0..21): NOP, STATUS, REVOKE, GRANT, CONFIG, SAVE, DIAG, SHA256, VERIFY, TRUST, ENTROPY, TIMER, CONSOLE_WRITE, CONSOLE_READ, DEVICE_CALL, YIELD, STORAGE_READ, STORAGE_WRITE, MONOTONIC, MAILBOX_PUT, MAILBOX_GET, DEVICE_ENUM.
- **Traps**: 14 canonical trap classes required by spec (`canonical_traps 14/14`); full C enum has 30 codes. Observed here: 8=BUDGET, 3=CAPABILITY, 17=UNSUPPORTED_ABI, 26=SIGNATURE.
- **Capabilities** (8-bit gate, per-instruction, indexed by cap slot): CONTROL, ARITH, MEMORY, STACK, SERVICE, STATE, UPDATE, DIAG. `run`-path grants requested caps into slot 0, so all rows must reference cap index 0 (`C0:CAP`).
- **Determinism**: representation choice never changes ISA-visible results, traps, or instruction counts. A deterministic HAL adapter provides seeded-PRNG entropy + counter clock as replay substitutes.
- **Lifecycle**: create → initialize → configure → load → verify → start → step/run → suspend/resume/stop/fault → destroy. Machine status: 0=READY 1=RUNNING 2=HALTED 3=TRAPPED 4=CANCELLED 5=SUSPENDED 6=STOPPED.

## Image format(s) and how deploy/*.brimg were produced

- **Image format**: **BRIM/1** — 80-byte little-endian header + N×16-byte instructions (+ optional 64-byte Ed25519 signature when signed). Header fields: magic `BRIM`; product version bytes `04 03 00`; flags (bit0 factory, bit1 signed); abi=2; isa_marker=21; regs=16; caps=16; opcodes=41; modes=4; header-len=80; image_version(u32); requested_caps(u64); insn count(u16); data bytes(u16); SHA-256 of payload (32 B); tag **`BRLCTL43`** (8 B); source-SHA prefix (8 B). Each instruction is `<opcode,mode,rd,ra,rb,cap,flags(u16),imm(u64)>`.
- **THERE IS A FRONT END** (contra the "no compiler" premise): **`tools/lctl430.py`** (Python 3, self-identifies `br-lctlc/4.3.0`) is a full compiler for the Columned-LCTL source language: it canonicalizes/parses the UTF-8 `.lctlc` columnar source, runs a static semantic verifier (operand arity, capability gating, CFG reachability, stack-balance, loop/termination), emits **BRIR/1** IR, and encodes the **BRIM/1** image + a `BR.Provenance` manifest. `tools/brim_verify.py` is an independent image verifier. The Makefile `image` target literally runs `python3 tools/lctl430.py compile src/BOOT.lctlc …`, so every shipped `deploy/*.brimg` was produced by this Python compiler (provenance JSON confirms `compiler_version: br-lctlc/4.3.0`).
- **Guest source language**: **Columned-LCTL** (magic line `LCTLC/1.2`; dialect `columned-lctl/4.3`). Source is a pipe-delimited (`│`, U+2502) column table `ID│LANE│OP│OUT│CTRL│IN│ARG│META` with `@unit`/`@defaults`/`@frame`/`@end` directives. Source ceiling 65,536 bytes, NFC-normalized, LF-only.
- **Reference program** `src/BOOT.lctlc`: `MOVI R0,42 ; HALT` → 112-byte factory image (2 insns). The older `deploy` demo images 4.0.1–4.3.0 are 6-insn programs that compute `40+2` and leave **42 in R2**.

## Capabilities matrix

| Capability | Present? | Evidence |
|---|---|---|
| Compile guest source → image | **YES** | `tools/lctl430.py compile` (Python front end); reproduced live (see programmatic drive) |
| Sign images | **YES** | `brctl keygen` / `brctl sign-image` (OpenSSL Ed25519, EVP); `lctl430 compile --sign-private` delegates to brctl |
| Trust chain | **YES (design)**, but **not provisionable from the shipped CLI** | Root-anchored Ed25519 chain the README calls "BRTM/1": immutable root → **BRTP/1** policy (352 B, domain BR-TRUST-POLICY-1) → **BRMF/1** manifest (216 B, domain BR-IMAGE-MANIFEST-1) → BRIM. `src/brtrust.c`. Production `brctl` refuses to run/verify because no CLI path provisions it. |
| Device ABI | **YES — Device ABI v1** | `spec/DEVICE_ABI.json`; `BR_DEVICES=8` built-ins (1 console, 2 persistent-block, 3 monotonic, 4 entropy, 5 clock, 6 mailbox, 7 diagnostic) + optional 8 network / 9 wall-clock (absent by default). Deterministic discovery. |
| Deterministic replay | **YES** | `br_hal_deterministic` adapter (seeded PRNG entropy, counter clock); wide-state spec guarantees representation-independent results/traps/step counts. |
| Step bound | **YES** | `br_vm_run(vm, max_steps)`; `brctl run` hardcodes **4096** steps → `BR_TRAP_BUDGET` (trap 8). Also per-run quotas: 1024 transfer bytes, 4 storage writes, 8 entropy requests, 1-packet mailbox, 64-byte device buffers. |

## Toolchain + dependencies

- **VM core** (`src/brvm.c`, `src/brtrust.c` → `libbrvm_core.a`): freestanding **C11**, `-O2 -Wall -Wextra -Werror`. `make core-scan` proves the core uses no stdio/unistd/fcntl/sys/openssl and none of fopen/read/write/EVP_/RAND_ etc. — it is host-agnostic and depends only on a supplied HAL.
- **Host CLI** (`host/brctl.c`) and **file adapter** (`adapters/br_file_adapter.c`): C11 + **OpenSSL libcrypto** (`-lcrypto`, EVP Ed25519/SHA-256) + POSIX.
- **Tooling** (compiler, qualify, evidence, static tests): **Python 3** (stdlib only — hashlib/struct/json/argparse; no third-party packages).
- **Adapters shipped** (`adapters/`): C **HAL** implementations only — `br_hal_posix`, `br_hal_windows`, `br_hal_memory`, `br_hal_deterministic`, `br_hal_baremetal`, `br_hal_smartcard`. **No Python/FFI binding exists**; to drive from Python you shell out to the CLIs (see below).

## Entry points and exact commands

- Build + operational gate: `make` (default target `all: operational`) or `make operational`.
- Size gate: `make size`. Sanitizers: `make sanitize` (ASan+UBSan). Full qualification: `make qualify` (or `make qualify-full` = sanitize+qualify).
- Regenerate evidence on this toolchain: `make regenerate-evidence`.
- **Development runner** (executes images): `make brctl-dev` then `.build/brctl-dev run <img>`.
- Production CLI (`.build/brctl`, built by plain `make`): `run|run-signed|verify-image|inspect-image|keygen|sign-image|update|save-state|recover-state|status|serve|selftest`. **`run`/`run-signed`/`verify-image` exit 1 on any shipped image** (trust chain not provisioned).
- Compile a new image: `python3 tools/lctl430.py compile SRC.lctlc OUT.brimg --factory [--manifest M.json] [--brir-out B.json]`. Also `check`, `brir`, `disasm`, `provenance`, `roundtrip`.
- Performance reference: `make bench` (in-process, development build).

## Build & gate results measured here

Toolchain matched the errata's sealed reference (Ubuntu GCC **13.3.0** / OpenSSL **3.0.13**), so ledgers reproduced.

| Gate | Command | Exit | Time | Result |
|---|---|---|---|---|
| Build + operational (cold) | `make` | **0** | **21 s** | Full compile + all suites PASS |
| Operational (rerun) | `make operational` | **0** | ~1 s | 12 suites PASS |
| Dev runner build | `make brctl-dev` | **0** | 2 s | `.build/brctl-dev` produced |
| Size | `make size` | **0** | <1 s | `production_exec_source_bytes=60945` < 61000 (headroom 55) |
| Sanitizers | `make sanitize` | **0** | **27 s** | `SANITIZER_470_PASS` (ASan+UBSan, incl. 512 fuzz) |
| Qualification | `make qualify` | **0** | ~1 s | see summary below |
| Integrity | `sha256sum -c RELEASE_CONTENTS.sha256` | **0** | — | **892/892 OK, 0 FAILED** |

`make qualify` `--assemble` summary (authoritative, all reproduced):
`work_packages 13/13 · requirements 66/66 · opcode_positive 41/41 · opcode_negative 41/41 · canonical_traps 14/14 · BR-410 18/18 · BR-440 23/23 · BR-450 31/31 · BR-460 13/13 · BR-470 10/10 · production_apdu 1/1 · file_adapter 1/1 · apdu_fuzz 512/512 · semantic 19/19 · static 14/14 · toolchain 2/2 · sanitizers PASS · brim_bytes 112 · production_exec_source_bytes 60945 · ledger_hash_mismatches 0 · status OPERATIONAL`.

Per-suite operational tally (all PASS, exit 0): BR-410=18, BR-430=8 (opcode±41, traps 14), BR-440=23, BR-450=31, BR-460=13, BR-470=10, BR-470-PROD=1, BR-470-APDU-FUZZ=512, BR-470-FILE=1, semantic=19, toolchain=2, static=14. I counted **126 named `PASS <name>` checks / 141 total PASS tokens** across 12 suites (652 assertions incl. 512 fuzz cases). The audit's "138 PASS" is in this range but is not printed verbatim anywhere; the authoritative tallies (66/66, 13/13) reproduced exactly.

Claims reproduced: 13/13 packages ✔, 66/66 requirements ✔, 60,945-byte source boundary ✔, 112-byte reference BRIM ✔, zero ledger-hash mismatches ✔, sanitizers PASS ✔, `make brctl-dev` executes images ✔, production `brctl` refuses unprovisioned images ✔, 892 manifest entries ✔.

Note: the compiler emits many `-Wmisleading-indentation … column-tracking disabled` **notes** (not warnings/errors) because `src/brvm.c` is minified onto multi-thousand-char lines — see F10. The build is clean under `-Werror`.

## How to drive it programmatically as a fabric target

No native binding is shipped; drive via two subprocess calls (compile then run). End-to-end, verified live:

1. **Author** a Columned-LCTL unit (`LCTLC/1.2`). Minimal ADD example that lands a result in R2 (all rows use cap slot 0, `│`=U+2502, `›`=U+203A):
   ```
   LCTLC/1.2
   @unit id=fabtest version=4.3.0 language=columned-lctl/4.3 isa=BR/1.1 br_image_version=10 br_request_caps=CONTROL|ARITH
   ID│LANE│OP│OUT│CTRL│IN│ARG│META
   A│exec│MOVI│R2│C0:CONTROL│_│imm=40│_
   B│exec│MOVI│R1│C0:CONTROL│_│imm=2│_
   C│exec│ADD│R2│C0:ARITH│R2›R1│_│_
   D│exec│HALT│_│C0:CONTROL│_│_│_
   @end
   ```
2. **Compile** (image provenance): `python3 tools/lctl430.py compile fab.lctlc fab.brimg --factory` → prints `BR.Provenance` JSON (source/BRIR/BRIM SHA-256s).
3. **Run under step bound + read result**: `.build/brctl-dev run fab.brimg` → `{"status":2,"trap":0,"R2":42}`.
   - **Result register**: `brctl run` prints **R2.low64** as the `"R2"` field; `status`=2 means HALTED (success), `trap`=0.
   - **Step bound**: the runner uses a fixed 4096-step budget. A budgeted infinite loop returned `{"status":3,"trap":8,"R2":2048}` — trap 8 = BUDGET, i.e. it stopped at the ceiling. To change the bound a caller must recompile the host or use the `br_vm_run(vm, n)` API directly.
   - **Caveat**: the current 4.5/4.6/4.7 boot images write R0 only, so their R2 reads 0; author programs must target R2 for the CLI to surface a value. All caps must be declared in `@unit br_request_caps=` AND referenced at cap index 0.

Observed `.build/brctl-dev run` over shipped images (status/trap/R2):
- 4.0.1–4.3.0 (176 B, 6 insn): `{2,0,42}` — HALTED, R2=42.
- 4.5.0/4.6.0/4.7.0 (112 B, 2 insn): `{2,0,0}` — HALTED, R2=0.
- 4.4.0_SIGNED (240 B): `{3,26,0}` exit 1 — raw `run` traps 26 (SIGNATURE); needs the signed path.

**Cross-lineage image compatibility (key finding)**: the 5.0.0 toolchain (`/home/claude/work/build/Medium/…/.build/bradmin`) uses the *same* `BRIM` magic but a different container: ABI=1, isa_marker=20, 32 opcodes, tag `Q17-BRVM-ISA41`, image_version 9. I fed both a pre-built 5.0.0 image (`a.brimg`) and a **freshly `bradmin compile-lctlc`'d** image to this 4.7.0 VM:
- 4.7.0 `inspect-image` **accepts the header** (shared BRIM/1 container) and reports version 9.
- 4.7.0 `brctl-dev run` **REJECTS execution**: `{"status":3,"trap":17,"R2":0}`, exit 1 — **trap 17 = BR_TRAP_UNSUPPORTED_ABI**.
- For reference, native 5.0.0 `bradmin run` executes the same images fine (`status=2 … result=PASS`).
- **Conclusion**: 5.0.0-lineage (BRIM/1 v9, ISA 4.1/ABI 1.0/32-op) images are **not runnable** on this 4.7.0 node; the ABI-2 gate stops them. The two lineages are not binary compatible, and their LCTLC dialects (1.1 vs 1.2) reject each other at the source line too. Only images compiled by this package's own `tools/lctl430.py` run here.

## Self-reported status / blockers (verbatim)

From `README.md`: "Current sealed host-reference result: 13/13 BR-470 packages, 66/66 BR-470 requirements, 60,945-byte executable production-source boundary, 112-byte reference BRIM, zero evidence-ledger hash mismatches." And: "Physical SIM/UICC/eSIM device qualification, actual external network transport/security qualification, issuer ceremony/certification, TPM/secure-element qualification, native-Windows OS execution certification, and independent third-party certification remain external and are not represented as completed by this host-reference package."

From `README.md` (execution): "The production `.build/brctl` intentionally refuses raw or merely Ed25519-signed images: `run`, `run-signed` and `verify-image` exit 1 unless the BRTM/1 trust chain has been provisioned into the instance, and this package exposes no CLI provisioning path."

From `evidence/ACCEPTANCE.json`: `"status":"OPERATIONAL"`, `"scope":"host-reference"`, `"external_not_claimed":[ "actual external network transport/security qualification (network remains optional and absent by default)", "physical SIM/UICC/eSIM device I/O and timing qualification", "issuer key ceremony/certification", "TPM/secure-element hardware qualification", "native Windows OS execution certification", "independent third-party certification" ]`.

From `AUDIT_ERRATA.md`: F9 (two divergent 4.7.0 lineages / ISA-name collision), F10 (compacted/minified C sources, human review impractical), F11 (evidence ledgers toolchain-bound; portable only after `make regenerate-evidence`), F12 (64 corpus negatives untestable by row-wrapping). "No VM in this set can execute the Columned-LCTL corpus (quantum-circuit programs for the LCTL 1.6.1 Java runtime) or the MSSL writers' corpus … Each VM accepts only its own dialect."

## Files of note

- `src/brvm.h` — ISA/ABI/limit authority (enums, opcodes, traps, devices, ABI reg roles).
- `src/brvm.c` (35.7 KB, **minified**) — VM core: decode/execute, wide-state math, services, APDU, persistence. `#ifdef BR_DEVELOPMENT` gates raw code loading (`br_vm_load_code`, `br_vm_start` sig requirement, APDU class 0x81).
- `src/brtrust.c/.h` — Ed25519 trust chain (BRTP/1 policy, BRMF/1 manifest, root anchor, revocation, secure boot/recovery).
- `host/brctl.c` — production + dev CLI; `run` prints `{"status","trap","R2"}` (R2 = `br_vm_reg(vm,2)[0]`).
- `adapters/` — C HAL adapters (posix/file, memory, deterministic, baremetal, smartcard, windows); `br_adapters.h`.
- `tools/lctl430.py` — **the Columned-LCTL → BRIM/1 compiler + verifier** (front end). `tools/brim_verify.py` — independent image verifier. `tools/qualify470.py`, `tools/regenerate_evidence470.py`, `tools/sanitize470.sh`.
- `spec/BR_SPEC.json`, `spec/DEVICE_ABI.json`, `spec/LCTL_SPEC.json`, `spec/WIDE_STATE_SPEC.json`, `spec/TRUST_SPEC.json`, `spec/PERSIST_SPEC.json` — machine-readable contracts.
- `deploy/*.brimg` (8 images 4.0.1→4.7.0) + `.brir.json`/`.provenance.json`; `deploy/*.brtp`/`.brmf`/secure bundle.
- `src/BOOT.lctlc` (authoritative boot unit), `src/CORE.lctlc`.
- `evidence/ACCEPTANCE.json`, `RELEASE_CONTENTS.sha256` (892 entries), `AUDIT_ERRATA.md`.

## Surprises / inconsistencies

1. **"No front end" is false.** The package *does* ship a compiler — `tools/lctl430.py` (Python) — and the `image`/`verify` Make targets use it to build the deploy images from `src/*.lctlc`. What it lacks is a *C-native* compiler; the front end is Python, kept out of the 61 KB **C** source budget (the size gate counts only `src/*.c/*.h/BOOT.lctlc` + adapters = 60,945 B). So a caller absolutely can construct runnable images.
2. **ISA/ABI lineage collision (F9).** Two packages call themselves "4.7.0". This one is BR/1.1 / 41 opcodes / ABI 2 / marker 21 / LCTLC/1.2 / tag `BRLCTL43`. The 5.0.0 "frozen 4.7 core" is ISA 4.1 / 32 opcodes / ABI 1.0 / marker 20 / LCTLC/1.1 / tag `Q17-BRVM-ISA41`. Confirmed empirically: 5.0.0 images are rejected here with UNSUPPORTED_ABI (trap 17). Note marker 20 is literally this VM's `BR_LEGACY_ISA_MARKER`, and an expository note (BR-EXN-02) mislabels this package "ISA 4.1" — wrong for the code.
3. **Minified sources (F10).** `src/brvm.c` is one-lined (max ~5,966-char line); identifiers like `Z15`, `W`, `AA`. GCC disables column tracking and floods the build with notes. Clean under `-Werror` but not human-reviewable.
4. **Production CLI cannot run anything shipped.** `brctl run/verify-image/run-signed` exit 1 for every shipped image (raw load compiled out; trust chain unprovisionable). Reference/fabric execution requires `brctl-dev` (raw load enabled) — acceptable for an internal fabric node, but it means the "production" binary is effectively inert here.
5. **Result register subtlety.** The CLI surfaces only R2.low64; the current boot images leave R2=0 (they write R0), so a naive `run` looks like it "did nothing". Meaningful results require authoring to R2.
6. **Evidence ledgers are toolchain-bound (F11)** but reproduced here because the sandbox matches the sealed reference (GCC 13.3 / OpenSSL 3.0.13); `ledger_hash_mismatches=0`. On a different toolchain, `make qualify` would need `make regenerate-evidence` first.
