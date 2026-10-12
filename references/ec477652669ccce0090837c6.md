# QUORUM BR-410-03 — Define Host Abstraction Layer

**Release sequence:** BOTTLE ROCKET 4.1.0 — Production Execution Boundary  
**Purpose:** Separate the actual VM from the POSIX host application.  
**Source baseline:** `BOTTLE_ROCKET_4.0.0_COLUMNED_LCTL_MODEL_OPERATIONAL_61K`  
**Work-package status vocabulary:** `NOT_STARTED | IN_PROGRESS | PARTIAL | BLOCKED | OPERATIONAL | REGRESSED`

## QUORUM execution prompt

Using QUORUM, upgrade the attached BOTTLE ROCKET 4.0.0 COLUMNED LCTL repository to satisfy **Define Host Abstraction Layer** as an evidence-backed step toward BOTTLE ROCKET 5.0.0 FULLY OPERATIONAL VM. Work directly against the repository; do not replace executable behavior with prose, mocks, placeholder PASS files, or unverifiable claims. Preserve working behavior unless this package explicitly supersedes it.

Treat the current package as a host-reference model, not as already production-qualified. The current architecture includes a 24-opcode BR ISA, 16 × 1,048,576-bit registers, four arithmetic modes, 4,096-byte memory, a 256-word wide stack, BRIM/1 images, Ed25519 signing, dual-slot persistence/recovery, APDU service, and LCTL-C source carried through canonical NOP rows with `br.*` metadata. Any semantic or format change must be versioned and migrated explicitly.

### Repository anchors to inspect first
- `host/brctl.c`
- `src/brvm.c`
- `Makefile`
- `src/brvm.h`
- `host/brctl.c::signimg/verifyrun`
- `src/brvm.c::verify_ed25519`
- `src/brvm.c::br_image_load`
- `src/brvm.c::br_vm_save/br_vm_recover/image_slot_write/image_slot_load`

### Atomic requirements
- **BR-410-03-R01:** Define storage_read
- **BR-410-03-R02:** Define storage_write
- **BR-410-03-R03:** Define storage_commit
- **BR-410-03-R04:** Define storage_erase
- **BR-410-03-R05:** Define monotonic_read
- **BR-410-03-R06:** Define monotonic_commit
- **BR-410-03-R07:** Define verify_signature
- **BR-410-03-R08:** Define random_bytes
- **BR-410-03-R09:** Define clock_read
- **BR-410-03-R10:** Define console_read
- **BR-410-03-R11:** Define console_write
- **BR-410-03-R12:** Define device_call
- **BR-410-03-R13:** Define panic
- **BR-410-03-R14:** Define yield
- **BR-410-03-R15:** Define lock
- **BR-410-03-R16:** Define unlock

### Non-negotiable QUORUM rules
- **Truth over labeling:** never mark an item OPERATIONAL without freshly generated evidence from the modified repository.
- **Fail closed:** malformed, unsupported, ambiguous, unsigned, unauthorized, over-budget, or stale inputs must be rejected wherever the governing specification requires rejection.
- **Determinism:** identical source, configuration, and deterministic inputs must produce identical semantic results and, where specified, byte-identical artifacts.
- **Bounded execution:** add explicit limits for memory, instruction count, service use, parser sizes, persistent data, and host interaction relevant to this package.
- **No silent compatibility break:** version changed formats/semantics and provide migration or explicit rejection behavior.
- **Keep development escape hatches out of production:** if a bypass is needed for testing, make it a separately compiled/profiled development feature.
- **No size-accounting tricks:** do not meet the 61 KB or 51,200-byte goals by moving required production behavior outside the measured boundary without documenting that boundary.
- **Preserve offline-by-default posture:** networking is not introduced implicitly.

## Workflow

### Q0 — Authority and baseline
1. Unpack the repository into a clean work tree.
2. Hash the untouched baseline and record compiler, linker, crypto library, OS, architecture, and relevant LCTL verifier version.
3. Run the current `make clean`, `make operational`, `make sanitize`, and `make size` gates where supported; capture outputs without altering their status.
4. Inspect the repository anchors above and map each atomic requirement to concrete functions, structures, specifications, tests, and generated artifacts.
5. Record any pre-existing failure as **BASELINE_BLOCKER**, not as a regression caused by this package.

### Q1 — Design invariants
Define the invariants for **Define Host Abstraction Layer** before editing code. At minimum specify: accepted inputs, rejected inputs, state transitions, trust boundary, resource ceiling, deterministic/replay behavior, compatibility/version behavior, and the exact condition that produces OPERATIONAL status.

