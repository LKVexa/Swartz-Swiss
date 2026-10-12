# QUORUM RC-PW 7.0.0 — Security, Capability, and Sandbox Authority

Treat world packages, saves, mods/adapters, live patches, generated content, and external assets as untrusted until validated.

Runtime services receive least-privilege capabilities:
- canonical read;
- bounded canonical mutation;
- ledger append;
- asset read;
- diagnostics;
- presentation-only access;
- patch/migration authority.

No presentation or content script gains arbitrary canonical mutation authority by default.

Test malformed packages, schema bombs, oversized assets, recursive dependencies, path abuse, stale signatures/hashes where used, capability escalation attempts, and resource exhaustion.
