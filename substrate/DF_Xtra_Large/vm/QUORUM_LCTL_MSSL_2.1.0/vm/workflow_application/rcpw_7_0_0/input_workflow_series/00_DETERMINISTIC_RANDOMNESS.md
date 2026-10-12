# QUORUM RC-PW 7.0.0 — Deterministic Randomness Contract

All canonical stochastic outcomes use named, versioned deterministic streams.

Record:
- world seed;
- subsystem stream ID;
- entity/region/event derivation key;
- algorithm/version;
- canonical tick/event position;
- draw count or equivalent reproducible state.

Rendering-only randomness may be nondeterministic if it cannot affect canonical outcomes.

Remote abstract simulation and later materialization must not draw incompatible random sequences that change previously committed canonical outcomes. Replay must reproduce canonical stochastic decisions exactly within the declared deterministic domain.
