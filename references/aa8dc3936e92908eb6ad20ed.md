# 14 — RCPW-17-R18 — Fold-Operator Performance Independent of Total Canonical Population

**Stage:** 17 — QUORUM Fold Operator  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Operator performance is bounded with declared per-frame/per-tick cost independent from world canonical population size except through active representation sets.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-17-R18** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/world_runtime.py`
- `vm/world/qualification/benchmark_fold.py`
- `vm/world/tests/test_fold_scaling.py`

## Workflow

1. Make fold evaluation operate on an active representation set or spatial query result rather than scanning every canonical entity.
2. Add or validate an index/active-set mechanism whose canonical population can grow while the evaluated fold set remains fixed.
3. Benchmark fixed active-set sizes across increasing total canonical populations.
4. Record per-view/per-tick time, number of evaluated entities, index/query cost, and p50/p95/p99.
5. Define an acceptable scaling envelope showing cost is governed primarily by active representation count.
6. Add a regression test that detects accidental full-population scans.

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

Measured fold cost remains bounded by active representation/query size within the declared envelope rather than growing linearly with total canonical population.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
