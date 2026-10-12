# JA21 Suite 39 — Core Studio

Fourteen independent JA Core Application Language scripts for files, editors, tabs, sessions, builds, tests, controlled integration, Repository UI, Code Editor, Integrated Terminal, Visual App Designer, Model, Resource Dashboard, and Local Server.

## Language profile

- Language: JA Core Application Language
- Profile: `ja.core`
- Extension: `.ja`
- Header: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus size declared by the attachment: 10,000 records
- Primary artifact: `ApplicationArtifact`
- Policy posture: `policy no_network`
- Script posture: deterministic plan construction, pure transformation, typed `Result`, success assertion, and JSON emission

The attached corpus demonstrates records, functions, immutable bindings, typed `Result` values, declared effects, assertions, serialization, and emitted application artifacts. Its source examples use a conservative record-transform-assert-emit structure.

The corpus is provisional and does not establish production JA Core compiler or runtime execution. These `.ja` files therefore construct reviewable Core Studio plan artifacts. They do not directly modify files, invoke compilers, execute shell commands, start servers, call models, or integrate external components. Those effects require separately implemented and approved adapters.

## Files

| File | Sub-suite | Core responsibility | Emitted plan |
| --- | --- | --- | --- |
| `39.1_Core_Studio_Files.ja` | Files | Plans workspace file identity, selection, opening, saving, renaming, moving, and recovery | `FilesPlan` |
| `39.2_Core_Studio_Editors.ja` | Editors | Plans editor type resolution, document models, dirty state, validation, and persistence | `EditorsPlan` |
| `39.3_Core_Studio_Tabs.ja` | Tabs | Plans tab identity, ordering, pinning, preview tabs, dirty-state protection, and restoration | `TabsPlan` |
| `39.4_Core_Studio_Sessions.ja` | Sessions | Plans recoverable workspace, editor, terminal, build, test, designer, and server sessions | `SessionsPlan` |
| `39.5_Core_Studio_Builds.ja` | Builds | Plans deterministic build graphs, inputs, tools, caches, outputs, and receipts | `BuildsPlan` |
| `39.6_Core_Studio_Tests.ja` | Tests | Plans deterministic test discovery, fixtures, execution profiles, results, and evidence | `TestsPlan` |
| `39.7_Core_Studio_Controlled_Integration.ja` | Controlled integration | Plans the sole capability-gated path from reviewed plans to authorized effects | `ControlledIntegrationPlan` |
| `39.8_Core_Studio_Repository_UI.ja` | Repository UI | Plans a clear selector and browser for input and working repositories | `RepositoryUIPlan` |
| `39.9_Core_Studio_Code_Editor.ja` | Code Editor | Plans language-aware source editing, diagnostics, navigation, changes, and provenance | `CodeEditorPlan` |
| `39.10_Core_Studio_Integrated_Terminal.ja` | Integrated Terminal | Plans persistent sandboxed terminal sessions, approvals, logs, cancellation, and recovery | `IntegratedTerminalPlan` |
| `39.11_Core_Studio_Visual_App_Designer.ja` | Visual App Designer | Plans composition, layout, interaction, preview, and handoff integration | `VisualAppDesignerPlan` |
| `39.12_Core_Studio_Model.ja` | Model | Plans model selection, routing, context, permissions, output review, and evidence | `ModelPlan` |
| `39.13_Core_Studio_Resource_Dashboard.ja` | Resource Dashboard | Plans deterministic CPU, GPU, memory, storage, job, terminal, build, test, and server snapshots | `ResourceDashboardPlan` |
| `39.14_Core_Studio_Local_Server.ja` | Local Server | Plans an explicitly approved loopback-only preview server configuration and lifecycle | `LocalServerPlan` |

## Core Studio architecture

```text
Repository UI
  -> Files
  -> Editors and Tabs
  -> Session checkpoint
  -> Code Editor or Visual App Designer
  -> Build plan
  -> Test plan
  -> Model and Resource review
  -> Controlled Integration approval
  -> Integrated Terminal or Local Server adapter
  -> Podium receipts
```

The flow is not automatically linear. Files, editors, tabs, sessions, code, design, builds, tests, models, terminals, resources, and servers keep independent identities. Controlled Integration binds an approved set together only after validation.

## Analytical ensemble

Every emitted record carries one declared responsibility for each participant.

