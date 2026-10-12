# QUORUM BR-450-06 — Power-loss injection

**Release sequence:** BOTTLE ROCKET 4.5.0 — Transactional Persistence & Crash Recovery  
**Purpose:** Guarantee state integrity through crashes, interrupted writes and power loss.  
**Source baseline:** `BOTTLE_ROCKET_4.0.0_COLUMNED_LCTL_MODEL_OPERATIONAL_61K`  
**Work-package status vocabulary:** `NOT_STARTED | IN_PROGRESS | PARTIAL | BLOCKED | OPERATIONAL | REGRESSED`

## QUORUM execution prompt

Using QUORUM, upgrade the attached BOTTLE ROCKET 4.0.0 COLUMNED LCTL repository to satisfy **Power-loss injection** as an evidence-backed step toward BOTTLE ROCKET 5.0.0 FULLY OPERATIONAL VM. Work directly against the repository; do not replace executable behavior with prose, mocks, placeholder PASS files, or unverifiable claims. Preserve working behavior unless this package explicitly supersedes it.

Treat the current package as a host-reference model, not as already production-qualified. The current architecture includes a 24-opcode BR ISA, 16 × 1,048,576-bit registers, four arithmetic modes, 4,096-byte memory, a 256-word wide stack, BRIM/1 images, Ed25519 signing, dual-slot persistence/recovery, APDU service, and LCTL-C source carried through canonical NOP rows with `br.*` metadata. Any semantic or format change must be versioned and migrated explicitly.

### Repository anchors to inspect first
- `src/brvm.c::br_vm_save/image_slot_write/sync_parent`
- `tests/test_main.c`

### Atomic requirements
- **BR-450-06-R01:** Inject before candidate write
- **BR-450-06-R02:** Inject during candidate write
- **BR-450-06-R03:** Inject after candidate write
- **BR-450-06-R04:** Inject before sync
- **BR-450-06-R05:** Inject after sync
- **BR-450-06-R06:** Inject during control write
- **BR-450-06-R07:** Inject before rename
- **BR-450-06-R08:** Inject after rename
- **BR-450-06-R09:** Inject during first boot
- **BR-450-06-R10:** Inject after first successful boot

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
Define the invariants for **Power-loss injection** before editing code. At minimum specify: accepted inputs, rejected inputs, state transitions, trust boundary, resource ceiling, deterministic/replay behavior, compatibility/version behavior, and the exact condition that produces OPERATIONAL status.

### Q2 — Implementation
1. **BR-450-06-R01 — Inject before candidate write.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
2. **BR-450-06-R02 — Inject during candidate write.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
3. **BR-450-06-R03 — Inject after candidate write.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
4. **BR-450-06-R04 — Inject before sync.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
5. **BR-450-06-R05 — Inject after sync.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
6. **BR-450-06-R06 — Inject during control write.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
7. **BR-450-06-R07 — Inject before rename.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
8. **BR-450-06-R08 — Inject after rename.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
9. **BR-450-06-R09 — Inject during first boot.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.
10. **BR-450-06-R10 — Inject after first successful boot.** Add deterministic positive and negative tests, adversarial cases, bounded resource assertions, and machine-readable pass/fail evidence.

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
- `BR-450-06_requirements.json` — status and evidence hash for every atomic requirement.
- `BR-450-06_tests.log` — exact commands, exit codes, and salient output.
- `BR-450-06_audit.md` — human-readable before/after findings and unresolved blockers.
- `BR-450-06_manifest.sha256` — hashes of every file changed or generated by this work package.

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
| BR-450-06-R01 | Inject before candidate write | NOT RUN | — |
| BR-450-06-R02 | Inject during candidate write | NOT RUN | — |
| BR-450-06-R03 | Inject after candidate write | NOT RUN | — |
| BR-450-06-R04 | Inject before sync | NOT RUN | — |
| BR-450-06-R05 | Inject after sync | NOT RUN | — |
| BR-450-06-R06 | Inject during control write | NOT RUN | — |
| BR-450-06-R07 | Inject before rename | NOT RUN | — |
| BR-450-06-R08 | Inject after rename | NOT RUN | — |
| BR-450-06-R09 | Inject during first boot | NOT RUN | — |
| BR-450-06-R10 | Inject after first successful boot | NOT RUN | — |

## Required output
Return a modified repository or patch set, the complete evidence package, exact reproduction commands, a concise change log, unresolved blockers, and the final gate decision for **BR-450-06**. The next package may consume this package only when its declared prerequisite status is satisfied.

## Dependencies
- `BR-450-05`
- `BR-440-11`
