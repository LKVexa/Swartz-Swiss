# QUORUM RC-PW 7.0.0 — Deterministic Scheduler and Time Contract

## Objectives

- one canonical simulation timebase;
- explicit fixed/variable-step ownership;
- deterministic same-tick event ordering;
- bounded catch-up after stalls;
- no hidden wall-clock authority for canonical outcomes;
- shell/LOD update cadence that preserves elapsed canonical time;
- replayable reference movement, fold parameter changes, and authority-well changes.

## Required controls

Record tick/epoch, scheduler version, phase, event sequence, deterministic seed stream, and canonical revision for every durable mutation. If parallel work is used, canonical commit order must be deterministic or equivalently conflict-resolved.

Remote abstractions may use coarse time steps, but promotion must reconcile elapsed canonical time without double stepping.