| Participant | Core Studio responsibility |
| --- | --- |
| SOPHIA | Interprets user intent, workspace context, repository purpose, edit meaning, build and test goals, model tasks, resource conditions, and integration proposals |
| CHARLOTTE | Validates paths, types, state, permissions, policies, syntax, manifests, build inputs, test fixtures, terminal commands, model routes, resource limits, loopback rules, rollback, and evidence |
| LANDON | Resolves stable identities, stages deterministic plans, coordinates approved adapters, checkpoints sessions, orders effects, captures outputs, and restores safe state |
| Professor | Explains plans, changes, dependencies, commands, diagnostics, tests, model limits, resource pressure, server boundaries, failures, and recovery |
| Podium | Publishes hashes, plans, approvals, denials, effects, outputs, diagnostics, metrics, checkpoints, R12/MCRT evidence, provenance, and final receipts |

No participant may fabricate state, conceal a dirty document, alter a repository selection silently, execute an unapproved command, weaken a build or test gate, bypass Controlled Integration, expose secrets, bind a public server, or report a plan as an executed effect.

## Common script contract

Each file independently declares:

1. `ja source 0.3`, a stable module, `use Core`, and `policy no_network`.
2. One named plan record with a stable `Count` identity and `Text` scope.
3. Explicit SOPHIA, CHARLOTTE, LANDON, Professor, and Podium fields.
4. One pure function returning `Result<Plan, Text>`.
5. An immutable sample plan with a unique Suite 39 identity.
6. A normalized scope copied into the result.
7. A success assertion.
8. JSON emission of the typed result.

The common fields mean:

| Field | Contract |
| --- | --- |
| `id` | Stable plan identity; sample identities range from `3901` through `3914` |
| `scope` | Canonical sub-suite responsibility and effect boundary |
| `sophia` | Interpretation responsibility |
| `charlotte` | Validation and policy responsibility |
| `landon` | Staging and coordination responsibility |
| `professor` | Explanation responsibility |
| `podium` | Evidence-publication responsibility |

These short record fields preserve the demonstrated corpus grammar. Detailed runtime records belong in the adapter, policy, data, training, interface, and operations suites referenced by an implementation.

## Core artifact envelope

An implementation that consumes these plans should bind:

| Field | Required meaning |
| --- | --- |
| `workspace_id` | Stable logical workspace identity |
| `repository_id` | Exact input or working repository identity |
| `root_path` | Canonical approved workspace root |
| `plan_id` | Exact Suite 39 plan being executed |
| `actor_id` | Accountable user, suite, or service identity |
| `input_hashes` | Hashes of every source used by the plan |
| `expected_outputs` | Declared paths, media types, schemas, and hashes when known |
| `capabilities` | Minimal read, write, execute, process, model, render, or loopback permissions |
| `denials` | Explicit forbidden paths, operations, endpoints, commands, and effects |
| `resource_budget` | CPU, GPU, memory, storage, process, file, time, and output bounds |
| `timeout` | Hard stop for the approved operation |
| `cancellation` | Safe cancellation and cleanup behavior |
| `idempotency_key` | Identity preventing duplicate effects |
| `checkpoint_id` | Restorable state before a consequential action |
| `rollback_id` | Exact restoration target and operation |
| `result_hashes` | Hashes of outputs, logs, diagnostics, metrics, and receipts |
| `r12_mcrt_refs` | Compiler and runtime evidence bound to the exact operation |
| `podium_receipt` | Final accepted, denied, failed, cancelled, or rolled-back outcome |

## Sub-suite contracts

### 39.1 Files

- Resolves paths relative to one approved workspace root.
- Distinguishes files, directories, symlinks, archives, generated outputs, ignored items, and protected items.
- Preserves stable file identity across rename or move when the underlying artifact remains the same.
- Tracks content hash, encoding, line ending, media type, size, modification basis, provenance, dirty state, and conflict state.
- Uses atomic write, pre-write hash comparison, checkpoint, and recovery for approved mutations.
- Denies absolute-path escape, parent traversal, device paths, alternate data streams, symlink escape, archive escape, and writes outside allowed roots.

### 39.2 Editors

- Resolves an editor by media type and declared language profile rather than filename alone.
- Keeps the document model, view state, selection, cursor, diagnostics, undo history, dirty state, source hash, and saved hash distinct.
- Supports text, structured data, Markdown, image, scene, animation, manifest, and read-only binary viewers through typed adapters.
- Never discards unsaved work on close, reload, tab replacement, session restore, or external file change.
- Requires explicit conflict handling when disk content changes after an editor opens.

