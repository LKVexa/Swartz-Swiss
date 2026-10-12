# 304 — RCPW-20-R15

## Stage

**20 — Core Architecture + System Invariants**

## Exact requirement

> The final release gate executes the Golden World suite plus a content-scale worldbuilding scenario containing regions, settlements, interiors, ecology, economy, transport, weather, narrative wells, and persistent history.

## Current state

- Status: **PARTIAL**
- Current blocker: A bounded hosted reference mechanism or contract exists, but the requirement exceeds the implemented local fidelity or qualification scope.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T2_HIGH_FIDELITY`
- Test families: `IDENTITY_PERSISTENCE, CAUSAL_REPLAY, ECOLOGY_CONSERVATION, ECONOMY_CONSERVATION, NARRATIVE_KNOWLEDGE, SCALE_SOAK`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-20-R15** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **The final release gate executes the Golden World suite plus a content-scale worldbuilding scenario containing regions, settlements, interiors, ecology, economy, transport, weather, narrative wells, and persistent history.** Treat this as a T2_HIGH_FIDELITY remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/source_authority.mssl`
- `vm/world/authority/fabric.mssl`
- `vm/world/qualification/qualify_world.py`
- `vm/world/spec/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-20-R15`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 20 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-20-R15` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **IDENTITY_PERSISTENCE.** Track stable IDs, ownership, references, lifecycle/tombstone state, and historical lineage through fold/save/migration cycles.
6. **IDENTITY_PERSISTENCE.** Inject stale copies, duplicate ownership attempts, retirement/destruction, and reconstruction; verify no fork/resurrection.
7. **CAUSAL_REPLAY.** Emit deterministic event IDs, causal parents, pre/post references, seeds/model versions, and semantic digests.
8. **CAUSAL_REPLAY.** Replay/reconstruct from checkpoint + history, then corrupt/reorder/omit events and verify first-divergence detection.
9. **ECOLOGY_CONSERVATION.** Create a small high-fidelity reference ecology and a remote/cohort abstraction using identical seeds.
10. **ECOLOGY_CONSERVATION.** Compare population/resource conservation, migration topology, deterministic stochastic outcomes, and rehydration error.
11. **ECONOMY_CONSERVATION.** Use conservation-auditable money/inventory/population/logistics fixtures across at least two settlements.
12. **ECONOMY_CONSERVATION.** Inject route loss, shortages, migration, worker/replay boundaries, and verify no duplicate inventory/population or impossible travel-time shortcuts.
13. **NARRATIVE_KNOWLEDGE.** Separate canonical facts, narrative priority/reservations, and observer-local knowledge/belief state.
14. **NARRATIVE_KNOWLEDGE.** Test competing events, stale/false information, bounded priority, off-screen deferral, and replay of the same eligibility/arbitration decision.
15. **SCALE_SOAK.** Define the precise duration/load/capacity profile and success thresholds before execution.
16. **SCALE_SOAK.** Run a sustained stress/soak with checkpoints and fault injection; measure drift, leaks, storage growth, queue stability, and recovery.
17. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
18. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
19. **Profile/fidelity closure.** Execute the actual fidelity/profile named by the requirement. Do not promote a hosted approximation to a production/native/external claim. Record exact environment and limitations.
20. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
21. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-20-R15.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
22. **Promotion decision.** Change `RCPW-20-R15` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `The final release gate executes the Golden World suite plus a content-scale worldbuilding scenario containing regions, settlements, interiors, ecology, economy, transport, weather, narrative wells, and persistent history.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-20-R15.json`
- `vm/world/evidence/remediation_315/RCPW-20-R15.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
