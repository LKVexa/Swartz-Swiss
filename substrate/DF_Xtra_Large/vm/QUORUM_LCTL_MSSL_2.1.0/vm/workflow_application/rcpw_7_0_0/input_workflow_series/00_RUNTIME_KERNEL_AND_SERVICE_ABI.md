# QUORUM RC-PW 7.0.0 — Runtime Kernel and Service ABI

Define a versioned ABI/service contract for:
- canonical state read/mutation;
- deterministic scheduler/time;
- causal ledger;
- reference frame;
- fold geometry/operator;
- simulation LOD;
- entity persistence;
- navigation/routes;
- AI/goals/social simulation;
- ecology/economy/environment;
- combat/damage/interactions;
- transport/moving frames;
- narrative/event orchestration;
- materialization;
- rendering/audio views;
- save/replay;
- diagnostics/telemetry.

Each service declares authority ownership, inputs, outputs, tick phase, concurrency policy, error model, version compatibility, resource budget, and whether calls are deterministic, idempotent, transactional, or derived-only.

A consumer may not acquire canonical mutation authority by bypassing the ABI.
