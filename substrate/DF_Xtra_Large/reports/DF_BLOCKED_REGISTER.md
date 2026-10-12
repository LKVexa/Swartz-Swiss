# DF_Xtra_Large (N_XLARGE) -- what does not work, and why

Release DF-PA21.2-1.0.0. Every item below is stated in the same voice as the operational ones: an undisclosed gap is the defect, a disclosed one is scope.

## `DFN-01` container integrity -- `VERIFIED`

every delivered byte is hashed (SHA256SUMS.txt) and the MANIFEST inventory matches disk

*G0.1/G0.2 run after sealing; the shipped results file predates the seal by construction (see provenance/DF_PROVENANCE.json assembly record) and VERIFY re-runs them live*

## `DFN-30` classical-face execution -- `BLOCKED_CAPABILITY_ABSENT`

executing the classical rows of a bundle rather than witnessing them

## `DFN-31` quantum-face execution -- `BLOCKED`

the machine has no qubit; every quantum feature is UNSUPPORTED

## `DFN-32` cross-machine federation -- `BLOCKED`

NETWORK=deny; the fabric is executed on one host

## `DFN-33` physical quantum outputs -- `BLOCKED_EXTERNAL_AUTHORITY`

PHYSICAL_PARALLEL_QPU_EXECUTION, PHYSICAL_DISTRIBUTED_QPU_EXECUTION

## `DFN-34` the target's own blockers -- `BLOCKED`

physical distributed L9 subprofile CONDITIONAL_EXTERNAL_AUTHORITY (authenticated external adapter authority and physical receipts); production-domain fidelity and executable legacy-runtime equivalence not claimed (B001-B003); QVM production 5.0.0 gate PARTIAL: not self-hosted/native, key custody unaudited, no cross-platform, no 72-hour soak, no independent rebuild/replay; world QP3/QP4/WQ4/AW4/production fabric BLOCKED

*restated verbatim from README_START_HERE.md, CLAIM_BOUNDARY.md, vm/evidence/QUALIFICATION_REPORT.md, vm/world/spec/WORLD_CLAIM_BOUNDARY.md; not lifted by the fabric*

## Inherited from the target, verbatim

Source: README_START_HERE.md, CLAIM_BOUNDARY.md, vm/evidence/QUALIFICATION_REPORT.md, vm/world/spec/WORLD_CLAIM_BOUNDARY.md. Binding the VM to the fabric closes none of these.

* physical distributed L9 subprofile CONDITIONAL_EXTERNAL_AUTHORITY (authenticated external adapter authority and physical receipts)
* production-domain fidelity and executable legacy-runtime equivalence not claimed (B001-B003)
* QVM production 5.0.0 gate PARTIAL: not self-hosted/native, key custody unaudited, no cross-platform, no 72-hour soak, no independent rebuild/replay
* world QP3/QP4/WQ4/AW4/production fabric BLOCKED

## Findings recorded, not adjudicated

* `vm/RUN_WORLD.sh` rewrites four manifest-bound WORLD_DEMO.* files, so the repository's own VERIFY_ALL fails afterwards until `validation/reseal_tree.py`; the DF container never runs it against the sealed payload (VERIFY uses a scratch copy).
* Shipped world qualification counts disagree between files (267/315 vs 582/0); both are restated, neither is adjudicated here.
* The QVM rejects BOTTLE ROCKET BRIM/1 binaries and LCTLC/1.1-1.2 sources; it is a different machine.
* Execution is ~35k steps/s (each step hashes the state): the witness of a 240-row bundle takes ~0.7 s; a million steps ~29 s.
