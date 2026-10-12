# 11 — RCPW-20-R11 — Profile Compatibility and Qualification Matrix

**Stage:** 20 — Core Architecture + System Invariants  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> A compatibility matrix distinguishes reference-model, hosted operational, native VM, production-scale, and independently qualified profiles.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-20-R11** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/spec/QUALIFICATION_COMPATIBILITY_MATRIX.md`
- `vm/world/evidence/qualification_compatibility_matrix.json`
- `vm/world/qualification/qualify_world.py`

## Workflow

1. Create a machine-readable matrix for QP0 reference model, QP1 hosted operational, QP2 native VM authority, QP3 production-scale, and QP4 independently qualified.
2. For each profile, enumerate mandatory capabilities, tests, evidence, environment, unsupported features, and promotion criteria.
3. Map WQ, AW, and worker/fabric profiles to compatible QP levels without implying promotion.
4. Record current status for each profile from evidence IDs, not keyword inference.
5. Make qualification output explicitly state `PASS/PARTIAL/BLOCKED/N/A` per profile and why.
6. Add a schema test ensuring every claim in the summary points to the matrix.

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

The matrix exists, is machine-readable, distinguishes all five execution profiles, and prevents lower-profile evidence from being promoted to a higher profile.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
