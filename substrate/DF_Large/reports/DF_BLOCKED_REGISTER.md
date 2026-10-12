# DF_Large (N_LARGE) -- what does not work, and why

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

actual external network transport/security qualification (network optional, absent by default); physical SIM/UICC/eSIM device I/O and timing qualification; issuer key ceremony/certification; TPM/secure-element hardware qualification; native Windows OS execution certification; independent third-party certification

*restated verbatim from the package's evidence/qualification ledgers (`status OPERATIONAL, scope host-reference`) and AUDIT_ERRATA.md (F9-F12); not lifted by the fabric*

## Inherited from the target, verbatim

Source: the package's evidence/qualification ledgers (`status OPERATIONAL, scope host-reference`) and AUDIT_ERRATA.md (F9-F12). Binding the VM to the fabric closes none of these.

* actual external network transport/security qualification (network optional, absent by default)
* physical SIM/UICC/eSIM device I/O and timing qualification
* issuer key ceremony/certification
* TPM/secure-element hardware qualification
* native Windows OS execution certification
* independent third-party certification

## Findings recorded, not adjudicated

* The prior audit said this package cannot compile anything; that is wrong -- `tools/lctl430.py` is a full Columned-LCTL -> BRIM/1 compiler and built every `deploy/*.brimg`. What is absent is a C-native compiler.
* The dev CLI's `run-signed` reports status/trap but not R2; the adapter runs the byte-identical unsigned payload for the register read-back and records both.
* 5.0.0-lineage images are rejected here with trap 17 (UNSUPPORTED_ABI): the two 4.7.0 lineages are not binary compatible (AUDIT_ERRATA F9, confirmed by execution).
* Sources are minified (F10); the build is `-Werror` clean.
