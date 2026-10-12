# QUORUM RC-PW 7.0.0 — Formal Properties and Model-Checking Contract

Where tooling permits, express core guarantees as properties:

P1 Identity Preservation:
A persistent entity cannot have two simultaneously canonical owners.

P2 No Distance Death:
Changing only reference distance cannot destroy a persistent entity.

P3 Canonical Coordinate Invariance:
Fold/unfold/rebase cannot change canonical position.

P4 Causal Replay:
Same canonical initial state + deterministic inputs yields equivalent canonical checkpoint digests.

P5 Unique Interaction Target:
A reference-space interaction maps to at most one canonical target.

P6 Bounded Fold:
Projected radial distance remains finite and monotonic over the supported domain.

P7 Transition Conservation:
LOD/materialization transitions preserve the stage's declared conservation vector.

P8 Recovery Idempotence:
Repeated recovery from the same last-known-good state converges to the same authoritative result.

P9 Resource Safety:
Exhaustion degrades derived fidelity before loss of authoritative state.

P10 Topology Preservation:
Fold projection cannot create canonical adjacency.

Use property-based randomized scenarios, bounded model checking, invariant assertions, or equivalent mechanisms available in the repository.
