# JA21 Suite 61 — Popup Runner

Seven independent JA Interface Language scripts define a focused desktop launch
surface for approved jobs. The popup exposes selection, typed parameters,
policy preview, confirmation, bounded output, results, and recovery without
exposing an unrestricted shell, command line, executable picker, or arbitrary
working-directory control.

## Language profile

- Language: JA Interface Language
- Profile: `ja.interface`
- Extension: `.jaui`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Default policy: `no_network`
- Interaction posture: capability-gated actions, derived enablement, complete
  keyboard path, accessible names, bounded portal-scene presentation

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Interface Language examples covering components, local and
shared state, derived/reactive values, forms, validation, commands, events,
service and data binding, permission controls, focus management, keyboard
workflows, accessibility, localization, layout constraints, responsive
behavior, desktop/web/mobile/headless targets, themes, tokens, resources,
navigation, and portal-scene embedding.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level JA21 source. Production operation requires the intended JA
Interface compiler/runtime plus trusted job-catalog, capability, policy,
approval, job-queue, worker, stream, artifact, recovery, and audit services.

## Files

| File | Sub-suite | Responsibility |
| --- | --- | --- |
| `61.1_Approved_Job_Selector.jaui` | Approved Job Selector | Presents only current approved job descriptors and binds one immutable selection |
| `61.2_Job_Parameter_Form.jaui` | Job Parameter Form | Collects schema-driven typed parameters without accepting raw shell text |
| `61.3_Capability_and_Policy_Preview.jaui` | Capability and Policy Preview | Shows effective capabilities, scope, effects, resources, approvals, and rollback before launch |
| `61.4_Launch_Confirmation.jaui` | Launch Confirmation | Revalidates the exact job commitment and provides the sole launch action |
| `61.5_Live_Output_Console.jaui` | Live Output Console | Renders ordered, bounded, redacted stdout, stderr, progress, diagnostics, and status |
| `61.6_Status_and_Artifact_Summary.jaui` | Status and Artifact Summary | Separates exit status, validated result, observed effects, artifacts, and terminal provenance |
| `61.7_Cancellation_and_Recovery.jaui` | Cancellation and Recovery | Requests bounded cancellation, cleanup, reconciliation, retry, or rollback |

Each file is independently loadable and emits one named interface artifact.

## Analytical ensemble

Every interface contains one explicit component for each requested participant:

| Participant | Suite 61 responsibility |
| --- | --- |
| SOPHIA | Interprets the job, parameters, policy, output, result, and recovery context |
| CHARLOTTE | Validates catalog approval, schemas, capabilities, scope, launch commitment, stream safety, artifacts, and recovery |
| LANDON | Binds the selection, canonical parameters, approved launch, output projection, result projection, and recovery request |
| Professor | Explains job purpose, fields, effects, risks, output, failures, artifacts, and next steps |
| Podium | Exposes the exact approval, policy, launch, output, result, and recovery evidence receipts |

Every action requires a narrowly scoped `popup.job.*:approved` capability.
Component labels and accessible names describe the same action. No ensemble
component can turn a denial into a launch or mutate authoritative evidence.

## Focused popup boundary

The Popup Runner accepts only:

- a job selected from the approved catalog;
- fields defined by that job's current parameter schema;
- repository/worktree choices already admitted for the job;
- resources and output options within the descriptor's bounds;
- a current policy/approval commitment; and
- explicit launch, cancellation, or recovery actions.

It does not expose:

- a raw command line or shell interpreter;
- arbitrary executable, script, interpreter, or plugin selection;
- arbitrary arguments outside a typed descriptor;
- unrestricted environment variables or secret values;
- unrestricted filesystem or working-directory browsing;
- hidden subprocess or network controls;
- direct process termination;
- automatic retry of unknown effects; or
- controls that mutate policy, approval, capability, logs, or evidence.

Closing the popup does not imply cancellation. Reopening it resolves current
job state from the authoritative service rather than reconstructing state from
local UI memory.

## Shared identity model

The UI keeps these identities visible or evidence-linked:

1. catalog generation and approved job descriptor;
2. selected repository/worktree/source snapshot;
3. parameter schema and canonical parameter hash;
4. capability manifest, effective scope, and policy decision;
5. approval and launch commitment;
6. logical job, attempt, worker lease, and sandbox;
7. output stream and ordered event sequence;
8. exit, observed effects, validation, and result;
9. artifact and provenance identities;
10. cancellation/recovery request and outcome; and
11. Podium receipts.

A display label never replaces an immutable identity or hash. The popup shows
freshness and changed-state warnings before permitting launch.

## 61.1 Approved Job Selector

The selector shows only job descriptors that are:

- registered and active;
- compatible with the current application/runtime;
- admitted for the current principal and role;
- within repository, data-classification, and capability policy;
- not expired, suspended, or revoked; and
- backed by complete provenance and a current catalog generation.

