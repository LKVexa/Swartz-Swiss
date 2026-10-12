# 16 — RCPW-19-R19 — Multi-Day/World-Age Ledger Compaction, Migration, Corruption and Replay

**Stage:** 19 — World-State Ledger  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Qualification includes multi-day/world-age history, compaction, migration, index rebuild, partial corruption, and independent replay.

## Root cause

**INDEPENDENT_REPRODUCTION_EVIDENCE** — The requirement genuinely asks for independent replay/reconstruction/qualification. Build a clean-process/fresh-extraction verifier and keep external-party QP4 distinct.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-19-R19** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/history/ledger_store.py`
- `vm/world/history/reconstruct.py`
- `vm/world/tests/test_ledger_long_history.py`

## Workflow

1. Generate a deterministic multi-day/world-age history with ecology, economy, ownership, wells, archives, frontier changes, and saves.
2. Compact historical segments using versioned compaction rules while preserving required causal proofs.
3. Migrate the ledger/archive format to a new version and rebuild all indexes solely from canonical segments.
4. Inject partial corruption into one segment/index and verify detection plus recovery or explicit failure.
5. Run clean-room replay/reconstruction before and after compaction/migration and compare semantic digests.
6. Measure storage reduction and replay/index rebuild cost.

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

Long-history compaction/migration/index rebuild preserves semantic results; corruption is detected; independent replay reproduces the expected canonical history.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
