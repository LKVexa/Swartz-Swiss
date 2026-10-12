# JA21 Suite 33 — Visual Feedback Loop

Six independent JA Training and Evaluation Language experiments that compare generated visual output with admitted targets and produce evidence-backed correction proposals.

## Language profile

- Language: JA Training and Evaluation Language
- Profile: `ja.training`
- Extension: `.jate`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Reproducibility posture: fixed references, splits, preprocessing, optimizer, scheduler, batch rules, seed, checkpoints, metrics, and thresholds

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. These scripts therefore use only demonstrated source forms: experiments, model and dataset references, deterministic splits, normalization, optimizer and scheduler declarations, batch and precision settings, explicit seeds, checkpoints, evaluation metrics, acceptance thresholds, gated registry promotion, reproducibility assertions, and MCRT lineage emission.

## Files

| File | Sub-suite | Evaluation responsibility | Principal evidence |
| --- | --- | --- | --- |
| `33.1_Visual_Feedback_Target_Intake.jate` | Target intake | Validate target schemas, hashes, provenance, and comparison readiness | Admitted target set and lineage |
| `33.2_Visual_Feedback_Visual_Comparison.jate` | Visual comparison | Compare aligned generated and target imagery | Structural, perceptual, and pixel agreement |
| `33.3_Visual_Feedback_Metric_Evaluation.jate` | Metric evaluation | Evaluate geometry, color, layers, and temporal continuity | Component-level metric record |
| `33.4_Visual_Feedback_Error_Localization.jate` | Error localization | Locate mismatches and bind them to evidence | Precision, recall, and evidence coverage |
| `33.5_Visual_Feedback_Correction_Proposals.jate` | Correction proposals | Rank evidence-backed, regression-aware proposed changes | Expected correction gain and safety evidence |
| `33.6_Visual_Feedback_Regression_Verification.jate` | Regression verification | Verify an approved correction against targets and protected baselines | Similarity, safety, and deterministic replay result |

## Analytical ensemble

The composite model references in every script identify the five-part analytical ensemble.

| Participant | Visual Feedback Loop responsibility |
| --- | --- |
| SOPHIA | Interprets target intent, decomposes visual differences, relates errors to scene semantics, and drafts correction hypotheses |
| CHARLOTTE | Validates targets, alignment, metrics, thresholds, causal evidence, proposal safety, protected baselines, policy, and replay invariants |
| LANDON | Stages admitted pairs, performs deterministic preprocessing and evaluation, localizes differences, and assembles proposal evidence |
| Professor | Explains metric meaning, mismatch causes, uncertainty, tradeoffs, limitations, and proposed repair effects |
| Podium | Publishes target admissions, comparisons, metrics, localized evidence, correction proposals, regression results, hashes, and MCRT receipts |

No participant may alter a target silently, omit a failed metric, infer a cause from correlation alone, apply a proposal automatically, or represent an evaluation candidate as a production release.

## Feedback-loop pipeline

```text
generated output + admitted target
  -> canonical alignment
  -> multi-channel visual comparison
  -> component metric evaluation
  -> evidence-bound error localization
  -> ranked correction proposals
  -> separately approved correction
  -> regression verification
  -> Podium evidence publication
```

This suite proposes and evaluates corrections. It does not directly mutate reconstruction code, scene data, model weights, prompts, policies, targets, or release packages.

## Common experiment contract

Every file independently declares:

1. `ja source 0.3`, a stable module, `use Training`, and `policy no_network`.
2. A composite SOPHIA–CHARLOTTE–LANDON–Professor–Podium model reference.
3. A versionable dataset reference with `0.8/0.1/0.1` train, validation, and test splits.
4. Deterministic normalization.
5. A declared AdamW optimizer and cosine scheduler.
6. Bounded batch and accumulation settings.
7. Mixed precision under a fixed runtime profile.
8. A unique fixed seed.
9. Periodic checkpoints.
10. Named evaluation metrics and acceptance thresholds.
11. Registry promotion only when every threshold passes.
12. A reproducibility assertion and named MCRT lineage record.

