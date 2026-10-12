# JA21 Suite 19 — Mesh Geometry

Five independent DeepML Specialized Language scripts for geometric proxies, depth hypotheses, topology, camera coordinates, and deformable meshes.

## Language profile

- Language: Specialized Language (DeepML)
- Profile: `deepml.specialized`
- Extension: `.deepml`
- Header: `deepml specialized 0.3`
- Namespace: `deepml.specialized`
- MCRT profile: `DEEPML_SPECIALIZED_R12`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 shards
- Runtime posture: deterministic and no network

The attached corpus was gzip-validated and includes formal grammar, compiler and runtime contracts, semantic operators, conformance cases, and native sample scripts. These files are specification-level Mesh Geometry extensions built from that vocabulary; execution by a production DeepML Specialized compiler or runtime is not claimed.

## Files

| File | Sub-suite | Primary tensors | Principal output |
| --- | --- | --- | --- |
| `19.1_Mesh_Geometry_Geometric_Proxies.deepml` | Geometric proxies | Vertices, normals, faces, confidence | Validated proxy geometry and R12 receipt |
| `19.2_Mesh_Geometry_Depth_Hypotheses.deepml` | Depth hypotheses | Depth candidates, confidence, occlusion, uncertainty | Ranked depth evidence and R12 receipt |
| `19.3_Mesh_Geometry_Topology.deepml` | Topology | Vertices, face indices, half-edges, components | Validated connectivity and R12 receipt |
| `19.4_Mesh_Geometry_Camera_Coordinates.deepml` | Camera coordinates | Intrinsics, world-to-camera transform, world/camera/image points | Frame-valid coordinate evidence and R12 receipt |
| `19.5_Mesh_Geometry_Deformable_Meshes.deepml` | Deformable meshes | Rest/deformed vertices, faces, weights, parameters | Deterministic deformation state and R12 receipt |

## Analytical ensemble

| Participant | Mesh Geometry responsibility |
| --- | --- |
| SOPHIA | Proposes semantic geometry, depth, topology, coordinate alignment, and deformation hypotheses |
| CHARLOTTE | Validates shapes, units, bounds, calibration, topology, coordinate frames, uncertainty, and reconstruction gates |
| LANDON | Stages and executes deterministic tensor transformations while preserving stable asset and element identities |
| Professor | Explains assumptions, ambiguity, limitations, contradictions, and repair paths without changing validation outcomes |
| Podium | Certifies outputs and records provenance, semantic hashes, R12/MCRT evidence, replay identity, and admission decisions |

Each script declares an evidence schema containing stable hashes for all five roles, a source timestamp, and provenance. Role operators are pure and deterministic; a role may not silently override another role's denial or discard source evidence.

## Common specialized pipeline

Every file independently declares:

1. `deepml specialized 0.3` and a stable module identity.
2. `policy deterministic` and `policy no_network`.
3. Explicit physical or index units and fixed tensor shapes.
4. A provenance-bearing evidence schema.
5. SOPHIA proposal or classification.
6. CHARLOTTE validation and bounded calibration.
7. LANDON deterministic staging or transformation.
8. Professor explanation.
9. Podium certification.
10. Semantics-preserving optimization and `DEEPML_SPECIALIZED_R12` lowering.

Expected compiler route:

```text
lex -> parse -> AST -> name resolution -> type check
-> semantic validation -> safety gate -> normalization
-> optimization -> R12 lowering -> MCRT emission
```

## Input and adapter boundary

The scripts expect approved local adapters to provide tensors in the declared shapes and units. Decoders, photogrammetry engines, camera APIs, mesh importers, and physics solvers are outside the static script boundary.

Adapters must be deterministic, bounded, provenance-preserving, and non-executing during inspection. They must record coordinate convention, handedness, unit scale, matrix layout, index base, vertex/face ordering, camera model, distortion model, source hash, and conversion diagnostics. Missing or ambiguous metadata blocks reconstruction.

## Sub-suite contracts

### 19.1 Geometric proxies

- Proxy identity, source asset, vertex order, face winding, normals, unit scale, and approximation error are retained.
- Face indices must be integer-valued, in range, and reference existing vertices.
- Normals must use the declared coordinate convention and remain distinguishable from source normals.
- Simplification records the algorithm, tolerance, source-to-proxy correspondence, and error distribution.

### 19.2 Depth hypotheses

