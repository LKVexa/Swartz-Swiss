# 09 — RCPW-07-R09 — Canonical Habitat Isolation Under Spatial Folding

**Stage:** 07 — Ecology Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Spatial folding cannot collapse independent habitats into one ecological interaction domain.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-07-R09** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/world_runtime.py`
- `vm/world/authority/ecology_economy.mssl`
- `vm/world/tests/test_ecology_fold_isolation.py`

## Workflow

1. Represent habitat/interaction domains by canonical region/topology IDs and ecological adjacency, never by folded display proximity.
2. Create two canonically distant/nonadjacent habitats whose folded representations become visually close near the horizon.
3. Advance ecology and prove no predation, migration, resource sharing, or encounter is introduced solely because folded coordinates are close.
4. Create a positive-control pair with canonical ecological adjacency and prove interaction occurs according to the ecological model.
5. Repeat under reference movement and changing fold parameters.
6. Emit habitat-domain and interaction traces with canonical region IDs.

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

Folded distance cannot create ecological adjacency; only canonical ecological/topological rules can.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
