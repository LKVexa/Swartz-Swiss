# JA21 Suite 38 — Preview Designer

Four independent JA Interface Language scripts for reviewable application, scene, animation, and release previews.

## Language profile

- Language: JA Interface Language
- Profile: `ja.interface`
- Extension: `.jaui`
- Header: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records represented: 10,000
- Primary artifact: `InterfaceArtifact`
- Runtime posture: deterministic local preview, no network, capability-gated actions, immutable review inputs, and no unknown code execution

The attached corpus demonstrates typed state, derived enablement, components, labels, accessibility semantics, permission-gated actions, portal-scene embedding, motion binding, keyboard-path assertions, R12/MCRT evidence, and emitted interface artifacts.

The corpus is provisional and does not establish production JA Interface compiler execution. These `.jaui` files are specification-level interface programs, not HTML, JavaScript, C#, deployment packages, or permission to execute an uploaded application.

## Files

| File | Sub-suite | Preview responsibility | Emitted artifact |
| --- | --- | --- | --- |
| `38.1_Preview_Designer_Reviewable_Application.jaui` | Reviewable application | Opens a bounded application snapshot for state, layout, interaction, accessibility, and evidence review | `PreviewDesignerReviewableApplication` |
| `38.2_Preview_Designer_Scene.jaui` | Scene | Reviews deterministic scene composition, geometry, layers, materials, lighting, camera, and evidence | `PreviewDesignerScene` |
| `38.3_Preview_Designer_Animation.jaui` | Animation | Reviews bounded timelines, frame states, transforms, timing, continuity, camera motion, and reduced-motion behavior | `PreviewDesignerAnimation` |
| `38.4_Preview_Designer_Release.jaui` | Release | Reviews an immutable release candidate and its application, scene, animation, manifest, policy, and provenance closure | `PreviewDesignerRelease` |

## Relationship to adjacent suites

Suite 35 App Designer creates composition, layout, interaction, preview, and handoff contracts. Suite 38 supplies specialized review interfaces for the resulting application, scene, animation, and release artifacts.

```text
Suite 35 handoff
  -> immutable application snapshot
  -> scene and animation review
  -> integrated release preview
  -> findings and evidence
  -> return for correction or certify preview
```

A Suite 38 certification states that the reviewed snapshot satisfied the declared preview profile. It is not production deployment, release signing, distribution approval, or proof that unreviewed environments behave identically.

## Analytical ensemble

Every script gives SOPHIA, CHARLOTTE, LANDON, Professor, and Podium a named, reviewable interface component.

| Participant | Preview Designer responsibility |
| --- | --- |
| SOPHIA | Interprets preview intent, review scope, expected states, scene meaning, animation behavior, release composition, and candidate findings |
| CHARLOTTE | Validates identity, readiness, permissions, deterministic fixtures, constraints, accessibility, scene and motion invariants, release closure, policy, and evidence |
| LANDON | Resolves immutable inputs, opens approved local previews, stages deterministic scenes and timelines, records action traces, and returns bounded results |
| Professor | Explains controls, states, scene layers, animation timing, release contents, findings, uncertainty, limitations, and corrective guidance |
| Podium | Presents hashes, manifests, screenshots or traces, validation outcomes, action receipts, R12/MCRT evidence, provenance, and preview certification |

No participant may change the reviewed snapshot, invent a missing dependency, hide a failed state, execute untrusted metadata, bypass a denial, make an undeclared network call, or represent a preview as a deployed release.

## Common interface contract

Every file independently declares:

1. `ja source 0.3`, a stable module, `use Interface`, and `policy no_network`.
2. A nullable `Text?` selection state and a `Flag` activity state.
3. Derived selection and preview enablement that prevents invalid or concurrent actions.
4. Named SOPHIA, CHARLOTTE, LANDON, Professor, and Podium components.
5. Visible labels and explicit accessible button names.
6. Actions gated by `admin.action:approved`.
7. A stable portal-scene viewport and named motion timeline.
8. A complete keyboard-path assertion.
9. A named emitted interface artifact matching the declared interface.

The scripts express review state and approved action intent. File access, decoding, rendering, simulation, export, service calls, and evidence writes remain behind typed adapters with declared capability, input, timeout, cancellation, resource, idempotency, error, and provenance contracts.

