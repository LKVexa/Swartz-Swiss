# JA21 Suite 27 — DeepML Worker

Four independent DeepML Core scripts for sandboxed inference, feature extraction, reconstruction proposals, and deterministic model routing.

## Language profile

- Language: DeepML Language
- Profile: `deepml.core`
- Extension: `.deepml`
- Header: `deepml core 0.3`
- Namespace: `deepml.core`
- MCRT profile: `DEEPML_CORE_R12`
- Primary artifact: `DeepMLModelPackage`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 shards
- Runtime posture: deterministic and no network

The attached corpus was gzip-validated and includes grammar, compiler and runtime contracts, semantic operators, conformance cases, optimization rules, and native sample scripts. These files are specification-level DeepML Core programs; execution requires a conforming DeepML compiler and approved runtime.

## Files

| File | Sub-suite | Worker responsibility | Principal output |
| --- | --- | --- | --- |
| `27.1_DeepML_Worker_Sandboxed_Inference.deepml` | Sandboxed Inference | Executes a bounded deterministic inference graph on CPU | Certified inference graph and MSSLB package |
| `27.2_DeepML_Worker_Feature_Extraction.deepml` | Feature Extraction | Normalizes observations and emits an eight-value feature representation | Stable feature tensor and MSSLB package |
| `27.3_DeepML_Worker_Reconstruction_Proposals.deepml` | Reconstruction Proposals | Encodes observed features and decodes a candidate reconstruction vector | Non-authoritative proposal tensor and MSSLB package |
| `27.4_DeepML_Worker_Model_Routing.deepml` | Model Routing | Scores four pinned model routes using a deterministic graph | Stable route-score tensor and MSSLB package |

## Analytical ensemble

| Participant | DeepML Worker responsibility |
| --- | --- |
| SOPHIA | Interprets the accepted request and produces a normalized analytical representation |
| CHARLOTTE | Validates tensor types, shapes, model signatures, policies, constraints, confidence, and route compatibility |
| LANDON | Executes the approved graph, extracts features, constructs proposals, or computes route scores |
| Professor | Produces an explainable intermediate representation and records assumptions, uncertainty, limitations, and repair guidance |
| Podium | Emits the final tensor with source/model hashes, R12/MCRT evidence, route or proposal identity, replay status, and certification receipt |

Every graph contains five named nodes ordered as SOPHIA, CHARLOTTE, LANDON, Professor, and Podium. These nodes form a data-dependency chain; they do not average away a validation denial, shape error, unsupported model, contradiction, or missing input.

## Common worker contract

Every file independently declares:

1. `deepml core 0.3` and a stable module identity.
2. Deterministic and no-network policies.
3. Explicit `f32` tensor types and fixed shapes.
4. Seeded model parameters.
5. A pure, acyclic five-role computation graph.
6. Named deterministic inference output.
7. CPU execution.
8. Semantics-preserving optimization.
9. `DEEPML_CORE_R12` lowering.
10. A named `.msslb` model package.
11. Strict graph certification.

Expected compiler route:

```text
lex -> parse -> AST -> tensor, shape, dtype, and operator resolution
-> graph, policy, determinism, and model-signature validation
-> optimization -> execution graph -> DEEPML_CORE_R12 lowering
-> MCRT emission -> DeepMLModelPackage -> replay certification
```

## Sandboxed runtime boundary

Before inference, the runtime must declare:

- Stable runtime, device, kernel, model, operator, and package IDs.
- Model and dependency hashes.
- Input/output signatures and maximum tensor sizes.
- Operator allowlist and prohibited external operators.
- CPU, memory, storage, thread, timeout, cancellation, and output quotas.
- Determinism class, precision profile, numerical tolerance, and replay support.
- File, clock, random, process, device, and network effects.
- Diagnostic, redaction, provenance, and audit schemas.

The worker must not download a model, execute an unknown operator, load an unapproved native library, open a network connection, escape its approved storage boundary, access undeclared secrets, or substitute a model after routing.

## Input and model manifest

Every request requires:

- Request, source, asset, observation, model-catalog, graph, worker, and replay IDs.
- Source and input hashes.
- Tensor dtype, rank, dimensions, layout, axis meanings, units, normalization, missing-value policy, and bounds.
- Pinned model semantic ID, package hash, version, signature, operator set, device profile, and determinism class.
- Requested output type, confidence policy, uncertainty representation, and validation thresholds.
- Resource budget, deadline, cancellation identity, and evidence destination.

