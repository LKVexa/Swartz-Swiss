# Compiler Contract

## Front end

The front end produces a stable AST node identity, source span, declared/inferred type, semantic judgment, effects, capabilities, policy decision, and proof obligations. Syntax recovery must not silently reinterpret a rejected kernel as valid.

## Semantic analysis

The compiler validates tensor rank and dimensions, scalar compatibility, shape substitution, memory spaces, bounds, synchronization, atomic operations, device capabilities, deterministic behavior, and policy. Every denial carries a machine-readable diagnostic.

## R12 lowering

The lowering record retains statement identity, node identity, language profile, semantic operator, dependencies, type, effects, capabilities, policy decision, input/output hashes, state, error status, confidence, proof status, source location, MCRT reference, and canonical tuple.

## Optimization law

An optimization is admissible only when it preserves observable semantics within the declared tolerance profile. The compiler must not erase capability checks, policy denials, proof obligations, deterministic ordering requirements, or R12/MCRT identity. Transformations include tiling, vectorization, fusion, layout conversion, device specialization, and reduction restructuring.

## Emission

Accepted kernels may produce an artifact. Rejected kernels must produce no executable artifact. The corpus field `actual_status: modeled_not_executed` means the expected result is specified but not proven by a supplied production compiler.
