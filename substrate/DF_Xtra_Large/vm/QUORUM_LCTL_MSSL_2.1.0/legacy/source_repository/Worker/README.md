# JA21 Suite 60 — Worker

Six independent JA Operations Language scripts define the shared approved
repository-job/report contract and specialized build, test, translation,
rendering, and packaging workers.

Workers execute admitted jobs; they do not select their own work, grant
capabilities, expand repository scope, change acceptance criteria, or publish
success without validation. Every attempt reports stdout, stderr, exit status,
artifacts, observed effects, and provenance separately.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Default environment: locked, offline, network disabled, resource bounded,
  health checked, and reproducible
- Packaging: one unique MSSLB artifact per sub-suite

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Operations Language examples covering workspace/project
builds, target platforms, compiler profiles, dependencies and lockfiles,
workers, services, resource requirements, health checks, storage, logging,
metrics, traces, artifact repositories, offline and air-gapped execution,
clean-room builds, scaling, upgrade, rollback, and MSSLB packaging.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level JA21 source. Production execution requires the intended JA
Operations compiler/runtime plus trusted repository, process, sandbox, build,
test, translation, rendering, packaging, storage, stream, hash, clock, and
audit adapters.

## Files

| File | Sub-suite | Responsibility |
| --- | --- | --- |
| `60.1_Approved_Repository_Jobs_and_Reports.jaops` | Approved repository jobs and reports | Defines the shared admission, attempt, execution, output, artifact, validation, failure, and receipt contract |
| `60.2_Build_Worker.jaops` | Build worker | Executes pinned, clean, reproducible repository builds |
| `60.3_Test_Worker.jaops` | Test worker | Executes versioned test plans and fixtures in isolated attempts |
| `60.4_Translation_Worker.jaops` | Translation worker | Parses and translates exact source artifacts through versioned language contracts |
| `60.5_Rendering_Worker.jaops` | Rendering worker | Produces deterministic scene/frame/image outputs from pinned rendering inputs |
| `60.6_Packaging_Worker.jaops` | Packaging worker | Assembles validated artifacts, manifests, checksums, and installer/release packages |

Each file is independently loadable and emits one named MSSLB package.

## Analytical ensemble

Every workspace represents the requested five-part analytical ensemble:

| Participant | Suite 60 responsibility |
| --- | --- |
| SOPHIA | Interprets the approved job, repository context, dependency graph, expected artifacts, result meaning, and uncertainty |
| CHARLOTTE | Validates job identity, capabilities, scope, repository state, tools, resources, sandbox, outputs, and acceptance gates |
| LANDON | Executes the exact admitted worker operation and captures bounded operational evidence |
| Professor | Explains execution, stdout/stderr significance, diagnostics, failures, artifacts, limitations, and remediation |
| Podium | Records job, attempt, worker, repository, command, output, artifact, result, package, and provenance receipts |

Each workspace also declares one narrowly scoped mechanical worker. The named
LANDON service controls the admitted operation; the mechanical worker performs
it. The worker cannot bypass CHARLOTTE or publish outside Podium.

## Common workspace contract

All six scripts:

1. target `windows-x64` with the release compiler profile;
2. require locked dependencies;
3. run offline with networking disabled;
4. declare finite CPU and memory;
5. use opaque secret references instead of embedded secret values;
6. define a health check for every service and worker;
7. use rolling upgrades with rollback on health failure;
8. assert reproducible deployment; and
9. emit a unique MSSLB package.

`policy explicit_network` does not grant network access. Every workspace
explicitly disables it. Networked dependency resolution, remote render farms,
telemetry export, package publication, or signing services require separately
declared and approved profiles.

## Approved repository job contract

Every logical job should identify:

- job ID, family, schema version, tenant, requester, purpose, and priority;
- repository, worktree, commit/tree, and dirty-state identities;
- confined input and output roots;
- immutable input, dependency, configuration, and policy hashes;
- required worker type, version, capabilities, and sandbox profile;
- approved structured commands and toolchain identities;
- environment-variable names and opaque secret references;
- CPU, memory, accelerator, storage, process, handle, time, and output budgets;
- expected artifacts, validations, effects, exit/result schema, and rollback;
- cancellation, retry, idempotency, retention, and recovery policy; and
- approval and Podium receipt identities.

Admission occurs before a worker lease. Unknown job families, wrong worker
types, stale repository state, unpinned tools, missing inputs, out-of-scope
paths, undeclared effects, unavailable resources, or incomplete provenance fail
closed.

## Worker and attempt identity

The suite separates:

1. logical job ID;
2. job-specification hash;
3. attempt ID and attempt number;
4. worker ID, version, package hash, and capability set;
5. lease ID and validity;
6. sandbox instance and profile hash;
7. command/execution IDs;
8. output stream and event IDs;
9. artifact and validation IDs;
10. result and failure IDs; and
11. final Podium receipt.

