# Runtime Contract

The JA Agent Scheduler shall enforce:

- deterministic-test execution when declared;
- explicit-only network access and no-network denial by default;
- schema validation before and after every tool invocation;
- least-capability consumption;
- durable human-approval and supervision gates;
- step, tool, time, and retry accounting;
- memory scope and retention expiry;
- prompt-injection isolation and secret redaction;
- causal audit history and MCRT emission;
- safe failure recovery and idempotent retry rules;
- explicit termination or a declared unresolved state.

The runtime must never infer broader authority from successful prior behavior, friendly language, apparent urgency, or model confidence.
