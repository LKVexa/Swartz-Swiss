# QUORUM RC-PW 7.0.0 — Causal Concurrency Model

Concurrent world systems must have explicit causal semantics.

Classify interactions as:
- independent;
- commutative;
- ordered;
- exclusive;
- transactional;
- compensatable;
- event-barrier constrained.

Examples requiring strict coordination include exclusive ownership, inventory transfer, death/destruction, mission reservation, transport boarding, canonical route mutation, and settlement/economic transfer.

A race detector or equivalent audit should identify overlapping canonical write domains and unresolved ordering ambiguity.
