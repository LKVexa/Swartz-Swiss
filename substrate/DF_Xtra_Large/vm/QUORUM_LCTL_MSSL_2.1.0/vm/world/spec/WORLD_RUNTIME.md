# RC-PW 7.0 Hosted World Runtime

The `vm/world/` subsystem applies the QUORUM Reference-Centric Penteract World 7.0 prompt/workflow series to the 5.0.0 QVM candidate as a bounded host-reference world runtime.

## Implemented reference domains

- canonical integer world coordinates and stable entity/region identity;
- reference-relative fold projection with an identity near field and finite fold horizon;
- S0-S8 shell classification and L0-L8 simulation-detail view;
- no-unload entity semantics;
- deterministic canonical time and named-seed aggregate ecology/economy evolution;
- persistent entity inventory, goals, schedules, health, roles and observer-local knowledge;
- hash-chained causal ledger;
- deterministic frontier region generation/admission;
- archive/rehydrate state and protected-obligation rejection;
- authority wells;
- idempotent inventory transactions;
- partition ownership metadata and migration without entity mutation;
- canonical save/load integrity and deterministic command replay;
- deterministic world-package compiler;
- QVM service ABI bridge from Columned LCTL-C guest programs.

## Fold function

For canonical radial distance `r`, near radius `N`, and finite horizon `H`:

- if `r <= N`, `r_f = r`;
- otherwise, with `t = r - N` and `S = H - N`, `r_f = N + floor(S*t/(S+t))`.

The mapping is monotone, bounded by `H`, and has unit first derivative at the near-field boundary before integer quantization. Canonical coordinates never change because of this projection.

## Claim boundary

This is a deterministic hosted reference implementation. It does not provide a 3D renderer, production-scale content set, native LCTL world primitives, actual multi-process deterministic fabric, independent replay, cross-platform qualification, or long-duration production soak evidence.
