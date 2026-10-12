# 02 — RCPW-09-R01 — Narrative Gravity Independence from Distance

**Stage:** 09 — Narrative Gravity Authority  
**Current status:** BLOCKED  
**Claim profile recorded by applied build:** `QP1/WQ2/AW1/WP1_SINGLE`

## Exact requirement

> Narrative gravity is independent from raw distance and has explicit inputs.

## Root cause

**CLASSIFIER_FALSE_BLOCK + EVIDENCE_GAP** — The current qualifier blocks on keyword matching. Here, terms such as “independent” describe semantic separation or timing/layout independence, not necessarily external-party qualification. Replace keyword classification and still add direct proof.

## QUORUM remediation prompt

Using QUORUM, modify the applied RC-PW 7 VM candidate to satisfy **RCPW-09-R01** with direct executable evidence. Preserve canonical identity/topology/time/ownership/causality; preserve existing VM/RC-PW tests; use MSSL for semantic contracts and Columned LCTL/canonical LCTL where the behavior belongs in native guest authority. Do not promote the requirement from BLOCKED solely by editing status logic. Implement and execute the proof below.

## Primary target paths

- `vm/world/world_runtime.py`
- `vm/world/authority/agents_narrative.mssl`
- `vm/world/tests/test_world_runtime.py`

## Workflow

1. Add an explicit narrative-gravity record and scoring function with named inputs such as mission relevance, unresolved obligation, player relationship, threat, recency, authored importance, and causal significance.
2. Keep raw geometric/reference distance as a separate optional scheduling input; it must not be silently embedded in narrative gravity.
3. Record gravity-score inputs and reasons in deterministic trace output.
4. Create paired tests where two entities have equal distance but different narrative gravity, and different distance but equal narrative inputs.
5. Verify LOD/materialization priority can combine narrative gravity with distance without conflating the two authorities.
6. Emit `narrative_gravity_evidence.json` with score decomposition and replay traces.

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

Narrative gravity has explicit named inputs and deterministic output; distance changes do not alter gravity when gravity inputs remain fixed.

## Status rule

Set this requirement to **OPERATIONAL** only if its required evidence is fresh and passes for the claimed profile. Use **PARTIAL** if implementation exists but required proof is incomplete. Use **BLOCKED** only for a genuinely unavailable mandatory capability/dependency/profile—not because a keyword appears in the requirement text.
