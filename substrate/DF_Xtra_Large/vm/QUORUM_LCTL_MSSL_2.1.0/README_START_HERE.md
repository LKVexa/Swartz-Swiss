# QUORUM Generic Project — LCTL/MSSL L4–L9 Open 2.1.0 Candidate

This release builds on the 2.0.1 native-runtime qualification candidate and changes higher qualification from a strictly sequential ladder into profile-scoped gates.

## Gate availability

- L0–L3: retained structural qualification.
- L4: **OPEN** — 66/66 reference-domain fixture profiles PASS.
- L5: **OPEN** — 66/66 source/contract differential profiles PASS.
- L6: **OPEN** — 66/66 exact reference-domain replay PASS; native LCTL replay retained.
- L7: **OPEN** — 66/66 reference security PASS; native failure/recovery retained.
- L8: **OPEN** — 66/66 measured deterministic reference performance PASS; native benchmark evidence retained.
- L9: **OPEN** — 5/5 local/offline cross-plane scenarios PASS with exact replay; distributed simulator profile retained.

The physical distributed L9 subprofile remains conditional on authenticated external adapter authority and physical receipts. Production-domain fidelity and executable legacy-runtime equivalence are not claimed.

Start with `qualification/open_gates/L4_L9_GATE_OPENING_DECISION_2.1.0.md` and `qualification/open_gates/L4_L9_OPEN_GATE_MATRIX_2.1.0.json`.


## QUORUM Virtual Machine extension

This repository now includes a functional **5.0.0-candidate hosted Virtual Machine subsystem** under `vm/`. Start with `vm/README_START_HERE.md`, run `vm/RUN_VM.sh` (or `vm\RUN_VM.cmd` on Windows), and review `vm/evidence/QUALIFICATION_REPORT.md` plus `vm/workflow_application/WORKFLOW_APPLICATION_REPORT.md`.

The VM extension does **not** overwrite the original L4-L9 reference-profile claims. Its local hosted execution gate is operational, while native/self-hosted, production cryptographic custody, cross-platform, 72-hour soak, and independent rebuild/replay gates remain explicitly partial or blocked until independently demonstrated.

## RC-PW 7.0 folded-world application

The 5.0.0 hosted QVM candidate now includes an applied **Reference-Centric Penteract World 7.0** subsystem under `vm/world/` and a Columned LCTL-C guest demo at `vm/src/WORLD_DEMO.lctlc`.

Run `vm/RUN_WORLD.sh` (or `vm\RUN_WORLD.cmd`) and review `vm/world/evidence/QUALIFICATION_REPORT.md`.

The locally demonstrated profile is now **QP1/WQ2/AW1/WP4_HOSTED_REFERENCE**. The 26 atomic requirements that were previously marked BLOCKED have been remediated with direct hosted-reference evidence: the application ledger now records **267 OPERATIONAL, 315 PARTIAL, 0 BLOCKED, 0 REGRESSED** atomic requirements. The full RC-PW 7.0 gate remains PARTIAL because native upstream world primitives, production renderer/physics/AI fidelity, all 80 Golden Worlds, production-distributed/multi-host fabric, target-hardware/cross-platform qualification, production-duration soak, and external-party QP4 certification remain outside the demonstrated profile.

Start remediation verification with `vm/world/qualification/remediate_26.py` or run the integrated `vm/world/qualification/qualify_world.py`. Evidence is under `vm/world/evidence/remediation_26/`.

## Re-sealing after a VM gate run (audit remediation)

`vm/make operational` regenerates `vm/deploy/*` and `vm/evidence/*`, which the root `SHA256SUMS.txt` binds, and seven MSSL authority documents shipped with stale or placeholder κ seals, so `validation/VERIFY_ALL.sh` failed on the pristine tree. Use `validation/RESEAL_AFTER_VM_GATE.sh` (or `.cmd`) — it runs the VM gate, repairs every MSSL κ seal, regenerates `SHA256SUMS.txt`, and re-runs `VERIFY_ALL` and the L4–L9 evidence check. `validation/reseal_tree.py` can also be run alone after editing any `.mssl` file.

The QVM's `--skip-lctl-verify` now really skips the bundled JVM verifier, and Ed25519 uses the `cryptography` package when importable (set `QVM_PURE_PYTHON_ED25519=1` to force the pure-Python reference implementation); see `vm/CHANGELOG.md`.
