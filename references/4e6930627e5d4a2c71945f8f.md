# 19 — RCPW-04-R24 — Single-Worker vs Multi-Worker LOD Semantic Equivalence

**Stage:** 04 — Simulation LOD Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> LOD qualification compares single-worker and multi-worker canonical checkpoint digests for semantic equivalence.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-04-R24** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/fabric/lod_workers.py`
- `vm/world/qualification/multi_worker_conformance.py`
- `vm/world/tests/test_multiworker_lod.py`

## Workflow

1. Implement true spawned-process worker execution for LOD work, not only sequential simulated lanes.
2. Declare read/write sets and deterministic commit ordering for LOD-related canonical changes.
3. Run identical seeded scenarios under 1, 2, and 4 workers with alternate partition assignments.
4. Compare canonical checkpoint digests, entity identity/ownership, unresolved obligations, and LOD decision traces.
5. Inject randomized worker completion order and one worker restart.
6. Emit `multi_worker_lod_conformance.json`.

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

Canonical checkpoint digests and semantic outcomes match across worker counts/layouts for the deterministic profile.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
