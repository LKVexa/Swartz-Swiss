# 06. Pencil Sharpener — JA21 Certifier Grammar

This package contains five independent JA Certifier Grammar 0.3 scripts:

1. **Correctness** — symbol resolution, reachability, precedence, ambiguity, typing, evidence, and deterministic lowering.
2. **Clarity** — unambiguous names, source-spanned diagnostics, line/column provenance, and readable certification traces.
3. **Compactness** — factored EBNF, language-preserving normalization, FIRST/FOLLOW construction, automaton building, and table compression.
4. **Compile-readiness** — lexer, LR(1) parser, AST, type, safety, R12, MCRT, compatibility, and packaging gates.
5. **Consistency** — stable semantic IDs, preserved provenance, repeatable lowering, compatibility, and replay evidence.

## Suite roles

| Layer | Responsibility |
|---|---|
| SOPHIA | Semantic, equivalence, policy, and type judgments |
| CHARLOTTE | Ambiguity, clarity, identity, and front-end analysis |
| LANDON | AST-to-R12-to-MCRT lowering and replay verification |
| Professor | Required source/compiler/runtime evidence |
| Podium | Final all-validator certification profile |

## Corpus alignment

The scripts follow the attached corpus patterns: `ja certifier 0.3`, deterministic static analysis, `no_network`, `no_execute_unknown_code`, required evidence hashes, signed certificate bundles, `JA_CERTIFIER_R12` lowering, and `.msslb` packaging.

The attached corpus contains both positive and expected-failure records. These five scripts are positive certification specifications; a conforming JA21 certifier should reject a target whenever any required validator, hash, signature, symbol, production, or semantic identity check fails.

## Suggested execution order

Run the scripts in this order: correctness, clarity, compactness, compile-readiness, consistency. Each module is independently certifiable and emits its own certificate package.