Missing model data, tensor semantics, or route constraints must remain unresolved rather than being guessed.

## Sub-suite contracts

### 27.1 Sandboxed Inference

- Only approved, content-hashed tensors and model parameters enter the graph.
- Input shape is exactly `[1,8]`; incompatible inputs are rejected before execution.
- Parameter seeds and operator implementations remain stable.
- Execution is limited to the declared CPU profile and resource budget.
- Output, diagnostics, timing class, graph hash, model hash, and replay receipt are recorded.

### 27.2 Feature Extraction

- The observation schema defines the meaning of all 16 input values.
- Normalization parameters and missing-value handling are explicit.
- Projection and encoder signatures preserve feature order and identity.
- The eight-value output records units, scale, confidence, source spans, and provenance.
- Optimization cannot merge, reorder, or silently remove observable features.

### 27.3 Reconstruction Proposals

- A proposal is a candidate for later validation, not an accepted reconstructed scene.
- Encoder and decoder identities, shapes, weights, and source evidence are pinned.
- Every proposal records confidence, uncertainty, alternatives, unsupported regions, and limitations.
- CHARLOTTE validation must occur before another suite promotes a proposal into a scene, mesh, material, or motion plan.
- The worker must not invent missing geometry, texture, material, camera, depth, topology, or temporal evidence.

### 27.4 Model Routing

- The available catalog contains four pinned, signature-compatible model routes.
- Route scoring uses only approved request features and the accepted routing graph.
- Route scores are emitted in stable catalog order.
- The approved host router selects the highest admissible score using a declared deterministic tie rule.
- An incompatible, unavailable, denied, or insufficiently supported model cannot be selected even if its raw score is highest.

## Admission gate

A DeepML Worker request is admitted only when:

- Source, input, model, package, graph, operator, runtime, device, and replay identities are present and content-hashed.
- Tensor dtype, rank, shapes, axes, and model signatures resolve without ambiguity.
- The graph is acyclic and every operator overload resolves uniquely.
- External operators and unknown code are absent.
- Random streams are either absent or explicitly seeded.
- Required resource budgets are available.
- No network or undeclared effect is requested.
- R12, MCRT, graph, model package, output, route/proposal identity, and replay receipt describe the same accepted execution.

## Validation matrix

| Class | DeepML Worker test | Expected result |
| --- | --- | --- |
| Positive | Valid tensors, compatible pinned model, acyclic graph, resources, package, and receipts | Pass |
| Negative | Shape mismatch, ambiguous operator, graph cycle, unknown model, unsupported route, external operator, or replay mismatch | Expected fail |
| Boundary | Minimum/maximum tensor, exact resource limit, exact score tie, exact confidence threshold, or timeout boundary | Pass or explicit boundary diagnostic |
| Integration | All four scripts preserve request, model catalog, tensor, graph, worker, package, and evidence identities | Pass |
| Security | Hidden network, dynamic model download, unknown operator, native-library substitution, path escape, or secret access | Deny |
| Performance | Inference, feature extraction, proposal decoding, routing, and hashing remain within declared budgets | Pass within profile |
| Determinism | Repeated execution preserves node order, output values within profile, route order, and canonical tuple hash | Pass |
| Interoperability | Tensor and model adapters preserve dtype, shape, axes, units, signatures, identities, and provenance | Pass |
| Recovery | Interrupted work resumes from an accepted boundary without duplicate output or model substitution | Pass or explicit repair requirement |
| Certification | R12, MCRT, model, graph, sandbox, package, output, and replay evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes constant folding, algebraic simplification, pure-operator fusion, common-subexpression elimination, shape/dtype propagation, memory planning, buffer reuse with alias proof, constant-weight prepacking, vectorization, and static device placement.

Optimization must not change model input/output signatures, remove named observable nodes, change parameter or feature identity, reorder non-associative reductions without tolerance permission, introduce approximate kernels under an exact profile, change random streams, execute external operators, change route catalog order, or erase proposal uncertainty and provenance.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, the worker preserves latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, input/model/graph identities, route or proposal identity, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. A matching feature or proposal vector is not proof of latent coupling. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 27 is certifiable only when all four scripts preserve deterministic/no-network policy, explicit tensor signatures, seeded parameters, acyclic five-role graphs, sandbox limits, pinned model identities, valid feature/proposal/route semantics, CPU execution, semantics-preserving optimization, `DEEPML_CORE_R12`, MCRT provenance, and replayable `.msslb` packages.
