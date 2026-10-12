# JA21 Suite 56 — Job Queue Workers and Sandboxes

Nine independent JA Operations Language scripts define deterministic queue
primitives, worker lifecycle, sandbox isolation, status evidence, recovery, and
the higher-level services that coordinate jobs, workers, sandboxes, failures,
and retries.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Default environment: locked, offline, local, resource bounded, and
  reproducible
- Packaging: one independently identifiable MSSLB artifact per sub-suite

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Operations Language examples covering workspace builds,
target platforms, compiler profiles, locked dependencies, offline and
air-gapped deployment, resources, workers, services, health checks, storage,
logging, metrics, traces, deployment probes, scaling, upgrade, rollback,
artifact repositories, and MSSLB packaging.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level JA21 source. A production JA Operations compiler/runtime
and trusted queue, process, sandbox, storage, clock, and audit adapters are
still required.

## Files

| File | Sub-suite | Responsibility |
| --- | --- | --- |
| `56.1_Deterministic_Queues.jaops` | Deterministic queues | Canonical ordering, immutable queue identity, deduplication, and stable dequeue eligibility |
| `56.2_Worker_Management.jaops` | Worker management | Worker registration, leases, heartbeats, capacity, lifecycle, and quarantine primitives |
| `56.3_Isolated_Sandboxes.jaops` | Isolated sandboxes | Per-attempt confinement, bounded resources, controlled inputs/outputs, and cleanup |
| `56.4_Status_Tracking.jaops` | Status tracking | Ordered, hash-linked job, attempt, worker, and sandbox status events |
| `56.5_Recovery.jaops` | Recovery | Reconciliation of leases, checkpoints, effects, receipts, and restart eligibility |
| `56.6_Job_Queue.jaops` | Job queue | Admission, tenant quotas, queue selection, dispatch, cancellation, and completion |
| `56.7_Worker_Manager.jaops` | Worker manager | Fleet-level matching, leasing, draining, scaling, replacement, and health |
| `56.8_Sandboxes.jaops` | Sandboxes | Versioned sandbox profiles, provisioning service, policy enforcement, and evidence |
| `56.9_Failures_and_Retries.jaops` | Failures and retries | Failure classification, retry policy, backoff, dead-letter handling, and terminal outcomes |

The similarly named layers are intentionally distinct:

- **Deterministic queues** define ordering and queue-state primitives; **Job
  Queue** is the admission and dispatch service using those primitives.
- **Worker management** defines one worker's registration, lease, heartbeat,
  and lifecycle; **Worker Manager** coordinates a fleet and placement policy.
- **Isolated sandboxes** define confinement invariants for one attempt;
  **Sandboxes** manages approved versioned profiles and provisioning.
- **Recovery** reconciles uncertain state; **Failures and retries** decides
  whether a classified failure is retryable and under what budget.

## Analytical ensemble

Every workspace represents the requested five-part analytical ensemble as
named services:

| Participant | Suite 56 responsibility |
| --- | --- |
| SOPHIA | Interprets job intent, dependencies, queue class, worker needs, sandbox profile, failure context, and recovery evidence |
| CHARLOTTE | Validates admission, capabilities, quotas, ordering, leases, isolation, status transitions, retry eligibility, and recovery preconditions |
| LANDON | Performs the bounded enqueue, lease, sandbox, status, retry, or recovery operation |
| Professor | Explains ordering, admission, placement, failure class, retry decision, terminal state, and repair path |
| Podium | Records immutable job, attempt, worker, sandbox, policy, state, effect, package, and recovery receipts |

Each file also declares one narrowly scoped mechanical worker. The worker may
perform only the operation admitted by CHARLOTTE and must complete through a
Podium-recorded outcome.

## Common workspace contract

All nine workspaces:

1. target `windows-x64` with the release compiler profile;
2. require locked dependencies;
3. run offline with networking disabled;
4. declare finite CPU and memory resources;
5. reference secret identifiers rather than embedding secret values;
6. define a health check for every declared service;
7. use rolling upgrades with rollback on health failure;
8. assert reproducible deployment; and
9. emit a unique MSSLB package.

The `vault://` values are opaque references. They are not credentials and do
not authorize a remote secret service. A future networked variant must declare
destinations, data classes, authentication, rate limits, timeouts, and audit
behavior explicitly.

## Identity model

The suite keeps these identities separate:

1. logical job ID;
2. job specification and input hashes;
3. queue and queue-policy version;
4. attempt ID and attempt number;
5. worker ID, worker version, and lease ID;
6. sandbox instance and sandbox-profile hashes;
7. checkpoint and effect-receipt identities;
8. failure record and retry-decision identities;
9. status-event sequence and state-projection hash; and
10. final Podium receipt.

A retry is a new attempt within the same logical job lineage. A worker restart
does not create a new logical job. A sandbox identifier is not a worker
identifier. A successful process exit is not proof of accepted output.

## 56.1 Deterministic queues

Every queue item should include:

