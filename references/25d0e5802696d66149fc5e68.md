# 06 — RCPW-20-R07 — Bounded CPU/GPU/Memory/I-O/Storage Budgets and Degradation

**Stage:** 20 — Core Architecture + System Invariants  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> The integrated system has bounded CPU/GPU/memory/I/O/storage budgets and fail-safe degradation.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-20-R07** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/runtime/resource_governor.py`
- `vm/world/qualification/benchmark_world.py`
- `vm/world/spec/RESOURCE_BUDGETS.md`

## Workflow

1. Define profile-scoped budgets for CPU tick time, render/diagnostic frame time, resident/transient memory, read/write I/O, ledger throughput, checkpoint latency, storage growth, and GPU where a GPU backend exists.
2. For headless/reference profiles with no GPU backend, mark GPU `NOT_APPLICABLE` with evidence that no canonical behavior depends on GPU execution; do not call it PASS as a fake GPU test.
3. Implement a deterministic ResourceGovernor that consumes normalized pressure inputs and emits replayable degradation decisions.
4. Order degradation so speculative assets/presentation reduce before remote fidelity, and remote fidelity reduces before canonical/persistence/ledger safety.
5. Run increasing-load benchmarks to the knee point and overload recovery.
6. Emit p50/p95/p99 metrics, high-water marks, backlog recovery time, and fail-safe-degradation trace.

## Mandatory negative/adversarial tests

- stale revision/version input where applicable;
- malformed/truncated evidence or state;
- duplicate/replayed operation where applicable;
- resource/backlog pressure where applicable;
- interrupted operation/retry where applicable;
- save/load/replay boundary;
- deterministic rerun with matching canonical digests.

## Evidence contract

Emit a requirement-specific JSON receipt containing `requirement_id`, `profile`, `implementation_paths`, `test_command`, `exit_code`, `observed_results`, `canonical_digest_before`, `canonical_digest_after`, `replay_digest`, `tool_versions`, `evidence_sha256`, and `status`.

## Acceptance criterion

Every applicable resource dimension has a declared budget and measured evidence; overload degrades derived fidelity without canonical state loss.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
