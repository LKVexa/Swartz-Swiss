# JA21 Suite 24 — CSharp Renderer

Three independent DeepML Animation VFX Language scripts for the native C# rendering provider, deterministic scene rendering, and deterministic frame-state rendering.

## Language profile

- Language: Animation VFX Language (DeepML)
- Profile: `deepml.vfx`
- Extension: `.deepml`
- Header: `deepml vfx 0.3`
- Namespace: `deepml.vfx`
- MCRT profile: `DEEPML_VFX_R12`
- Primary artifact: `VfxPackage`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 shards
- Runtime posture: deterministic and no network

The attached corpus was gzip-validated and includes grammar, compiler and runtime contracts, semantic operators, conformance cases, and native sample scripts. These files are specification-level DeepML VFX programs; execution requires a conforming DeepML VFX compiler plus a trusted native C# render provider.

## Files

| File | Sub-suite | Rendering responsibility | Principal output |
| --- | --- | --- | --- |
| `24.1_CSharp_Renderer_Native_CSharp_Layer.deepml` | Native C# Layer | Binds accepted scene and frame state to the native C# render surface | Native render target, R12 lowering, and C#-provider VFX package |
| `24.2_CSharp_Renderer_Scene_Rendering.deepml` | Scene Rendering | Renders reconstructed geometry, materials, lighting, atmosphere, visibility, and camera state | Deterministic scene color target and certified scene-render package |
| `24.3_CSharp_Renderer_Frame_State_Rendering.deepml` | Frame-State Rendering | Renders ordered Temporal Animator states with a fixed 60 Hz cache profile | Deterministic frame target, temporal cache, and replayable VFX package |

## Analytical ensemble

| Participant | CSharp Renderer responsibility |
| --- | --- |
| SOPHIA | Interprets accepted scene and temporal intent and proposes the render composition |
| CHARLOTTE | Validates resources, formats, color space, graph order, frame order, policy, determinism, and replay equivalence |
| LANDON | Resolves stable scene, frame, camera, shader, target, cache, provider, and package identities and executes the approved graph |
| Professor | Explains shading, composition, interpolation, provider assumptions, uncertainty, limitations, and repair paths |
| Podium | Records source and semantic hashes, render-graph identity, target hash, R12/MCRT evidence, replay result, package identity, and certification receipt |

Each script declares an ordered SOPHIA → CHARLOTTE → LANDON → Professor → Podium render-graph evidence chain. This order records distinct responsibilities and never averages away a validation denial, missing resource, graph conflict, unsupported provider, or replay mismatch.

## Common renderer contract

Every file independently declares:

1. `deepml vfx 0.3` and a stable module identity.
2. Deterministic and no-network policies.
3. Stable scene, timeline, frame, camera, target, and provider-facing identities.
4. A typed `rgba16f` render target.
5. An acyclic, ordered analytical render graph.
6. Multipass compositing with explicit inputs.
7. A native `render ... camera ... to ...;` operation.
8. A named deterministic cache boundary.
9. Semantics-preserving VFX optimization.
10. `DEEPML_VFX_R12` lowering.
11. A named `.msslb` VFX package.
12. Strict VFX certification.

Expected compiler route:

```text
lex -> parse -> AST -> resource and type resolution
-> policy, graph, shader-interface, and scene-binding validation
-> render-graph compilation -> trusted C# provider binding
-> optimization -> DEEPML_VFX_R12 lowering
-> MCRT emission -> VfxPackage -> render/replay certification
```

## Native C# provider boundary

The corpus defines DeepML VFX syntax rather than arbitrary C# source execution. `CSharpSurfaceBridge` is therefore a stable provider identity, not embedded C# code. A conforming host maps the accepted DeepML records to immutable C# data-transfer objects and native rendering services.

The provider must declare and hash:

- Assembly and toolchain versions.
- Renderer/provider semantic ID.
- Scene, frame-state, camera, shader, material, texture, buffer, and target schemas.
- Coordinate system, handedness, unit scale, depth range, color space, exposure convention, alpha convention, and texture origin.
- Resource allocation, pass scheduling, synchronization, and disposal behavior.
- Numerical precision, device/backend profile, tolerance class, and replay capabilities.
- Output format, dimensions, canonical serialization, target hash, diagnostics, and provenance.

Static inspection must not compile or execute unknown C#, load an unapproved assembly, invoke reflection over untrusted types, fetch network resources, or substitute a provider after certification.

## Sub-suite contracts

### 24.1 Native C# Layer

