# BR-500-15 final operational-gate audit

## Decision

**PARTIAL — hosted VM operational; production/native 5.0.0 gate not fully earned.**

## Locally demonstrated

- **PASS** environment-captured — `evidence/environment.json`
- **PASS** lctl-verify-CORE.lctlc — `evidence/lctl_verify_CORE.json`
- **PASS** lctl-verify-BOOT.lctlc — `evidence/lctl_verify_BOOT.json`
- **PASS** lctl-verify-all_opcodes.lctlc — `evidence/lctl_verify_all_opcodes.json`
- **PASS** unit-adversarial-suite — `evidence/tests.log`
- **PASS** static-syntax-check — `evidence/static_check.log`
- **PASS** deterministic-build-replay — `evidence/determinism.json`
- **PASS** 24-opcode-conformance — `evidence/isa_conformance.json`
- **PASS** deterministic-fuzz — `evidence/fuzz.json`
- **PASS** performance-baseline — `evidence/benchmark.json`
- **PASS** resource-accounting — `evidence/resource_accounting.json`
- **PASS** offline-network-boundary — `evidence/network_boundary.json`
- **PASS** base-repository-regression — `evidence/base_repository_regression.log`
- **PASS** release-manifest — `evidence/RELEASE_MANIFEST.json`

## External / unearned gates

- QVM ISA semantics are not upstream-native LCTL primitives/self-hosted
- production cryptography/key custody not independently audited
- cross-platform qualification not run
- 72-hour soak not run
- independent rebuild not run
- independent replay not run

## BR-500-15 requirement ledger

- **PARTIAL** `BR-500-15-R01` — Native COLUMNED LCTL authority OPERATIONAL — Columned LCTL-C is authoritative QVM input; QVM semantics are not upstream-native LCTL primitives.
- **PARTIAL** `BR-500-15-R02` — Native compiler OPERATIONAL — Compiler is deterministic and operational but host-implemented, not self-hosted.
- **PARTIAL** `BR-500-15-R03` — Native verifier OPERATIONAL — Canonical LCTL plus QVM semantic verification are operational but not self-hosted.
- **OPERATIONAL** `BR-500-15-R04` — VM execution core OPERATIONAL — Hosted execution core passes current local suite.
- **OPERATIONAL** `BR-500-15-R05` — ISA OPERATIONAL — 24/24 opcodes compile and execute in local conformance evidence.
- **OPERATIONAL** `BR-500-15-R06` — ABI OPERATIONAL — ABI 1 is versioned and enforced.
- **OPERATIONAL** `BR-500-15-R07` — Memory system OPERATIONAL — Lazy megabit registers, memory and stack bounds pass.
- **OPERATIONAL** `BR-500-15-R08` — Capability system OPERATIONAL — Memory/service capability enforcement passes.
- **PARTIAL** `BR-500-15-R09` — Secure loader OPERATIONAL — Signed fail-closed loader works with development trust root; production key custody not qualified.
- **PARTIAL** `BR-500-15-R10` — Signed-image chain OPERATIONAL — Ed25519 chain works; bundled reference crypto is not independently audited or constant-time.
- **OPERATIONAL** `BR-500-15-R11` — Rollback protection OPERATIONAL — Rollback floor rejection passes.
- **OPERATIONAL** `BR-500-15-R12` — Persistence OPERATIONAL — Authenticated dual-slot persistence passes hosted tests.
- **OPERATIONAL** `BR-500-15-R13` — Recovery OPERATIONAL — Corrupt-newest-slot recovery fallback passes.
- **OPERATIONAL** `BR-500-15-R14` — Virtual devices OPERATIONAL — Versioned deterministic service/device ABI passes.
- **OPERATIONAL** `BR-500-15-R15` — APDU interface OPERATIONAL — Bounded APDU reference interface is implemented.
- **OPERATIONAL** `BR-500-15-R16` — Deterministic replay OPERATIONAL — Exact local deterministic replay passes.
- **OPERATIONAL** `BR-500-15-R17` — Resource enforcement OPERATIONAL — Program/step/memory/stack/output/APDU limits are enforced.
- **PARTIAL** `BR-500-15-R18` — Security qualification PASS — Local security tests pass; independent production security qualification is not available.
- **OPERATIONAL** `BR-500-15-R19` — Fuzz qualification PASS — Deterministic 200-case fuzz campaign passes.
- **BLOCKED** `BR-500-15-R20` — Cross-platform qualification PASS — Only the current Linux host was executable in this session.
- **BLOCKED** `BR-500-15-R21` — 72-hour native soak PASS — A 72-hour native soak cannot be established in this single build session.
- **BLOCKED** `BR-500-15-R22` — Independent rebuild PASS — No independent clean-room builder is available in-session.
- **BLOCKED** `BR-500-15-R23` — Independent replay PASS — No independent party/runtime replay is available in-session.
- **PARTIAL** `BR-500-15-R24` — Release evidence ledger 100% PASS — Local evidence ledger is complete; final release ledger cannot be 100% PASS while required external gates remain blocked.

This report follows the QUORUM hard-open rule: no manual override, no skipped required test treated as success, and no claim elevated beyond current-root evidence.
