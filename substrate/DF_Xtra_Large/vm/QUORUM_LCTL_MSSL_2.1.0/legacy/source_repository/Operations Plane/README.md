# JA21 Suite 53 — Operations Plane

JA21 language: **JA Operations Language** (`.jaops`)

Suite 53 defines the operational control plane behind AI services. The suite is
split into seven independently reviewable sub-suites so registration, resource
control, scheduling, observability, configuration, deployment, and recovery can
be tested without hiding one concern inside another.

The attached corpus was validated before generation. Its manifest identifies
the `ja.operations` profile, JA kernel `ja-kernel-0.3`, MSSLB packaging, locked
dependencies, offline deployment, resource requirements, services, health
checks, scaling rules, upgrade strategies, rollback rules, logging, metrics,
and traces. The corpus status is
`provisional-generated-not-production-compiler-validated`; accordingly, these
files are specification-level JA21 source and still require the intended JA21
compiler/runtime for production compilation.

## Files

| Sub-suite | File | Operational responsibility |
|---|---|---|
| 53.1 AI Service Registry | `53.1_Operations_Plane_AI_Service_Registry.jaops` | Maintains stable AI service identities, versions, capabilities, runtime bindings, and lifecycle state. |
| 53.2 Runtime Resource Control | `53.2_Operations_Plane_Runtime_Resource_Control.jaops` | Enforces CPU, memory, accelerator, storage, time, process, and output budgets. |
| 53.3 Job Scheduling and Quotas | `53.3_Operations_Plane_Job_Scheduling_and_Quotas.jaops` | Admits, prioritizes, schedules, retries, cancels, and accounts for bounded work. |
| 53.4 Health and Observability | `53.4_Operations_Plane_Health_and_Observability.jaops` | Produces local health, progress, logging, metric, and trace evidence. |
| 53.5 Secrets and Configuration | `53.5_Operations_Plane_Secrets_and_Configuration.jaops` | Resolves typed configuration and opaque secret references with redaction and provenance. |
| 53.6 Deployment and Scaling | `53.6_Operations_Plane_Deployment_and_Scaling.jaops` | Reconciles desired service state, placements, replicas, and bounded scaling. |
| 53.7 Upgrade and Rollback | `53.7_Operations_Plane_Upgrade_and_Rollback.jaops` | Stages version changes, checks compatibility, and restores a known-good state on failure. |

## Analytical ensemble

Every sub-suite represents the requested five-part analytical ensemble as named
services:

- **SOPHIA** establishes operating context, evidence boundaries, invariants,
  service state, and constraints.
- **CHARLOTTE** performs admission and safety gating, rejecting ambiguous,
  unauthorized, unhealthy, or out-of-budget actions.
- **LANDON** executes the bounded operational transition and emits explicit
  state changes.
- **Professor** explains the transition, test result, failure mode, and
  remediation in a reviewable report.
- **Podium** records the final decision, evidence references, package identity,
  and rollback receipt.

Each workspace also contains one narrowly scoped worker. The worker performs
mechanical operational work; it does not bypass CHARLOTTE or issue an
unrecorded decision outside Podium.

## Common workspace contract

All seven workspaces:

1. target `windows-x64` using the release compiler profile;
2. require locked dependencies;
3. default to an offline environment with networking disabled;
4. declare bounded CPU and memory resources;
5. reference secrets through `vault://` identifiers rather than embedding
   secret values;
6. define a health check for every declared service;
7. use rolling upgrades with automatic rollback on health failure;
8. assert reproducible deployment; and
9. emit an independently identifiable MSSLB package.

Network access is not inferred from a service name or model route. A future
networked variant must declare its bindings, destinations, authentication,
timeouts, data classes, and audit behavior explicitly.

## Control-plane flow

The intended control loop is:

`registry -> configuration -> admission -> scheduling -> resource reservation
-> deployment -> health evaluation -> scaling/upgrade decision -> Podium
receipt`

A stage may stop the loop with a typed failure. Failure is not converted into a
successful but partial state, and later stages may not act on an unvalidated
predecessor result.

## 53.1 AI Service Registry contract

The registry owns stable identifiers for services, models, adapters, runtimes,
and endpoints. A registry record should include:

- service and deployment identity;
- model, tokenizer, weights, runtime, and adapter versions where applicable;
- supported request and response schemas;
- declared capabilities and prohibited capabilities;
- lifecycle state, readiness, placement, and health evidence;
- resource and policy class;
- artifact hashes and provenance; and
- creation, update, retirement, and replacement receipts.

Unknown or duplicate registrations fail closed. A mutable label cannot replace
an immutable version or digest. Registry health establishes whether a service
can receive work; it does not establish the semantic quality of the model's
answer.

## 53.2 Runtime Resource Control contract

Resource control operates on reservations and observed use. It should bound:

- CPU cores and wall-clock time;
- system and accelerator memory;
- GPU or other accelerator allocation;
- processes, threads, file handles, and temporary storage;
- input, intermediate, and output sizes; and
- concurrency, cancellation grace periods, and cleanup time.

Admission fails before execution if mandatory resources cannot be reserved.
Runtime pressure produces a recorded throttle, preemption, or cancellation
decision. The controller must not silently overcommit or reinterpret a hard
limit as a target.

