# JA21 Suite 32 — Orchestrator II

Five independent JA Agent Language scripts for reconstruction, rendering, validation, learning records, and release packaging.

## Language profile

- Language: JA Agent Language
- Profile: `ja.agent`
- Extension: `.jaa`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Memory posture: session-scoped with one-hour retention
- Capability posture: approved tool invocation only

The attached corpus contains specification-model compiler and runtime expectations rather than evidence of production compiler execution. These scripts therefore use only demonstrated constructs: agent identity, role, confidence-gated goals, bounded memory and budgets, capability-approved tools, observation, authorization, policy gating, execution, MCRT recording, deterministic termination, capability-boundary assertions, and MCRT emission.

## Files

| File | Sub-suite | Goal | Principal output |
| --- | --- | --- | --- |
| `32.1_Orchestrator_II_Reconstruction.jaa` | Reconstruction | Produce a deterministic, evidence-bearing reconstruction | Validated reconstruction record and MCRT evidence |
| `32.2_Orchestrator_II_Rendering.jaa` | Rendering | Render certified scene and frame states | Deterministic render results and evidence |
| `32.3_Orchestrator_II_Validation.jaa` | Validation | Certify or block reconstruction, rendering, learning, and release artifacts | Certification or explicit blocking record |
| `32.4_Orchestrator_II_Learning_Records.jaa` | Learning records | Derive replayable learning records from certified evidence | Validated learning records and provenance |
| `32.5_Orchestrator_II_Release_Packaging.jaa` | Release packaging | Assemble and publish a verified deterministic release | Manifest-bound release package and receipt |

## Relationship to Orchestrator I

Suite 15 Orchestrator coordinates suite fan-out, deterministic fan-in, load order, conflict resolution, and synthesis. Suite 32 Orchestrator II governs the downstream production pipeline after synthesis:

```text
certified synthesis
  -> deterministic reconstruction
  -> reconstruction validation
  -> deterministic rendering
  -> render validation
  -> learning-record derivation
  -> learning-record validation
  -> release manifest
  -> release validation and packaging
  -> Podium publication
```

`32.3_Orchestrator_II_Validation.jaa` is intentionally reusable at each gate. Passing an earlier gate never implies that a later artifact is valid.

## Analytical ensemble

| Participant | Orchestrator II responsibility |
| --- | --- |
| SOPHIA | Interprets certified evidence, synthesizes reconstruction, plans rendering, classifies findings, derives learning records, and drafts the release manifest |
| CHARLOTTE | Validates inputs, capabilities, reconstruction invariants, rendering continuity, learning-record evidence, release closure, security policy, and replay determinism |
| LANDON | Stages inputs, performs approved reconstruction support and rendering, collects evidence, stages learning inputs, and packages the verified release |
| Professor | Explains assumptions, geometry, rendering decisions, findings, learning limits, package contents, failures, and repair paths |
| Podium | Records each stage, publishes learning records and releases, and binds all outputs to hashes, provenance, policy decisions, R12/MCRT identity, and replay receipts |

No participant may silently override a denial, fabricate missing geometry, hide a rendering defect, convert an unresolved finding into a pass, train from unapproved data, or publish an incomplete release.

## Common JA Agent contract

Every script independently declares:

1. `ja source 0.3`, a stable module, and `use Agent`.
2. `policy no_network`.
3. A stable agent identity and composite ensemble role.
4. A confidence-gated goal.
5. Session memory with bounded retention.
6. Finite step and tool budgets.
7. Five role-specific tools requiring `tool.invoke:approved`.
8. Explicit authorization before every tool can execute.
9. `continue when policy_allows` before effects.
10. MCRT recording and deterministic goal-based termination.
11. A true capability-boundary assertion and named MCRT output.

Tool authorization permits only the named operation. It does not grant network access, unknown-code execution, ambient filesystem access, release authority, or permission to weaken another policy.

## Sub-suite contracts

### 32.1 Reconstruction

- LANDON stages only admitted source imagery, feature graphs, geometry, scene records, motion plans, equations, metadata, and provenance.
- SOPHIA synthesizes one candidate reconstruction without erasing uncertainty, contradictions, missing evidence, coordinate frames, units, or source relationships.
- CHARLOTTE verifies topology, geometry, transforms, layers, materials, relations, camera state, motion constraints, canonical identities, and deterministic replay.
- Professor explains assumptions and unresolved evidence without changing the validated artifact.
- Podium records the exact inputs, output hash, validation result, policy state, limitations, and MCRT receipt.
- Missing dependencies, invalid topology, non-finite geometry, a hash mismatch, or a policy denial blocks certification.

### 32.2 Rendering

- Rendering begins only from a certified reconstruction and declared renderer, target profile, color profile, frame range, resolution, and resource budget.
- SOPHIA produces a canonical render plan.
- CHARLOTTE checks scene identity, layer order, transforms, materials, lighting, camera state, timing, continuity, output paths, capabilities, and deterministic settings.
- LANDON renders only the approved plan and preserves per-frame identity.
- Professor explains differences and limitations; Podium records frame hashes, logs, metrics, and receipts.
- Unsupported operators, missing assets, invalid frame states, continuity failure, path escape, or resource-budget violations block output admission.

### 32.3 Validation

