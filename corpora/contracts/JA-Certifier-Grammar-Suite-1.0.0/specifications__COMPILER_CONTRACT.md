# Compiler and Certifier Contract

A conforming implementation shall:

- parse the declared JA Certifier source version, module, policies, grammar declarations, and certification commands;
- resolve imports, tokens, productions, validators, profiles, certificates, and evidence records;
- preserve source spans and stable identities through AST binding;
- compute nullability, reachability, recursion, FIRST/FOLLOW, automata, conflicts, and ambiguity evidence;
- validate precedence, associativity, recovery, semantic predicates, type judgments, and validator dependencies;
- reject unknown symbols, empty-progress cycles, invalid evidence, stale hashes, unsigned certificates when signatures are required, and policy violations;
- prove equivalence for grammar normalization and parser-table compression;
- emit diagnostics at the earliest responsible stage;
- lower accepted semantic relations to stable R12 identities and emit MCRT provenance;
- distinguish pass, fail-as-expected, rejected, unresolved, and certification outcomes;
- preserve source, semantic, profile, validator, signature, and release identities in every certificate.

A transformation is not equivalent when it changes the accepted language, parse forest, committed AST shape, diagnostic phase, recovery behavior, policy gate, signature requirement, or replay identity without an explicit migration profile.
