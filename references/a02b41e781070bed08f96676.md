# 13 — RCPW-16-R12 — Independent Versioning of 8S/Penteract Mappings

**Stage:** 16 — Penteract World Coordinate Model  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> 8S/Penteract mappings are versioned independently from runtime schemas so mathematical experimentation cannot silently alter canonical save semantics.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-16-R12** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/authority/penteract_mapping.mssl`
- `vm/world/spec/PENTERACT_MAPPING_VERSION.md`
- `vm/world/world_runtime.py`

## Workflow

1. Create a dedicated `penteract_mapping_version` separate from world schema, save format, runtime ABI, and fold-policy versions.
2. Persist mapping version only where needed to interpret mapped/experimental extended-state fields; do not allow mapping upgrades to reinterpret canonical XYZ/topology silently.
3. Add compatibility/migration rules for mapping-version changes.
4. Create a test that changes the mapping version while canonical spatial/save semantics remain identical when the adapter is disabled.
5. Create a test that loads an incompatible mapping version and fails closed or runs an explicit migration.
6. Emit mapping-version compatibility evidence.

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

8S/Penteract experimentation is independently versioned and cannot silently change canonical save semantics.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
