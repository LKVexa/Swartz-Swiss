# JA Core Application Language — Standalone Specification

## Status

Version 1.0.0 publication profile, reconstructed from the uploaded 10,000-record corpus. The corpus labels its compiler and runtime results as modeled rather than natively executed.

## Purpose

JA Core is the general application layer of the JA21 suite. It provides modules, packages, values, algebraic data, functions, generics, traits, structured errors, ownership and borrowing, effects and capabilities, asynchronous work, streams, metaprogramming, reflection, serialization, FFI, and governed host integration.

## Normative application principles

1. Source identity is stable and hashable.
2. Types, ownership, effects, capabilities, and policies are checked as separate but coupled judgments.
3. Hidden network activity is prohibited by the default corpus policy.
4. Protected operations require explicit capability paths.
5. Optimization must preserve observable behavior and evidence identities or emit a traceable replacement.
6. R12 and MCRT records preserve statement identity, causal parents, policy status, hashes, confidence, and replay state.
7. Diagnostics are first-class educational and certification artifacts.
8. Smithson 8S annotations remain explicitly marked as a proposed framework.

## Feature surface

The publication recognizes **31 features**:

`async_task`, `borrow`, `capability`, `closure`, `collection`, `compile_time_generation`, `constant`, `constraint`, `effect`, `enum`, `foreign_function`, `function`, `generic`, `host_integration`, `immutable_binding`, `lifetime`, `macro`, `module`, `mutable_state`, `option`, `ownership`, `package`, `pattern_match`, `record`, `reflection`, `result`, `serialization`, `stream`, `structured_error`, `trait`, `variant`.

## Validation classes

`positive`, `negative`, `boundary`, `integration`, `security`, `performance`, `determinism`, `interoperability`, `recovery`, and `certification`.

## Native implementation boundary

This suite defines corpus-derived contracts and conformance expectations. It does not claim a production parser, compiler, VM, FFI host, package manager, or certificate signer was available.
