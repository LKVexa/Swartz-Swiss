# 20 — RCPW-10-R23 — Presentation Asset Hot Reload with Independent Rollback

**Stage:** 10 — Materialization Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Hot-reloaded presentation assets are versioned separately from canonical semantic state and can roll back independently.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-10-R23** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/assets/presentation_registry.py`
- `vm/world/tests/test_asset_hot_reload.py`
- `vm/world/spec/PRESENTATION_ASSET_VERSIONING.md`

## Workflow

1. Create a presentation-asset registry whose version/hash is separate from canonical world schema/state version.
2. Activate new presentation asset sets at a frame/view barrier without altering canonical entity IDs, coordinates, ownership, or ledger state.
3. Record previous-known-good presentation package and support rollback.
4. Test valid update, invalid dependency/hash, mid-frame rejection, rollback, save/load, and canonical digest invariance.
5. Ensure interaction targets continue to resolve by canonical identity rather than presentation asset identity.
6. Emit hot-reload/rollback receipts.

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

Presentation assets can be updated and rolled back independently while canonical semantic digest remains unchanged.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