## Canonical preview envelope

Every preview instance preserves:

| Field | Contract |
| --- | --- |
| `preview_id` | Stable identity for one review session |
| `preview_kind` | Application, scene, animation, or release |
| `artifact_id` | Exact source artifact and version |
| `artifact_hash` | Immutable content hash of the reviewed input |
| `manifest_hash` | Hash of the complete admitted dependency set |
| `profile_id` | Versioned platform, viewport, renderer, device, theme, locale, accessibility, and motion profile |
| `fixture_id` | Deterministic data, service-double, event, and state fixture |
| `allowed_capabilities` | Minimal adapter and rendering capabilities approved for preview |
| `denied_capabilities` | Network, process, credential, host-write, path-escape, and undeclared execution denials |
| `resource_budget` | CPU, GPU, memory, frame, event, file, time, and output limits |
| `entry_state` | Exact initial route, scene, frame, timeline, and application state |
| `action_trace` | Ordered review inputs and resulting state transitions |
| `finding_set` | Versioned findings with evidence, severity, uncertainty, and disposition |
| `evidence_hashes` | Screenshot, frame, trace, metric, manifest, and log hashes |
| `r12_mcrt_refs` | Compiler and runtime evidence bound to the exact preview |
| `podium_receipt` | Final receipt for the reviewed identity and outcome |

Changing the artifact, manifest, profile, fixture, permissions, or rendering runtime creates a new preview identity.

## Review states

| State | Meaning | Permitted transition |
| --- | --- | --- |
| `UNSELECTED` | No preview artifact is selected | `SELECTED` |
| `SELECTED` | Artifact identity is known but not admitted | `VALIDATING`, `UNSELECTED` |
| `VALIDATING` | Hashes, manifest, policy, capabilities, fixtures, and budgets are checked | `READY`, `BLOCKED` |
| `READY` | Exact preview envelope is approved | `OPENING`, `UNSELECTED` |
| `OPENING` | LANDON stages the bounded local preview | `REVIEWABLE`, `FAILED`, `CANCELLED` |
| `REVIEWABLE` | Review controls and evidence capture are active | `COMPLETED`, `FAILED`, `CANCELLED` |
| `COMPLETED` | Required paths were reviewed and evidence is closed | `CERTIFIED`, `RETURNED` |
| `CERTIFIED` | Preview profile passed with a bound Podium receipt | Terminal for this identity |
| `RETURNED` | Findings require design, scene, animation, or packaging changes | Terminal for this identity |
| `BLOCKED` | Admission, policy, dependency, or safety gate failed | Terminal until a new identity is submitted |
| `FAILED` | Preview could not complete within its declared contract | Terminal for this execution |
| `CANCELLED` | Review stopped without certification | Terminal for this execution |

Reloading or retrying a failed preview creates a new execution receipt while retaining the same artifact identity if no input changed.

## Sub-suite contracts

### 38.1 Reviewable application

- Names the exact application build, design version, entry route, state fixture, platform, viewport, theme, locale, text scale, input profile, and service doubles.
- Reviews initial, loading, empty, partial, success, error, disabled, permission-denied, interrupted, offline, timeout, retry, cancellation, and recovery states where applicable.
- Preserves component identity, responsive layout, interaction state, navigation, validation, keyboard and focus behavior, accessibility semantics, and error recovery.
- Uses deterministic local fixtures; production credentials, live user data, hidden network access, and undeclared host integration are prohibited.
- Captures the action sequence, expected result, actual result, screenshot or trace hash, severity, and reproducibility of each finding.
- Application preview is view-and-simulate only. It may not modify project sources, install software, invoke arbitrary processes, or publish a release.

### 38.2 Scene

- Names the exact scene graph, source asset set, feature graph, mesh geometry, equation operator set, renderer profile, camera, viewport, lighting, and color-management profile.
- Reviews regions, contours, landmarks, layers, materials, relations, geometry, transforms, occlusion, depth, camera coordinates, effects, compositing, and protected baselines.
- Preserves stable node, layer, material, asset, camera, and operator identities across replays.
- Separates latent geometry from projected geometry and records alignment, tolerance, uncertainty, and provenance.
- Flags missing assets, hash mismatches, invalid topology, unresolved references, clipping, depth conflicts, lighting variance, nondeterministic ordering, and policy violations.
- Scene review cannot rewrite geometry, substitute assets, alter materials, or silently change the camera profile.

