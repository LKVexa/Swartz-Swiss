# Compiler Contract

The compiler pipeline shall:

1. Parse `.jasp` into a stable typed AST.
2. Resolve messages, endpoint parameters, response types, protocol states, and transports.
3. Infer effects and capability requirements.
4. Validate schema closure and serialization identity.
5. Check protocol reachability, transition legality, and terminal behavior.
6. Analyze retry, idempotency, delivery, deadline, quota, rate limit, and backpressure together.
7. Reject hidden network access and missing authority.
8. Emit deterministic diagnostics with stable codes.
9. Lower accepted statements to R12 without removing policy gates.
10. Produce an MCRT-linked artifact or a blocked evidence record.

Optimization may fuse validators, batch messages, compress protocol tables, and deduplicate schemas only when semantic, ordering, authority, compatibility, and evidence identities remain equivalent.