Each row should display job name, family, version, purpose, risk class,
repository requirement, expected artifacts, estimated resource class, and
approval state. Search and filters only change presentation; they cannot
broaden the authorized set.

Selection is observational. It does not enqueue, lease, execute, download, or
modify a repository.

## 61.2 Job Parameter Form

The form is generated from the selected job's pinned parameter schema. Fields
declare:

- name, type, cardinality, required/default state, bounds, and validation;
- path class and confined selector behavior;
- enum or approved resource identity;
- secret reference versus nonsecret text;
- classification, help, examples, and localization key;
- dependencies between fields; and
- whether changing the value invalidates policy or approval.

Raw shell strings are not accepted. Commands remain structured descriptors with
typed arguments. Paths are selected within approved repository/worktree roots
and normalized before binding.

Validation errors are associated with fields, summarized for assistive
technology, and do not erase entered nonsecret values. Secret values are never
displayed or persisted by the form.

## 61.3 Capability and Policy Preview

The preview is read-only and displays:

- principal, role, job descriptor, and repository identity;
- requested and granted capabilities;
- effective resource/path/action scope;
- denied and unresolved effects;
- filesystem, process, tool, model, device, and network posture;
- sandbox and resource limits;
- expected mutations, outputs, artifacts, and rollback;
- approval identity, validity, separation of duties, and revocation;
- policy versions, conflict result, and freshness; and
- Professor explanation and Podium evidence.

Absence of a deny is not displayed as an allow. Approval cannot erase an
explicit deny. Any identity-bearing parameter change invalidates the preview
and returns the workflow to validation.

## 61.4 Launch Confirmation

Launch Confirmation is the only sub-suite containing the launch action. It
summarizes the exact:

- job descriptor and version;
- repository/worktree/source state;
- canonical parameters;
- capabilities and effective scope;
- expected effects, outputs, artifacts, and rollback;
- sandbox/resources, deadline, cancellation, and retry policy;
- approval and policy decision; and
- request/idempotency identity.

CHARLOTTE revalidates immediately before LANDON launches. The launch control is
disabled during validation, after first activation, when state is stale, when
approval is absent/expired/revoked, or when any mandatory predicate is not
positive.

Double activation, repeated keyboard events, or popup reopening cannot submit
duplicate logical jobs. The interface shows the accepted job identity returned
by the authoritative queue.

## 61.5 Live Output Console

The console has separate views for:

- stdout;
- stderr;
- structured diagnostics;
- progress and lifecycle state;
- artifacts as they are admitted;
- warnings, truncation, drops, and backpressure; and
- stream/Podium evidence.

Events retain job, attempt, execution, stream, sequence, timestamp,
classification, encoding, payload hash, redaction, and causal identity.
Presentation may merge streams visually, but the underlying identities/order
remain separate.

Output is untrusted data. The console renders terminal escapes, links, markup,
binary payloads, and instruction-like content inertly. Redaction precedes
display and persistence. There is no command-input prompt in the output view.

The console uses bounded windows, virtualization, follow/pause controls, text
search, copy under policy, accessible announcements, and explicit truncation.
Pausing presentation does not pause the job or authoritative stream.

## 61.6 Status and Artifact Summary

The summary separates:

- lifecycle state;
- process exit code/signal;
- result and acceptance state;
- observed effects;
- stdout/stderr counts and truncation;
- diagnostics and failure class;
- artifact identity, type, size, hash, validation, and destination;
- resource usage and limits;
- cleanup/rollback state; and
- Professor explanation and Podium terminal receipt.

Exit code `0` is not shown as success unless artifact/effect validation passes.
Nonzero exit may still produce accepted diagnostic artifacts without becoming
a successful job.

Artifact actions are bounded to preview, reveal within approved storage,
compare, copy an allowed reference, or open a separately governed handoff.
The popup does not execute artifacts.

## 61.7 Cancellation and Recovery

Cancellation is a request, not an immediate process kill. The UI shows:

- target job/attempt and current state;
- expected cancellation effects;
- grace period and process boundary;
- artifact/output preservation behavior;
- child-process/effect reconciliation;
- cleanup and rollback expectations;
- retry eligibility and remaining budget; and
- approval requirements.

Recovery options are derived from authoritative state and may include waiting,
reconnecting to output, completing validation, releasing an orphaned lease,
resuming a verified checkpoint, retrying an eligible failure, rolling back, or
requesting operator action.

Unknown completion is reconciled before retry. A failed, cancelled, or
inconclusive attempt remains visible and cannot be overwritten by a later
attempt.

## Popup layout and focus

Recommended desktop popup layout:

```text
+--------------------------------------------------------------+
| Popup Runner | Job identity | Policy state | Close            |
+----------------------+---------------------------------------+
| Workflow steps       | Current focused surface               |
| 1 Select             |                                       |
| 2 Parameters         | Typed fields / preview / output       |
| 3 Policy             |                                       |
| 4 Confirm            |                                       |
| 5 Run                |                                       |
| 6 Result             |                                       |
+----------------------+---------------------------------------+
| Professor help | Podium evidence | Back | Primary action      |
+--------------------------------------------------------------+
```

