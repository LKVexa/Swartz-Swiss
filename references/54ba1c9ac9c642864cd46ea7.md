# 26 — RCPW-19-R29 — Multi-Era Query Equivalence Across Compaction, Archive Migration and Expansion

**Stage:** 19 — World-State Ledger  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Qualification includes multi-era query equivalence before/after compaction, archive migration, world expansion, and independent reconstruction.

## Root cause

**INDEPENDENT_REPRODUCTION_EVIDENCE** — The requirement genuinely asks for independent replay/reconstruction/qualification. Build a clean-process/fresh-extraction verifier and keep external-party QP4 distinct.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-19-R29** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/history/query.py`
- `vm/world/history/reconstruct.py`
- `vm/world/tests/test_multi_era_queries.py`

## Workflow

1. Define a canonical historical query corpus covering entity lineage, role succession, ownership, settlement state, ecology/economy, region history, archive provenance, and expansion events.
2. Run the query corpus against un-compacted baseline history and store semantic results/digests.
3. Compact history, migrate archive format, rebuild indexes, expand the world, then rerun the same historical-cut queries.
4. Ensure expansion does not alter answers about prior canonical history outside declared mutations.
5. Run the query corpus in a fresh process/fresh extraction.
6. Emit exact/aggregated/reconstructed precision class with each result and compare semantic query digests.

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

Historical queries are semantically equivalent across compaction, archive migration, world expansion, index rebuild, and clean-room reconstruction.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