### 39.3 Tabs

- Gives every tab a stable identity independent of display title or position.
- Distinguishes pinned, regular, preview, dirty, read-only, detached, missing-source, conflict, and recovery tabs.
- Opening a preview tab may reuse only an eligible clean preview slot.
- Closing, replacing, or restoring a dirty tab requires save, discard, checkpoint, or cancellation.
- Focus order, keyboard order, screen-reader names, and visual order remain consistent.

### 39.4 Sessions

- Checkpoints repository selection, open files, editor state, tabs, layouts, terminal identities, build and test history, designer state, model route, dashboard filters, and local-server plans.
- Excludes secrets, raw credentials, ephemeral tokens, and prohibited content from ordinary session persistence.
- Uses versioned session schemas and transactional restoration.
- Treats missing files, changed hashes, unavailable adapters, or policy changes as visible recovery conditions.
- Restoring a session does not automatically rerun commands, builds, tests, models, integrations, or servers.

### 39.5 Builds

- Freezes source hashes, dependency manifests, toolchain identity, environment profile, target, configuration, graph, cache policy, and output paths before execution.
- Uses deterministic ordering and content-addressed inputs where supported.
- Separates planning, approval, execution, diagnostics, output collection, and publication.
- Treats compiler, generator, package, and script content as untrusted until admitted by Safety Gate and Controlled Integration.
- Does not claim a build succeeded until exit status, required outputs, hashes, diagnostics, and policy receipts are complete.

### 39.6 Tests

- Freezes test discovery, fixtures, oracles, seeds, environment, ordering, timeouts, retries, quarantine rules, and coverage profile.
- Separates unit, integration, interface, rendering, performance, security, accessibility, determinism, and recovery tests.
- Records pass, fail, skip, expected fail, timeout, crash, cancelled, and indeterminate independently.
- Retries do not erase the first failure, and flaky outcomes cannot be promoted as stable success.
- Test execution cannot silently obtain broader capabilities than the build or artifact being tested.

### 39.7 Controlled integration

- Is the only Suite 39 boundary allowed to convert a pure plan into a requested effect.
- Requires exact producer, consumer, artifact, schema, version, hash, capability, policy, timeout, idempotency, rollback, and evidence identities.
- Performs compatibility and policy validation before staging.
- Separates prepare, validate, approve, commit, verify, publish, and rollback phases.
- Rejects ambiguous targets, stale approvals, missing dependencies, schema drift, unbounded effects, and incomplete rollback.
- Never grants a capability merely because a component is present in the Studio.

### 39.8 Repository UI

- Opens the repositories that supply Core Studio project inputs and working content, not the Core Studio application's own source repository unless that source repository is explicitly selected as input.
- Provides a visible repository selector or dropdown with recent, pinned, mounted, and approved repository roots.
- Shows the selected repository name, root, branch or snapshot, status, policy, and provenance without forcing users through a nesting-doll folder search.
- Supports large repositories with virtualization, indexed filtering, breadcrumbs, path copy, stable selection, and deterministic sorting.
- Preserves ignored, generated, protected, missing, conflict, and permission-denied states visibly.
- Repository selection changes workspace context only after validation and dirty-state protection.

### 39.9 Code Editor

- Binds each document to an exact language profile, grammar, formatter, analyzer, symbol index, diagnostics version, and source hash.
- Separates edits from formatting, quick fixes, refactors, code generation, and external tool actions.
- Shows proposed multi-file changes before application and preserves per-file approval.
- Maintains undo, source provenance, cursor and selection state, diagnostics, and conflict recovery.
- Unknown code is treated as text until an approved build, test, terminal, or integration adapter receives explicit execution authority.

### 39.10 Integrated Terminal

- Uses a persistent, visible terminal session rather than a transient flashing command window.
- Names the shell, working directory, environment profile, command, arguments, input source, capabilities, timeout, and cancellation behavior.
- Displays the command before execution and distinguishes typed user input from generated suggestions.
- Requires CHARLOTTE approval and the applicable Safety Gate for consequential or generated commands.
- Streams stdout and stderr separately, retains exit status and logs, and supports safe interruption.
- Denies hidden shell expansion, credential exposure, network use, privilege escalation, process escape, and commands outside the approved scope.
- Reopening Core Studio may restore terminal history and metadata but does not silently rerun commands.

