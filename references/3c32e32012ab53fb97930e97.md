# 05 — RCPW-19-R06 — Independent Historical Reconstruction

**Stage:** 19 — World-State Ledger  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Historical reconstruction is independently reproducible.

## Root cause

**INDEPENDENT_REPRODUCTION_EVIDENCE** — The requirement genuinely asks for independent replay/reconstruction/qualification. Build a clean-process/fresh-extraction verifier and keep external-party QP4 distinct.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-19-R06** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/history/reconstruct.py`
- `vm/world/qualification/independent_replay.py`
- `vm/world/tests/test_history_reconstruction.py`

## Workflow

1. Create a history reconstruction API that starts from a trusted checkpoint plus ledger range/index metadata and reconstructs selected entity/region/world state without using current live state.
2. Run reconstruction in a separate process/fresh extraction.
3. Compare reconstructed entity identities, ownership, region topology, institutional roles, ecology/economy summaries, archives, and ledger head against expected checkpoint digests.
4. Include query-by-entity, region, time, cause, role, and event-lineage cases.
5. Corrupt or omit a ledger segment and verify reconstruction fails with the first missing/invalid causal boundary.
6. Emit `historical_reconstruction_receipt.json` and semantic digest comparisons.

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

Historical state is reproducibly reconstructed from checkpoint + durable history with matching semantic digests and explicit failure on damaged history.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
