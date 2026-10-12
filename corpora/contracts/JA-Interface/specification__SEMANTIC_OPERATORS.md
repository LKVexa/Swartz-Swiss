# Semantic Operator Registry

| Operator | Interface responsibility | Preservation obligation |
|---|---|---|
| `component_declare` | Introduce a stable component node | Preserve identity, type, accessibility addressability, and target mapping |
| `render` | Materialize an interface projection | Preserve semantic state, target policy, and accessibility tree |
| `bind` | Connect source and destination values | Preserve type, dependency direction, cycle freedom, and update order |
| `derive` | Compute a value from dependencies | Preserve purity, dependency identity, and invalidation semantics |
| `dispatch` | Emit an event or command | Preserve ordering, capability checks, and replay identity |
| `validate` | Evaluate form, state, or policy rules | Preserve rule identity, severity, and recovery guidance |
| `authorize_control` | Gate a control or action | Preserve capability, approval, and denial evidence |
| `navigate` | Change semantic location | Preserve route identity, history policy, and focus transfer |
| `animate` | Bind deterministic visual change | Preserve clock, reduced-motion policy, and endpoint state |
| `load_resource` | Resolve a declared resource | Preserve adapter, content identity, policy, and failure behavior |
