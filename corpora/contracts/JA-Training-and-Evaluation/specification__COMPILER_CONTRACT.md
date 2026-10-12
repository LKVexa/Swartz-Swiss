# Compiler Contract

A conforming compiler should parse `.jate`, resolve local references, type experiment declarations, calculate effects and required capabilities, enforce policy, validate splits and thresholds, produce deterministic diagnostics, lower accepted programs to an R12 experiment plan, and preserve source spans and hashes.

Compilation must fail closed for unresolved artifacts, invalid split totals, undeclared capabilities, hidden network use, contradictory registry rules, missing seed provenance for stochastic operations, or stale evidence identities.
