# JA Verification Runtime Contract

The runtime must provide deterministic test scheduling, virtual time, ordered events, bounded failure injection, generator seeding, property execution, counterexample shrinking, proof checking, model checking, resource enforcement, coverage collection, benchmark isolation, recovery, replay, and MCRT receipt emission.

## Fail-closed rules

- Undeclared network or unknown-code execution is denied.
- Missing seeds, clocks, proof dependencies, resource profiles, or replay identities cannot silently default.
- Uncertainty is recorded explicitly rather than converted into pass.
- Failed shrink or proof normalization preserves the original witness.
- Coverage and benchmark data identify the exact source, compiler, runtime, and environment.