### Q2 — Implementation
1. **BR-410-03-R01 — Define storage_read.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
2. **BR-410-03-R02 — Define storage_write.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
3. **BR-410-03-R03 — Define storage_commit.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
4. **BR-410-03-R04 — Define storage_erase.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
5. **BR-410-03-R05 — Define monotonic_read.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
6. **BR-410-03-R06 — Define monotonic_commit.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
7. **BR-410-03-R07 — Define verify_signature.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
8. **BR-410-03-R08 — Define random_bytes.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
9. **BR-410-03-R09 — Define clock_read.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
10. **BR-410-03-R10 — Define console_read.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
11. **BR-410-03-R11 — Define console_write.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
12. **BR-410-03-R12 — Define device_call.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
13. **BR-410-03-R13 — Define panic.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
14. **BR-410-03-R14 — Define yield.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
15. **BR-410-03-R15 — Define lock.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.
16. **BR-410-03-R16 — Define unlock.** Specify the contract precisely, encode it in machine-readable form where possible, and bind tests to the specification.

### Q3 — Integration
1. Update the authoritative specification first or in the same atomic change as implementation.
2. Update headers/ABI declarations and compiler/verifier tables when semantics change.
3. Update `Makefile` targets so qualification runs from a clean checkout.
4. Extend `tests/test_main.c` or split tests into focused suites if the monolith would hide coverage.
5. Keep evidence generation separate from evidence assertions: reports must consume actual command results.
6. If this package changes BRIM, LCTL, ISA, ABI, persistence, trust, or device formats, add explicit version and backward-compatibility tests.

### Q4 — Positive verification
For every atomic requirement, create at least one success-path test proving the intended behavior. Use boundary values, including zero, one, maximum legal values, and 1,048,576-bit cases when relevant.

### Q5 — Negative/adversarial verification
For every externally reachable parser, state transition, capability, image field, buffer, counter, or device path touched by this package, add malformed, unauthorized, stale/replayed, truncated, oversized, and resource-exhaustion cases as applicable. A negative test passes only when the VM rejects safely and predictably.

### Q6 — Determinism and regression
1. Run the same deterministic build/assembly/execution at least twice and compare results.
2. Re-run all pre-existing 4.0.0 tests that remain semantically valid.
3. Run sanitizer/static-analysis gates available for this codebase.
4. Record performance and size deltas; explain every material regression.
5. Verify no new implicit host dependency or network dependency has appeared.

### Q7 — Evidence package
Generate:
- `BR-410-03_requirements.json` — status and evidence hash for every atomic requirement.
- `BR-410-03_tests.log` — exact commands, exit codes, and salient output.
- `BR-410-03_audit.md` — human-readable before/after findings and unresolved blockers.
- `BR-410-03_manifest.sha256` — hashes of every file changed or generated by this work package.

The requirements JSON must include: `requirement_id`, `status`, `command`, `exit_code`, `evidence_path`, `sha256`, `baseline`, `result`, `blocker`, and `notes`.

### Q8 — Gate decision
Use these rules:
- **OPERATIONAL:** every atomic requirement passes with fresh evidence, all relevant negative tests pass, no unresolved critical/high defect exists, and regression gates pass.
- **PARTIAL:** implementation exists but one or more non-critical atomic requirements lack proof or fail.
- **BLOCKED:** required authority, dependency, hardware, independent implementation, or security prerequisite is unavailable.
- **REGRESSED:** a previously passing required behavior now fails.

Do not convert PARTIAL/BLOCKED/REGRESSED into PASS through documentation.

## Acceptance ledger

| Requirement | Requirement text | Status | Evidence |
|---|---|---|---|
| BR-410-03-R01 | Define storage_read | NOT RUN | — |
| BR-410-03-R02 | Define storage_write | NOT RUN | — |
| BR-410-03-R03 | Define storage_commit | NOT RUN | — |
| BR-410-03-R04 | Define storage_erase | NOT RUN | — |
| BR-410-03-R05 | Define monotonic_read | NOT RUN | — |
| BR-410-03-R06 | Define monotonic_commit | NOT RUN | — |
| BR-410-03-R07 | Define verify_signature | NOT RUN | — |
| BR-410-03-R08 | Define random_bytes | NOT RUN | — |
| BR-410-03-R09 | Define clock_read | NOT RUN | — |
| BR-410-03-R10 | Define console_read | NOT RUN | — |
| BR-410-03-R11 | Define console_write | NOT RUN | — |
| BR-410-03-R12 | Define device_call | NOT RUN | — |
| BR-410-03-R13 | Define panic | NOT RUN | — |
| BR-410-03-R14 | Define yield | NOT RUN | — |
| BR-410-03-R15 | Define lock | NOT RUN | — |
| BR-410-03-R16 | Define unlock | NOT RUN | — |

## Required output
Return a modified repository or patch set, the complete evidence package, exact reproduction commands, a concise change log, unresolved blockers, and the final gate decision for **BR-410-03**. The next package may consume this package only when its declared prerequisite status is satisfied.

## Dependencies
- `BR-410-02`
