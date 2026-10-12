# 066 — RCPW-05-R23

## Stage

**05 — Entity Persistence Authority**

## Exact requirement

> High-volume transient evidence uses bounded retention/compaction without reusing canonical identities in a way that breaks historical references.

## Current state

- Status: **PARTIAL**
- Current blocker: Requirement was applied to the design/traceability ledger but lacks a direct executable proof specific enough for OPERATIONAL status.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T1_DIRECT_PROOF`
- Test families: `REFERENCE_PRECISION, IDENTITY_PERSISTENCE, CAUSAL_REPLAY`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-05-R23** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **High-volume transient evidence uses bounded retention/compaction without reusing canonical identities in a way that breaks historical references.** Treat this as a T1_DIRECT_PROOF remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/persistence_ledger.mssl`
- `vm/world/tests/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-05-R23`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 05 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-05-R23` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **REFERENCE_PRECISION.** Generate deterministic transform vectors at near, shell, horizon, extreme positive/negative, and vertical coordinates.
6. **REFERENCE_PRECISION.** Measure round-trip error and continuity under rebases/reference handoffs; publish numeric tolerances and maximum observed error.
7. **IDENTITY_PERSISTENCE.** Track stable IDs, ownership, references, lifecycle/tombstone state, and historical lineage through fold/save/migration cycles.
8. **IDENTITY_PERSISTENCE.** Inject stale copies, duplicate ownership attempts, retirement/destruction, and reconstruction; verify no fork/resurrection.
9. **CAUSAL_REPLAY.** Emit deterministic event IDs, causal parents, pre/post references, seeds/model versions, and semantic digests.
10. **CAUSAL_REPLAY.** Replay/reconstruct from checkpoint + history, then corrupt/reorder/omit events and verify first-divergence detection.
11. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
12. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
13. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
14. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-05-R23.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
15. **Promotion decision.** Change `RCPW-05-R23` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `High-volume transient evidence uses bounded retention/compaction without reusing canonical identities in a way that breaks historical references.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-05-R23.json`
- `vm/world/evidence/remediation_315/RCPW-05-R23.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