### 39.11 Visual App Designer

- Connects Core Studio to Suite 35 App Designer and Suite 38 Preview Designer through typed plans.
- Preserves component, layout, token, asset, interaction, preview, accessibility, and handoff identities.
- Keeps visual changes synchronized with reviewable source changes rather than producing an opaque binary-only result.
- Separates design preview from production rendering, build, packaging, or release.
- Requires validation of responsive behavior, keyboard paths, focus order, reduced motion, localization, and error states.
- Designer output returns through Controlled Integration as reviewed change sets.

### 39.12 Model

- Resolves the exact model, version, task, context, input classification, tool permissions, output schema, seed or sampling profile, timeout, and resource budget.
- Keeps SOPHIA, CHARLOTTE, LANDON, Professor, and Podium responsibilities distinct even when implemented by one composite runtime.
- Presents model output as a proposal until validated and approved.
- Prevents prompt, repository content, tool output, or model response from granting itself capabilities.
- Records uncertainty, citations or evidence, policy outcomes, transformations, and model provenance.
- Networked model access is outside these `policy no_network` scripts and requires an explicit service policy and approved adapter.

### 39.13 Resource Dashboard

- Observes declared CPU, GPU, memory, storage, process, file-watch, build, test, terminal, model, renderer, and local-server metrics.
- Uses monotonic measurement identity and fixed aggregation windows.
- Distinguishes reserved, requested, active, idle, throttled, failed, cancelled, and released resources.
- Shows per-job ownership, limits, pressure, warnings, and cleanup status.
- Cannot increase a budget, terminate a job, delete an output, or restart a service without a separate approved action.
- Missing or stale telemetry remains explicit rather than appearing as zero use.

### 39.14 Local Server

- The `.ja` script emits a loopback-server configuration plan only; it does not bind a socket under `policy no_network`.
- An implementation may start a local server only through an explicit runtime adapter and policy permitting loopback.
- Defaults to a loopback address, ephemeral or approved port, random session token, declared content root, strict path normalization, and no directory listing.
- Denies wildcard or public binding, remote access, proxying, credential forwarding, arbitrary file serving, upload execution, and host mutation.
- Publishes address class, port, root hash, route set, process identity, start and stop receipts, and cleanup outcome.
- Session restoration never restarts a server automatically.

## Controlled integration protocol

| Phase | Required outcome |
| --- | --- |
| `PREPARE` | Resolve exact plan, producer, consumer, artifacts, versions, hashes, and requested capabilities |
| `VALIDATE` | Confirm schema, compatibility, path, policy, permissions, resource bounds, timeout, and rollback |
| `APPROVE` | Bind accountable approval to the exact plan and current inputs |
| `CHECKPOINT` | Preserve a restorable pre-effect state |
| `COMMIT` | Perform the minimum approved effect through the named adapter |
| `VERIFY` | Compare expected and actual outputs, hashes, diagnostics, invariants, and side effects |
| `PUBLISH` | Emit Podium evidence and final status |
| `ROLLBACK` | Restore the checkpoint when verification fails or cancellation requires recovery |

An approval becomes stale when the plan, input hash, repository, workspace, capability, adapter, target, command, model, build graph, test fixture, server binding, or policy changes.

## State and concurrency

- Each mutable resource has one stable identity and a version or generation.
- Writes use compare-and-swap or equivalent precondition checks.
- Dirty documents, active terminals, builds, tests, integrations, and servers cannot be silently replaced.
- Dependent actions follow declared order; independent results use deterministic fan-in.
- Cancellation is cooperative first and forceful only through a separately approved boundary.
- Late results from cancelled or superseded jobs cannot overwrite current state.
- Session checkpoints record active work without treating incomplete effects as completed.

## Error model

Every adapter error should include:

| Field | Required contents |
| --- | --- |
| `error_id` | Stable identity |
| `plan_id` | Exact Suite 39 plan |
| `phase` | Prepare, validate, approve, checkpoint, commit, verify, publish, rollback, or cleanup |
| `category` | Input, path, policy, permission, dependency, syntax, build, test, command, model, resource, server, timeout, cancellation, conflict, or internal |
| `message` | Safe human-readable description |
| `cause` | Structured causal record without secret exposure |
| `affected_ids` | Repository, file, editor, tab, session, job, artifact, process, or server identities |
| `recoverability` | Retryable, repairable, rollback-required, or terminal |
| `evidence_refs` | Diagnostics, logs, hashes, metrics, R12/MCRT, and Podium receipts |