### 38.3 Animation

- Names the exact scene version, motion plan, timeline, frame range, frame rate, time base, interpolation profile, camera motion, constraints, continuity rules, and renderer.
- Reviews transforms, constraints, timing, easing, deformation, visibility, effects, compositing, audio synchronization, camera motion, and frame-state continuity.
- Provides deterministic play, pause, step, seek, loop-bounded, marker, and comparison behavior.
- Honors reduced-motion, pause, stop, replay, caption, transcript, and non-motion alternative requirements.
- Captures frame identity, timestamp, input state, transform state, camera state, expected result, actual result, and evidence hash for every reported defect.
- Playback cannot extend the admitted frame range, raise a resource budget, mutate the motion plan, or trigger an undeclared interaction.

### 38.4 Release

- Names the exact release candidate, application artifact, scene and animation versions, assets, native dependencies, adapters, configuration, licenses, manifests, checksums, and validation receipts.
- Opens only immutable, pre-admitted content under the declared no-network and capability profile.
- Reviews install or launch presentation through deterministic fixtures rather than modifying the host.
- Confirms application, scene, animation, accessibility, security, performance, provenance, packaging, and rollback evidence closure.
- Displays known limitations, unresolved findings, waived findings with accountable authority, target compatibility, and release notes.
- Blocks certification for missing artifacts, hash mismatch, unsigned or unapproved substitutions, secret material, path escape, unknown execution, failed mandatory tests, or incomplete rollback evidence.
- Release preview certification does not sign, deploy, distribute, install, update, or activate the candidate.

## Review control model

Each interface should expose a target-appropriate subset of these controls through typed extensions:

| Control group | Expected controls |
| --- | --- |
| Selection | Choose artifact, show identity, show hash, clear selection |
| Profile | Platform, viewport, renderer, theme, locale, accessibility, reduced motion |
| State | Initial state, fixture, route, scene, frame, marker, error scenario |
| Playback | Play, pause, stop, step, seek, bounded loop, speed, reduced-motion alternative |
| Comparison | Baseline, target, overlay, difference, side-by-side, metric view |
| Evidence | Screenshot, frame capture, trace, metrics, finding, annotation, receipt |
| Review | Pass, fail, return, abstain, severity, rationale, assigned correction |
| Guidance | Professor explanation, limitation, keyboard help, scene description, transcript |
| Publication | Podium evidence view and certification receipt |

Controls remain disabled unless their required identity, permission, state, and capability are current.

## Accessibility contract

- Every control has a stable accessible name, role, state, value, instruction, and error relationship.
- The keyboard path, focus order, focus visibility, skip navigation, modal containment, escape behavior, and recovery path are complete.
- Scene and animation viewports provide meaningful text alternatives, structured scene descriptions, object and layer summaries, captions, transcripts, and non-motion review paths.
- Status, loading, validation, playback, errors, findings, and certification changes are announced without stealing focus.
- Color contrast, non-color cues, zoom, reflow, text scaling, high contrast, touch targets, localization expansion, reduced motion, and assistive-technology operation are validated.
- Auto-play is prohibited unless explicitly permitted by the preview profile; pause and stop remain available.
- Accessibility failures block certification and remain visible in Podium evidence.

## Security and isolation

1. Verify artifact and manifest hashes before opening a preview.
2. Treat filenames, metadata, manifests, scene labels, captions, scripts, and project content as untrusted data.
3. Normalize paths and deny absolute paths, parent traversal, symlink escape, device paths, alternate data streams, and archive escape.
4. Deny network, credentials, shell, process creation, installer execution, package-manager execution, host registry mutation, and undeclared writes.
5. Decode media and archives through bounded, allowlisted adapters.
6. Enforce file-count, byte, resolution, duration, frame, node, layer, event, recursion, CPU, GPU, memory, and time limits.
7. Isolate service doubles from production endpoints and secrets.
8. Keep logs, screenshots, frames, and traces within declared privacy and retention policy.
9. Cancel safely without leaving partial evidence or changing the reviewed input.
10. Publish denials and failures as evidence rather than retrying through a weaker path.

## Determinism contract

For fixed artifact, manifest, profile, fixture, adapters, policy, permissions, seed, and runtime:

