# 07 — RCPW-20-R08 — End-to-End Recovery, Replay, Failure Injection and Independent Qualification

**Stage:** 20 — Core Architecture + System Invariants  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> End-to-end save/replay, crash recovery, deterministic replay, failure injection, and independent qualification are complete.

## Root cause

**INDEPENDENT_REPRODUCTION_EVIDENCE** — The requirement genuinely asks for independent replay/reconstruction/qualification. Build a clean-process/fresh-extraction verifier and keep external-party QP4 distinct.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-20-R08** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/qualification/e2e_qualification.py`
- `vm/world/qualification/independent_replay.py`
- `vm/world/evidence/e2e/`

## Workflow

1. Compose one end-to-end scenario that exercises world boot, simulation, fold/reference movement, entity updates, authority wells, save/checkpoint, crash injection, recovery, replay, ledger verification, and final digest comparison.
2. Inject failure at canonical mutation, ledger commit, save/checkpoint, materialization, transition, and partition/worker boundaries that exist in the hosted implementation.
3. Repeat recovery twice to prove idempotence.
4. Pass the resulting package/save/trace to the clean-room replay runner and compare canonical digests.
5. Separate local independent-process qualification from external-party QP4 qualification in the profile matrix.
6. Emit a consolidated end-to-end gate report referencing every sub-evidence file and exact command.

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

All locally applicable end-to-end gates pass with fresh evidence; any truly external-only QP4 item is isolated as a profile blocker rather than blocking the hosted requirement indiscriminately.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