A retry is a new attempt in the same job lineage. A worker restart does not
rewrite prior attempts. A successful process exit is not an accepted job result
until required artifact and effect validation pass.

## Execution and report flow

```text
approved job
-> repository snapshot and expected-state validation
-> worker capability/resource match
-> exclusive attempt lease
-> isolated sandbox preparation
-> approved structured command execution
-> stdout/stderr/status streaming
-> exit and observed-effect capture
-> artifact collection and hashing
-> artifact/schema/content validation
-> result/failure classification
-> cleanup and recovery check
-> Professor report
-> Podium terminal receipt
```

CHARLOTTE may stop the flow at every gate. LANDON performs only the admitted
transition. Podium publishes completion only after output, effects, artifacts,
validation, and cleanup are reconciled.

## Report schema

Every attempt report should contain:

- job, attempt, worker, lease, sandbox, and execution identities;
- repository/worktree and source snapshot hashes;
- command descriptor, toolchain, configuration, and policy hashes;
- start/end/deadline/cancellation state;
- stdout and stderr stream identities, byte/event counts, truncation/drop
  evidence, encodings, and redaction state;
- process exit code, signal/termination class, and child-process reconciliation;
- observed filesystem, process, resource, tool, model, and network effects;
- artifact names, types, sizes, content hashes, destinations, and provenance;
- validation/test identities and outcomes;
- result, failure class, retry eligibility, limitations, and uncertainty;
- cleanup and rollback/recovery status; and
- Professor explanation and Podium receipt.

Exit code, result, and acceptance are distinct. Exit code `0` may still yield a
rejected result when artifacts are missing, invalid, out of scope, or
non-reproducible. A nonzero exit can still produce valid diagnostic artifacts
without becoming a successful job.

## Stdout and stderr

Stdout and stderr are independent ordered streams. Every chunk/event records
execution, stream, sequence, encoding, classification, payload hash, redaction,
and causal identity.

The policy defines maximum chunk size, total bytes, lines, events, buffers,
spill behavior, backpressure, idle timeout, and total deadline. Output beyond
the admitted limit is explicitly truncated or cancels the attempt according to
policy. Privileged audit and terminal failure evidence are not silently
dropped.

Secrets, credentials, environment values, private prompts, restricted
repository data, terminal control sequences, embedded links, markup, and
instruction-like output are classified and safely rendered before persistence
or display.

## Artifacts

An artifact record identifies:

- artifact ID, type, schema/version, path relative to the admitted output root;
- size, media type, content hash, and hash algorithm;
- producing job, attempt, worker, command, and parent artifacts;
- validation status and validator identity;
- classification, redaction, retention, and publication state; and
- provenance and Podium receipt.

Workers write to staging. Artifacts become published only after successful
close, hash, path/scope, schema/content, and policy validation. Partial or
conflicting artifacts remain quarantined and cannot replace an accepted
version.

## 60.2 Build worker

The build worker binds:

- source snapshot, manifest, lockfile, dependencies, toolchain, target,
  architecture, configuration, and feature set;
- clean-room/sandbox profile and approved build graph;
- structured compiler, linker, generator, and package commands;
- expected binaries, symbols, manifests, checksums, and metadata; and
- reproducibility and downstream-test requirements.

It does not download missing dependencies, use ambient toolchains, inherit
undeclared environment, modify source inputs, or write outside the approved
build/output roots. Products and logs preserve the canonical dependency graph
and exact toolchain identity.

## 60.3 Test worker

The test worker binds:

- candidate artifact and hash;
- test-plan, selector, fixture, oracle, tolerance, and expected-result versions;
- deterministic order, seed, locale, clock, and environment;
- required services, models, devices, tools, and capabilities;
- isolation/resource limits; and
- coverage, diagnostic, flake, retry, quarantine, and acceptance policy.

Passed, failed, skipped, blocked, timed out, flaky, infrastructure-failed, and
inconclusive remain separate. Empty discovery and skipped tests are not passes.
Retries preserve the original outcome and receive new attempt identities.

## 60.4 Translation worker

The translation worker binds:

- source language, grammar/version, encoding, profile, and source hash;
- target language, grammar/version, profile, and output schema;
- parser, canonical intermediate representation, translator, emitter,
  validator, and test identities;
- semantic/type/effect/capability/policy preservation rules; and
- diagnostics, source maps, unsupported constructs, uncertainty, and round-trip
  checks.

Source, AST, intermediate representation, target AST, emitted artifact,
diagnostics, and validation result retain distinct identities. Unsupported or
ambiguous constructs fail explicitly rather than being approximated silently.

## 60.5 Rendering worker

The rendering worker binds:

- scene, frame state, geometry, materials, layers, effects, motion, camera, and
  source-asset hashes;
- renderer/runtime, operator bank, shader/effect, color-management, and target
  profile versions;
- resolution, frame range, sample count, seed, timebase, coordinate system,
  units, and resource budget;