- Validation accepts a declared artifact type, profile, identity, canonical hash, dependencies, expected invariants, and evidence set.
- LANDON collects evidence in canonical identity order rather than discovery or completion order.
- SOPHIA classifies findings without flattening `UNRESOLVED`, `CONTRADICTION`, `HIGHER_ORDER`, or policy-denied outcomes.
- CHARLOTTE certifies or blocks the artifact using schema, integrity, security, quality, interoperability, determinism, and replay gates.
- Professor explains failures and repairs; Podium preserves the full decision record.
- Missing provenance or evidence is a failure to certify, not permission to infer a pass.

### 32.4 Learning records

- Learning records are derived only from certified pipeline evidence.
- Records retain source identity, task, input and output hashes, policy decision, findings, confidence, limitations, causal parents, R12 identity, MCRT identity, and replay status.
- Failed and unresolved examples remain evidence; they are not discarded to improve apparent performance.
- Learning-record publication does not automatically update a model, prompt, policy, corpus, or runtime.
- Any later training or promotion requires a separate approved process, dataset version, evaluation, and release decision.
- Duplicate identities with different content are conflicts and block publication.

### 32.5 Release packaging

- SOPHIA drafts a canonical manifest from certified artifacts only.
- CHARLOTTE validates versions, schemas, licenses, capabilities, dependencies, paths, signatures, hashes, security findings, validation receipts, and release policy.
- LANDON packages files in canonical manifest order with normalized metadata.
- Professor explains installation, compatibility, limitations, known issues, and verification.
- Podium publishes only after archive integrity, manifest closure, hash verification, and replay checks pass.
- Filesystem order, timestamps, worker completion, and compression metadata may not alter the logical release identity.

## Deterministic pipeline contract

For fixed certified inputs, versions, policies, capabilities, profiles, dependencies, and budgets:

1. Reconstruction yields the same canonical scene and reconstruction hash.
2. Rendering yields the same admitted frame-state sequence and output hashes within the declared deterministic profile.
3. Validation yields the same finding classes, certification result, and evidence order.
4. Learning derivation yields the same record identities, causal links, and canonical hashes.
5. Release packaging yields the same logical manifest, file order, content hashes, dependency closure, and release identity.
6. R12/MCRT replay yields the same statement identity, policy decision, result, relation class, tuple hash, interaction order, and Podium receipt target.

Discovery order, filesystem enumeration, locale, wall-clock timestamps, thread scheduling, worker completion order, and archive entry timestamps may not influence canonical results.

## Validation matrix

| Class | Orchestrator II test | Expected result |
| --- | --- | --- |
| Positive | Complete certified inputs, approved tools, valid invariants, closed manifest, and deterministic termination | Pass |
| Negative | Missing dependency, invalid geometry, rendering discontinuity, hash mismatch, false capability assertion, or incomplete release | Expected fail |
| Boundary | Empty optional layers, maximum scene depth, frame count, artifact count, archive size, memory, step, and tool limits | Pass or explicit boundary diagnostic |
| Integration | Reconstruction identities survive rendering, validation, learning records, packaging, and Podium publication | Pass |
| Security | Prompt injection, untrusted metadata execution, path escape, hidden network, secret leakage, unsigned substitution, or undeclared tool | Deny |
| Performance | Sparse dependencies, bounded budgets, streaming frames, canonical collection, and packaging remain within declared resources | Pass within budget |
| Determinism | Shuffled inputs and worker timing yield identical canonical artifacts, findings, learning records, and logical release manifest | Pass |
| Interoperability | Compatible JA versions preserve identities, schemas, units, coordinate frames, effects, provenance, and receipts | Pass |
| Recovery | Interrupted stages resume without duplicate effects, record loss, corrupted manifests, or identity drift | Pass or explicit repair requirement |
| Certification | R12/MCRT replay reproduces exact identity, policy, result, relation class, tuple hash, and interaction order | Pass |

## Release admission gate

A release may be published only when:

1. Reconstruction and rendering artifacts have current validation receipts.
2. Every artifact identity, version, dependency, path, byte count, and hash resolves.
3. The manifest is canonical, complete, collision-free, and unable to escape the package root.
4. Required licenses, notices, operator explanations, and compatibility declarations are present.
5. Security findings are closed or explicitly release-blocking.
6. Learning records contain only approved evidence and do not trigger an undeclared model update.
7. Archive integrity and deterministic replay pass.
8. Podium binds publication to the exact manifest hash and validation state.

An unresolved required item blocks release. The package must preserve its evidence and repair requirement rather than omitting it silently.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, every stage preserves fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, provenance, projection version, tolerance profile, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Reconstruction, rendering, validation, learning records, release manifests, and Podium receipts retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, phase/support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result. If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`; rendering similarity cannot become evidence of latent coupling.

R12 replay requires an independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, wrapped phase difference at most `1e-6` radians, and identical relation class, tuple hash, and interaction order.

Smithson 8S is treated as a proposed analytical framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 32 is certifiable only when all five agents stay within bounded memory, steps, tools, and approved capabilities; reconstruction and rendering are deterministic and evidence-bearing; validation preserves denials, contradictions, uncertainty, and failures; learning records are replayable and do not trigger undeclared training; release packaging is manifest-closed and hash-verified; hidden network and unknown-code execution are absent; and R12/MCRT replay preserves exact policy, result, relation class, tuple hash, interaction order, and Podium receipt target.