Registry promotion means that an evaluation result may enter the Visual Feedback evidence registry. It does not authorize training, source modification, deployment, or release.

## Sub-suite contracts

### 33.1 Target intake

- Every target retains stable identity, version, content hash, provenance, license or authority, coordinate frame, color profile, resolution, aspect ratio, frame range, and intended comparison scope.
- Target transformations are declared and hashed; the original target remains immutable.
- Missing provenance, schema mismatch, hash mismatch, unsupported media, invalid dimensions, or ambiguous comparison scope blocks admission.
- The target split prevents the same logical item or derived near-duplicate from leaking across train, validation, and test partitions.

### 33.2 Visual comparison

- Generated and target outputs are aligned only under declared crop, scale, transform, camera, timing, color, and masking rules.
- Structural similarity evaluates organization and local structure.
- Perceptual similarity evaluates feature-space appearance under a versioned evaluator.
- Pixel accuracy evaluates canonical aligned samples without replacing structural or perceptual evidence.
- Misalignment, occlusion, transparency, dynamic range, compression, and masked regions remain explicit evidence rather than hidden preprocessing.

### 33.3 Metric evaluation

- Geometry accuracy covers admitted silhouettes, contours, landmarks, depth, topology, camera, and transforms.
- Color accuracy uses the declared color space, transfer function, tone map, and alpha convention.
- Layer accuracy covers layer identity, order, visibility, blending, materials, and attachment.
- Temporal continuity covers frame identity, transforms, camera motion, deformation, timing, and protected continuity constraints.
- Aggregate scores never erase component failures; a required component below threshold blocks promotion.

### 33.4 Error localization

- Each mismatch is bound to an output identity, target identity, frame, region or layer, metric, measured delta, threshold, and supporting evidence.
- Localization precision limits unsupported blame; localization recall limits missed defects.
- A region may have multiple competing causes, each with confidence and contradictory evidence.
- Missing causal evidence remains `UNRESOLVED`; visual proximity alone is not proof of cause.

### 33.5 Correction proposals

- Every proposal identifies its source output and target hashes, affected scene or code identities, localized evidence, proposed operation, expected metric gain, risk, dependencies, confidence, rollback plan, and protected baselines.
- Corrections are ranked by expected validated gain after complexity, compute, energy, and regression costs.
- A proposal may not weaken security, provenance, deterministic replay, protected geometry, accessibility, license, or policy constraints.
- Promotion places a proposal in the evidence registry; execution requires a separate authorized reconstruction or development workflow.

### 33.6 Regression verification

- Verification compares the approved corrected output with the same target profile and all protected baselines.
- It repeats target similarity, component metrics, error localization, safety, performance, and deterministic replay checks.
- Improvement in one region cannot hide regression elsewhere.
- A failed protected baseline, hash mismatch, nondeterministic replay, or missing evidence rejects the correction and preserves rollback evidence.

## Evidence-backed correction record

Podium should publish each proposal with at least:

| Field | Meaning |
| --- | --- |
| `proposal_id` | Stable correction-proposal identity |
| `generated_output_hash` | Exact evaluated output |
| `target_hash` | Exact admitted target |
| `alignment_profile` | Crop, scale, camera, timing, color, and mask rules |
| `localized_region` | Frame, region, layer, asset, or operator implicated |
| `metric_before` | Measured baseline value |
| `expected_metric_after` | Predicted value with uncertainty |
| `proposed_operation` | Non-executed change description |
| `causal_evidence` | Evidence supporting the proposed relationship |
| `risk_and_dependencies` | Protected constraints and downstream effects |
| `rollback_plan` | Exact state restoration identity |
| `sophia_judgment` | Semantic interpretation and hypothesis |
| `charlotte_validation` | Evidence, policy, and safety decision |
| `landon_status` | Evaluation and staging state |
| `professor_explanation` | Human-readable rationale and limitations |
| `podium_receipt` | Hash- and provenance-bound publication evidence |

