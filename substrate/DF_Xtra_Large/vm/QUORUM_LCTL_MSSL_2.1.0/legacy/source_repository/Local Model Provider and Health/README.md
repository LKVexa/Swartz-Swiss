# JA21 Suite 54 — Local Model Provider and Health

Eight independent JA Service and Protocol Language scripts define the approved,
local-only model-provider boundary and its routing, lifecycle, readiness,
health, contract, dashboard, and reconciliation behavior.

## Language profile

- Language: JA Service and Protocol Language
- Profile: `ja.service`
- Extension: `.jasp`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Transport posture: approved local or offline transport only
- Network posture: explicit-only; no implicit cloud or remote fallback
- Execution posture: capability-gated, bounded, idempotent, and evidence-backed

The attached corpus was integrity-checked before generation. Its manifest
demonstrates service declarations, request and response schemas, streaming
endpoints, authentication and authorization capabilities, local and offline
transports, explicit network capabilities, discovery, deadlines, bounded
retries, idempotency, quotas, rate limits, backpressure, protocol states,
validators, compatibility versions, error contracts, and test doubles.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
therefore specification-level JA21 source and must be compiled and exercised by
the intended JA21 Service compiler/runtime before production use.

## Files

| File | Sub-suite | Endpoint | Capability | Purpose |
| --- | --- | --- | --- | --- |
| `54.1_Approved_Local_Providers.jasp` | Approved local providers | `approve` | `local_model.provider.approve` | Admit a provider only from pinned local evidence and an explicit approval |
| `54.2_Provider_Routing.jasp` | Provider routing | `route` | `local_model.provider.route` | Select an eligible local provider and model deterministically |
| `54.3_Provider_Lifecycle.jasp` | Lifecycle | `transition` | `local_model.provider.lifecycle` | Perform state-guarded load, activate, drain, unload, stop, or recover transitions |
| `54.4_Provider_Readiness.jasp` | Readiness | `inspect` | `local_model.provider.readiness.inspect` | Decide whether an exact provider/model instance may accept work |
| `54.5_Provider_Health.jasp` | Health | `check` | `local_model.provider.health.inspect` | Classify liveness, readiness, progress, resources, and degradation |
| `54.6_Local_Model_Provider_Contract.jasp` | Local model-provider contract | `validate` | `local_model.provider.contract.validate` | Validate schemas, protocol, serialization, errors, capabilities, and local transport |
| `54.7_Model_Provider_Dashboard.jasp` | Model provider dashboard | `snapshot` | `local_model.provider.dashboard.read` | Produce a bounded, redacted, read-only operational snapshot |
| `54.8_Model_Lifecycle_and_Health.jasp` | Model lifecycle and health | `reconcile` | `local_model.provider.reconcile` | Reconcile desired state with current readiness, health, resources, and recovery policy |

## Analytical ensemble

Every response exposes the requested five-part analytical ensemble:

| Participant | Responsibility |
| --- | --- |
| SOPHIA | Interprets provider intent, model requirements, lifecycle meaning, routing evidence, and unresolved conditions |
| CHARLOTTE | Validates approvals, capabilities, hashes, schemas, transports, expected state, readiness, health, and policy |
| LANDON | Performs the bounded local discovery, route selection, lifecycle transition, probe, snapshot, or reconciliation |
| Professor | Explains decisions, failed predicates, limitations, remediation, and evidence requirements |
| Podium | Publishes the compatibility report and binds outcomes to exact provider, model, policy, evidence, and replay receipts |

No participant may approve an unknown binary, fabricate a provider, substitute
a model or artifact, infer a capability, conceal degradation, bypass a denial,
or report a lifecycle mutation as complete without a Podium receipt.

## Local-provider boundary

A local model provider is an application-controlled adapter to a model runtime
on the same trusted device or approved offline execution boundary. Provider
identity is not just a display name. It is the tuple of:

1. stable provider ID and provider kind;
2. provider executable or package hash;
3. provider manifest and compatibility version;
4. local transport descriptor;
5. admitted capability set;
6. configuration and policy hashes;
7. model, tokenizer, weights, adapter, and runtime identities;
8. resource and isolation class; and
9. approval and provenance receipts.

An implementation such as a native runtime, `llama.cpp`, ONNX Runtime, Ollama,
LM Studio, or another local adapter is not automatically approved by product
name. The exact executable, manifest, transport, capabilities, versions, and
artifacts must pass the same approval and contract checks. This list is
illustrative, not an allowlist.

Cloud APIs, remote discovery, remote telemetry, and fallback to an external
endpoint are outside the default contract. `policy explicit_network` means a
network capability must be deliberately declared and admitted; it does not
grant one. When no eligible local provider exists, routing returns an explicit
unavailable result.

## Common service contract

Every script independently declares:

- `ja source 0.3`, a unique module, `use Service`, and
  `policy explicit_network`;
