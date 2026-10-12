# 159 — RCPW-11-R13

## Stage

**11 — Visibility / Rendering Authority**

## Exact requirement

> Temporal rendering history is invalidated or transformed correctly when fold parameters, reference origins, portals, or shell representations change.

## Current state

- Status: **PARTIAL**
- Current blocker: A bounded hosted reference mechanism or contract exists, but the requirement exceeds the implemented local fidelity or qualification scope.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T2_HIGH_FIDELITY`
- Test families: `REFERENCE_PRECISION, FOLD_PROPERTY, LOD_TRANSITION, CAUSAL_REPLAY, NARRATIVE_KNOWLEDGE, PRESENTATION_REGRESSION, RESOURCE_STRESS, TRAVERSAL_PORTAL`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-11-R13** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **Temporal rendering history is invalidated or transformed correctly when fold parameters, reference origins, portals, or shell representations change.** Treat this as a T2_HIGH_FIDELITY remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/presentation_transition_remediation.mssl`
- `vm/world/qualification/`
- `vm/world/tests/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-11-R13`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 11 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-11-R13` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **REFERENCE_PRECISION.** Generate deterministic transform vectors at near, shell, horizon, extreme positive/negative, and vertical coordinates.
6. **REFERENCE_PRECISION.** Measure round-trip error and continuity under rebases/reference handoffs; publish numeric tolerances and maximum observed error.
7. **FOLD_PROPERTY.** Use property-based vectors for near-field identity, monotonicity, boundedness, continuity, unique inverse targeting, and canonical-topology preservation.
8. **FOLD_PROPERTY.** Inject invalid/singular/out-of-range cases and prove explicit safe failure or fallback.
9. **LOD_TRANSITION.** Define the exact conservation vector and transition payload for source/target representations.
10. **LOD_TRANSITION.** Cycle promotion/demotion repeatedly, change update cadence, inject cancellation/failure, and compare canonical digests for drift.
11. **CAUSAL_REPLAY.** Emit deterministic event IDs, causal parents, pre/post references, seeds/model versions, and semantic digests.
12. **CAUSAL_REPLAY.** Replay/reconstruct from checkpoint + history, then corrupt/reorder/omit events and verify first-divergence detection.
13. **NARRATIVE_KNOWLEDGE.** Separate canonical facts, narrative priority/reservations, and observer-local knowledge/belief state.
14. **NARRATIVE_KNOWLEDGE.** Test competing events, stale/false information, bounded priority, off-screen deferral, and replay of the same eligibility/arbitration decision.
15. **PRESENTATION_REGRESSION.** Build deterministic reference frames/descriptors for the exact visual/audio property and bind them to world/fold/reference versions.
16. **PRESENTATION_REGRESSION.** Measure seam/popping/jitter/artifact and frame-budget metrics over fixed traversal traces; preserve canonical digests across quality degradation.
17. **RESOURCE_STRESS.** Declare explicit budgets, pressure metrics, degradation order, hysteresis/backpressure, and starvation bounds.
18. **RESOURCE_STRESS.** Increase load past budget, capture p50/p95/p99/high-water/backlog recovery, and prove authoritative state survives overload.
19. **TRAVERSAL_PORTAL.** Create deterministic route/portal/teleport traces with canonical time, occupancy/collision, route phase, and prewarm milestones.
20. **TRAVERSAL_PORTAL.** Test rapid direction reversal, missed prewarm, moving phenomena, portal/interior boundaries, and recovery to target fidelity.
21. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
22. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
23. **Profile/fidelity closure.** Execute the actual fidelity/profile named by the requirement. Do not promote a hosted approximation to a production/native/external claim. Record exact environment and limitations.
24. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
25. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-11-R13.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
26. **Promotion decision.** Change `RCPW-11-R13` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `Temporal rendering history is invalidated or transformed correctly when fold parameters, reference origins, portals, or shell representations change.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-11-R13.json`
- `vm/world/evidence/remediation_315/RCPW-11-R13.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
