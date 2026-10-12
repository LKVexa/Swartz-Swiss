# Compiler Contract

The compiler accepts UTF-8 JA Portal Scene source and emits either a stage-specific diagnostic or a typed scene graph plus R12/MCRT evidence. Required stages are header validation, lexing, parsing, AST construction, name resolution, component/type/unit checking, graph validation, resource closure, physics and portal consistency, safety gate, normalization, optimization, R12 lowering, and MCRT emission.

Diagnostics must include stable code, stage, source span, implicated identities, and remediation guidance. The compiler must stop downstream admission after a rejecting diagnostic. Optimization passes require explicit equivalence evidence.
