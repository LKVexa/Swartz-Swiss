# QUORUM RC-PW 7.0.0 — Replication, Checkpoint, and Recovery

Replication is optional optimization/resilience; committed canonical authority remains explicit.

Define:
- authoritative versus replica state;
- replica freshness/revision;
- commit acknowledgement policy;
- coherent checkpoint algorithm;
- partition remapping after recovery;
- replay cut point;
- stale replica rejection;
- last-known-good rollback.

Worker/process loss must not create duplicate ownership or resurrect uncommitted mutations. Recovery must be idempotent and produce the same canonical digest when repeated from the same committed evidence.