Opening places focus on the popup heading or first actionable control.
Focus is trapped within the modal while open and returns to the invoking
control on close. Escape requests close only when it cannot hide a required
confirmation; it never launches or cancels a job.

The primary action is unique per step. Destructive or state-changing actions
are not triggered by row selection, double-click, hover, focus, or Enter in a
multiline field.

## Accessibility, localization, and responsiveness

- Every action has an accessible role and name.
- All workflows are complete by keyboard.
- Step, validation, policy, running, failure, and completion changes have
  appropriate noninterrupting or urgent announcements.
- Focus moves to the first error or a concise error summary after failed
  validation.
- Color is not the sole status indicator.
- Reduced motion removes nonessential transitions without changing state.
- High contrast, text scaling, zoom, and screen readers preserve content/order.
- Labels use localization keys and allow expansion without clipping.
- Numeric values retain invariant underlying units while display formatting
  follows locale.
- Narrow windows collapse secondary evidence into accessible details without
  removing the primary workflow or safety information.

## Service-binding rules

The interface is a projection over authoritative services. It:

- sends stable request IDs and expected-state hashes;
- treats responses, repository content, output, and artifact metadata as
  untrusted data;
- validates schema/version before binding;
- shows loading, empty, stale, unavailable, denied, and partial states
  explicitly;
- uses bounded reconnect/backoff for observational streams;
- never infers successful mutation after timeout;
- reconciles unknown launch/cancel/recovery outcomes; and
- does not cache capability, policy, approval, revocation, or result state
  beyond its declared freshness window.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Approved job, valid typed parameters, current policy/approval, single launch, bounded output, and accepted artifacts | Pass |
| Negative | Raw command, arbitrary executable, path escape, missing capability, stale approval, duplicate launch, or untrusted output action | Deny or disabled control |
| Boundary | Empty catalog, maximum parameters, narrow window, large output, exact expiry, output cap, or cancellation grace | Usable explicit boundary state |
| Integration | Catalog, parameters, policy, launch, stream, result, artifact, recovery, and Podium identities agree | Pass |
| Accessibility | Keyboard-only, screen reader, high contrast, text scaling, reduced motion, and focus restoration | Pass |
| Security | Shell injection, repository prompt injection, secret output, terminal escape, hidden network, or artifact execution | Deny/safely render |
| Determinism | Same catalog, inputs, policy, and state yield the same commitment and canonical UI result | Pass |
| Recovery | Disconnect, popup close, crash, cancellation, or unknown launch reconciles without duplicate execution | Pass or explicit operator action |
| Localization | Long labels, RTL, pluralization, locale numbers, and translated diagnostics preserve operation and safety | Pass |
| Certification | R12/MCRT evidence and Podium receipts replay the exact launch, output, result, and recovery targets | Pass |

## Optimization restrictions

Permitted optimization includes immutable catalog caching within freshness,
virtualized lists/output, derived-value memoization, deterministic event
batching, and lazy loading of secondary evidence.

Optimization must not:

- expose jobs outside the approved set;
- transform typed parameters into an unrestricted shell string;
- reuse stale policy, approval, revocation, repository, or expected-state data;
- enable launch before every mandatory gate passes;
- merge jobs, attempts, repositories, worktrees, principals, or capabilities;
- reorder stream events within a channel;
- hide denial, stale state, truncation, dropped events, failure, or uncertainty;
- weaken redaction, focus, accessibility, confirmation, or audit; or
- change stable R12/MCRT and Podium identities.

## Smithson 8S and R12 preservation

If Popup Runner displays jobs or artifacts containing Smithson 8S Coupled
Mechanics records, all screens preserve the declared fifth-coordinate meaning,
independence evidence, latent/projected geometry, product-state separation,
semantic distance, uncertainty, projection version, tolerance profile, and
interaction order.

R12 replay retains `eta_ind`, `Delta_8S`, `g5`, `delta8`, `g3`, `gJ`,
phase/support state, relation class, limitations, and whether pairwise or
selective triadic mechanics changed the result. If `g5 > tol5` while
`g3 <= tol3`, the result remains `PROJECTION_ONLY`; UI visualization cannot
promote visible overlap into latent coupling.

Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 61 is certifiable only when all seven interfaces emit successfully;
approved job, parameters, repository state, capabilities, policy, approval,
launch, output, result, artifacts, cancellation, recovery, and provenance are
explicit; unrestricted execution is absent; networking is disabled by default;
all actions are capability-gated; keyboard paths are complete; untrusted output
is bounded and safely rendered; and R12/MCRT replay reproduces the same launch,
result, and Podium receipt targets.