## Metric and promotion policy

| Stage | Required thresholds |
| --- | --- |
| Target intake | Schema accuracy `>= 0.99`; provenance coverage `= 1.00`; target hash match `= 1.00` |
| Visual comparison | Structural similarity `>= 0.95`; perceptual similarity `>= 0.90`; pixel accuracy `>= 0.95` |
| Metric evaluation | Geometry and color accuracy `>= 0.95`; layer and temporal accuracy `>= 0.99` |
| Error localization | Precision and recall `>= 0.90`; evidence coverage `>= 0.99` |
| Correction proposals | Expected correction gain `>= 0.90`; regression safety and evidence coverage `>= 0.99` |
| Regression verification | Target similarity `>= 0.95`; regression safety `>= 0.99`; deterministic replay `= 1.00` |

Thresholds are suite defaults and remain part of the versioned evaluation profile. A project may declare stricter thresholds. Any change creates a new profile identity and cannot rewrite prior results.

## Determinism and leakage controls

- Dataset identity, split membership, preprocessing, evaluator versions, metric definitions, seeds, runtime profile, and thresholds are immutable within one experiment identity.
- The same canonical input pair and profile must yield the same metric vector, finding classes, proposal ordering, and MCRT tuple hash.
- Splits are grouped by logical source and derivation family to prevent near-duplicate leakage.
- Target or test evidence cannot be used to tune a proposal and then be represented as untouched evaluation.
- Hardware or mixed-precision variation outside the declared tolerance produces a new runtime profile or an unresolved replay result.
- Filesystem order, worker timing, locale, and wall-clock timestamps do not influence canonical ordering.

## Validation matrix

| Class | Visual Feedback test | Expected result |
| --- | --- | --- |
| Positive | Admitted target, valid alignment, complete metrics, localized evidence, safe proposal, and regression pass | Pass |
| Negative | Target hash mismatch, invalid split, misalignment, failed threshold, unsupported cause, or protected regression | Expected fail |
| Boundary | Empty masks, maximum resolution, deepest layers, longest frame sequence, metric tolerance, and batch limits | Pass or explicit boundary diagnostic |
| Integration | Reconstruction, scene, frame, target, metric, proposal, rollback, and Podium identities remain linked | Pass |
| Security | Hidden network, untrusted metadata execution, target substitution, path escape, secret leakage, or unauthorized correction | Deny |
| Performance | Bounded batches, checkpoints, sparse regions, metric caching, and deterministic comparison remain within budget | Pass within budget |
| Determinism | Shuffled input order and worker timing yield identical metrics, proposals, and replay records | Pass |
| Interoperability | Compatible evaluators preserve alignment, units, color, timing, metric definitions, identities, and provenance | Pass |
| Recovery | Interrupted evaluation resumes from checkpoints without duplicate records or split leakage | Pass or explicit repair requirement |
| Certification | R12/MCRT replay reproduces exact target, output, findings, proposal order, policy, relation class, and interaction order | Pass |

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is evaluated, the loop preserves fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, provenance, projection version, tolerance profile, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Targets, comparisons, metrics, localized errors, correction proposals, regression results, and Podium receipts retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, phase/support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result. If `g5 > tol5` while `g3 <= tol3`, the result remains `PROJECTION_ONLY`; visual similarity cannot establish latent coupling.

R12 replay requires an independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, wrapped phase difference at most `1e-6` radians, and identical relation class, tuple hash, and interaction order.

Smithson 8S is treated as a proposed analytical framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 33 is certifiable only when all six experiments preserve fixed references, splits, preprocessing, seeds, checkpoints, metric definitions, thresholds, hashes, provenance, and reproducibility; target and test leakage are absent; correction proposals remain non-executing and evidence-backed; protected regressions block promotion; hidden network and unknown-code execution are absent; and R12/MCRT replay preserves exact policy, result, relation class, tuple hash, interaction order, and Podium receipt target.
