# 22 — RCPW-14-R23 — Versioned Representation-Transition Migration and Replay Compatibility

**Stage:** 14 — No-Unload Representation Transitions  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Transition format versions are independently migratable and replay-compatible according to the compatibility matrix.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-14-R23** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/transitions/format.py`
- `vm/world/transitions/migrations.py`
- `vm/world/tests/test_transition_migrations.py`

## Workflow

1. Define an explicit representation-transition record schema/version and conservation vector.
2. Implement at least one prior→current migration fixture and rejection of unsupported future/incompatible formats.
3. Preserve identity, canonical time/position, ownership, health/inventory, route progress, and unresolved obligations during migration.
4. Save during/after a transition, migrate, replay, and compare semantic digests.
5. Test cancellation/reversal after migrated state.
6. Register transition-format compatibility in the global compatibility matrix.

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

Transition formats migrate through explicit versioned rules and replay to equivalent canonical state.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
