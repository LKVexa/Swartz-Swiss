# JA21 Suite 57 — Translation, Build, Test, and Evaluation Jobs

Five independent JA Operations Language scripts define a common governed-job
envelope and specialized translation, build, test, and evaluation job families.
Every family preserves its artifacts, results, decisions, and provenance as
separate identities.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Default posture: locked dependencies, offline execution, disabled network,
  bounded resources, reproducible deployment, health-gated upgrade, and
  rollback on health failure
- Packaging: one unique MSSLB package per sub-suite

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Operations Language examples covering workspace and
project builds, target platforms, compiler profiles, locked dependencies,
lockfiles, workers, services, resources, offline and air-gapped deployment,
artifact repositories, storage, health checks, deployment probes, logging,
metrics, traces, scaling, upgrade, rollback, clean-room builds, and MSSLB
packaging.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level JA21 source. Production execution requires the intended JA
Operations compiler/runtime and trusted translation, compiler, test,
evaluation, sandbox, storage, hash, clock, and audit adapters.

## Files

| File | Sub-suite | Responsibility |
| --- | --- | --- |
| `57.1_Governed_Job_Families.jaops` | Governed job families | Defines the shared job envelope, lifecycle, artifact/result contract, provenance, admission, and terminal receipt |
| `57.2_Translation_Jobs.jaops` | Translation jobs | Detects, parses, translates, validates, and tests language artifacts without losing source meaning or identity |
| `57.3_Build_Jobs.jaops` | Build jobs | Performs clean, locked, reproducible builds and records exact inputs, tools, logs, products, and attestations |
| `57.4_Test_Jobs.jaops` | Test jobs | Executes pinned test plans in isolated environments and preserves fixtures, observations, diagnostics, and coverage |
| `57.5_Evaluation_Jobs.jaops` | Evaluation jobs | Applies versioned rubrics and datasets to exact candidates and emits evidence-backed scores, findings, and uncertainty |

Each file is independently loadable and emits one named MSSLB package.

## Analytical ensemble

Every workspace represents the requested five-part analytical ensemble:

| Participant | Suite 57 responsibility |
| --- | --- |
| SOPHIA | Interprets job intent, inputs, dependencies, semantic requirements, expected artifacts, result meaning, and uncertainty |
| CHARLOTTE | Validates job family, capabilities, schemas, hashes, policies, tools, fixtures, rubrics, budgets, and acceptance gates |
| LANDON | Executes the admitted translation, build, test, or evaluation operation in the declared bounded environment |
| Professor | Explains transformations, diagnostics, failures, test observations, scores, uncertainty, limitations, and repair paths |
| Podium | Records job, attempt, artifact, result, policy, toolchain, evidence, provenance, package, and terminal receipts |

Each workspace also declares one narrowly scoped mechanical worker. A worker
cannot choose its own job family, widen capabilities, replace inputs, change an
acceptance rule, or publish an unvalidated terminal result.

## Common workspace contract

All five scripts:

1. target `windows-x64` with the release compiler profile;
2. require locked dependencies;
3. run offline with networking disabled;
4. declare finite CPU and memory;
5. use opaque secret references rather than embedded values;
6. give every ensemble service and worker a health check;
7. use rolling upgrades with rollback on health failure;
8. assert reproducible deployment; and
9. emit a unique MSSLB package.

`policy explicit_network` does not authorize network use. The workspaces
explicitly disable it. A future connected job profile must separately declare
destinations, data classes, credentials, rate limits, timeouts, caching,
offline replay material, and Podium evidence.

## Governed job envelope

Every logical job should identify:

- job ID, family, schema version, tenant, submitter, and purpose;
- canonical request and idempotency hashes;
- immutable input identities, hashes, classifications, and provenance;
- declared dependencies and their closure;
- required capabilities, tools, runtimes, and sandbox profile;
- resource, time, output, retry, and retention budgets;
- policy and approval identities;
- expected artifact and result schemas;
- acceptance, rejection, cancellation, and recovery rules; and
- final Podium receipt target.

Each execution creates an attempt identity. Retries preserve the logical job
identity but receive a new attempt number and retain every prior failure.
Changing an identity-bearing input, toolchain, rubric, or requested effect
creates a new job-specification hash.

## Artifact, result, and provenance model

The suite keeps these concepts separate:

- **artifact** — a produced file, package, intermediate representation, report,
  log, trace, coverage map, model output, or other addressable object;
- **result** — the typed decision about the job or artifact, such as accepted,
  rejected, passed, failed, scored, inconclusive, cancelled, or unresolved;
