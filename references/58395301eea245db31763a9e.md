# 138 — RCPW-10-R09

## Stage

**10 — Materialization Authority**

## Exact requirement

> Prewarm cancellation releases resources without losing canonical state or leaving orphan handles.

## Current state

- Status: **PARTIAL**
- Current blocker: Requirement was applied to the design/traceability ledger but lacks a direct executable proof specific enough for OPERATIONAL status.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T1_DIRECT_PROOF`
- Test families: `ECOLOGY_CONSERVATION, MATERIALIZATION_READINESS, RESOURCE_STRESS`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-10-R09** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **Prewarm cancellation releases resources without losing canonical state or leaving orphan handles.** Treat this as a T1_DIRECT_PROOF remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/presentation_transition_remediation.mssl`
- `vm/world/spec/PRESENTATION_ASSET_VERSIONING.md`
- `vm/world/tests/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-10-R09`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 10 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-10-R09` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **ECOLOGY_CONSERVATION.** Create a small high-fidelity reference ecology and a remote/cohort abstraction using identical seeds.
6. **ECOLOGY_CONSERVATION.** Compare population/resource conservation, migration topology, deterministic stochastic outcomes, and rehydration error.
7. **MATERIALIZATION_READINESS.** Model dependency/readiness states explicitly and gate interaction until all authoritative dependencies required by the requirement are ready.
8. **MATERIALIZATION_READINESS.** Inject slow/missing dependency, cancellation, worker failure, and retry; verify no duplicate embodiment or fabricated canonical state.
9. **RESOURCE_STRESS.** Declare explicit budgets, pressure metrics, degradation order, hysteresis/backpressure, and starvation bounds.
10. **RESOURCE_STRESS.** Increase load past budget, capture p50/p95/p99/high-water/backlog recovery, and prove authoritative state survives overload.
11. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
12. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
13. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
14. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-10-R09.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
15. **Promotion decision.** Change `RCPW-10-R09` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `Prewarm cancellation releases resources without losing canonical state or leaving orphan handles.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-10-R09.json`
- `vm/world/evidence/remediation_315/RCPW-10-R09.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