- Depth, confidence, occlusion, and uncertainty tensors share the same hypothesis and image axes.
- Depth is non-negative in the declared camera convention and retains scale provenance.
- Hypotheses are ranked by declared evidence rather than input order.
- Missing baselines, calibration, scale, or occlusion evidence keeps the result `UNRESOLVED`.

### 19.3 Topology

- Vertex, face, half-edge, and component identities remain stable through optimization.
- Index values are integral, in range, and consistent with one declared index base.
- Non-manifold edges, duplicate faces, inverted winding, disconnected components, holes, and self-intersections are reported explicitly.
- Repairs require a separate approved transformation with before/after provenance; validation itself does not repair topology.

### 19.4 Camera coordinates

- Intrinsics, extrinsics, lens/distortion model, image origin, handedness, matrix convention, and source/destination frames are explicit.
- World, camera, normalized-image, and pixel coordinates remain separate typed concepts.
- Matrices must be finite, dimensionally valid, and invertible where the operation requires an inverse.
- Reprojection error and calibration uncertainty remain attached to every admitted transform.

### 19.5 Deformable meshes

- Rest state, current state, topology, weights, parameters, constraints, time step, and solver identity are preserved.
- Vertex and face identities do not change silently during deformation.
- Weights obey their declared normalization and support rules.
- Inversion, self-intersection, non-finite displacement, constraint violation, or replay drift blocks certification.

## Reconstruction admission gate

Reconstruction may begin only when:

- Every required tensor matches its declared type, shape, unit, and coordinate convention.
- Provenance, source hashes, stable element identities, and adapter versions are present.
- Camera calibration and depth scale are known or explicitly bounded.
- All topology indices resolve and required manifold/orientation rules pass.
- Proxy and deformation errors remain within declared tolerances.
- Uncertainty intervals do not cross an admission threshold.
- No security, policy, or unknown-code denial is present.
- Podium evidence references the exact accepted tensors and validation result.

Missing geometry is not silently invented. A required unresolved hypothesis, reference frame, topology defect, or deformation constraint blocks dependent reconstruction.

## Validation matrix

| Class | Mesh Geometry test | Expected result |
| --- | --- | --- |
| Positive | Valid shapes, units, calibration, topology, provenance, and receipts | Pass |
| Negative | Invalid index, dimension mismatch, unsafe operator, or false evidence hash | Expected fail |
| Boundary | Empty mesh, maximum declared tensor, zero-area face, singular camera, or deformation limit | Pass or explicit boundary diagnostic |
| Integration | Proxy, depth, topology, camera, and deformation records preserve shared asset and element identities | Pass |
| Security | Network access, unknown kernel, path escape, untrusted payload, or source substitution | Deny |
| Performance | Sparse planning and bounded tensors remain within declared compute and memory budgets | Pass within profile |
| Determinism | Identical inputs produce identical graph state, semantic hash, and tuple order | Pass |
| Interoperability | Compatible coordinate, mesh, and camera adapters preserve units and provenance | Pass |
| Recovery | Interrupted transformation resumes without duplicate or reordered mesh identities | Pass or explicit repair requirement |
| Certification | R12 and MCRT evidence reproduce validation, relation class, and tuple hash | Pass |

The corpus contains 7,875 positive examples and 2,125 negative examples. Negative outcomes are expected evidence, not permission to coerce invalid geometry into an admitted result.

## Optimization restrictions

Permitted optimization includes unit propagation, dimensional simplification, operator specialization, sparse planning, calibration folding, and target lowering only when observable semantics are preserved.

Optimization must not change units, coordinate conventions, handedness, topology, vertex/face identity, camera matrix meaning, hypothesis ranking, random-stream assignment, provenance, uncertainty, contradictions, or named observable stages. An approximate kernel requires an explicit tolerance and cannot replace an exact profile silently.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, latent and projected geometry remain independent:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium records retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, camera and mesh profile, tolerances, uncertainty, provenance, interaction order, `Delta_8S`, relation class, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Visible mesh overlap, similar silhouettes, or low reprojection error does not prove latent coupling. A single 3-by-5 base projection cannot uniquely recover a five-dimensional center; stacked views require rank 5 for unique linear reconstruction.

Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 19 is certifiable only when all five scripts preserve deterministic execution, no-network policy, stable identities, typed units, coordinate conventions, topology invariants, calibration evidence, uncertainty, provenance, role-specific evidence, and replayable `DEEPML_SPECIALIZED_R12`/MCRT records.
