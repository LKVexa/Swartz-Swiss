# JA Service Runtime Contract

The runtime consumes validated service artifacts and shall preserve:

- deterministic dispatch and protocol ordering;
- explicit transport activation;
- capability consumption and policy receipts;
- deadlines, quotas, rate limits, backpressure, and bounded retries;
- idempotency identities and delivery guarantees;
- structured error contracts;
- secret redaction and unknown-code prohibition;
- local, offline, or explicitly authorized remote operation;
- replayable MCRT receipts for significant transitions.

The runtime must fail closed when an artifact, compatibility identity, authority grant, transport declaration, or protocol transition is absent or invalid.
