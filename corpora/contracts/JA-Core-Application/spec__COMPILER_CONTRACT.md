# JA Core Compiler Contract

## Required stages

1. Source decoding and header validation
2. Module, package, import, and policy resolution
3. Parse-tree construction with source spans
4. AST construction with stable node identities
5. Name and type resolution
6. Generic and trait constraint solving
7. Ownership, borrow, and lifetime analysis
8. Effect and capability inference
9. Policy adjudication
10. R12 lowering
11. Optimization with invariant evidence
12. Artifact emission and MCRT handoff

## Rejection obligations

A rejected program must identify the stage, diagnostic code, affected source span, violated rule, and whether recovery is safe.

## Optimization invariants

The compiler must not erase:
- required effects or capabilities;
- ownership and lifetime obligations;
- policy decisions;
- source-to-AST provenance;
- R12/MCRT identity or traceable supersession;
- deterministic replay requirements;
- uncertainty, contradiction, or higher-order interaction evidence.

## Determinism

The deterministic-test profile requires stable parse, type, R12, artifact, and MCRT identities for equivalent inputs and declared toolchain versions.
