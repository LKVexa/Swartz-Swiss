# JA21 Suite 21 — Scene Reconstruction

Five independent JA Portal Scene Language scripts for reconstructing deterministic layered scenes from source imagery and inferred geometry.

## Sub-suite split

The request describes one reconstruction responsibility rather than enumerating named sub-suites. This bundle decomposes it into five independently executable concerns:

1. Source imagery.
2. Inferred geometry.
3. Layer assembly.
4. Camera and material binding.
5. Deterministic emission.

## Language profile

- Language: JA Portal Scene Language
- Profile: `ja.portal.scene`
- Extension: `.ja`
- Header: `ja portal.scene 0.3`
- Namespace: `ja.portal.scene`
- MCRT profile: `PORTAL_SCENE_R12`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 shards
- Runtime posture: no unknown-code execution and no network

The attached corpus was gzip-validated and includes grammar, compiler and runtime contracts, semantic operators, conformance cases, and native samples. These scripts are specification-level reconstruction modules; execution by a production JA Portal Scene compiler or runtime is not claimed.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `21.1_Scene_Reconstruction_Source_Imagery.ja` | Source imagery | Bind approved source imagery to a canonical scene plane and evidence hierarchy | Canonical image scene, snapshot, R12, and MCRT trace |
| `21.2_Scene_Reconstruction_Inferred_Geometry.ja` | Inferred geometry | Bind approved inferred mesh geometry without silently repairing it | Geometry scene, snapshot, R12, and MCRT trace |
| `21.3_Scene_Reconstruction_Layer_Assembly.ja` | Layer assembly | Establish stable, explicit layer order for evidence and geometry | Topologically ordered layered scene |
| `21.4_Scene_Reconstruction_Camera_Material_Binding.ja` | Camera/material binding | Bind validated camera, mesh, and material resources | Camera-valid material scene and trace |
| `21.5_Scene_Reconstruction_Deterministic_Emission.ja` | Deterministic emission | Serialize, snapshot, lower, trace, package, and certify the admitted scene | Canonical snapshot, `.msslb` package, and MCRT receipt |

## Analytical ensemble

| Participant | Scene Reconstruction responsibility |
| --- | --- |
| SOPHIA | Interprets source imagery and geometry, proposes scene meaning and relations, and produces the reconstruction candidate |
| CHARLOTTE | Validates resource hashes, types, transforms, hierarchy, camera projection, material ranges, uncertainty, and admission gates |
| LANDON | Stages resources, preserves stable identities, assembles canonical hierarchy and layers, and performs deterministic bindings |
| Professor | Explains assumptions, missing evidence, contradictions, limitations, and repair paths without changing validation outcomes |
| Podium | Records snapshots, source and semantic hashes, relation classes, R12/MCRT evidence, package identity, and replay receipts |

Every script contains stable scene entities for all five participants. An entity records role-specific evidence and does not grant authority to override policy, fabricate resources, or conceal an unresolved result.

## Reconstruction inputs

The Scene Language declares and composes scene resources; it does not itself decode images or infer meshes. Approved local adapters or upstream suites must provide:

- Source image texture with content hash, dimensions, colorspace, orientation, and provenance.
- Inferred mesh with vertex/face identity, coordinate system, scale, topology diagnostics, uncertainty, and source correspondence.
- Camera intrinsics/extrinsics, projection convention, clipping range, calibration error, and provenance.
- Materials with shader profile, scalar ranges, texture hashes, colorspace, and supported-feature diagnostics.
- Stable asset, entity, component, layer, R12, and replay identifiers.

Adapters remain deterministic, bounded, local, and non-executing. Missing resources or ambiguous coordinate conventions block reconstruction.

## Canonical reconstruction flow

```text
approved source imagery
-> validated geometry and source correspondence
-> stable scene entities and resource graph
-> canonical layer hierarchy
-> camera and material bindings
-> semantic validation and admission
-> canonical serialization and snapshot
-> PORTAL_SCENE_R12 lowering and MCRT trace
-> final ScenePackage certification
```

## Sub-suite contracts

### 21.1 Source imagery

- Preserve the original image hash, pixel dimensions, orientation, crop, colorspace, alpha meaning, and adapter version.
- Keep stored pixel data distinct from rendered appearance.
- The source-image plane is evidence, not inferred geometry.
- Unsupported formats, missing hashes, or decode contradictions block dependent reconstruction.

### 21.2 Inferred geometry

