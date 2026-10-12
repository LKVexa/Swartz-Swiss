# JA21 Suite 63 — Sandbox and Offline Runtime

Six independent JA Operations Language scripts define approved sandbox and
offline-runtime profiles for tools, builds, tests, translation, rendering, and
packaging.

Suite 63 provisions and validates environments. Suite 60 workers consume these
profiles to execute admitted jobs. A healthy runtime profile does not itself
authorize a job, command, repository mutation, or artifact publication.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Runtime posture: locked, offline, network disabled, resource bounded, health
  checked, reproducible, upgradable, and recoverable
- Packaging: one unique MSSLB package per workload profile

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Operations Language examples covering locked dependencies
and lockfiles, compiler profiles, target platforms, workers, services, resource
and GPU requirements, storage bindings, artifact repositories, health checks,
logging, metrics, traces, clean-room builds, offline and air-gapped deployment,
scaling, upgrade, rollback, and MSSLB packaging.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level JA21 source. Production operation requires the intended JA
Operations compiler/runtime plus trusted sandbox, process, filesystem, artifact
repository, toolchain, renderer, package, storage, resource, clock, and audit
adapters.

## Files

| File | Sub-suite | Runtime responsibility |
| --- | --- | --- |
| `63.1_Tools.jaops` | Tools | Maintains approved local tool identities, capabilities, dependencies, invocation contracts, and isolated availability |
| `63.2_Builds.jaops` | Builds | Provides clean, pinned build toolchains, local dependency sources, writable outputs, and reproducibility controls |
| `63.3_Tests.jaops` | Tests | Provides isolated test runners, fixtures, clocks, seeds, services, devices, and outcome-evidence controls |
| `63.4_Translation.jaops` | Translation | Provides pinned grammars, parsers, IRs, translators, emitters, validators, and translation fixtures |
| `63.5_Rendering.jaops` | Rendering | Provides pinned renderer/operator/shader/color profiles, assets, frame state, deterministic seeds, and render resources |
| `63.6_Packaging.jaops` | Packaging | Provides canonical package layout, compression, manifest, checksum, installer, verification, and signing-preparation tools |

Each file is independently loadable and emits one named MSSLB package.

## Analytical ensemble

Every workspace represents the requested five-part analytical ensemble:

| Participant | Suite 63 responsibility |
| --- | --- |
| SOPHIA | Interprets workload requirements, dependency meaning, runtime compatibility, expected products, and uncertainty |
| CHARLOTTE | Validates tools, hashes, capabilities, isolation, resources, offline completeness, health, rollback, and provenance |
| LANDON | Provisions, reconciles, health-checks, and retires the exact admitted runtime profile |
| Professor | Explains profile contents, constraints, incompatibilities, missing dependencies, degraded state, and remediation |
| Podium | Records profile, tool, dependency, resource, health, upgrade, rollback, package, and provenance receipts |

Every workspace also declares one narrowly scoped runtime worker. It maintains
the environment; it does not accept arbitrary commands or choose repository
jobs.

## Common workspace contract

All six scripts:

1. target `windows-x64` with the release compiler profile;
2. require locked dependencies;
3. declare `environment offline`;
4. disable networking;
5. declare finite CPU and memory;
6. use opaque secret references instead of embedded secret values;
7. health-check every ensemble service and runtime worker;
8. use rolling upgrades with rollback on health failure;
9. assert reproducible deployment; and
10. emit one unique MSSLB package.

`policy explicit_network` does not grant networking. The workspaces explicitly
disable it. Runtime health probes, dependency resolution, telemetry, license
checks, package publication, remote rendering, and updates must operate from
approved local evidence unless a separate connected profile is admitted.

The `vault://` strings are opaque references, not credentials or permission to
contact a remote secret service.

## Runtime-profile identity

An immutable runtime profile should bind:

- profile ID, schema/version, workload class, platform, and architecture;
- base filesystem/image identity and hash;
- operating-system/runtime versions;
- approved tool, executable, library, plugin, model, and device identities;
- dependency lockfile and local artifact-repository snapshot;
- environment-variable names and opaque secret references;
- read-only inputs and bounded writable mounts;
- filesystem, process, child-process, IPC, device, model, and network policy;
- CPU, memory, accelerator, storage, handle, process, time, and output limits;
- command/invocation schemas;
- health, readiness, cleanup, retention, and rollback behavior;
- fixtures and conformance evidence; and
- approval and Podium provenance.

Any identity-bearing change creates a new profile. A mutable display label or
“latest” alias never replaces the pinned profile identity.

## Isolation boundary

Every instance receives:

