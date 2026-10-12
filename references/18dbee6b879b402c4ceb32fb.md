# 038 — RCPW-03-R24

## Stage

**03 — Fold Geometry Authority**

## Exact requirement

> Fold qualification includes partition-boundary traversal, policy hot-swap rollback, acceleration-structure rebuild, and worker-loss recovery.

## Current state

- Status: **PARTIAL**
- Current blocker: A bounded hosted reference mechanism or contract exists, but the requirement exceeds the implemented local fidelity or qualification scope.
- Existing evidence pointer: `world/evidence/qualification_summary.json`
- Current profile: `QP1/WQ2/AW1/WP1_SINGLE`
- Remediation tier: `T3_FABRIC`
- Test families: `VERSION_MIGRATION, FOLD_PROPERTY, SAVE_RECOVERY, MULTI_WORKER_CONFORMANCE, TRAVERSAL_PORTAL, AUTONOMOUS_HISTORY`

## QUORUM requirement-specific prompt

Using QUORUM, modify the actual RC-PW 7 VM candidate to make **RCPW-03-R24** fully evidence-backed OPERATIONAL. The exact semantic obligation is: **Fold qualification includes partition-boundary traversal, policy hot-swap rollback, acceleration-structure rebuild, and worker-loss recovery.** Treat this as a T3_FABRIC remediation. Preserve canonical identity, topology, time, ownership, causality, save/replay compatibility, and all existing passing behavior. Use MSSL for semantic authority; use Columned LCTL/canonical LCTL when this behavior belongs in native guest execution; use the hosted VM world-service layer where that is the repository's declared architecture. Do not satisfy this requirement with prose, mocks, prewritten evidence, or a status edit.

## Primary implementation targets

- `vm/world/world_runtime.py`
- `vm/world/authority/reference_fold.mssl`
- `vm/world/spec/WORLD_RUNTIME.md`
- `vm/world/tests/`

## Detailed workflow

1. **Baseline the exact requirement.** Capture the current PARTIAL record for `RCPW-03-R24`, all existing tests that touch it, and canonical/ledger digests for a minimal deterministic scenario.
2. **Write/strengthen the semantic contract.** In the Stage 03 MSSL authority, define the state owner, allowed mutations, inputs/outputs, units/domains if numeric, invariants, failure semantics, persistence/replay obligations, and profile scope needed by this exact requirement.
3. **Close the implementation gap.** Implement the behavior required by `RCPW-03-R24` in the real target paths. If a bounded mechanism already exists, raise its fidelity until the entire requirement—not only a simplified approximation—is exercised.
4. **Bind direct instrumentation.** Add requirement-ID-tagged assertions/telemetry so the qualifier can observe the exact property without inferring it from unrelated tests.
5. **VERSION_MIGRATION.** Create previous/current/incompatible version fixtures and explicit migration functions with pre/post semantic digests.
6. **VERSION_MIGRATION.** Test upgrade, rejection of unsupported future/incompatible state, rollback, interrupted migration, and replay after migration.
7. **FOLD_PROPERTY.** Use property-based vectors for near-field identity, monotonicity, boundedness, continuity, unique inverse targeting, and canonical-topology preservation.
8. **FOLD_PROPERTY.** Inject invalid/singular/out-of-range cases and prove explicit safe failure or fallback.
9. **SAVE_RECOVERY.** Checkpoint at deterministic canonical barriers and record dirty partitions/ledger cut/version metadata.
10. **SAVE_RECOVERY.** Inject interruption/corruption/stale fragments, recover repeatedly, and compare canonical checkpoint digests plus recovery-time objective.
11. **MULTI_WORKER_CONFORMANCE.** Run the same seeded scenario under 1, 2, and 4 spawned workers or the highest practical hosted profile using deterministic commit semantics.
12. **MULTI_WORKER_CONFORMANCE.** Randomize worker completion/order, repartition or restart one worker, and compare canonical/ledger/save digests.
13. **TRAVERSAL_PORTAL.** Create deterministic route/portal/teleport traces with canonical time, occupancy/collision, route phase, and prewarm milestones.
14. **TRAVERSAL_PORTAL.** Test rapid direction reversal, missed prewarm, moving phenomena, portal/interior boundaries, and recovery to target fidelity.
15. **AUTONOMOUS_HISTORY.** Create an exact historical cut plus long-horizon/archive/rehydration path with provenance classes.
16. **AUTONOMOUS_HISTORY.** Compare fine-step vs abstract evolution, old-save continuation, compaction/rehydration, and pre-existing history digests after expansion.
17. **Adversarial closure.** Test malformed, stale, duplicate/replayed, interrupted, unsupported-version, and resource-exhaustion inputs wherever meaningful to this requirement; failures must preserve the last known-good canonical state.
18. **Deterministic replay.** Re-run the deterministic fixture at least twice and compare canonical checkpoint and semantic-ledger digests. If the requirement is presentation-only, additionally prove canonical digest invariance.
19. **Profile/fidelity closure.** Execute the actual fidelity/profile named by the requirement. Do not promote a hosted approximation to a production/native/external claim. Record exact environment and limitations.
20. **Regression.** Run the relevant stage suite plus base VM tests, existing RC-PW tests, blocker-remediation tests, world compiler determinism, LCTL verification, and any upstream/downstream stages affected by the change.
21. **Evidence receipt.** Emit `vm/world/evidence/remediation_315/RCPW-03-R24.json` conforming to `00_COMMON_EVIDENCE_CONTRACT.md`, including exact commands, exit codes, observed values, digests, profile, hashes, and blocker field.
22. **Promotion decision.** Change `RCPW-03-R24` from PARTIAL to OPERATIONAL only if its evidence predicate passes. If any mandatory high-profile environment is unavailable, retain the appropriate profile cell as PARTIAL/BLOCKED and state the missing evidence explicitly.

## Acceptance criteria

- the exact statement `Fold qualification includes partition-boundary traversal, policy hot-swap rollback, acceleration-structure rebuild, and worker-loss recovery.` is directly asserted by executable evidence;
- positive and boundary tests pass;
- applicable negative/fault cases fail safely;
- deterministic replay/semantic digests match where applicable;
- canonical truth is not silently altered by rendering/folding/LOD optimization;
- all previously passing regressions remain passing;
- the evidence receipt is fresh, hash-bound, and profile-scoped;
- the requirement-specific qualifier resolves to **OPERATIONAL**, not merely 'implemented'.

## Required evidence paths

- `vm/world/evidence/remediation_315/RCPW-03-R24.json`
- `vm/world/evidence/remediation_315/RCPW-03-R24.log`
- updated `vm/world/qualification/requirement_evidence_registry.json`
- updated stage requirement ledger
- updated global `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
