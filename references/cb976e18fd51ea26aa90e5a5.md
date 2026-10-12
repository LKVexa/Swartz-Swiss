# 10 — RCPW-18-R08 — Thread-Timing-Independent Overlapping Well Arbitration

**Stage:** 18 — Multiple Reference Points / Authority Wells  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Overlapping wells use deterministic conflict arbitration independent of thread timing.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-18-R08** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/fabric/authority_wells.py`
- `vm/world/world_runtime.py`
- `vm/world/tests/test_authority_well_arbitration.py`

## Workflow

1. Define a deterministic well-order tuple such as `(canonical_tick, priority, reservation_class, stable_well_id)` and a conflict policy.
2. Separate presentation priority, simulation priority, and canonical mutation ownership.
3. Randomize submission order and thread/process completion order while holding canonical inputs fixed.
4. Verify the selected owner/priority result and committed events are identical across permutations.
5. Test merge, overlap, tie, migration, expiration, and abrupt worker-loss cases.
6. Record arbitration traces and canonical ownership digests.

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

Overlapping-well outcomes are identical across thread/process timing permutations for identical canonical inputs.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
