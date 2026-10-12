# 24 — RCPW-19-R20 — Execution-Layout-Independent Ledger with Worker Provenance

**Stage:** 19 — World-State Ledger  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> World-state ledger archives include partition/worker provenance for diagnostics while canonical event meaning remains execution-layout independent.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-19-R20** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/history/ledger_store.py`
- `vm/world/world_runtime.py`
- `vm/world/tests/test_ledger_worker_provenance.py`

## Workflow

1. Add diagnostic provenance fields for worker/partition/service version to durable events without making them part of gameplay semantics unless explicitly required.
2. Define a semantic event digest that excludes execution-layout-only provenance while integrity hashes may still cover the complete stored record.
3. Run equivalent scenarios under different worker layouts.
4. Verify semantic ledger digests and reconstructed canonical state match while provenance correctly reflects different execution layouts.
5. Test repartition and worker recovery.
6. Document which event fields are semantic versus diagnostic.

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

Ledger archives retain worker/partition provenance while canonical event meaning and semantic reconstruction remain execution-layout independent.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