- logical job ID and canonical job-specification hash;
- tenant, priority class, queue class, and submission sequence;
- dependency identities and admission state;
- not-before time, deadline, and cancellation state;
- idempotency key and deduplication identity;
- required worker capabilities and sandbox profile;
- resource budget and quota class; and
- policy, provenance, and Podium receipt references.

Queue order uses a declared canonical tuple, for example:

```text
(priority_class, not_before, submission_sequence, logical_job_id)
```

Wall-clock ties, filesystem enumeration, discovery order, worker speed, and
thread timing may not change canonical order. Priority changes create explicit
events. Dequeue is a lease proposal, not removal; the item is completed only
after an accepted terminal receipt.

## 56.2 Worker management

A worker record identifies:

- stable worker ID, binary/package hash, version, and runtime;
- admitted capabilities and supported job classes;
- isolation and sandbox compatibility;
- total, reserved, and available resources;
- registration, readiness, health, drain, quarantine, and stop state;
- current lease identities and expiry;
- heartbeat sequence and freshness policy; and
- configuration, policy, and provenance hashes.

Leases are exclusive for the exact attempt unless controlled redundancy is
explicit. A missed heartbeat does not immediately prove failure; it produces a
stale or suspect state followed by bounded reconciliation. Draining blocks new
leases while preserving accountability for active ones.

## 56.3 Isolated sandboxes

Each attempt receives a fresh sandbox or a proven-clean reusable boundary with:

- immutable profile identity and policy hash;
- explicitly mounted read-only inputs;
- a bounded writable work area;
- path confinement and link/mount handling;
- denied network by default;
- process, child-process, device, model, and tool capabilities;
- CPU, memory, accelerator, storage, handle, time, and output limits;
- sanitized environment and opaque secret references;
- controlled output collection and validation; and
- deterministic teardown, cleanup, and evidence.

Unknown code and repository content remain untrusted data. A sandbox profile
cannot be weakened by job input, a model response, an environment variable, or
a worker-local configuration.

## 56.4 Status tracking

Status is derived from ordered immutable events, not overwritten display text.
Representative job states are:

```text
submitted -> admitted -> queued -> leased -> preparing -> running
-> validating -> succeeded
```

Alternative explicit outcomes include:

```text
rejected | cancelled | timed_out | failed_retryable
| failed_terminal | dead_lettered | recovery_required
```

Events identify job, attempt, worker, lease, sandbox, state transition, reason,
sequence, causal parent, policy, evidence, and previous-event hash. Invalid
transitions, missing parents, duplicate sequence numbers, and conflicting
payloads are rejected. Dashboard progress is a projection and cannot mutate
authoritative status.

## 56.5 Recovery

Recovery begins with evidence, not an automatic restart. It reconciles:

- queue membership and dequeue/lease receipts;
- worker heartbeat, lease ownership, and expiry;
- sandbox existence, process state, and cleanup state;
- checkpoint identity and compatibility;
- observed external or durable effects;
- output and validation receipts;
- status-event sequence and Podium ledger; and
- retry budget and policy.

An attempt with unknown completion is not re-executed until effects are
reconciled. Recovery may resume from a verified compatible checkpoint, finish
validation of completed output, release an orphaned lease, quarantine a worker
or sandbox, or require operator action. It may not fabricate a missing
checkpoint, receipt, output, or prior state.

## 56.6 Job Queue

The Job Queue service coordinates:

- schema and capability validation;
- tenant and service quotas;
- idempotent admission and duplicate suppression;
- dependency closure and readiness;
- deterministic queue selection;
- priority and fairness policy;
- cancellation and deadline propagation;
- worker/sandbox requirement matching;
- dispatch receipts; and
- accepted terminal completion.

Admission fails before enqueue if mandatory inputs, permissions, resources,
dependencies, or policy evidence are absent. A queue can be paused without
rewriting job identity or order. Cancellation is a requested transition with a
recorded result, not deletion of history.

## 56.7 Worker Manager

The Worker Manager coordinates many registered workers while preserving the
single-worker rules. It:

- maintains the authoritative eligible-worker set;
- matches job requirements to exact capabilities and resources;
- resolves equal candidates by stable ordering;
- issues, renews, expires, and reconciles leases;
- enforces per-worker and fleet concurrency;
- drains workers before upgrade or removal;
- quarantines identity, health, or isolation drift;
- scales only within declared minimum, maximum, and resource ceilings; and
- replaces unhealthy capacity without erasing failed attempts.

Scaling does not mask deterministic software failure. A replacement worker must
pass the same registration, version, capability, readiness, and sandbox gates.

## 56.8 Sandboxes

The Sandboxes service maintains approved, immutable sandbox profiles and
provisions instances from them. A profile binds:

- operating-system and runtime identity;
- base image or filesystem hash;
- tool and model allowlists;
- capability and security policy;
- network, process, filesystem, device, and secret rules;
- resource ceilings;
- input/output contracts;
- cleanup and retention behavior;
- health probes and test fixtures; and
- profile version, approval, and provenance.

Changing a profile creates a new identity. Existing attempts retain the profile
they started with. Provisioning failure never falls back to an unconfined local
process.

## 56.9 Failures and retries

Failure classification distinguishes:

