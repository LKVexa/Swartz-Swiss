# JA Data Compiler Contract

The compiler SHALL parse `.jad`, resolve modules and schemas, type-check records and operators, infer nullability, compute effects and capabilities, apply policy decisions, construct a stable typed AST, and lower accepted statements into R12 records.

The compiler SHALL NOT erase capability checks, rights decisions, retention rules, lineage edges, ordering semantics, event-time semantics, cardinality assumptions, null behavior, source identity, R12 identity, or MCRT references during optimization.

Diagnostics SHALL identify a stable code, stage, source span, violated obligation, and recovery guidance. A compiler result remains modeled until produced by a native implementation.
