# Semantic Operator Library

The corpus lowers kernels through a family of semantic operators recorded in R12. These operators are not merely opcodes; each carries type, effect, capability, policy, evidence, and identity.

| Operator family | Meaning | Preservation rule |
|---|---|---|
| `kernel_declare` | Establish a kernel boundary and execution contract | Preserve signature, target policy, and artifact identity |
| `load` / `store` | Read or write a declared memory space | Preserve address space, bounds, ordering, and effects |
| `map` | Apply elementwise semantics over an index domain | Preserve domain, shape, and numerical profile |
| `reduce` | Combine values across an axis or domain | Preserve identity, associativity assumptions, ordering, and tolerance |
| `transfer` | Move values across device or memory boundaries | Preserve source/destination capability and synchronization |
| `barrier` | Establish ordering among participating workers | Preserve scope and participant set |
| `atomic` | Apply indivisible state transition | Preserve operation, memory ordering, and target support |
| `differentiate` | Declare or lower an autodiff primitive | Preserve primal semantics and derivative contract |
| `lower` | Convert a high-level kernel to backend representation | Preserve all externally observable semantics and provenance |

An implementation may add operators through a versioned registry, but existing canonical tuples must remain replayable.
