# DeepML Device Runtime Contract

## Runtime envelope

The runtime consumes a compiler-approved kernel artifact, a verified R12 record, a linked MCRT provenance record, declared input hashes, target capabilities, a numerical profile, and an execution policy.

## Mandatory behavior

1. Refuse artifacts whose policy status is denied or whose proof state failed.
2. Bind only declared device and memory capabilities.
3. Keep hidden network execution disabled.
4. Redact secrets from diagnostics and provenance.
5. Report observed effects and consumed capabilities.
6. Produce replay evidence sufficient to compare output hashes, deterministic class, error state, and tolerance-sensitive results.
7. Never report a modeled result as device execution.

## Determinism classes

`R3-Deterministic` represents reproducible execution under the declared backend and numerical profile. `R0-Audit` represents blocked or expected-failure paths retained for inspection. Future classes must be versioned.

## Failure containment

A failed bounds proof, race proof, capability check, security policy, or provenance check blocks execution. Recovery may repair the source or select a compatible backend, but it may not suppress the original evidence.