- one exact runtime profile;
- one job/attempt identity supplied by the governed queue;
- a fresh or proven-clean sandbox boundary;
- read-only admitted inputs;
- a bounded writable staging/output area;
- sanitized environment;
- attenuated capabilities;
- controlled output/artifact collection; and
- deterministic cleanup and evidence.

Repository content, job inputs, model output, logs, packages, and generated
scripts remain untrusted data. They cannot alter the profile, enable network,
install tools, add mounts, grant capabilities, or weaken cleanup.

Provisioning failure never falls back to an unrestricted host process.

## Offline-completeness gate

Before a profile becomes ready, CHARLOTTE verifies:

- every required artifact is available locally;
- versions and hashes match the lockfile/manifest;
- dependency closure is complete and cycle policy is satisfied;
- licenses/metadata required by policy are present;
- no tool performs hidden network resolution or telemetry;
- required resources and devices are available;
- sandbox controls can be enforced;
- health and conformance probes pass;
- expected outputs can be staged and validated; and
- rollback remains reachable.

Missing dependencies produce an explicit unavailable profile. The runtime does
not download them, substitute an ambient version, or silently omit the feature.

## 63.1 Tools

The Tools profile registers:

- exact executable/package and hash;
- publisher/source/provenance;
- version and compatibility range;
- structured command/subcommand/argument schema;
- supported input/output types;
- required libraries, runtimes, plugins, models, and devices;
- filesystem/process/network/tool/model effects;
- capability and sandbox requirements;
- resource and timeout budgets;
- exit/error/diagnostic schemas; and
- health and test-double identities.

Tool discovery never implies authorization. `PATH`, registry, application
folders, repository binaries, or user-installed software are not trusted
sources by default.

Interpreters, shells, compilers, renderers, package tools, and signing tools are
distinct tool classes. Approval of one command does not authorize arbitrary
scripts or subcommands.

## 63.2 Builds

The Builds profile supplies:

- pinned compiler, linker, generator, assembler, and package-tool identities;
- target SDK/runtime and architecture;
- dependency/lockfile and local artifact source;
- deterministic environment, clock, locale, paths, and metadata normalization;
- read-only source and bounded intermediate/output mounts;
- incremental-cache policy;
- expected product, symbols, manifest, checksum, and SBOM schemas; and
- clean-room and reproducibility probes.

The profile denies ambient toolchains, unpinned dependency lookup, hidden
downloads, source mutation, and writes outside staging/output roots. Incremental
caches are keyed by every semantic input and never override clean-build
verification.

## 63.3 Tests

The Tests profile supplies:

- pinned test runner, adapters, fixtures, oracles, and coverage tools;
- deterministic discovery, order, seed, clock, locale, and environment;
- candidate/artifact mount policy;
- approved local services, models, devices, test doubles, and data;
- network simulation without external access;
- resource, timeout, output, and parallelism limits;
- result/diagnostic/coverage schemas; and
- cleanup and flake-detection evidence.

State does not leak between tests unless a fixture explicitly declares it.
Skipped, blocked, flaky, timed-out, infrastructure-failed, and inconclusive
remain separate from pass/fail.

## 63.4 Translation

The Translation profile supplies:

- source and target grammar/profile versions;
- decoders and encoding policy;
- parser, source AST, canonical IR, target AST, translator, and emitter;
- type/effect/capability/policy/provenance preservation rules;
- validators, source maps, diagnostic catalogs, and fixtures;
- unsupported/ambiguous construct behavior;
- deterministic canonicalization; and
- round-trip and semantic comparison tools.

The runtime cannot fetch a missing grammar or translator. It does not execute
source content. Source, IR, emitted artifact, diagnostics, and validation each
retain separate identities.

## 63.5 Rendering

The Rendering profile supplies:

- renderer/runtime and native-layer identity;
- operator bank, shader/effect, material, geometry, animation, and VFX versions;
- color space, transfer, format, codec, and platform profile;
- asset and font manifests;
- camera, coordinate, unit, timebase, frame range, sample, and seed rules;
- CPU/accelerator/memory/storage limits;
- frame/output/metadata/diagnostic schemas;
- continuity, comparison, and acceptance fixtures; and
- deterministic fallback policy for unsupported optional features.

Missing required assets, invalid geometry, unsupported mandatory operators, or
resource insufficiency makes the profile unavailable. It does not fetch remote
assets or silently lower quality outside the declared fallback.

## 63.6 Packaging

The Packaging profile supplies:

