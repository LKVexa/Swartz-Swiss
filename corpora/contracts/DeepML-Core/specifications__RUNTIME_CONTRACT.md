
# DeepML Core Runtime Contract

The runtime executes only compiler-admitted packages and records deterministic evidence for every route.

## Core duties

- Load a validated DeepML Core package and verify its hashes.
- Enforce declared effects and capabilities.
- Deny network access and unknown code execution under the standalone profile.
- Bind execution targets through named adapters.
- Seed random streams by stable identity rather than incidental launch order.
- Preserve checkpoint schema, variable identity, optimizer state, and provenance.
- Emit runtime status, trace route, output hash or declared tolerance result, and failure stage.

## Distributed execution

Sharding ownership, collective order, target set, mixed-precision rules, and checkpoint barriers are part of the runtime contract. The runtime must not depend on nondeterministic arrival order when a deterministic reduction or synchronization order is declared.

## Failure discipline

A failure is evidence, not an invitation to continue. The runtime stops at policy denial, incompatible checkpoint schema, unsupported target, tolerance failure, unstable computation, or other declared validation boundary. A failure record contains the source identity, stage, diagnostic, and replay context.
