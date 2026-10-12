# QUORUM Profile Promotion Ladder

## T1_DIRECT_PROOF

**Goal:** Promote locally implemented semantics by adding exact executable proof.

**Minimum profile:** QP1 hosted reference, unless requirement states otherwise

**Mandatory:** direct requirement test; negative/boundary test; deterministic replay where stateful; full regression.

## T2_HIGH_FIDELITY

**Goal:** Raise hosted implementation fidelity and measurable behavior to the requirement's full local semantics.

**Minimum profile:** QP1/WQ2+; may require WQ3/WQ4 for presentation/scale semantics

**Mandatory:** implementation extension; fidelity/error budget; stress/performance evidence; recovery/regression.

## T3_FABRIC

**Goal:** Demonstrate deterministic spawned-worker/partitioned behavior rather than only single-process simulation.

**Minimum profile:** Hosted fabric worker profile plus deterministic conformance; QP2/QP3 only if native/production is actually shown

**Mandatory:** 1/2/4-worker comparison; repartition/restart; transaction/ownership proof; save/replay digest equivalence.

## T4_PRODUCTION_EXTERNAL

**Goal:** Execute the actual production/hardware/independent environment named by the requirement.

**Minimum profile:** QP3 or QP4 as applicable

**Mandatory:** declared target environment; observed run; independent/production evidence; risk/rollback.