- package, installer, archive, or bundle tools and versions;
- canonical file ordering and layout;
- included/excluded artifact rules;
- compression and metadata/timestamp/permission normalization;
- manifest, checksum, SBOM, license, and provenance schemas;
- installer/uninstaller and rollback fixtures;
- platform/architecture/channel/version rules;
- verification and reproducibility checks; and
- signing-preparation interfaces.

Only accepted artifacts from the admitted set are mounted. Packaging cannot
scan arbitrary repository or user directories. Signing preparation produces a
digest and evidence; the offline runtime contains no unrestricted signing key
authority and does not publish releases.

## Health and lifecycle

Runtime states should distinguish:

```text
registered -> validating -> ready -> leased -> active -> draining
-> cleaning -> ready
```

Explicit alternatives include:

```text
unavailable | degraded | quarantined | failed | rollback_required | retired
```

Health separates process liveness, profile readiness, dependency integrity,
sandbox enforcement, resource availability, tool conformance, and cleanup.
A live process with a missing dependency or failed confinement probe is not
ready.

Draining blocks new leases. Cleanup proves processes, mounts, temporary data,
secrets, handles, devices, and resources are reconciled before reuse.

## Upgrade and rollback

An upgrade binds source/target profiles, artifact hashes, compatibility,
migration, rollout, health gates, observation window, and rollback checkpoint.

Rolling upgrade never changes an active attempt's profile. New attempts use the
new profile only after readiness. Failed health/conformance triggers rollback
to the last known-good immutable profile. Irreversible changes require explicit
approval and recovery evidence.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Complete local closure, pinned tools, enforced isolation, bounded resources, valid probes, and rollback | Pass |
| Negative | Missing artifact, hash drift, hidden network, ambient tool, path escape, unsupported mandatory device, or failed cleanup | Unavailable/deny |
| Boundary | Exact resource limit, maximum tool count, empty fixture set, final frame, package-size cap, or retention edge | Pass or explicit boundary result |
| Integration | Job, worker, profile, tools, sandbox, outputs, artifacts, cleanup, and Podium identities agree | Pass |
| Security | Repository instruction execution, secret leak, child-process escape, remote telemetry, tool substitution, or audit bypass | Deny/quarantine |
| Performance | Provisioning, health, execution support, cleanup, and artifact staging remain within budgets | Pass within budget |
| Determinism | Same profile/inputs produce the same readiness, tool closure, environment, and canonical output conditions | Pass |
| Recovery | Crash, failed cleanup, corrupt cache, interrupted upgrade, or unknown lease reconciles without unsafe reuse | Pass or operator action |
| Interoperability | Sandbox, toolchain, renderer, packager, storage, and ledger adapters preserve JA contracts | Pass |
| Certification | R12/MCRT and Podium evidence replay exact profile, dependency, health, lifecycle, and rollback state | Pass |

## Optimization restrictions

Permitted optimization includes immutable layer reuse, content-addressed local
artifacts, deterministic cache keys, copy-on-write sandboxes, prevalidated tool
closures, fixture caching, and bounded profile pools.

Optimization must not:

- reuse a sandbox with unproven cleanup;
- substitute tools, dependencies, assets, or profiles;
- use ambient host state;
- enable network or telemetry;
- merge tenants, jobs, attempts, profiles, or protection domains;
- widen mounts, processes, tools, models, devices, resources, or secret access;
- skip health, conformance, cleanup, or rollback gates;
- hide missing dependencies, degradation, cache corruption, or uncertainty;
- publish unvalidated artifacts; or
- change stable R12/MCRT and Podium identities.

## Smithson 8S and R12 preservation

If sandboxed workloads process Smithson 8S Coupled Mechanics records, runtime
profiles, translations, builds, tests, renderings, packages, health evidence,
and Podium receipts preserve the fifth-coordinate meaning, independence
evidence, latent and projected geometry, product-state separation, semantic
distance, uncertainty, projection version, tolerance profile, and interaction
order.

R12 replay retains `eta_ind`, `Delta_8S`, `g5`, `delta8`, `g3`, `gJ`,
phase/support state, relation class, limitations, and whether pairwise or
selective triadic mechanics changed the result. If `g5 > tol5` while
`g3 <= tol3`, the record remains `PROJECTION_ONLY`; sandbox execution,
rendering, or packaging cannot promote visible overlap into latent coupling.

Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 63 is certifiable only when all six packages are reproducible; profiles,
tools, dependencies, local artifact sources, sandboxes, mounts, capabilities,
resources, health, cleanup, upgrades, rollback, and provenance are explicit;
networking is disabled; missing dependencies fail closed; every service has a
health check; and R12/MCRT replay reproduces the same profile, readiness,
lifecycle, and Podium receipt targets.
