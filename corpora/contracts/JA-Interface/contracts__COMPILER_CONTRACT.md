# JA Interface Compiler Contract

## Inputs
- UTF-8 `.jaui` source.
- JA source-version profile.
- Imported symbol and capability registries.
- Target, resource, localization, and policy profiles.
- Optional prior AST and dependency graph for incremental compilation.

## Required stages
1. Source/header scan.
2. Tokenization and parsing.
3. Module/import resolution.
4. Symbol, type, effect, and capability analysis.
5. Binding graph construction and cycle detection.
6. Layout, accessibility, target, resource, and localization validation.
7. Typed AST emission.
8. Semantics-preserving optimization.
9. Target-neutral interface IR generation.
10. R12 evidence emission.

## Required outputs
- Accepted or rejected frontend status.
- Structured diagnostics with code, severity, source span, explanation, and recovery guidance.
- Typed AST with stable node identities.
- Interface dependency graph.
- Accessibility and target-compatibility evidence.
- Source and artifact hashes.
- R12 record linking source, semantics, policy, dependencies, and MCRT expectation.

## Non-negotiable preservation rules
Optimization may not erase component identity required for focus, accessibility,
diagnostics, test addressing, replay, or host integration. It may not reorder
observable events, bypass capability checks, weaken `no_network`, or merge states
whose update boundaries are externally visible.