- invalid input or policy denial;
- unavailable dependency or capacity;
- worker loss or lease conflict;
- sandbox provisioning or isolation failure;
- deadline, cancellation, or resource exhaustion;
- transient runtime or transport failure;
- deterministic application failure;
- output-validation or integrity failure;
- unknown completion or durable-effect ambiguity; and
- operator-required terminal failure.

Retry policy declares eligible classes, maximum attempts, delay/backoff,
jitter source, deadline interaction, checkpoint rules, resource changes, and
dead-letter behavior. Invalid input, policy denial, deterministic defects,
integrity failures, unknown effects, and exhausted budgets are not blindly
retried.

Backoff is deterministic from declared inputs or recorded entropy. Retrying
creates a new attempt ID and preserves the prior failure. Dead-lettering is a
terminal, reviewable state—not deletion.

## End-to-end control flow

```text
job request
-> capability, schema, quota, and policy admission
-> deterministic queue placement
-> worker capability/resource match
-> exclusive attempt lease
-> sandbox provisioning
-> bounded execution
-> status and progress events
-> output validation
-> accept success OR classify failure
-> retry/dead-letter/recovery decision
-> Podium terminal receipt
```

CHARLOTTE may stop the flow at every gate. LANDON performs only the admitted
transition. Professor explains rejected, failed, degraded, and unresolved
outcomes. Podium binds the exact evidence and outcome.

## Retry and idempotency rules

- Submission idempotency prevents duplicate logical jobs.
- Dispatch identity prevents duplicate active leases for one attempt.
- Attempt identity distinguishes retries without losing job lineage.
- Effects use their own idempotency keys and receipts.
- Retry never changes the original job specification silently.
- A changed input, capability, sandbox profile, or requested effect requires a
  new job specification hash.
- Completion is accepted once for the exact terminal receipt.
- Unknown completion is reconciled before another attempt.

Exactly-once execution is not assumed. The design targets deterministic
at-least-once observation with effect-specific idempotency and reconciliation
where duplicate delivery is possible.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Valid job, quota, dependencies, eligible worker, approved sandbox, bounded execution, and accepted output | Pass |
| Negative | Duplicate conflicting job, missing capability, out-of-scope input, invalid transition, or unapproved sandbox | Expected fail |
| Boundary | Queue depth, exact deadline, last retry, lease expiry, output limit, and worker resource ceiling | Pass or explicit boundary diagnostic |
| Integration | Job, queue, attempt, worker, lease, sandbox, status, output, failure, and Podium identities agree | Pass |
| Security | Path escape, hidden network, sandbox bypass, secret leak, worker substitution, or audit bypass | Deny |
| Performance | Queue operations, leasing, status projection, and health checks remain within declared budgets | Pass within budget |
| Determinism | Shuffled submissions, workers, and completion timing yield the same canonical queue and eligibility results | Pass |
| Recovery | Interrupted lease, worker loss, orphaned sandbox, or unknown effect reconciles without duplicate mutation | Pass or explicit operator action |
| Interoperability | Queue, worker, sandbox, storage, clock, and ledger adapters preserve JA identities and state semantics | Pass |
| Certification | R12/MCRT evidence and Podium receipts replay exact ordering, decision, state, failure class, and terminal result | Pass |

## Optimization restrictions

Permitted optimization includes indexed queue lookup, immutable descriptor
caching, deterministic batching, sparse status projection, worker-capability
indexes, and pure health/readiness memoization.

Optimization must not:

- change canonical queue order or fairness;
- merge tenants, jobs, attempts, workers, leases, or sandboxes;
- widen a capability or sandbox profile;
- skip admission, quota, health, status, output, or retry gates;
- extend a lease or retry budget without a recorded decision;
- treat worker speed as priority;
- erase failures or previous attempts;
- reuse stale readiness, policy, or revocation evidence;
- remove cleanup, audit, redaction, or reconciliation; or
- change stable R12/MCRT and Podium identities.

## Smithson 8S and R12 preservation

When a job processes Smithson 8S Coupled Mechanics records, queue items,
worker leases, sandboxes, checkpoints, outputs, failure records, retries, and
Podium receipts preserve the fifth-coordinate meaning, independence evidence,
latent and projected geometry, product-state separation, semantic distance,
uncertainty, provenance, tolerance profile, and interaction order.

R12 replay retains `eta_ind`, `Delta_8S`, `g5`, `delta8`, `g3`, `gJ`,
phase/support state, relation class, limitations, and whether pairwise or
selective triadic mechanics changed the result. If `g5 > tol5` while
`g3 <= tol3`, the result remains `PROJECTION_ONLY`; a retry, worker change, or
sandbox change cannot reinterpret visible overlap as latent coupling.

Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 56 is certifiable only when all nine packages are reproducible; queue
order, job identity, attempt lineage, worker leases, sandbox profiles, status
transitions, failure classes, retry budgets, recovery decisions, and terminal
receipts are explicit; network is disabled by default; resources and retries
are bounded; unknown completion is reconciled; every service has a health
check; and R12/MCRT replay reproduces the same decisions, states, classifications,
and Podium receipt targets.
