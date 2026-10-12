# 15 — RCPW-18-R16 — Headless Persistent Remote Authority Wells

**Stage:** 18 — Multiple Reference Points / Authority Wells  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Remote simulation wells may persist without any camera/renderer consumer when canonical events require continued fidelity.

## Root cause

**MISSING_EXECUTABLE_CAPABILITY_OR_MEASUREMENT** — The current hosted reference build lacks a direct executable/measurement path for this renderer/resource/headless/multi-worker capability.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-18-R16** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/fabric/authority_wells.py`
- `vm/world/qualification/headless_world.py`
- `vm/world/tests/test_headless_wells.py`

## Workflow

1. Decouple authority-well lifetime from camera and renderer objects.
2. Create a headless canonical event that creates/maintains a remote well with no render consumer.
3. Advance canonical time and verify required high-fidelity/priority obligations continue.
4. Save, reload, and replay the headless well.
5. Expire or resolve the underlying canonical event and verify the well retires deterministically.
6. Emit a headless well lifecycle trace.

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

A remote authority well persists and evolves correctly with no camera/renderer consumer whenever canonical event obligations require it.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
