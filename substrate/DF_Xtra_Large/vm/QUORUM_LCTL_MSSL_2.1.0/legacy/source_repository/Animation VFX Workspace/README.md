# JA21 Suite 34 — Animation VFX Workspace

Five independent DeepML Animation VFX Language scripts for animation, effects, compositing, inspection, and controlled iteration.

## Language profile

- Language: DeepML Animation VFX Language
- Profile: `deepml.vfx`
- Extension: `.deepml`
- Header: `deepml vfx 0.3`
- Namespace: `deepml.vfx`
- R12 profile: `DEEPML_VFX_R12`
- Primary artifact: `VfxPackage`
- Package extension: `.msslb`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 example shards
- Runtime posture: deterministic and no network

The attached corpus was gzip-validated and contains grammar, semantic operators, compiler/runtime contracts, conformance cases, and native sample scripts. These files are specification-level DeepML VFX programs; execution requires a conforming DeepML VFX compiler and trusted render provider.

## Files

| File | Sub-suite | Workspace responsibility | Principal output |
| --- | --- | --- | --- |
| `34.1_Animation_VFX_Workspace_Animation.deepml` | Animation | Evaluate scene and timeline state at a fixed 60 Hz workspace profile | Animation preview target, cache, R12 record, and package |
| `34.2_Animation_VFX_Workspace_Effects.deepml` | Effects | Evaluate collision-aware, volumetric, particle, and destruction effect layers | Effects target and certified effects package |
| `34.3_Animation_VFX_Workspace_Compositing.deepml` | Compositing | Merge background, scene, effects, and interface layers deterministically | Final composite target and package |
| `34.4_Animation_VFX_Workspace_Inspection.deepml` | Inspection | Expose beauty, depth, normals, motion, and validation overlays | Inspection target and evidence package |
| `34.5_Animation_VFX_Workspace_Iteration.deepml` | Iteration | Compare baseline and candidate states with localized difference overlays | Review target and controlled-iteration package |

## Analytical ensemble

Every script declares the ordered render-graph chain `SOPHIA -> CHARLOTTE -> LANDON -> Professor -> Podium`.

| Participant | Animation VFX Workspace responsibility |
| --- | --- |
| SOPHIA | Interprets animation and effects intent, proposes compositions, explains visual relationships, and frames iteration hypotheses |
| CHARLOTTE | Validates resources, graph order, timing, continuity, masks, formats, color/alpha/depth conventions, determinism, policy, and replay equivalence |
| LANDON | Resolves stable scene, timeline, frame, effect, shader, target, cache, render-graph, and package identities and executes approved graphs |
| Professor | Explains animation, simulation, shading, compositing, inspection findings, uncertainty, tradeoffs, and repair paths |
| Podium | Records source and semantic hashes, graph identity, caches, target hashes, inspection evidence, iteration differences, R12/MCRT state, packages, and certification receipts |

The graph order records distinct responsibilities. It cannot average away a denial, missing resource, invalid frame, unstable simulation, graph hazard, unsupported shader, or replay mismatch.

## Workspace pipeline

```text
certified scene + frame states
  -> animation evaluation
  -> deterministic effects simulation
  -> ordered compositing
  -> inspection buffers and overlays
  -> evidence-backed iteration candidate
  -> repeated animation/effects/compositing
  -> re-inspection
  -> approved package
```

Iteration creates a candidate branch. It does not overwrite the baseline, silently apply a correction, or bypass repeated inspection and certification.

## Common DeepML VFX contract

Every script independently declares:

1. `deepml vfx 0.3` and a stable module identity.
2. Deterministic and no-network policies.
3. Five differentiable analytical operators in a fixed evidence order.
4. Stable scene and timeline bindings.
5. A shader function and typed `rgba16f` render target.
6. An acyclic ordered render graph.
7. Explicit multipass composite inputs.
8. A native render operation using `scene.MainCamera`.
9. A named cache boundary.
10. Semantics-preserving optimization.
11. `DEEPML_VFX_R12` lowering.
12. A named `.msslb` package and strict certification.

Animation and iteration additionally declare fixed `0s..10s` temporal caches with `1/60s` sampling and stable hash identities.

## Sub-suite contracts

### 34.1 Animation

- Every frame retains stable identity, ordinal, sample time, scene hash, timeline hash, source clip, and canonical state hash.
- Frame ordinals and times are monotonic, unique, and bound to the declared timebase.
- Transforms, constraints, camera state, deformation, interpolation, and continuity are evaluated in canonical dependency order.
- The `0s..10s` cache includes exact boundary semantics and cannot silently resample, extrapolate, or change the 60 Hz profile.
- Missing constraints, invalid transforms, non-finite values, discontinuities, or timeline/hash mismatches block certification.

### 34.2 Effects

- Effects resolve collision fields, volumes, visibility masks, shaders, materials, emitters, forces, random streams, and scene dependencies before execution.
- Random streams are explicitly seeded by the accepted effect profile and remain stable across replay.
- Particle lifetime, spawn rate, simulation step, collision response, volumetric density, and destruction state use declared units and bounds.
- Simulation instability, a negative lifetime, missing cache, resource hazard, uninitialized read, or unsupported interaction remains an explicit diagnostic.
- Effect simulation cannot mutate the certified source scene or substitute an asset silently.

### 34.3 Compositing

- Background, scene, effects, and interface inputs have compatible dimensions, frame identity, color space, transfer function, exposure, alpha convention, depth convention, and texture origin.
- Every pass reads initialized resources and writes one declared target or uses an explicit merge rule.
- Masks retain their source identity, sampling rule, and coordinate mapping.
- Premultiplied and straight alpha are never mixed without an explicit validated conversion.
- Render-graph cycles, simultaneous writes without a merge rule, missing layers, invalid blend semantics, or color/depth mismatches block certification.