1. Application preview yields the same logical component tree, states, action trace, findings, and evidence ordering.
2. Scene preview yields the same scene graph, camera state, layer order, material bindings, projected frame identities, and findings.
3. Animation preview yields the same frame states, transforms, camera motion, continuity outcomes, and review markers.
4. Release preview yields the same manifest closure, integrated review state, mandatory findings, and certification decision.
5. Keyboard and assistive-technology paths preserve the same logical order and named actions.
6. R12/MCRT replay yields the same identity, policy result, relation class, tuple hash, interaction order, and Podium receipt target.

Wall-clock time, filesystem enumeration, worker scheduling, decoder completion order, locale defaults, and nondeterministic GPU ordering may not affect canonical evidence identity.

## Finding record

Every finding includes:

| Field | Required contents |
| --- | --- |
| Identity | Finding, preview, artifact, profile, fixture, and execution identities |
| Scope | Route, component, scene node, layer, frame, timestamp, state, or release item |
| Classification | Visual, geometry, material, lighting, animation, continuity, interaction, accessibility, security, performance, packaging, or provenance |
| Severity | Blocker, critical, major, minor, informational, or unresolved |
| Expected | Versioned expected result and tolerance |
| Actual | Observed result and measured delta |
| Reproduction | Exact action sequence, state, seed, and runtime profile |
| Evidence | Screenshot, frame, trace, metric, manifest, log, and hash references |
| Uncertainty | Confidence, ambiguity, missing evidence, and alternate explanations |
| Disposition | Pass, return, accepted limitation, quarantined, or unresolved |
| Ownership | Responsible suite, artifact, reviewer, and correction target |
| Receipts | SOPHIA, CHARLOTTE, LANDON, Professor, Podium, R12, and MCRT |

Findings cannot authorize their own correction. They return to an appropriate design, reconstruction, animation, correction, or packaging suite under a new bounded change identity.

## Validation matrix

| Class | Preview Designer test | Expected result |
| --- | --- | --- |
| Positive | Valid immutable artifact, complete manifest, accessible actions, deterministic fixtures, and evidence closure | Pass |
| Negative | Missing dependency, hash mismatch, invalid state, inaccessible control, policy denial, or incomplete release evidence | Expected fail |
| Boundary | Smallest viewport, largest text scale, maximum admitted scene, final frame, longest localization, and resource limit | Pass or explicit boundary diagnostic |
| Application | State, layout, navigation, focus, validation, error, recovery, and service-double behavior | Pass |
| Scene | Graph, asset, geometry, layer, material, light, camera, operator, and projection identity | Pass |
| Animation | Frame, transform, constraint, timing, continuity, camera, effects, audio, and reduced-motion identity | Pass |
| Release | Manifest, dependency, license, configuration, compatibility, rollback, and receipt closure | Pass |
| Security | Network, credential, process, metadata execution, path escape, archive escape, or host mutation attempt | Deny |
| Determinism | Shuffled inputs and scheduling yield identical logical previews, finding order, and evidence identities | Pass |
| Recovery | Cancellation or decoder failure leaves input immutable and evidence explicit | Pass or bounded failure |
| Certification | Accessibility, R12/MCRT, action, finding, provenance, and Podium evidence are complete | Pass |

## Smithson 8S and R12 preservation

When Smithson 8S Coupled Mechanics appears in a preview, Suite 38 preserves the fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, projection version, tolerance profile, phase, support, interaction order, and provenance independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

The application, scene, animation, release, finding, and Podium evidence preserve `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, phase and support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result.

If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`. Visual overlap in a preview cannot prove latent coupling. Smithson 8S remains a proposed computational framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 38 is certifiable only when all four scripts preserve:

- valid JA Interface source form and matching emitted artifacts;
- no-network policy and immutable preview inputs;
- typed state and safe derived enablement;
- named ensemble components and permission-gated actions;
- complete keyboard and accessibility paths;
- exact artifact, manifest, profile, fixture, and runtime identities;
- deterministic application, scene, animation, and release review behavior;
- bounded adapters and resource use;
- explicit findings, limitations, failures, and recovery outcomes;
- R12/MCRT lineage and Podium receipts; and
- a clear boundary between preview certification and production release authority.

Any missing mandatory condition blocks certification.
