# QUORUM RC-PW 7.0.0 — Production Execution Authority

## Purpose

Convert the RC-PW series from a strong implementation workflow into a production-execution and qualification system.

## Authority hierarchy

1. canonical world state and mutation contracts;
2. deterministic scheduler/tick ownership;
3. causal ledger commit order;
4. simulation/LOD authority;
5. fold/reference transforms;
6. materialization/physics/AI embodiment;
7. rendering/audio presentation;
8. derived caches and telemetry.

Lower layers may request changes from higher authority but may not silently redefine them.

## Mandatory execution phases per tick

A reference deterministic ordering is:

`INPUT_FREEZE → CANONICAL_READ → REMOTE_SIM → CAUSAL_DECISION → LOD/FOLD_PLAN → MATERIALIZATION_PLAN → PHYSICS/AI_STEP → CANONICAL_COMMIT → LEDGER_COMMIT → REFERENCE_PROJECTION → RENDER_VIEW → CHECKPOINT/TELEMETRY`

A repository may use a different order only if it documents why, proves causal equivalence, and records the versioned scheduler contract.

## Completion doctrine

No work package is complete merely because code exists. Completion requires the relevant design, implementation, functional, adversarial, determinism, performance, recovery, integration, evidence, and promotion gates.
