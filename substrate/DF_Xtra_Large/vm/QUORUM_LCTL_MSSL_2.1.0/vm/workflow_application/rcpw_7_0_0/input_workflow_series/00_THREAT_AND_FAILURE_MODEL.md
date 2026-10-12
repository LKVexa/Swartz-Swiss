# QUORUM RC-PW 7.0.0 — Threat and Failure Model

Treat all externally loaded world data, saves, schemas, mods/adapters, network-fed inputs if any, and replay/ledger segments as untrusted until validated.

Test at minimum:

- malformed/truncated/oversized state;
- duplicate IDs and conflicting ownership;
- stale epochs/revisions;
- event reordering and replay;
- corrupted snapshot/ledger/hash metadata;
- transition interruption;
- out-of-range fold parameters;
- NaN/Inf/precision overflow;
- materialization storms;
- shell oscillation;
- resource exhaustion;
- partial migration;
- unsupported schema/runtime versions;
- teleport into invalid occupancy/collision state;
- authority-well overlap conflict;
- recovery attempted repeatedly.

The system must fail closed on authoritative ambiguity while preserving the last known-good recoverable state.
