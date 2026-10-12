# QUORUM RC-PW 7.0.0 — Sovereign World Fabric Architecture

## Mission
Allow one canonical folded world to execute in a single runtime or across multiple deterministic worker lanes/partitions without changing canonical semantics.

## Fabric principles
- canonical identity is execution-location independent;
- canonical world location is not worker location;
- partitions are optimization/ownership boundaries, not lore/topology boundaries;
- derived presentation may be rebuilt anywhere;
- only committed canonical state and durable causal history define truth;
- worker failure must be recoverable from committed state;
- repartitioning may change performance, not canonical meaning.

## Fabric services
- partition directory;
- ownership/lease service;
- deterministic scheduler;
- transaction coordinator;
- causal ledger coordinator;
- checkpoint/recovery coordinator;
- world-package/version registry;
- hot-patch activation authority;
- global resource governor;
- diagnostics/conformance service.