- Preserve mesh identity, coordinate frame, scale, vertex order, face winding, normals, topology diagnostics, and uncertainty.
- Every resource reference resolves before packaging.
- Geometry may be rejected or marked unresolved but is never silently repaired by validation.
- Similar silhouette or projection is not proof of identical latent geometry.

### 21.3 Layer assembly

Canonical layer order is encoded by stable tag prefixes:

```text
000 SOPHIA source interpretation
100 CHARLOTTE validation
200 LANDON geometry assembly
900 Professor explanation
999 Podium receipt
```

Hierarchy order is determined by stable IDs and explicit tags, not discovery time. Parent cycles, duplicate IDs, conflicting parents, and undocumented reparenting are invalid.

### 21.4 Camera and material binding

- Camera projection is explicit and valid: `near_clip > 0` and `far_clip > near_clip`.
- Camera order uses explicit priority and stable identity.
- Mesh/material references resolve to declared resources.
- Material scalar ranges, texture compatibility, shader ordering, and hashes are validated.
- Unknown or untrusted shader execution is forbidden during static inspection.

### 21.5 Deterministic emission

- `canonical_scene_v1` serialization uses stable entity, component, resource, and field order.
- Snapshots keep runtime state separate from immutable scene definitions.
- Optimization preserves world transforms, stable identities, observable handler order, and resource hashes.
- The final `.msslb`, R12 record, MCRT trace, and tuple hash identify the same admitted scene.
- Certification fails on replay divergence, unresolved resources, or hidden effects.

## Scene graph invariants

The corpus defines four related graphs that must remain valid:

| Graph | Required invariant |
| --- | --- |
| Entity hierarchy | Rooted, acyclic, and at most one direct parent per entity |
| Component ownership | Component types and property values match declared schemas |
| Resource dependency | Mesh, texture, material, shader, and external references resolve by stable hash |
| Behavior | Systems, handlers, bindings, and timeline links preserve deterministic order |

Source order may be retained for round-trip documentation, but canonical serialization uses stable semantic identities.

## Reconstruction admission gate

A scene is admitted only when:

- Source image and inferred geometry identities and hashes are present.
- Coordinate frames, units, scale, orientation, and camera conventions are explicit.
- Entity hierarchy and resource graphs are valid and acyclic where required.
- Layer order is stable and replayable.
- Camera and material validation passes.
- Uncertainty does not cross a required tolerance.
- No network or unknown-code effect is requested.
- All five role entities refer to the same scene identity and accepted evidence set.
- Snapshot, R12, MCRT, and package hashes replay identically.

The system must not invent a missing mesh, transform, material, camera, resource, or relationship.

## Validation matrix

| Class | Scene Reconstruction test | Expected result |
| --- | --- | --- |
| Positive | Valid resources, hierarchy, camera, materials, layers, snapshot, and trace | Pass |
| Negative | Duplicate ID, parent cycle, invalid component type, unresolved resource, or replay divergence | Expected fail |
| Boundary | Empty scene, deepest valid hierarchy, clipping limits, maximum resources, or zero visible layers | Pass or explicit boundary diagnostic |
| Integration | Source, geometry, layers, camera/material, and final package preserve shared identities | Pass |
| Security | Active network, unknown shader/code, source substitution, traversal, or secret leakage | Deny |
| Performance | Resource deduplication and deterministic graph traversal remain within declared budget | Pass within profile |
| Determinism | Shuffled declaration/discovery order yields the same canonical snapshot and tuple hash | Pass |
| Interoperability | Compatible scene/resource adapters preserve units, coordinate conventions, and hashes | Pass |
| Recovery | Interrupted reconstruction resumes from checkpoint without duplicate entities or reordered layers | Pass or explicit repair requirement |
| Certification | Canonical serialization, R12, MCRT, and package evidence are replayable | Pass |

## Optimization restrictions

Permitted optimization includes stable-ID assignment, topological ordering, immutable resource deduplication, and constant-transform folding when semantic equivalence is proven.

Optimization must not reparent entities while changing world transforms, merge distinct identities, remove reflected or serialized components, reorder observable handlers, change material or camera meaning, erase uncertainty or contradictions, or drop source/resource hashes.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, reconstruction preserves latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, scene/resource identities, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Visible alignment or similar rendering does not prove latent coupling. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 21 is certifiable only when all five scripts preserve no-network/no-unknown-code policy, stable scene identities, deterministic hierarchy and layers, valid resources, camera/material constraints, provenance, canonical serialization, snapshots, `PORTAL_SCENE_R12`, MCRT traces, and replayable package evidence.
