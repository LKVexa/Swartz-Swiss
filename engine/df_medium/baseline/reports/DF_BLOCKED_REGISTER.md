# DF_Medium (N_MEDIUM) -- what does not work, and why

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

independent second-machine/operator replay; independent second-machine/operator rebuild; literal 72-hour native soak; AArch64 and Windows execution qualification; final 100% evidence ledger dependent on those proofs

*restated verbatim from PACKAGE_INFO.json (`strict_gate: BLOCKED`, 88/96 OPERATIONAL, 8 BLOCKED); not lifted by the fabric*

## Inherited from the target, verbatim

Source: PACKAGE_INFO.json (`strict_gate: BLOCKED`, 88/96 OPERATIONAL, 8 BLOCKED). Binding the VM to the fabric closes none of these.

* independent second-machine/operator replay
* independent second-machine/operator rebuild
* literal 72-hour native soak
* AArch64 and Windows execution qualification
* final 100% evidence ledger dependent on those proofs

## Findings recorded, not adjudicated

* Units must declare `version=4.7.0` and `image_version=9`: 5.0.0 is a qualification overlay on the frozen 4.7.0 executable core.
* The Core-61 figure is 48,264 B in the re-sealed evidence and 49,072 B in the README (both under 61,000).
* This is the target the corpora's own adapter (`pacore.adapters.bottlerocket`) binds; the DF adapter reproduces its lowering byte for byte.
