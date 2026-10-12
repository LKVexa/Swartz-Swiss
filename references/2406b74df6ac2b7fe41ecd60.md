# 107 — RCPW-08-R16

## Stage

**08 — Civilization / Economy Authority**

## Exact requirement

> Economic transactions are double-entry or equivalently conservation-auditable for money/inventory/value flows where applicable.

## Current state

- Status: **PARTIAL**
- Current blocker: A bounded hosted reference mechanism or contract exists, but the requirement exceeds the implemented local fidelity or qualification scope.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T2_HIGH_FIDELITY`
- Test families: `TRANSACTION_CONCURRENCY, ECONOMY_CONSERVATION`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-08-R16** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **Economic transactions are double-entry or equivalently conservation-auditable for money/inventory/value flows where applicable.** Treat this as a T2_HIGH_FIDELITY remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/ecology_economy.mssl`
- `vm/world/tests/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-08-R16`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 08 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-08-R16` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **TRANSACTION_CONCURRENCY.** Declare read/write sets, expected revisions, ownership/token semantics, and commit/abort behavior.
6. **TRANSACTION_CONCURRENCY.** Randomize ordering/retries/stale inputs and prove one deterministic canonical result with no duplicate mutation.
7. **ECONOMY_CONSERVATION.** Use conservation-auditable money/inventory/population/logistics fixtures across at least two settlements.
8. **ECONOMY_CONSERVATION.** Inject route loss, shortages, migration, worker/replay boundaries, and verify no duplicate inventory/population or impossible travel-time shortcuts.
9. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
10. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
11. **Profile/fidelity closure.** Execute the actual fidelity/profile named by the requirement. Do not promote a hosted approximation to a production/native/external claim. Record exact environment and limitations.
12. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
13. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-08-R16.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
14. **Promotion decision.** Change `RCPW-08-R16` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `Economic transactions are double-entry or equivalently conservation-auditable for money/inventory/value flows where applicable.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-08-R16.json`
- `vm/world/evidence/remediation_315/RCPW-08-R16.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
