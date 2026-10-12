# 23 — RCPW-18-R20 — First-Class Global Authority-Well Arbitration Service

**Stage:** 18 — Multiple Reference Points / Authority Wells  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Authority-well arbitration is a first-class runtime service with deterministic global ordering and partition-independent canonical ownership.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-18-R20** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/fabric/authority_wells.py`
- `vm/world/spec/WORLD_SERVICE_ABI.md`
- `vm/world/world_runtime.py`

## Workflow

1. Promote well arbitration from ad hoc dictionary state to a first-class service with versioned API and deterministic ordering.
2. Separate well observation/presentation, simulation priority, event reservation, and canonical mutation ownership.
3. Add canonical owner/lease/revision fields and transactional handoff.
4. Support partition-independent well IDs and deterministic tie-breaking.
5. Add service-level tests for create/update/merge/split/migrate/expire/recover.
6. Expose arbitration trace and ownership state to headless diagnostics.

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

Authority-well arbitration is a versioned runtime service with deterministic global ordering and canonical ownership independent of partition placement.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
