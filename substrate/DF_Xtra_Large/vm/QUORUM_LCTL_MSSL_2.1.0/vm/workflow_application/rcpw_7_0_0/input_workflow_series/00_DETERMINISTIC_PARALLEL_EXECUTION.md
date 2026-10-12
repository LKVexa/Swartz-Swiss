# QUORUM RC-PW 7.0.0 — Deterministic Parallel Execution

Parallel execution is permitted only when canonical equivalence is preserved for the claimed deterministic profile.

Each job declares:
- canonical tick/epoch;
- read set;
- write set;
- deterministic stream(s);
- authority owner;
- conflict domain;
- commit phase;
- retry/idempotence semantics.

Dynamic scheduling and work stealing may change placement but not canonical commit order. Parallel reductions that influence canonical results require deterministic ordering, fixed-point, compensated summation, or another declared equivalence method.

Qualification compares canonical checkpoint digests across worker counts and partition layouts.