- **provenance** — the causal record of sources, tools, policies, operations,
  attempts, workers, environments, and parent artifacts; and
- **receipt** — Podium's immutable record binding the exact evidence to the
  admitted outcome.

A hash identifies bytes under a declared algorithm; it does not prove semantic
correctness, safety, provenance, or approval. A successful process exit is not
an accepted result until required validation completes.

## Lifecycle

Representative states are:

```text
submitted -> admitted -> queued -> preparing -> running
-> validating -> completed
```

Typed terminal states include:

```text
accepted | rejected | failed_retryable | failed_terminal
| cancelled | timed_out | inconclusive | recovery_required
```

State is derived from ordered events. It is not overwritten by dashboard text.
Invalid transitions, missing causal parents, conflicting hashes, and stale
expected state fail closed.

## 57.1 Governed job families

The common family registry defines:

- stable family ID and version;
- request, artifact, result, error, event, and receipt schemas;
- permitted tools, capabilities, effects, and data classes;
- required sandbox and resource profile;
- lifecycle and retry policy;
- acceptance and terminal-state rules;
- artifact naming, hashing, retention, and lineage;
- validator and test-double identities; and
- policy, approval, and provenance requirements.

Family definitions are immutable once used. A change creates a new version.
Unknown families, ambiguous schema versions, undeclared effects, unapproved
tools, missing validators, or incomplete provenance are denied before work
starts.

## 57.2 Translation jobs

Translation jobs bind:

- source language, grammar/version, encoding, and source hash;
- target language, grammar/version, profile, and output contract;
- parser, translator, intermediate-representation, and validator identities;
- semantic, type, effect, capability, policy, and provenance requirements;
- diagnostic and source-map schemas;
- translation test plan and fixtures; and
- expected determinism and round-trip properties.

The pipeline is:

```text
detect -> decode -> parse -> source AST -> canonical IR
-> target AST -> emit -> validate -> test -> Podium receipt
```

Source bytes, source AST, canonical IR, target AST, emitted artifact, diagnostics,
and validation result each retain separate identities. Translation cannot
silently discard uncertainty, unsupported constructs, capability requirements,
denials, effects, comments required by policy, or provenance.

If a construct has no valid target representation, the result is an explicit
unsupported or unresolved diagnostic—not an invented approximation. Round-trip
testing is evidence, not proof of semantic equivalence by itself.

## 57.3 Build jobs

Build jobs bind:

- repository/worktree identity and source-tree hash;
- build manifest, lockfile, dependency, and toolchain hashes;
- target platform, architecture, configuration, and feature set;
- environment, sandbox, and clean-room profile;
- build graph and canonical dependency order;
- compiler/linker/package commands as approved structured operations;
- expected products, symbols, manifests, and metadata;
- test or verification gates required before acceptance; and
- reproducibility, signing-preparation, and artifact-publication policy.

The build uses only pinned dependencies from an approved local artifact source.
Unpinned downloads, hidden network resolution, ambient tools, undeclared
environment variables, and output outside the admitted workspace are denied.

Products include logs, diagnostics, dependency graph, toolchain record, binary
or package artifacts, manifests, checksums, software-bill-of-materials data,
and reproducibility evidence. Signing preparation is not a signing grant.

## 57.4 Test jobs

Test jobs identify:

- candidate artifact and exact candidate hash;
- test-plan and fixture versions;
- test selector, order, seed, locale, clock, and environment;
- required tools, services, models, devices, and capabilities;
- expected observations, tolerances, oracles, and diagnostics;
- isolation and resource budgets;
- coverage and evidence requirements; and
- flake, retry, quarantine, and acceptance policy.

Test discovery and order are canonical. Randomized tests record the algorithm
and seed. Wall-clock, locale, filesystem order, worker timing, and prior test
state cannot change a deterministic fixture silently.

Passed, failed, skipped, blocked, inconclusive, flaky, timed out, and
infrastructure-failed are separate outcomes. A skipped or unavailable test is
not a pass. Retrying a deterministic failure does not erase it.

## 57.5 Evaluation jobs

Evaluation jobs bind:

- exact candidate artifact, output set, or behavior trace;
- evaluation task and version;
- dataset, fixture, target, and sample-selection identities;
- rubric, metric definitions, formulas, weights, and thresholds;
- evaluator implementation or model identity;
- baseline and comparison identities;
- uncertainty, confidence, subgroup, and robustness requirements;
- policy, contamination, leakage, and conflict checks; and
- score, finding, recommendation, and evidence schemas.

