# QUORUM RC-PW 7.0.0 — Cross-Partition Transactions

Use explicit transactions for canonical mutations spanning partition ownership.

Required properties:
- deterministic transaction ID;
- declared participants/read-write set;
- expected revisions;
- prepare/validate;
- commit or abort;
- idempotent retry;
- durable causal event linkage;
- recovery after coordinator/participant loss;
- stale/duplicate message rejection.

Exactly-once canonical meaning is required. Implementation may use idempotence, deduplication, compensation, or atomic commit, but the resulting canonical state must not double-apply money, inventory, ownership, damage, travel, or event consequences.
