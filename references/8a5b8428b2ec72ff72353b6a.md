# 03 — RCPW-11-R06 — Repeatable Visual Regression and Frame-Budget Evidence

**Stage:** 11 — Visibility / Rendering Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Visual regression and frame-budget evidence are generated from repeatable traversal traces.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-11-R06** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/render/reference_renderer.py`
- `vm/world/qualification/qualify_world.py`
- `vm/world/tests/test_visual_regression.py`
- `vm/world/evidence/visual_regression/`

## Workflow

1. Implement a deterministic diagnostic/reference renderer for fold geometry, shells, landmarks, entities, and horizon summaries. It may be software/headless but must produce reproducible frames or canonical frame descriptors.
2. Create fixed traversal traces covering near→fold→horizon, high-speed traversal, portal/reference changes, landmark density, and shell oscillation.
3. Generate golden outputs keyed by renderer version, world-package hash, fold-policy version, seed, and trace ID.
4. Compare new frames using exact hashes for deterministic diagnostic layers and bounded pixel/geometry metrics for presentation layers where exact identity is inappropriate.
5. Measure frame generation time and frame-budget percentiles; record hardware/runtime and whether GPU is absent/not-applicable for the claimed reference profile.
6. Fail on seam popping, duplicate landmarks, horizon inversion, unstable transforms, or budget regression beyond declared thresholds.

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

At least one repeatable traversal suite produces visual/geometry regression artifacts and p50/p95/p99 frame-budget evidence with zero unexplained mismatches.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