- `CSharpSurfaceBridge` accepts only type-resolved and policy-approved scene and frame-state records.
- DeepML semantic IDs map one-to-one to immutable C# identities.
- The C# provider cannot reinterpret coordinate, time, color, alpha, or depth conventions silently.
- Provider errors, device loss, unsupported features, and backend-dependent results remain explicit diagnostics.
- Native resources are released deterministically without changing evidence or output identity.

### 24.2 Scene Rendering

- Geometry, materials, lights, atmosphere, visibility masks, camera state, and collision resources resolve before graph execution.
- Every pass reads initialized resources and writes one declared target or uses an explicit merge rule.
- Shader inputs and outputs, resource bindings, dimensions, formats, and color spaces are compatible.
- Scene graph order is acyclic and stable after dependency analysis.
- Camera, projection, viewport, clipping, exposure, and output-transform profiles are preserved in evidence.

### 24.3 Frame-State Rendering

- Every input frame has a stable frame ID, ordinal, sample time, source clip, scene hash, and canonical state hash.
- Frame ordinals and times are monotonic, unique, and bound to one declared timebase.
- The temporal cache uses the declared `0s..4s` interval and `1/60s` step without silent resampling.
- Motion vectors, depth, color, and scene inputs refer to the same frame state.
- Repeated rendering with identical accepted inputs produces identical pass order and canonical output hash within the declared backend profile.

## Renderer admission gate

A render request is admitted only when:

- The DeepML source, scene, frame state, camera, provider, shader, material, resource, cache, and target identities are present and content-hashed.
- All resources are initialized before read, simultaneous writes have an explicit rule, and graph dependencies are acyclic.
- Shader-stage interfaces and resource binding numbers are valid.
- Dimensions, formats, color spaces, alpha conventions, depth conventions, and coordinate conventions are compatible.
- Frame order, timebase, cache interval, and sample step are valid.
- The C# provider and toolchain are trusted, version-pinned, and compatible with the requested deterministic profile.
- No network, unknown code execution, unapproved assembly loading, provider substitution, or source substitution is requested.
- R12, MCRT, VFX package, render target, and replay evidence identify the same accepted graph.

The renderer must not invent a missing scene component, frame, camera, shader, material, texture, buffer, target, provider capability, conversion, or output hash.

## Validation matrix

| Class | CSharp Renderer test | Expected result |
| --- | --- | --- |
| Positive | Valid scene/frame inputs, initialized resources, compatible shaders, ordered graph, package, and receipts | Pass |
| Negative | Missing target, uninitialized read, graph cycle, duplicate binding, provider mismatch, or replay mismatch | Expected fail |
| Boundary | First/last frame, exact clip end, minimum target size, maximum resource count, or declared numerical tolerance | Pass or explicit boundary diagnostic |
| Integration | Native layer, scene renderer, and frame renderer preserve shared provider, scene, camera, timeline, and target identities | Pass |
| Security | Hidden network, unknown C#, unapproved assembly, reflection over untrusted types, or source substitution | Deny |
| Performance | Pass merging, cache scheduling, domain tiling, resource reuse, and batching remain within declared budget | Pass within profile |
| Determinism | Repeated renders preserve pass order, frame order, random streams, and canonical target hash | Pass |
| Interoperability | DeepML-to-C# adapters preserve type, coordinate, time, color, alpha, depth, and serialization semantics | Pass |
| Recovery | Device loss or interrupted rendering resumes from a certified cache boundary without duplicate or omitted frames | Pass or explicit repair requirement |
| Certification | R12, MCRT, provider, graph, cache, package, target, and replay evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes node fusion, dead-pass removal, attribute packing, shader specialization, cache scheduling, domain tiling, resource lifetime aliasing, and render-graph ordering only when dependency and semantic equivalence are proven.

Optimization must not change random-stream assignment, read/write dependency order, blend semantics, externally observed passes, scene or frame identity, provider identity, shader interface, cache timing, color/depth conventions, or deterministic output beyond the declared tolerance profile.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, rendering preserves latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, renderer/provider identity, scene/frame hashes, render graph, target profile, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Visible overlap or a matching rendered frame is not proof of latent coupling. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 24 is certifiable only when all three scripts preserve deterministic/no-network policy, stable scene and frame identities, a trusted pinned C# provider, initialized and compatible resources, ordered render graphs, valid render targets, canonical caches, semantics-preserving optimization, `DEEPML_VFX_R12`, MCRT provenance, and replayable `.msslb` packages.