- typed request and response messages;
- one streaming endpoint with an exact authorization capability;
- a finite deadline and bounded retry rule;
- `request.request_id` as its idempotency key;
- an `Open -> Closed` protocol transition;
- a transition-validity assertion;
- a JSON compatibility-report emission; and
- SOPHIA, CHARLOTTE, LANDON, Professor, and Podium response fields.

Approval, lifecycle transition, and reconciliation use `retry max 0` because
they may create durable or state-changing effects. Their callers must reconcile
an unknown completion state before issuing another mutation. Routing,
readiness, health, contract validation, and dashboard snapshot are observational
and permit at most one bounded retry.

## 54.1 Approved local providers

Approval requires the exact provider binary or package hash, manifest hash,
compatibility version, provider kind, local transport, capability set, and
approval receipt. Approval must:

- reject duplicate provider IDs with conflicting identities;
- reject missing, malformed, untrusted, or revoked artifacts;
- keep display names separate from immutable identity;
- prohibit undeclared network and process-execution capabilities;
- bind approval to a policy version and evidence set;
- expire or revoke deterministically; and
- create a new receipt when any identity-bearing field changes.

Approval is not activation. The provider remains unable to accept model work
until its contract, configuration, resources, lifecycle state, readiness, and
health are separately admitted.

## 54.2 Provider routing

Routing considers only approved providers whose exact model, capability,
compatibility, resource, readiness, and health state satisfies the request.
The canonical routing key should include:

- operation class and request schema version;
- required model and provider capabilities;
- provider and model allowlist versions;
- resource budget and execution isolation;
- routing policy hash;
- current readiness and health evidence; and
- deterministic tie-break fields.

Selection must not depend on filesystem enumeration, discovery arrival,
thread-completion timing, dashboard sort order, or a mutable display label.
Equal candidates are resolved by a declared stable ordering rule. A route is
never silently changed to a remote provider.

## 54.3 Provider lifecycle

Provider and model instances move through explicit states such as:

`registered -> validated -> loading -> ready -> active -> draining -> unloaded`

`failed`, `quarantined`, and `stopped` are explicit states rather than aliases
for readiness. Every transition names the expected prior state, requested
transition, artifact and configuration hashes, resource lease, and approval
evidence. Invalid or stale expected state denies the mutation.

Loading verifies artifacts before mapping them into the runtime. Draining stops
new admissions before unload. Unload releases resources only after active work
is accounted for. A crash does not become a clean stop, and a restart does not
erase the prior failure event.

## 54.4 Provider readiness

Readiness answers one question: may this exact provider/model instance accept
new work under the requested capability and policy? A positive result requires:

- approved provider and model identities;
- validated provider contract and protocol version;
- verified artifacts and current configuration;
- acquired resource lease;
- completed model load and initialization;
- successful bounded inference or capability probe where required;
- compatible request and response schemas;
- healthy local transport; and
- no quarantine, drain, revocation, or blocking alert.

Readiness is specific to an operation class. A provider ready for embeddings is
not necessarily ready for generation, tool calling, multimodal input, or model
management.

## 54.5 Provider health

Health keeps separate evidence channels:

- **liveness** — the provider process and local transport respond;
- **readiness** — the exact provider/model can accept the requested work;
- **progress** — admitted jobs continue advancing within declared bounds;
- **resources** — memory, accelerator, storage, handles, queues, and deadlines
  remain inside policy;
- **quality signals** — bounded conformance probes satisfy their declared
  expectations; and
- **security state** — identities, configuration, capabilities, and isolation
  have not drifted.

A live process may be unready, stalled, degraded, or quarantined. Operational
health does not prove factual accuracy, safety, or answer quality. Each health
snapshot has a stable identity, policy hash, observation window, probe set, and
links to the preceding snapshot.

## 54.6 Local model-provider contract

The contract validates:

- service and method identities;
- request, response, streaming, and error schemas;
- protocol and compatibility versions;
- canonical serialization and size limits;
- local or offline transport identity;
- authentication and authorization capabilities;
- deadlines, cancellation, backpressure, quotas, and rate limits;
- idempotency and delivery guarantees;
- lifecycle, readiness, and health methods; and
- secret redaction, test doubles, and deterministic compatibility evidence.

Version negotiation may select only a mutually supported version allowed by
policy. Unknown fields, downgrade attempts, schema substitution, error
suppression, and hidden transport fallback fail closed.

## 54.7 Model provider dashboard

The dashboard is a read-only projection of authoritative provider records. It
shows bounded, paginated rows for:

- provider, model, runtime, and deployment identity;
- approval and compatibility state;
- lifecycle state and last valid transition;
- readiness and health classifications;
- resource reservations and observed use;
- active jobs, queues, rate limits, and quotas;
- alerts, failed predicates, and recommended operator action; and
- evidence hashes and Podium receipt references.

Dashboard controls do not mutate state through the read endpoint. Any approve,
start, drain, unload, quarantine, recover, or revoke action must open a separate
capability-gated action contract with expected effects and rollback. Secret
values, prompt content, model inputs, and unrestricted logs are never placed in
dashboard rows.

