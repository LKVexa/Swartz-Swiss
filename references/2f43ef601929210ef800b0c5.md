# 25 — RCPW-20-R25 — Automated Multi-Worker Conformance and Save/Replay Equivalence

**Stage:** 20 — Core Architecture + System Invariants  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> The final release includes automated conformance suites that compare canonical outcomes across multiple worker counts/layouts and verify equivalent save/replay results.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-20-R25** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/qualification/multi_worker_conformance.py`
- `vm/world/evidence/conformance/`
- `vm/world/tests/test_conformance_runner.py`

## Workflow

1. Create a conformance runner that executes selected Golden World traces under 1, 2, and 4 spawned workers plus alternate partition layouts.
2. Use identical world package, seeds, scheduler/fold-policy versions, and replay inputs.
3. Compare canonical checkpoint digests, semantic ledger digests, identity/ownership maps, route/time outcomes, unresolved obligations, and save/reload final digests.
4. Add repartition-during-run and worker-loss/recovery cases.
5. Produce one matrix with PASS/FAIL/BLOCKED per layout and first-divergence details.
6. Wire the matrix into `qualify_world.py` as direct evidence for relevant requirement IDs.

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

Automated conformance proves equivalent canonical/save/replay outcomes across the tested worker counts/layouts.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
