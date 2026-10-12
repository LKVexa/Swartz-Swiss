# JA21 Suite 20 — Equation Operator Bank

Five independent DeepML Kernel Language scripts that carry visual-structure evidence into reusable mathematical, MSSL, MSSLB, MCRT, and rendering operator banks.

## Language profile

- Language: DeepML Kernel Language
- Profile: `deepml.kernel`
- Extension: `.dmk`
- Source level: `ja source 0.3`
- Kernel import: `use DeepMLKernel`
- Kernel reference: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus examples: 10,000
- Runtime posture: strict precision, reproducible determinism, checked bounds, race-free assertion, and no network

The attached corpus was gzip-validated. Its manifest classifies the corpus as provisional, generated, and not production-compiler-validated. These scripts therefore stay within the demonstrated kernel envelope and do not claim production device execution.

## Files

| File | Sub-suite | Input shape | Target | Operator-bank purpose |
| --- | --- | --- | --- | --- |
| `20.1_Equation_Operator_Bank_Mathematical_Operators.dmk` | Mathematical operators | `Tensor<f32>[5,256]` | CPU | Coefficients, basis terms, constraints, tolerances, and equation identities |
| `20.2_Equation_Operator_Bank_MSSL_Operators.dmk` | MSSL operators | `Tensor<f32>[5,512]` | CPU | Versioned MSSL statement and semantic-operator descriptors |
| `20.3_Equation_Operator_Bank_MSSLB_Operators.dmk` | MSSLB operators | `Tensor<f32>[5,768]` | NPU | Bundle, dependency, semantic-hash, and MSSLB R12 tuple descriptors |
| `20.4_Equation_Operator_Bank_MCRT_Operators.dmk` | MCRT operators | `Tensor<f32>[5,128]` | CPU | Canonical R12/MCRT identity, policy, proof, replay, and certification fields |
| `20.5_Equation_Operator_Bank_Rendering_Operators.dmk` | Rendering operators | `Tensor<f32>[5,1024]` | GPU | Geometry, camera, material, projection, sampling, and rendering parameters |

## Corpus boundary for MSSL and MSSLB

The DeepML Kernel corpus does not define `MSSL` or `MSSLB` as independent source keywords. It references an `MSSLB R12 tuple` in the coupling-mechanics normalization. Suite 20 therefore treats MSSL and MSSLB as versioned operator-bank namespaces and input schemas while keeping the executable surface in demonstrated `DeepMLKernel` syntax.

This avoids assigning undocumented runtime semantics to new keywords. A future authoritative MSSL or MSSLB grammar can replace the adapter/schema boundary without changing the deterministic kernel contract.

## Five-channel analytical ensemble

The leading tensor dimension is fixed at five. Channel order is normative:

| Channel | Participant | Required contribution |
| ---: | --- | --- |
| 0 | SOPHIA | Structural interpretation, equation or operator candidates, semantic labels, and confidence |
| 1 | CHARLOTTE | Type, shape, unit, bounds, tolerance, proof, contradiction, and policy validation |
| 2 | LANDON | Stable identifiers, canonical layout, device staging, dependency order, and executable mapping |
| 3 | Professor | Explanation, assumptions, uncertainty, limitations, and repair guidance |
| 4 | Podium | Source and semantic hashes, R12/MCRT identity, relation class, replay receipt, and publication status |

Rows may not be reordered. Missing contributions remain explicitly unpopulated in the versioned input schema; they are not copied from another row or guessed.

## Kernel behavior

Each `.dmk` file is an independent, strict, reproducible, bounds-checked, race-free kernel. The `* 1.0` operation is intentional: it provides an exact pass-through lowering envelope for already-normalized operator descriptors while preserving all five ensemble channels.

The corpus demonstrates fixed-shape device kernels and scalar transformations but does not define native parsers or serializers for visual assets, MSSL, MSSLB, MCRT, or renderer documents. Approved adapters perform the semantic mapping into the declared tensor layout. The kernels certify deterministic transfer and device lowering without fabricating unsupported source-language behavior.

## Adapter contract

Before invoking a kernel, an approved local adapter must:

