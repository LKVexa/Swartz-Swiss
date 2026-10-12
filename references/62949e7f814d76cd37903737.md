# 04 — RCPW-12-R06 — Clean-Room Independent Replay Qualification

**Stage:** 12 — Save / Replay Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Independent replay verifies identity, coordinates, world state, and causal obligations after load.

## Root cause

**INDEPENDENT_REPRODUCTION_EVIDENCE** — The requirement genuinely asks for independent replay/reconstruction/qualification. Build a clean-process/fresh-extraction verifier and keep external-party QP4 distinct.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-12-R06** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/qualification/independent_replay.py`
- `vm/world/qualification/qualify_world.py`
- `vm/world/evidence/independent_replay/`

## Workflow

1. Build an independent replay entry point that consumes only a packaged world/save, replay trace, manifest, and public runtime interface—never live in-memory objects from the producing run.
2. Execute it in a fresh spawned process and a freshly extracted temporary copy of the release package.
3. Set deterministic environment controls and record interpreter/runtime/toolchain versions.
4. Verify identity map, canonical coordinates, world digest, ledger digest, unresolved obligations, archive state, and deterministic stream metadata at fixed checkpoints.
5. Run both valid and intentionally corrupted save/trace cases to prove the verifier rejects invalid evidence.
6. Emit an independent replay receipt containing command, exit code, input hashes, output hashes, checkpoint digests, and environment manifest.

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

Fresh-process/fresh-extraction replay reproduces all required canonical checkpoint digests and rejects corrupted inputs. External-party QP4 evidence remains a separate profile if unavailable.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