- expected images/frames, metadata, diagnostics, and validation fixtures; and
- continuity, determinism, comparison, and acceptance policy.

Each frame/artifact records its source state and renderer configuration.
Missing assets, invalid geometry, unsupported operators, resource exhaustion,
or continuity failure remain explicit. A rendered image is not accepted merely
because bytes were produced.

## 60.6 Packaging worker

The packaging worker binds:

- exact accepted input artifacts and hashes;
- package type, layout, manifest schema, version, architecture, and channel;
- included/excluded paths and canonical order;
- compression, timestamp normalization, permissions, metadata, and checksums;
- dependency/license notices, software bill of materials, and provenance;
- installer/uninstaller and rollback requirements;
- verification/test gates; and
- signing-preparation and publication policy.

Packaging cannot substitute unvalidated inputs or scan outside the admitted
artifact set. Deterministic packages normalize metadata under a declared
profile. Signing preparation creates a signable digest and evidence; it does
not grant access to signing keys or authorize release.

## Failure, cancellation, retry, and recovery

Failure classes include admission, repository state, worker lease, sandbox,
startup, toolchain, execution, deadline, cancellation, resource, output,
artifact, validation, integrity, cleanup, storage, and unknown effect.

Cancellation targets the admitted process boundary, allows a bounded grace
period, captures remaining output, reconciles children/effects, validates
cleanup, and publishes the actual terminal state.

Retries require a declared eligible failure, remaining attempt/deadline/resource
budget, and reconciled prior effects. Deterministic defects, invalid input,
policy denial, integrity failure, destructive/external effects, and unknown
completion are not blindly retried.

Recovery may resume from a verified compatible checkpoint, complete validation
of already-produced artifacts, release an orphaned lease, quarantine a worker
or sandbox, or require operator action. It never fabricates output, artifacts,
exit codes, or receipts.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Approved job, exact repository state, eligible worker, sandboxed execution, bounded streams, and valid artifacts | Pass |
| Negative | Wrong worker, stale worktree, unpinned tool, path escape, missing artifact, forged exit code, or incomplete report | Expected fail |
| Boundary | Exact timeout, last retry, output cap, artifact-size limit, empty test set, final frame, or package path edge | Pass or explicit boundary result |
| Integration | Job, attempt, worker, command, stream, artifact, validation, result, and Podium identities agree | Pass |
| Security | Repository instruction execution, hidden network, command injection, secret output, worker substitution, or audit bypass | Deny |
| Performance | Execution and reporting stay within CPU, memory, storage, time, output, and concurrency budgets | Pass within budget |
| Determinism | Same pinned job produces the same graph, selection, results, and canonical artifact/package identities | Pass |
| Recovery | Crash, disconnect, cancellation, orphaned lease, or unknown effect reconciles without blind duplicate execution | Pass or explicit operator action |
| Interoperability | Repository, process, toolchain, renderer, packager, storage, and ledger adapters preserve JA semantics | Pass |
| Certification | R12/MCRT evidence and Podium receipts replay exact job, output, artifact, failure, and result | Pass |

## Optimization restrictions

Permitted optimization includes immutable input caching, canonical dependency
indexes, incremental builds, deterministic test sharding, translation
memoization, frame parallelism, artifact deduplication, and package compression.

Optimization must not:

- change repository snapshot, inputs, dependencies, tools, policy, or sandbox;
- merge jobs, attempts, tenants, workers, leases, or protection domains;
- reinterpret structured commands through an unapproved shell;
- reorder conflict-sensitive operations or output events;
- change test selection, seed, fixture, or outcome accounting;
- change translation semantics, rendering state, or package membership;
- hide output truncation, failure, uncertainty, or cleanup state;
- publish unvalidated artifacts;
- weaken redaction, isolation, effect reconciliation, or audit; or
- change stable R12/MCRT and Podium identities.

## Smithson 8S and R12 preservation

If workers process Smithson 8S Coupled Mechanics records, source inputs,
translations, builds, tests, renderings, packages, outputs, artifacts, results,
and Podium receipts preserve the fifth-coordinate meaning, independence
evidence, latent and projected geometry, product-state separation, semantic
distance, uncertainty, projection version, tolerance profile, and interaction
order.

R12 replay retains `eta_ind`, `Delta_8S`, `g5`, `delta8`, `g3`, `gJ`,
phase/support state, relation class, limitations, and whether pairwise or
selective triadic mechanics changed the result. If `g5 > tol5` while
`g3 <= tol3`, the record remains `PROJECTION_ONLY`; a worker, rendered image, or
package cannot promote visible overlap into latent coupling.

Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 60 is certifiable only when all six packages are reproducible; jobs,
repositories, workers, leases, sandboxes, commands, stdout, stderr, exit status,
effects, artifacts, validations, failures, and provenance are explicit;
networking is disabled by default; resources and outputs are bounded; every
service has a health check; and R12/MCRT replay reproduces the same execution,
artifact, result, and Podium receipt targets.