## 53.3 Job Scheduling and Quotas contract

Every job has an immutable job ID, owner or tenant, operation class, priority,
budget, deadline, idempotency key, and input evidence references. Scheduling
must define:

- admission and queue selection;
- fair-share and priority rules;
- per-tenant and per-service quotas;
- retry eligibility, limits, and backoff;
- cancellation and deadline behavior;
- duplicate suppression and resumability; and
- starvation and queue-depth evidence.

Retries reuse the same logical job lineage. A retry may create a new attempt
identity, but it must not hide the preceding failure or double-apply a
non-idempotent effect.

## 53.4 Health and Observability contract

Health separates liveness, readiness, progress, and semantic evaluation.
Observability emits bounded local logs, metrics, and traces with:

- stable service, job, attempt, deployment, and correlation IDs;
- monotonic timestamps where ordering matters;
- declared metric units and bounded label cardinality;
- redaction before persistence;
- evidence links to versioned configuration and artifacts; and
- explicit retention, export, and deletion policy.

Telemetry is local in the default offline profile. A health check may initiate
rollback or removal from scheduling, but it may not expose prompts, model
inputs, secrets, or unbounded repository content.

## 53.5 Secrets and Configuration contract

Configuration is typed, versioned, and provenance-bearing. Precedence between
defaults, repository configuration, deployment configuration, and operator
overrides must be explicit. Secret material is represented by references:

- references are validated before service startup;
- values are redacted from logs, traces, errors, caches, and packages;
- access is capability-bound and least privilege;
- rotation creates a new configuration receipt;
- reload is atomic or rolls back to the previous valid snapshot; and
- missing or malformed required configuration fails closed.

The example `vault://` strings are opaque identifiers, not embedded
credentials and not permission to contact a remote secret service.

## 53.6 Deployment and Scaling contract

Deployment reconciliation compares desired and observed state using versioned
artifacts, placements, resource reservations, configuration digests, and health
gates. Scaling rules should define minimum and maximum replicas, stabilization
windows, evidence thresholds, cooldowns, and resource ceilings.

Scaling cannot be used to mask a deterministic service defect. A new replica
must pass the same registration, configuration, resource, and readiness gates
as the first. Conflicting desired-state writers are rejected or resolved by a
declared authority rule, never by last-arrival timing alone.

## 53.7 Upgrade and Rollback contract

An upgrade plan identifies source and target versions, artifact hashes,
compatibility requirements, configuration or data migrations, rollout steps,
health thresholds, observation windows, and rollback boundaries.

Rolling or canary progression pauses on inconclusive evidence and rolls back
on declared health failure. Rollback restores the last known-good artifacts,
configuration, placements, and scheduler eligibility. Irreversible migrations
require an explicit checkpoint, approval, recovery plan, and evidence that the
old runtime will not consume incompatible state.

## Admission gate

Before any operational mutation, CHARLOTTE should verify:

- the requested action and target are unambiguous;
- the actor has the required capability;
- registry, configuration, and artifact identities are pinned;
- required inputs and dependencies are present and verified;
- resource reservations and quotas permit the work;
- the service is ready and the requested operation is supported;
- expected effects, failure modes, and rollback are declared; and
- Podium can record the result without leaking restricted data.

Failure of any mandatory predicate denies execution and emits a bounded,
evidence-backed rejection.

## Evaluation matrix

| Condition | Expected result |
|---|---|
| Same source, lockfile, configuration, and inputs | Same package identity and operational plan |
| Duplicate service identity with conflicting digest | Registration rejected |
| Required resource reservation unavailable | Job remains unstarted or is rejected |
| Tenant quota exhausted | Job is denied or queued according to declared policy |
| Duplicate idempotency key | Existing logical job is returned; effects are not repeated |
| Readiness check fails | Service receives no new jobs |
| Secret reference missing or malformed | Startup or reload fails closed without disclosing a value |
| Scale threshold is met within declared bounds | Deterministic desired-replica transition is recorded |
| Upgrade health gate fails | Rollback restores the last known-good state |
| Telemetry contains restricted material | Record is redacted or rejected before persistence |
| Networking is undeclared | No external connection is attempted |
| Podium receipt cannot be written | Mutation is not reported as complete |

## Optimization restrictions

Optimization may reduce latency, memory, or duplicate work only if it preserves:

- policy and admission decisions;
- artifact, configuration, and service identity;
- quota accounting and scheduling fairness;
- retry, cancellation, and idempotency behavior;
- health and observability evidence;
- rollback reachability; and
- Podium receipt content and provenance.

Caching or batching must not merge tenants, capabilities, security contexts, or
job lineages. Autoscaling is an operational response, not evidence that a
service or model is correct.

## Corpus and compiler note

The corpus is a coupling-mechanics reference, not a production compiler
conformance certificate. These sources intentionally stay within recurring
manifest features and use the corpus convention of a five-service ensemble plus
one worker, health checks, locked offline workspaces, explicit resources,
rolling upgrades, health-triggered rollback, reproducibility assertions, and
MSSLB output. Validate them with the target JA21 Operations compiler and runtime
before release.
