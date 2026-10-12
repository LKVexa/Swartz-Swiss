# 17 — RCPW-20-R20 — Headless Deterministic Verifier

**Stage:** 20 — Core Architecture + System Invariants  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> The release includes a headless deterministic verifier capable of loading a world package/save, replaying Golden World traces, and emitting canonical checkpoint digests without full rendering.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-20-R20** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/qualification/headless_verify.py`
- `vm/RUN_WORLD_VERIFY.cmd`
- `vm/RUN_WORLD_VERIFY.sh`
- `vm/world/spec/HEADLESS_VERIFIER.md`

## Workflow

1. Implement a standalone verifier that loads a world package and optional save/replay/Golden World trace without creating a renderer.
2. Verify package hashes/schema/ABI versions, ledger chain, canonical invariants, checkpoint digests, and expected scenario outcomes.
3. Support deterministic replay to fixed checkpoints and emit machine-readable digests.
4. Return nonzero exit codes for malformed package, incompatible version, corrupted save, ledger divergence, or scenario mismatch.
5. Run it from a freshly extracted release package.
6. Document exact Windows and POSIX commands.

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

Headless verifier runs without rendering, reproduces canonical digests, and reliably fails invalid evidence with machine-readable output.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
