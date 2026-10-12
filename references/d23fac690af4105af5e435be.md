# 08 — RCPW-04-R09 — Observable and Replayable Resource Governor

**Stage:** 04 — Simulation LOD Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Budget governor decisions are observable, replayable, and attributed to CPU/GPU/memory/I/O pressure.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-04-R09** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/runtime/resource_governor.py`
- `vm/world/world_runtime.py`
- `vm/world/tests/test_resource_governor.py`

## Workflow

1. Define a normalized pressure snapshot schema for CPU, GPU-if-applicable, memory, I/O, storage, materialization backlog, and ledger/checkpoint pressure.
2. Make governor decisions deterministic from the pressure snapshot plus policy version, not from uncontrolled wall-clock timing.
3. Log decision ID, input pressure, violated thresholds, chosen degradation action, before/after fidelity budgets, and recovery action.
4. Replay recorded pressure traces and verify identical decisions.
5. Test no-pressure, single-resource pressure, combined pressure, sustained overload, and recovery/hysteresis.
6. Expose governor telemetry in qualification output.

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

Every governor decision is attributable to explicit resource pressure and can be replayed to the same decision sequence.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