Raw observations, derived metrics, aggregate scores, qualitative findings, and
release recommendations remain separate. Scores preserve units, direction,
sample counts, missingness, uncertainty, and calculation version.

An evaluation result may be pass, fail, inconclusive, invalid, contaminated,
or blocked. A score alone cannot authorize release, override security policy,
or replace the underlying evidence.

## Cross-family dependency rules

Job families may form a governed graph:

```text
translation artifact -> build input
build artifact -> test candidate
test evidence -> evaluation input
evaluation result -> separately governed release decision
```

Every edge names the exact upstream artifact/result identity and required
acceptance state. A downstream job never consumes “latest” without resolving
it to an immutable identity. Failed, rejected, cancelled, unresolved, or
unvalidated upstream output does not silently advance.

Fan-out produces explicit child jobs. Fan-in uses canonical dependency order
and declared conflict resolution, not completion timing.

## Failure and retry rules

Failure classes distinguish invalid input, policy denial, missing dependency,
capacity, infrastructure, toolchain, translation, compilation, test,
evaluation, integrity, timeout, cancellation, unknown effect, and operator
action.

Retry eligibility, maximum attempts, backoff, checkpoint behavior, and deadline
interaction are declared per family. Policy denial, invalid input, deterministic
semantic/compile/test defects, integrity failure, contaminated evaluation, and
unknown durable effects are not blindly retried.

Unknown completion is reconciled against worker, sandbox, output, artifact,
status, and Podium receipts before another attempt.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Valid family, pinned inputs/tools, admitted sandbox, complete validation, and matching provenance | Pass |
| Negative | Unknown family, changed hash, unpinned tool, missing fixture, invalid transition, or incomplete provenance | Expected fail |
| Boundary | Maximum artifact size, exact timeout, final retry, tolerance edge, empty test set, or score threshold | Pass or explicit boundary outcome |
| Integration | Translation, build, test, and evaluation identities form a closed causal graph | Pass |
| Security | Hidden network, tool substitution, path escape, secret leak, untrusted instruction execution, or audit bypass | Deny |
| Performance | Work remains within CPU, memory, storage, time, output, and concurrency budgets | Pass within budget |
| Determinism | Shuffled discovery and worker timing preserve build graph, test order, metrics, results, and receipts | Pass |
| Recovery | Interrupted job reconciles artifacts and effects without duplicate publication | Pass or explicit operator action |
| Interoperability | Translators, compilers, test runners, evaluators, storage, and ledgers preserve JA identities and schemas | Pass |
| Certification | R12/MCRT evidence and Podium receipts replay exact transformations, artifacts, results, and provenance | Pass |

## Optimization restrictions

Permitted optimization includes immutable artifact caching, canonical dependency
indexes, deterministic batching, pure validator memoization, incremental builds,
test sharding, and metric aggregation.

Optimization must not:

- use a cache across mismatched inputs, tools, policies, or environments;
- discard an intermediate identity or provenance edge;
- change translation semantics or diagnostic behavior;
- alter build dependency order or product bytes without new identity;
- change test selection, seed, fixture, ordering, or outcome accounting;
- change evaluation datasets, formulas, weights, thresholds, or missingness;
- merge tenants, jobs, attempts, capabilities, or protection domains;
- suppress failures, uncertainty, blocked work, or inconclusive results;
- skip validation, audit, redaction, or Podium publication; or
- change stable R12/MCRT identities.

## Smithson 8S and R12 preservation

If a job processes Smithson 8S Coupled Mechanics records, every source,
intermediate representation, build artifact, test observation, evaluation
metric, result, provenance edge, and Podium receipt preserves the declared
fifth-coordinate meaning, independence evidence, latent and projected geometry,
product-state separation, semantic distance, uncertainty, projection version,
tolerance profile, and interaction order.

R12 replay retains `eta_ind`, `Delta_8S`, `g5`, `delta8`, `g3`, `gJ`,
phase/support state, relation class, limitations, and whether pairwise or
selective triadic mechanics changed the result. If `g5 > tol5` while
`g3 <= tol3`, the record remains `PROJECTION_ONLY`; translation, compilation,
testing, or evaluation cannot promote visual overlap into latent coupling.

Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 57 is certifiable only when all five packages are reproducible; job
families, inputs, dependencies, tools, environments, attempts, artifacts,
results, validations, failures, and provenance are explicit; networking is
disabled by default; resources and retries are bounded; downstream jobs consume
only immutable accepted identities; every service has a health check; and
R12/MCRT replay reproduces the same transformations, graphs, results,
classifications, and Podium receipt targets.
