# 01 — RCPW-01-R01 — Canonical Coordinate Authority, Units, Precision and Separation

**Stage:** 01 — Canonical World Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Canonical coordinates and units are explicit, versioned, precision-bounded, and independent of render/reference coordinates.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-01-R01** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/world_runtime.py`
- `vm/world/authority/world_core.mssl`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/spec/WORLD_RUNTIME.md`
- `vm/world/tests/test_world_runtime.py`

## Workflow

1. Introduce a versioned `coordinate_authority` descriptor containing canonical unit, signed range, precision/resolution, axis semantics, coordinate schema version, and transform-policy version.
2. Make canonical entity/region positions validate against the descriptor before mutation, load, replay, frontier admission, or partition migration.
3. Keep canonical coordinates completely separate from reference/folded coordinates; never serialize folded coordinates as canonical entity position.
4. Add round-trip tests that move/reference/fold/rebase entities at near, horizon, extreme positive/negative, and high-Z coordinates, then compare exact canonical coordinates.
5. Add save/load/replay tests proving coordinate descriptor version and canonical positions survive unchanged.
6. Emit `coordinate_authority_evidence.json` with units, ranges, test vectors, max observed round-trip error, and canonical digests.

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

All coordinate tests pass; canonical positions remain exact across reference/fold operations; units/range/version are explicit; the gate is evaluated by evidence ID, not by the word 'independent'.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
