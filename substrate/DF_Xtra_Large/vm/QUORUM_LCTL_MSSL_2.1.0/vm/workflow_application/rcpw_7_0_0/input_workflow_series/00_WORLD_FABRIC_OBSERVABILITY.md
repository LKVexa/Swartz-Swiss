# QUORUM RC-PW 7.0.0 — World Fabric Observability

Expose read-only telemetry for:
- partition ownership;
- worker health;
- canonical revision;
- scheduler phase;
- transaction prepare/commit/abort counts;
- ledger lag;
- checkpoint age;
- replica freshness;
- shell/LOD backlog;
- materialization backlog;
- approximation debt;
- event barriers;
- authority wells;
- fold distortion;
- hot-patch version;
- resource saturation;
- recovery/repartition state.

Every diagnostic record includes canonical tick/epoch and version stamps sufficient for correlation with replay evidence.
