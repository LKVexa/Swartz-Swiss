# JA Operations Runtime Contract

A conforming executor should:

1. Execute only a compiler-produced plan whose source and policy identities are verified.
2. Sandbox process, file, network, secret, deployment, package, and ledger effects.
3. Treat secrets as reference-only inputs and redact all materialized values.
4. Journal state transitions before mutation.
5. Evaluate liveness, readiness, health, and certification probes without widening authority.
6. Enforce scaling, upgrade, cooldown, and rollback bounds.
7. Fail closed in offline and air-gapped profiles.
8. Produce deterministic traces and recovery receipts.
9. Emit an MCRT record tied to the exact plan, inputs, outputs, and artifact identities.
10. Never promote modeled corpus expectations into native execution claims.
