# Compiler Contract

A conforming compiler must:

1. Parse stable source spans and module identities.
2. Resolve fixtures, generators, tests, simulations, proof dependencies, and emissions.
3. Type-check inputs, oracles, model state, temporal expressions, durations, units, and resources.
4. Infer effects and require explicit capabilities for network, process, device, filesystem, and ledger effects.
5. Verify generator determinism and virtual-time isolation.
6. Generate proof, replay, coverage, and resource obligations.
7. Reject vacuous, contradictory, unsafe, or unsupported constructs at the earliest responsible stage.
8. Lower accepted verification programs into stable R12 records.
9. Preserve source, AST, theorem, counterexample, and MCRT identities through optimization.
10. Emit deterministic diagnostics suitable for conformance testing.
