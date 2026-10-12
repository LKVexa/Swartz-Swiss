# QUORUM RC-PW 7.0.0 — Event Orchestration Contract

Classify events as:
- canonical systemic;
- authored narrative;
- optional encounter;
- emergent;
- ambient;
- diagnostic/presentation-only.

Every durable event declares trigger, preconditions, canonical participants, location, time window, causal parents, resolution authority, fidelity requirement, and postconditions.

Event barriers prevent low-fidelity simulation from skipping interactions that require local/high-fidelity authority. Off-screen outcomes must be tagged `FULL_SIM`, `ABSTRACT_RESOLUTION`, `DEFERRED`, or `BLOCKED_FIDELITY`.

Authored overrides must be explicit causal events; they may not silently rewrite established canonical history.