The `locale` and `accessibility_profile` fields affect presentation only; they
must not affect provider ordering, health classification, routing, or policy.

## 54.8 Model lifecycle and health

Reconciliation compares desired lifecycle state with the admitted current
state, readiness snapshot, health snapshot, resource lease, and recovery
policy. It may:

- keep a healthy ready model eligible for scheduling;
- remove an unready or draining model from new scheduling;
- wait for bounded in-flight work before unload;
- quarantine a provider after identity, policy, or isolation drift;
- restart only when the recovery policy and retry budget permit;
- restore a prior verified artifact/configuration pair; or
- stop with an unresolved diagnostic when evidence is insufficient.

Reconciliation is not blind retry. It preserves the failure lineage, requires
the expected state, and produces a new lifecycle event and Podium receipt.
Conflicting desired-state writers are denied or resolved by a declared
authority rule, never by last-arrival timing.

## End-to-end control flow

The intended control path is:

`provider approval -> contract validation -> artifact/configuration validation
-> resource lease -> lifecycle load -> readiness -> health -> routing
eligibility -> dashboard projection -> lifecycle/health reconciliation`

CHARLOTTE can stop the path at every boundary. LANDON performs only the admitted
transition. Professor explains pass, deny, degraded, and unresolved outcomes.
Podium publishes an immutable receipt for the exact evidence and result.

## Validation matrix

| Class | Test | Expected result |
| --- | --- | --- |
| Positive | Approved provider, pinned model, compatible contract, local transport, resources, readiness, and health | Pass |
| Negative | Unknown provider, artifact mismatch, unsupported schema, stale expected state, or missing capability | Expected fail |
| Boundary | Empty provider set, maximum models, deadline, quota, queue, message size, and dashboard page | Pass or explicit boundary diagnostic |
| Integration | Approval identity survives contract, lifecycle, readiness, health, route, dashboard, and reconciliation | Pass |
| Security | Hidden remote fallback, binary substitution, capability escalation, secret leakage, or policy downgrade | Deny |
| Performance | Health probes, routing, backpressure, queues, resource budgets, and dashboard snapshots remain bounded | Pass within budget |
| Determinism | Shuffled discovery, provider timing, and dashboard ordering yield the same eligible route and state decision | Pass |
| Interoperability | Compatible local providers preserve schemas, errors, cancellation, streaming, identity, and provenance | Pass |
| Recovery | Interrupted load, crash, stall, or uncertain lifecycle effect reconciles without duplicate mutation | Pass or explicit operator action |
| Certification | R12/MCRT evidence and Podium receipts reproduce exact identity, policy, result, and transition | Pass |

## Failure rules

- No eligible provider produces `unavailable`, not a remote fallback.
- Missing evidence produces `unresolved` or denial, not an inferred approval.
- Artifact or manifest drift quarantines the affected identity.
- A stale expected state denies lifecycle mutation.
- Readiness failure removes scheduling eligibility.
- Health degradation follows the declared grace and recovery policy.
- An unknown completion state is reconciled before another mutation.
- A failed Podium write prevents the mutation from being reported as complete.

## Determinism and optimization

For fixed provider, model, artifact, configuration, contract, policy, resource,
readiness, and health evidence, the same request must produce the same approval,
route, lifecycle, readiness, health, dashboard, or reconciliation result.

Optimization may cache contract validation, batch health probes, or reuse
immutable descriptors only if it preserves capability decisions, evidence
freshness, routing order, lifecycle transitions, idempotency, error contracts,
and Podium receipt targets. Caches are invalidated by any identity-bearing
change. Batching cannot merge tenants, capabilities, models, providers,
security contexts, or lifecycle lineages.

## Smithson 8S and R12 preservation

If a model or provider carries Smithson 8S Coupled Mechanics records, this
suite transports them without reinterpreting their scientific status. Provider
contracts, routing evidence, lifecycle events, health snapshots, dashboard
rows, and Podium receipts preserve:

- fifth-coordinate meaning and independence evidence;
- `eta_ind`, `Delta_8S`, and admission result;
- `g5`, `delta8`, `g3`, and `gJ` as separate channels;
- uncertainty, tolerances, projection version, provenance, and limitations; and
- whether pairwise or selective triadic mechanics changed the result.

If latent separation and visible overlap disagree, the provider preserves
`PROJECTION_ONLY`; it does not collapse the channels into a stronger claim.
Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 54 is certifiable only when all eight compatibility reports pass;
provider, model, executable, manifest, artifacts, configuration, transport,
capabilities, schemas, versions, resources, lifecycle state, readiness, health,
routing, and evidence are explicit; no hidden network or cloud fallback exists;
state-changing effects are guarded by exact expected state and zero blind
retries; dashboard output is bounded and redacted; and R12/MCRT replay
reproduces the same policy result, identities, transitions, classifications,
and Podium receipt targets.