1. Assign a stable visual asset and feature identity.
2. Preserve the source hash, extraction version, coordinate system, units, uncertainty, and provenance.
3. Convert the selected descriptor into the bank's fixed width using its versioned feature dictionary.
4. Place SOPHIA, CHARLOTTE, LANDON, Professor, and Podium evidence in channels 0–4.
5. Reject or explicitly mark non-finite, out-of-range, missing, contradictory, or unsupported fields.
6. Record zero-padding and truncation rules; silent truncation is forbidden.
7. Bind the output artifact to its feature dictionary, adapter hash, kernel hash, R12 record, and MCRT replay ID.

Adapters remain local under `policy no_network` and may not execute unknown kernels, embedded programs, scripts, macros, or model payloads.

## Bank-specific contracts

### 20.1 Mathematical operators

Retain equation family, operands, coefficient order, domain, codomain, units, constraints, tolerance profile, differentiability status, and provenance. Algebraic simplification must preserve declared equivalence and cannot remove domain restrictions or uncertainty.

### 20.2 MSSL operators

Retain MSSL language version, stable statement identity, semantic operator, declared and inferred type, effects, capabilities, dependencies, source span, and semantic hash. An unresolved or unavailable MSSL grammar keeps the descriptor provisional.

### 20.3 MSSLB operators

Retain bundle identity, member order, dependency graph, load order, operator identities, source hashes, semantic hashes, compatibility range, policy decisions, R12 links, and canonical MSSLB tuple. A missing dependency or conflicting identity blocks bundle admission.

### 20.4 MCRT operators

Retain record type, schema version, profile, source hash, AST node, semantic judgment, R12 identity, sequence, causal parents, determinism class, policy status, confidence, certification status, and canonical-record hash. Replay requires identical ordering and tuple identity.

### 20.5 Rendering operators

Retain geometry identity, vertex/face layout, coordinate convention, handedness, camera and projection matrices, depth convention, materials, colorspace, sampling profile, tolerances, device target, and output profile. Rendered similarity cannot replace latent geometry or semantic evidence.

## Operator admission gate

An operator-bank artifact is admitted only when:

- The feature dictionary, adapter, and kernel versions are identified.
- All five role channels retain stable meaning and ordering.
- Shapes, scalar types, bounds, units, and numerical tolerances validate.
- Source and semantic hashes, provenance, policy, and capability paths are present.
- Bounds proof and race analysis pass.
- Device lowering preserves strict precision and reproducible determinism.
- Contradictions and uncertainty remain visible.
- R12 and MCRT identities replay to the same canonical tuple hash.

No pass-through kernel can convert invalid semantic input into a valid operator. CHARLOTTE validation and Podium certification must refer to the exact same input and kernel artifact.

## Validation matrix

| Class | Equation Operator Bank test | Expected result |
| --- | --- | --- |
| Positive | Valid fixed-shape descriptors, complete role channels, checked bounds, and stable receipts | Pass |
| Negative | Wrong shape, invalid operator identity, false race assertion, or incompatible bundle | Expected fail |
| Boundary | Empty descriptor region, maximum bank width, extreme finite value, or exact padding boundary | Pass or explicit boundary diagnostic |
| Integration | One visual feature maps through all five banks without identity or provenance loss | Pass |
| Security | Hidden network, unknown kernel, source substitution, secret leakage, or untrusted payload execution | Deny |
| Performance | Vectorized fixed-shape execution remains within declared device and memory limits | Pass within profile |
| Determinism | Repeated and cross-device test runs preserve declared tolerance and canonical ordering | Pass |
| Interoperability | Version-compatible adapters preserve operator identities and feature dictionaries | Pass |
| Recovery | Interrupted staging resumes without duplicated sequences or reordered rows | Pass or explicit repair requirement |
| Certification | Bounds, race, R12, MCRT, and tuple-hash evidence are replayable | Pass |

## Optimization restrictions

Tiling, vectorization, fusion, device specialization, and memory planning are permitted only within declared numerical tolerance and with semantic equivalence. Optimization must not remove bounds or race checks, reorder role channels, change feature dictionaries, alter strict precision silently, erase policy or capability decisions, or replace stable R12/MCRT identities.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, the operator bank retains latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. A rendered overlap is not proof of latent coupling. The framework is treated as a proposed computational law, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 20 is certifiable only when all five kernels preserve no-network policy, fixed tensor contracts, five-role ordering, strict precision, reproducible determinism, checked bounds, race freedom, provenance, versioned adapter schemas, stable operator identities, and replayable R12/MCRT evidence.
