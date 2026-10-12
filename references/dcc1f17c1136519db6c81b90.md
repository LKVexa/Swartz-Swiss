# 18 — RCPW-03-R20 — Parallel Fold Evaluation with One Versioned Policy

**Stage:** 03 — Fold Geometry Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Fold geometry can be evaluated in parallel over independent representation sets while using one versioned fold-policy authority.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-03-R20** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/fabric/fold_workers.py`
- `vm/world/world_runtime.py`
- `vm/world/tests/test_parallel_fold.py`

## Workflow

1. Define immutable fold-policy configuration with a version/hash captured per canonical epoch/frame view.
2. Partition independent active representation sets across spawned workers.
3. Evaluate folds in parallel and merge outputs deterministically by canonical entity/landmark ID.
4. Reject mixed fold-policy versions in one merged view.
5. Compare single-worker and multi-worker folded outputs across randomized partitions.
6. Test worker restart/retry and deterministic merge.

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

Parallel fold evaluation produces the same canonical-targeted folded representation as single-worker evaluation using one policy version.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
