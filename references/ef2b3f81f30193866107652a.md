# 12 — RCPW-02-R13 — Vertical Reference, Gravity and Elevation Precision

**Stage:** 02 — Reference Frame Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Vertical reference semantics, gravity direction, and large-world elevation precision are explicit and tested independently of horizontal folding.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-02-R13** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/world_runtime.py`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/tests/test_vertical_reference.py`

## Workflow

1. Define canonical axis orientation, vertical unit, gravity vector/direction, signed elevation range, and vertical precision.
2. Specify whether radial fold acts isotropically or whether vertical treatment differs; document the exact rule.
3. Test large positive/negative Z values, high mountains/deep interiors, zero horizontal displacement, and large horizontal displacement with fixed Z.
4. Verify horizontal fold changes do not mutate canonical Z or gravity semantics.
5. Test save/load/replay and reference handoff with vertical velocity/elevation.
6. Emit vertical precision/error vectors.

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

Vertical semantics are explicit and independently testable; canonical elevation and gravity remain correct under horizontal folding/reference movement.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
