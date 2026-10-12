# DF_Fabric (DF0) -- what does not work, and why

Release DF-PA21.2-1.0.0. Every item below is stated in the same voice as the operational ones: an undisclosed gap is the defect, a disclosed one is scope.

## `DFF-01` container integrity -- `VERIFIED`

hashes, manifest, one pinned core, schemas, citations, core selfcheck

*G0.1/G0.2 run after sealing; VERIFY re-runs them live*

## `DFF-30` work stealing, straggler mitigation, elasticity, grain adaptation, deadlock detection -- `SPECIFIED`

present in the carried core (pacore.fabric) but not exercised by the DF fabric programs

## `DFF-31` bundle-driven fabric programs -- `SPECIFIED`

FABRIC.pal is declarative; SPAWN/BARRIER/collective rows are not yet interpreted as the schedule

## `DFF-32` cross-machine federation -- `BLOCKED`

NETWORK=deny; local processes on one host

## `DFF-33` physical quantum outputs -- `BLOCKED_EXTERNAL_AUTHORITY`

PHYSICAL_PARALLEL_QPU_EXECUTION, PHYSICAL_DISTRIBUTED_QPU_EXECUTION

## `DFF-34` quantum-face execution on any node -- `BLOCKED`

no node has a qubit; qcapacity=0

## Findings recorded, not adjudicated

* Images are not portable between nodes (gate F7): a 5.0.0 image traps 17 UNSUPPORTED_ABI on the 4.7.0 VM; BOTTLE ROCKET binaries are rejected by the QVM loader with a generic error. The fabric therefore moves sealed rows, never images.
* The pipeline program is a dependency chain: span == work. No parallel speedup is claimed for it; it demonstrates that heterogeneous nodes can carry one computation, not that they carry it faster.
* multi_process_throughput executes and agrees, but its event-log hash is not asserted (may_reorder=True), exactly as PA_LCTL_FABRIC_SPEC.md s18 states.
* The QUORUM node's compile is column-verified by the bundled JVM verifier only when a Java runtime is present; otherwise the run says lctl_column_verify=SKIPPED_NO_JDK.
* The fabric's segment size is 84 rows whichever nodes are bound (the BOTTLE ROCKET 256-instruction ceiling), so a chain's shape does not depend on which containers are present; with fewer nodes bound the segments simply share the workers that are.
