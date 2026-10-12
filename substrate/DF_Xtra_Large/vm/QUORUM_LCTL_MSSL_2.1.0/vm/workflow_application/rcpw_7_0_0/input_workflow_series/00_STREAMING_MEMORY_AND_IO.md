# QUORUM RC-PW 7.0.0 — Streaming, Memory, and I/O Contract

The architecture is not 'everything at full fidelity'. It is 'everything authoritative at appropriate fidelity'.

Define:
- canonical-state residency policy;
- hot/warm/cold derived caches;
- asset residency tiers;
- materialization queue limits;
- I/O bandwidth quotas;
- prefetch horizon;
- cancellation/eviction rules;
- checkpoint/ledger I/O reserves;
- backpressure;
- degradation order.

Eviction may remove reconstructible derived assets and caches, but not the only copy of authoritative world state or unresolved causal obligations.

Measure queue depth, p50/p95/p99 latency, memory high-water marks, I/O saturation, cache hit rate, and recovery time after overload.
