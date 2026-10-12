# JA Test, Simulation, and Proof Language Specification

## Purpose

JA Test, Simulation, and Proof is the JA21 verification language for executable tests, deterministic simulations, failure injection, property testing, fuzzing, shrinking, formal propositions, proof obligations, temporal properties, coverage, benchmarking, and evidence publication.

## Core semantic objects

- `VerificationBundle`: compiled collection of tests, simulations, proofs, and evidence requirements.
- `Fixture`: named reusable input state.
- `Generator`: deterministic value source with a declared seed and domain.
- `Oracle`: assertion, matcher, invariant, property, model assertion, or theorem conclusion.
- `SimulationPlan`: virtual time, events, injected failures, resources, and recovery expectations.
- `ProofGraph`: theorem, lemma, obligation, proof term, assumptions, and dependencies.
- `CoveragePlan`: source, AST, runtime, or R12 targets and adequacy thresholds.
- `BenchmarkPlan`: workload, limits, repetitions, statistics, and environment identity.

## Determinism

Deterministic execution requires stable source, seed, virtual clock, event order, fault schedule, resource profile, dependency graph, compiler/runtime identity, and replay identifier. Any hidden wall-clock, network, random, scheduler, or host dependency must be rejected or declared as a capability.

## Evidence states

`modeled`, `structurally_validated`, `natively_executed`, `replayed`, and `certified` are distinct states. A higher state cannot be inferred from a lower one.