Errors remain visible and attributable. A failed operation may not be converted to success because partial outputs exist.

## Determinism contract

For fixed plans, workspace and repository snapshots, file hashes, toolchains, fixtures, model profiles, policies, permissions, adapters, seeds, and resource profiles:

1. File discovery and Repository UI ordering are canonical.
2. Editor and tab restoration produces the same logical state.
3. Build graphs, test discovery, and result aggregation use stable ordering.
4. Controlled Integration performs the same phase ordering and target selection.
5. Code and design changes produce the same logical change set.
6. Terminal plans and local-server configurations preserve exact commands, arguments, roots, and boundaries.
7. Resource snapshots use declared measurement windows and stable metric identities.
8. R12/MCRT replay preserves identity, policy result, relation class, tuple hash, interaction order, and Podium receipt target.

Filesystem enumeration, wall-clock time, worker scheduling, terminal output arrival, decoder completion, and locale defaults may not influence canonical identities.

## Validation matrix

| Class | Core Studio test | Expected result |
| --- | --- | --- |
| Positive | Valid plan, exact identities, approved scope, bounded adapter, complete output, and receipts | Pass |
| Negative | Path escape, stale hash, invalid type, policy denial, inaccessible action, failed build, failed test, or incomplete evidence | Expected fail |
| Boundary | Maximum file count, largest supported document, deepest admitted tree, longest line, tab limit, timeout, and resource limit | Pass or explicit bounded diagnostic |
| Repository | Input repository selector, virtualization, stable sorting, dirty-state protection, and provenance | Pass |
| Editing | Multi-editor state, conflicts, undo, diagnostics, changes, save, restore, and accessibility | Pass |
| Build and test | Frozen graph, toolchain, fixtures, seeds, outputs, diagnostics, failures, and determinism | Pass |
| Terminal | Visible persistent session, command approval, sandbox, output streams, cancellation, and exit evidence | Pass |
| Designer | Composition, layout, interaction, preview, source synchronization, accessibility, and handoff | Pass |
| Model | Exact route, context, permissions, output schema, uncertainty, and evidence | Pass |
| Resource | Ownership, limits, pressure, stale telemetry, cancellation, release, and cleanup | Pass |
| Server | Explicit loopback policy, safe root, token, routes, binding, stop, and cleanup | Pass |
| Security | Network, credential, process, path, archive, symlink, injection, substitution, or privilege attempt | Deny |
| Recovery | Crash, cancellation, stale session, missing file, failed integration, or orphaned process | Restore or explicit repair |
| Certification | R12, MCRT, policy, action, output, provenance, rollback, and Podium evidence complete | Pass |

## Smithson 8S and R12 preservation

When a Core Studio artifact carries Smithson 8S Coupled Mechanics metadata:

- SOPHIA may propose an elucidation coordinate only with independent semantic or mechanical meaning.
- CHARLOTTE preserves the independence test, held-out efficacy test, tolerance band, relation class, uncertainty, and proposed-framework status.
- LANDON keeps latent and projected geometry separate and preserves sparse, deterministic coupling support.
- Professor explains that projected overlap does not prove latent contact.
- Podium publishes `eta_ind`, `Delta_8S`, `W`, optional `H`, latent and projected distances, tolerances, interaction order, R12/MCRT, provenance, and limitations.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`. Smithson 8S remains a proposed computational framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 39 is certifiable only when:

- all fourteen scripts match the demonstrated JA Core source profile;
- each plan preserves stable identity, scope, ensemble responsibilities, typed `Result`, assertion, and JSON emission;
- Repository UI targets the intended input or working repository clearly;
- files, editors, tabs, and sessions preserve unsaved state and conflicts;
- builds and tests freeze inputs and publish complete outcomes;
- terminal, model, resource, and server capabilities remain bounded and explicit;
- all consequential effects pass through Controlled Integration;
- no-network policy is preserved by the plan layer;
- failures, denials, cancellations, and rollbacks remain visible;
- deterministic replay and R12/MCRT evidence succeed; and
- Podium can bind every outcome to exact inputs, outputs, policies, approvals, and provenance.

Any unmet mandatory condition blocks integration.
