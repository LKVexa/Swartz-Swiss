# JA Certifier Grammar Language Specification

## Status

This standalone profile is derived from the supplied 10,000-record corpus and original version 0.3 materials. It is an implementation target and educational specification, not evidence of a completed production certifier.

## Design principles

1. **Grammar identity is stable.** Source, module, version, start symbols, imports, and hashes are explicit.
2. **Diagnostics are semantics.** The phase, span, severity, and reason for rejection are part of conformance.
3. **Policies execute.** `no_network`, `no_execute_unknown_code`, provenance, and signature requirements are enforceable gates.
4. **Optimization requires equivalence.** Normalization or table compression may not change accepted language, AST shape commitments, conflict behavior, or diagnostics without a declared profile.
5. **Certification is evidence-bearing.** A certificate refers to exact source and semantic identities, validator versions, policy decisions, R12/MCRT records, and replay conditions.
6. **Uncertainty remains visible.** Ambiguity, incomplete evidence, tolerance crossings, and missing provenance become unresolved or rejected states rather than cosmetic success.

## Compilation unit

A `.ebnf` source declares the JA Certifier version, module, policies, one or more grammar definitions, tokens, productions, start symbols, optional imports and annotations, validation or certification commands, and assertions. A conforming implementation assigns stable identities to every declared and derived object.

## Static semantics

The compiler performs lexical parsing, grammar parsing, namespace resolution, AST binding, type judgments, semantic-predicate checks, nullability, reachability, recursion, FIRST/FOLLOW, automaton and conflict analysis, policy validation, evidence validation, normalization, optimization, R12 lowering, and MCRT emission. A phase may not conceal an earlier failure by manufacturing later-stage evidence.

## Certification semantics

Certification produces a language certificate only when the declared profile’s gates pass and the evidence record remains current, signed where required, internally consistent, replayable, and traceable to exact source and semantic hashes. Compatibility and migration profiles are separate governed judgments.