### 34.4 Inspection

- Beauty color, depth, surface normals, motion vectors, and validation overlays refer to the same scene and frame state.
- Inspection preserves raw buffers and produces overlays as separate derived outputs.
- Thresholds, masks, false-color mappings, zoom, crop, and display transforms remain explicit.
- An inspection visualization cannot alter the underlying buffer or become source evidence without preserving its derivation.
- Missing buffers, frame mismatch, non-finite values, tolerance violations, or replay differences remain visible findings.

### 34.5 Iteration

- Baseline and candidate retain separate scene, timeline, graph, shader, resource, cache, package, target, and provenance identities.
- Difference output uses an explicit alignment and comparison profile.
- Every candidate identifies the proposed change, localized evidence, expected gain, affected dependencies, protected invariants, risk, and rollback identity.
- A candidate proceeds only after CHARLOTTE validates policy, integrity, regression safety, and deterministic replay.
- Podium records rejected as well as accepted candidates; iteration history is append-only.

## Inspection and iteration evidence

At minimum, each review cycle preserves:

| Evidence | Required identity |
| --- | --- |
| Baseline | Scene, timeline, render graph, package, frame range, and target hashes |
| Candidate | Separate scene, timeline, render graph, package, frame range, and target hashes |
| Comparison | Alignment, color, alpha, depth, timebase, masking, and tolerance profiles |
| Findings | Frame, pass, region, metric, measured delta, threshold, severity, confidence, and causal evidence |
| Proposal | Operation, expected gain, dependencies, risks, protected invariants, and rollback identity |
| Decision | SOPHIA judgment, CHARLOTTE validation, LANDON execution state, Professor explanation, and Podium receipt |

Matching appearance alone does not prove equal geometry, simulation state, provenance, or policy.

## Determinism and cache contract

For fixed source, scene, timeline, frame states, effect profiles, random seeds, shaders, resources, masks, render graph, camera, backend, target, and policy:

1. Animation produces the same frame-state sequence.
2. Effects produce the same admitted simulation states.
3. Compositing preserves the same pass order and canonical target.
4. Inspection produces the same raw-buffer hashes, findings, and overlay derivations.
5. Iteration produces the same baseline/candidate ordering and difference target.
6. R12/MCRT replay produces the same identity, policy result, relation class, tuple hash, interaction order, package identity, and receipt target.

Filesystem enumeration, worker timing, locale, wall-clock timestamps, and device scheduling may not change canonical identities or logical graph order.

## Validation matrix

| Class | Animation VFX Workspace test | Expected result |
| --- | --- | --- |
| Positive | Valid scene, timeline, effects, resources, graph, targets, caches, package, and receipts | Pass |
| Negative | Missing resource, invalid frame, unstable simulation, graph cycle, format mismatch, or replay mismatch | Expected fail |
| Boundary | First/last frame, exact cache end, empty effect layer, zero-density volume, maximum pass count, and numerical tolerance | Pass or explicit boundary diagnostic |
| Integration | Animation, effects, composite, inspection, and iteration preserve shared scene, timeline, camera, and frame identities | Pass |
| Security | Hidden network, unknown shader code, unapproved provider, path escape, source substitution, or secret leakage | Deny |
| Performance | Node fusion, cache scheduling, tiling, resource reuse, pass ordering, and batching remain within budget | Pass within profile |
| Determinism | Repeated execution preserves frame order, random streams, graph order, cache identity, and canonical target hashes | Pass |
| Interoperability | Compatible providers preserve type, coordinate, time, color, alpha, depth, texture, and serialization semantics | Pass |
| Recovery | Interrupted simulation or rendering resumes from certified cache boundaries without missing or duplicate frames | Pass or explicit repair requirement |
| Certification | Source, graph, cache, package, target, R12, MCRT, inspection, iteration, and replay evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes node fusion, dead-pass removal, attribute packing, shader specialization, cache scheduling, domain tiling, resource-lifetime aliasing, and render-graph ordering only when dependency and semantic equivalence are proven.

Optimization must not change frame or pass order, random-stream assignment, simulation steps, read/write dependencies, blend semantics, externally observed passes, scene or timeline identity, shader interfaces, cache timing, inspection evidence, baseline/candidate identity, color/depth conventions, or deterministic output beyond the declared tolerance profile.

## Security contract

- No stage may access the network.
- Scene files, shaders, materials, metadata, caches, and package inputs are treated as untrusted data.
- Unknown code execution, unapproved shader compilation, reflection over untrusted types, ambient filesystem access, source substitution, provider substitution, and path escape are denied.
- All external providers, toolchains, schemas, resources, and optimization profiles are version-pinned and content-hashed.
- Secrets are redacted from shaders, diagnostics, overlays, explanations, packages, and Podium receipts.
- Explicit denial prevails over iteration intent, optimization, visual similarity, or operator preference.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, the workspace preserves fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, provenance, projection version, tolerance profile, phase, support, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Animation, effects, compositing, inspection, iteration, R12/MCRT evidence, packages, and Podium receipts retain `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, phase/support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result. If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`; a matching composite or inspection overlay cannot prove latent coupling.

R12 replay requires an independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, wrapped phase difference at most `1e-6` radians, and identical relation class, tuple hash, and interaction order.

Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 34 is certifiable only when all five scripts preserve deterministic/no-network policy, stable scene/timeline/frame identities, approved resources and providers, acyclic render graphs, compatible targets, canonical caches, semantics-preserving optimization, non-destructive inspection, append-only iteration history, `DEEPML_VFX_R12`, MCRT provenance, strict certification, and replayable `.msslb` packages.
