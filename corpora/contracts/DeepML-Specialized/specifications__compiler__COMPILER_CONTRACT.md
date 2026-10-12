
# Compiler Contract

A conforming compiler processes source through lexical analysis, parsing, AST construction, name resolution, type and unit checking, semantic validation, safety gates, normalization, optimization, R12 lowering, and MCRT emission.

The compiler must preserve stable source and semantic identities; record every optimization; reject unit mismatch, invalid constraints, unsafe capabilities, noncausal dependencies, incompatible custom-operator hashes, and unstable calibration at the earliest responsible stage; and distinguish modeled output from native runtime evidence.
