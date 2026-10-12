# QUORUM Master Prompt & Workflow
## Remediate the 26 BLOCKED RC-PW 7 Gates in the Applied 5.0.0 VM Candidate

### Inputs

Use these as the working authority set:

- `QUORUM_GENERIC_PROJECT_LCTL_MSSL_VIRTUAL_MACHINE_5.0.0_CANDIDATE_RCPW_7.0.0_APPLIED.zip`
- `QUORUM_RC_PW_PROMPT_WORKFLOW_SERIES_7.0.0.zip`
- `COLUMNED_LCTL_CORPUS_1.0.0.zip`
- `LCTL_1.6.1_RC1_COLUMNED_HYPERFEDERATED_EXECUTION_LANGUAGE.zip`
- `MSSL_WRITERS_CORPUS_1.0.0 (1).zip`

Use the corpora as semantic/source-format guides. Preserve the existing QVM ISA and functioning hosted RC-PW subsystem unless a remediation explicitly requires an ABI-compatible extension.

## QUORUM mission

Modify the **actual applied VM repository** so that the 26 requirements currently marked BLOCKED obtain direct, fresh, reproducible evidence. Do not satisfy this mission by documentation-only changes, keyword relabeling, expected-output files, or fabricated PASS records.

The current application report records 241 OPERATIONAL, 315 PARTIAL, and 26 BLOCKED requirements. fileciteturn0file0L5-L11 Preserve all existing passing behavior while remediating these 26.

## Source authority

1. MSSL semantic contracts and invariants.
2. Typed schemas/evidence contracts.
3. Columned LCTL editable source (`ID │ LANE │ OP │ OUT │ CTRL │ IN │ ARG │ META`) where runtime-affecting native guest behavior is added.
4. Canonical lowered/verifier-passing LCTL.
5. Hosted runtime implementation where the current VM architecture explicitly uses hosted services.
6. Fresh runtime evidence and replay digests.
7. Documentation.

A documentation claim may never outrank executable evidence.

## Global acceptance rule

For each blocked requirement:

- implement the missing capability or direct proof;
- run positive, boundary, adversarial, replay, and recovery tests as applicable;
- emit machine-readable evidence;
- map the requirement ID directly to that evidence;
- re-run the entire existing QVM and RC-PW regression suite;
- update status only from the evidence registry.

Do not promote QP3/QP4 or WQ4 merely because a hosted/local test passes.

# Execution Phases

## Phase A — Qualification correctness and low-cost semantic blockers

1. Replace keyword-based `classify(req)` with requirement-ID/evidence-contract qualification.
2. Remediate:
   - RCPW-01-R01
   - RCPW-09-R01
   - RCPW-07-R09
   - RCPW-02-R13
   - RCPW-16-R12
   - RCPW-20-R11
3. Re-run local tests and confirm these are no longer blocked merely by words such as `independent`.

## Phase B — Resource governance, performance, rendering diagnostics and headless execution

4. Implement deterministic resource governor + replayable pressure traces.
5. Add fold scaling/performance benchmark.
6. Add deterministic reference visual-regression renderer/traces.
7. Add headless persistent wells.
8. Add standalone headless verifier.
9. Remediate:
   - RCPW-04-R09
   - RCPW-17-R18
   - RCPW-11-R06
   - RCPW-18-R16
   - RCPW-20-R20
   - RCPW-20-R07

## Phase C — Deterministic multi-worker fabric

10. Use true spawned worker processes for the hosted reference profile.
11. Add deterministic job read/write domains and canonical commit ordering.
12. Add parallel fold evaluation.
13. Add multi-worker LOD conformance.
14. Add global authority-well arbitration.
15. Add concurrent materialization with dependency-safe readiness commits.
16. Add worker provenance to ledger while preserving layout-independent semantic digests.
17. Add multi-worker save/replay conformance.
18. Remediate:
   - RCPW-03-R20
   - RCPW-04-R24
   - RCPW-18-R08
   - RCPW-18-R20
   - RCPW-10-R24
   - RCPW-19-R20
   - RCPW-20-R25

## Phase D — Versioning, hot reload and transition migration

19. Add presentation-asset version registry and rollback.
20. Add versioned representation-transition format and migration.
21. Remediate:
   - RCPW-10-R23
   - RCPW-14-R23

## Phase E — Independent replay and long-history qualification

22. Build a clean-process/fresh-extraction verifier.
23. Build historical reconstruction from checkpoint + ledger only.
24. Add multi-day/world-age history, compaction, migration, index rebuild and corruption tests.
25. Add multi-era query corpus and query-equivalence digests.
26. Remediate:
   - RCPW-12-R06
   - RCPW-19-R06
   - RCPW-19-R19
   - RCPW-19-R29

## Phase F — Integrated final gate

27. Run end-to-end failure injection and recovery.
28. Remediate RCPW-20-R08.
29. Re-run base VM tests, all existing RC-PW world tests, all newly added blocker-remediation tests, applicable Golden Worlds, headless replay, and multi-worker conformance.
30. Rebuild:
   - `RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
   - stage requirement ledgers
   - `qualification_summary.json`
   - `QUALIFICATION_REPORT.md`
   - evidence SHA-256 manifest.

# Final promotion target

The final report must show, for these 26 IDs individually:

```text
requirement_id
old_status = BLOCKED
new_status
claimed_profile
test_command
exit_code
evidence_path
evidence_sha256
notes
```

**Success condition:** no one of the 26 remains BLOCKED because of keyword classification or a capability that the remediation can execute locally.

If an item genuinely requires an unavailable external party/hardware/production environment, isolate that requirement to the correct higher qualification profile while still completing the local clean-room verifier and evidence bundle. Do not fabricate the higher-profile PASS.
