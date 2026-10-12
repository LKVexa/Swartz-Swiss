# 21 — RCPW-10-R24 — Concurrent Dense-Region Materialization Across Workers/Storage Tiers

**Stage:** 10 — Materialization Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Materialization qualification includes concurrent dense-region hydration across multiple workers/storage tiers with deterministic interaction readiness.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-10-R24** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/materialization/materializer.py`
- `vm/world/fabric/materialization_workers.py`
- `vm/world/qualification/benchmark_materialization.py`

## Workflow

1. Model materialization as a dependency graph with semantic-ready, collision-ready, navigation-ready, AI-ready, visual-ready, and interactable states.
2. Use multiple spawned workers to hydrate independent derived dependencies while a deterministic coordinator owns readiness commits.
3. Model at least hot/warm/cold storage tiers using local fixtures with measurable latency/throughput.
4. Hydrate a dense region concurrently and verify no duplicate embodiment, stale completion, or early interaction enablement.
5. Inject worker failure, cancelled prewarm, slow storage tier, and restart.
6. Measure p50/p95/p99 readiness latency, queue depth, memory, I/O, and backlog recovery.

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

Dense concurrent materialization is deterministic at interaction-readiness boundaries and survives worker/storage faults without duplicate or stale embodiment.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
