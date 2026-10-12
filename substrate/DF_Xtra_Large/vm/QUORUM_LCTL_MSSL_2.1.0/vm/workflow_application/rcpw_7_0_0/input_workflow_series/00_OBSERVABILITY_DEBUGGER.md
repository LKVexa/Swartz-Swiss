# QUORUM RC-PW 7.0.0 — Observability / World Debugger Contract

Provide a debug/qualification view or machine-readable telemetry for:
- canonical entity ID and revision;
- reference coordinates and canonical coordinates;
- current shell and LOD;
- fold distortion/Jacobian or equivalent measure;
- materialization state/readiness;
- authority well membership;
- event barrier status;
- ledger sequence/lag;
- save/checkpoint age;
- simulation backlog;
- resource governor state;
- provenance class;
- last causal events.

The debugger is read-only with respect to canonical authority unless explicit privileged mutation tools are separately defined and audited.
