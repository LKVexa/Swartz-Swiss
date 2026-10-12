# 052 — RCPW-04-R25

## Stage

**04 — Simulation LOD Authority**

## Exact requirement

> Simulation LOD includes ultra-long-horizon demographic, institutional, ecological, economic, and infrastructure representations for generational world evolution.

## Current state

- Status: **PARTIAL**
- Current blocker: A bounded hosted reference mechanism or contract exists, but the requirement exceeds the implemented local fidelity or qualification scope.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T2_HIGH_FIDELITY`
- Test families: `FOLD_PROPERTY, LOD_TRANSITION, ECOLOGY_CONSERVATION, ECONOMY_CONSERVATION, NARRATIVE_KNOWLEDGE, AUTONOMOUS_HISTORY`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-04-R25** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **Simulation LOD includes ultra-long-horizon demographic, institutional, ecological, economic, and infrastructure representations for generational world evolution.** Treat this as a T2_HIGH_FIDELITY remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/agents_narrative.mssl`
- `vm/world/spec/RESOURCE_BUDGETS.md`
- `vm/world/tests/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-04-R25`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 04 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-04-R25` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **FOLD_PROPERTY.** Use property-based vectors for near-field identity, monotonicity, boundedness, continuity, unique inverse targeting, and canonical-topology preservation.
6. **FOLD_PROPERTY.** Inject invalid/singular/out-of-range cases and prove explicit safe failure or fallback.
7. **LOD_TRANSITION.** Define the exact conservation vector and transition payload for source/target representations.
8. **LOD_TRANSITION.** Cycle promotion/demotion repeatedly, change update cadence, inject cancellation/failure, and compare canonical digests for drift.
9. **ECOLOGY_CONSERVATION.** Create a small high-fidelity reference ecology and a remote/cohort abstraction using identical seeds.
10. **ECOLOGY_CONSERVATION.** Compare population/resource conservation, migration topology, deterministic stochastic outcomes, and rehydration error.
11. **ECONOMY_CONSERVATION.** Use conservation-auditable money/inventory/population/logistics fixtures across at least two settlements.
12. **ECONOMY_CONSERVATION.** Inject route loss, shortages, migration, worker/replay boundaries, and verify no duplicate inventory/population or impossible travel-time shortcuts.
13. **NARRATIVE_KNOWLEDGE.** Separate canonical facts, narrative priority/reservations, and observer-local knowledge/belief state.
14. **NARRATIVE_KNOWLEDGE.** Test competing events, stale/false information, bounded priority, off-screen deferral, and replay of the same eligibility/arbitration decision.
15. **AUTONOMOUS_HISTORY.** Create an exact historical cut plus long-horizon/archive/rehydration path with provenance classes.
16. **AUTONOMOUS_HISTORY.** Compare fine-step vs abstract evolution, old-save continuation, compaction/rehydration, and pre-existing history digests after expansion.
17. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
18. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
19. **Profile/fidelity closure.** Execute the actual fidelity/profile named by the requirement. Do not promote a hosted approximation to a production/native/external claim. Record exact environment and limitations.
20. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
21. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-04-R25.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
22. **Promotion decision.** Change `RCPW-04-R25` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `Simulation LOD includes ultra-long-horizon demographic, institutional, ecological, economic, and infrastructure representations for generational world evolution.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-04-R25.json`
- `vm/world/evidence/remediation_315/RCPW-04-R25.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
