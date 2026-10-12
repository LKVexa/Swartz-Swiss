# JA21 Suite 37 — Training Suite

Four independent JA Training and Evaluation Language experiments for visual training examples, evaluation fixtures, feedback records, and evidence-gated learning promotion.

## Language profile

- Language: JA Training and Evaluation Language
- Profile: `ja.training`
- Extension: `.jate`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Training posture: deterministic, split-safe, evidence-bound, checkpointed, regression-tested, and promotion-gated

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. These scripts therefore stay within the demonstrated experiment form: model and dataset references, deterministic dataset splits, normalization, optimizer and scheduler declarations, batch and precision settings, fixed seeds, checkpoints, evaluation metrics, threshold gates, registry promotion, reproducibility assertions, and MCRT lineage output.

## Files

| File | Sub-suite | Responsibility | Primary output |
| --- | --- | --- | --- |
| `37.1_Training_Suite_Visual_Training_Examples.jate` | Visual training examples | Curates admissible visual examples with evidence, annotations, provenance, and leakage-safe split identity | Validated visual example set |
| `37.2_Training_Suite_Evaluation_Fixtures.jate` | Evaluation fixtures | Freezes repeatable cases, expected outcomes, edge cases, and protected baselines | Versioned evaluation fixture set |
| `37.3_Training_Suite_Feedback_Records.jate` | Feedback records | Normalizes reviewer and system feedback into traceable, conflict-resolved learning evidence | Validated feedback ledger |
| `37.4_Training_Suite_Learning_Promotion.jate` | Learning promotion | Compares a candidate with its protected baseline and promotes it only after held-out, regression, reproducibility, and provenance gates pass | Promotion or rejection receipt |

## Training lifecycle

```text
Source evidence
  -> visual training example
  -> immutable evaluation fixture
  -> normalized feedback record
  -> candidate learning change
  -> held-out and regression evaluation
  -> promote, reject, or rollback
  -> Podium lineage receipt
```

Each transition requires stable identities and hashes. Training examples do not become evaluation fixtures implicitly, feedback does not authorize promotion by itself, and a candidate may not inspect or alter held-out outcomes.

## Analytical ensemble

The composite model reference in every script identifies the five-part analytical ensemble.

| Participant | Training Suite responsibility |
| --- | --- |
| SOPHIA | Interprets visual examples, derives candidate labels and learning hypotheses, clusters feedback, and explains expected gains |
| CHARLOTTE | Validates evidence, annotation quality, dataset boundaries, fixture oracles, protected baselines, conflicts, thresholds, safety, and promotion eligibility |
| LANDON | Stages datasets, freezes split membership, coordinates deterministic runs, manages checkpoints, compares candidates, and restores rejected states |
| Professor | Explains examples, fixture intent, feedback conflicts, learning rationale, limitations, metric changes, and promotion or rejection reasons |
| Podium | Publishes dataset, fixture, feedback, checkpoint, evaluation, decision, R12/MCRT, hash, provenance, and rollback receipts |

No participant may fabricate a label, move a record between splits after evaluation, inspect hidden test outcomes during training, suppress negative feedback, weaken a gate, or promote an unverified candidate.

## Common experiment contract

Every file independently declares:

1. `ja source 0.3`, a stable module name, `use Training`, and `policy no_network`.
2. A composite SOPHIA–CHARLOTTE–LANDON–Professor–Podium model reference.
3. A versioned dataset reference with fixed `0.8/0.1/0.1` train, validation, and test splits.
4. Deterministic normalization.
5. AdamW optimization at a declared learning rate and a cosine scheduler.
6. Bounded batch and gradient-accumulation settings.
7. Mixed precision under a fixed runtime profile.
8. A unique fixed seed.
9. Periodic checkpoints.
10. Named metrics and explicit acceptance thresholds.
11. Registry promotion only when every threshold passes.
12. A reproducibility assertion and named MCRT lineage record.

Registry promotion admits a validated dataset, fixture, feedback profile, or learning candidate to the Training registry. It does not silently replace a production model, deploy a release, mutate source evidence, or discard a protected baseline.

## Canonical record identities

### Visual training example

| Field | Contract |
| --- | --- |
| `example_id` | Stable identifier for exactly one example |
| `source_asset_hash` | Hash of the immutable source image, frame, scene, or UI state |
| `observation_scope` | Exact region, frame, layer, component, state, or interaction in scope |
| `task_type` | Versioned training task and label vocabulary |
| `annotation` | Structured target value with units or controlled class identity |
| `annotation_evidence` | Evidence that supports the annotation |
| `annotator_receipts` | Human or system reviewer identities and decisions |
| `uncertainty` | Explicit uncertainty or unresolved status |
| `rights_policy` | Admissibility, privacy, retention, and usage restrictions |
| `split_id` | Immutable train, validation, or test membership |
| `provenance_hash` | Hash binding the record to source, transformation, and policy history |

### Evaluation fixture

| Field | Contract |
| --- | --- |
| `fixture_id` | Stable identifier for one evaluation case |
| `fixture_version` | Immutable version of inputs, oracle, tolerances, and baselines |
| `input_hashes` | Exact input assets and state |
| `oracle` | Expected class, measurement, state, trace, or bounded range |
| `tolerance_profile` | Units, numerical tolerance, alignment rules, and uncertainty handling |
| `edge_case_tags` | Declared rare, adversarial, failure, or boundary conditions |
| `protected_baselines` | Safety, accessibility, geometry, behavior, performance, and policy invariants |
| `execution_profile` | Runtime, seed, model, adapter, and resource identity |
| `expected_receipts` | Required metrics, evidence, hashes, and lineage records |

### Feedback record

| Field | Contract |
| --- | --- |
| `feedback_id` | Stable identifier for one feedback assertion |
| `subject_id` | Exact example, fixture, model output, correction pass, or candidate |
| `reviewer_id` | Accountable human or system source |
| `feedback_kind` | Confirm, reject, correct, qualify, conflict, regress, or abstain |
| `claim` | Structured observation or proposed correction |
| `evidence_refs` | Exact supporting artifacts and measurements |
| `confidence` | Calibrated confidence and uncertainty |
| `conflict_set` | Related feedback records that disagree |
| `resolution` | Accepted, rejected, unresolved, or superseded with rationale |
| `policy_receipt` | Privacy, safety, rights, and retention decision |
| `lineage_hash` | Hash binding original and resolved record states |

### Learning promotion candidate

| Field | Contract |
| --- | --- |
| `candidate_id` | Stable identity for one proposed learning change |
| `baseline_id` | Exact protected baseline being challenged |
| `training_snapshot_hash` | Immutable dataset, preprocessing, seed, and configuration snapshot |
| `change_scope` | Exact weights, rules, adapters, thresholds, or registry entries affected |
| `expected_gain` | Predeclared held-out metric and minimum improvement |
| `evaluation_fixture_set` | Frozen fixture identities used for qualification |
| `regression_suite` | Protected safety, performance, accessibility, and policy checks |
| `checkpoint_id` | Restorable pre-promotion state |
| `decision` | Promote, reject, quarantine, or rollback |
| `decision_evidence` | Complete metrics, receipts, limitations, and reviewer outcomes |

## Sub-suite contracts

### 37.1 Visual training examples

- Accepts only evidence-backed examples with immutable source hashes and declared rights policy.
- Binds labels to the smallest supported visual region, temporal interval, component, state, or interaction.
- Preserves negative, ambiguous, abstained, and boundary examples rather than forcing a positive label.
- Freezes split membership before any fitting or hyperparameter selection.
- Groups near-duplicates, related frames, derived crops, and augmented variants within one split to prevent family leakage.
- Quarantines missing-source, contradictory, policy-blocked, or insufficient-evidence records.

### 37.2 Evaluation fixtures

- Converts selected examples into immutable evaluation contracts; it does not inherit training labels without independent review.
- Freezes exact inputs, expected outcomes, tolerances, execution profiles, and protected baselines.
- Covers nominal, boundary, rare, adversarial, malformed, and previously failed cases.
- Separates validation fixtures used for iteration from hidden test fixtures used for final qualification.
- Treats oracle ambiguity as unresolved and blocks fixture promotion until the ambiguity is bounded or corrected.
- Requires deterministic replay before a fixture can become a promotion gate.

### 37.3 Feedback records

- Captures positive, negative, corrective, conflicting, and abstention feedback without deleting dissenting evidence.
- Requires exact subject, reviewer, evidence, confidence, policy, and lineage identities.
- Resolves conflicts through evidence strength, scope match, fixture authority, temporal validity, and reviewer accountability.
- Keeps unresolved conflicts out of supervised targets and automatic promotion decisions.
- Separates observed defects from causal claims and separates correction proposals from executed changes.
- Publishes both original feedback and resolution history through Podium.

### 37.4 Learning promotion

- Qualifies one candidate against one immutable protected baseline at a time.
- Requires a predeclared gain metric, minimum gain, fixture set, regression suite, resource profile, and rollback checkpoint.
- Trains only on the training split, selects only on validation evidence, and evaluates final eligibility on an untouched test split.
- Requires reproducible reruns before promotion and treats material variance as a failed gate.
- Rejects a candidate when any protected baseline regresses, even if the aggregate score improves.
- Promotes only the exact candidate hash that was evaluated; any post-evaluation change creates a new candidate.
- Retains rejected and rolled-back evidence so future candidates do not repeat known failures.

## Dataset and leakage controls

1. Hash all source and derived artifacts before split assignment.
2. Group semantic or transformational relatives before partitioning.
3. Freeze split membership and record the partition algorithm and seed.
4. Fit normalization and preprocessing state on training data only.
5. Prohibit model selection against the test split.
6. Keep hidden fixture outcomes inaccessible to training and candidate generation.
7. Record every augmentation and preserve its parent example identity.
8. Reject cross-split duplicates, derived variants, temporal neighbors, and identity-linked records.
9. Version every correction; never overwrite the evidence used by an earlier decision.

## Promotion state machine

| State | Entry condition | Permitted next states |
| --- | --- | --- |
| `DRAFT` | Candidate and evidence envelope created | `VALIDATED`, `REJECTED` |
| `VALIDATED` | Schema, policy, provenance, and split checks pass | `EVALUATING`, `REJECTED` |
| `EVALUATING` | Baseline and candidate execute on frozen fixtures | `QUALIFIED`, `REJECTED`, `QUARANTINED` |
| `QUALIFIED` | Every declared metric and protected baseline gate passes | `PROMOTED`, `QUARANTINED` |
| `PROMOTED` | Exact evaluated candidate admitted with a decision receipt | `ROLLED_BACK`, `SUPERSEDED` |
| `REJECTED` | Any mandatory gate fails | `DRAFT` only under a new candidate identity |
| `QUARANTINED` | Evidence, variance, security, or policy remains unresolved | `EVALUATING`, `REJECTED` |
| `ROLLED_BACK` | Post-promotion monitoring triggers exact restoration | `DRAFT` only under a new candidate identity |
| `SUPERSEDED` | A later qualified candidate replaces the promoted version | Terminal for the old candidate |

Podium publishes state transitions and evidence but does not waive a gate. Professor explains the decision but does not substitute explanation for measured evidence.

## Acceptance thresholds

| Script | Required metric | Threshold |
| --- | --- | ---: |
| 37.1 | Example schema validity | `>= 0.99` |
| 37.1 | Annotation evidence coverage | `>= 0.99` |
| 37.1 | Split leakage safety | `>= 1.00` |
| 37.1 | Provenance completeness | `>= 0.99` |
| 37.2 | Fixture reproducibility | `>= 0.99` |
| 37.2 | Oracle agreement | `>= 0.97` |
| 37.2 | Edge-case coverage | `>= 0.95` |
| 37.2 | Protected-baseline coverage | `>= 0.99` |
| 37.3 | Feedback traceability | `>= 0.99` |
| 37.3 | Correction evidence quality | `>= 0.97` |
| 37.3 | Conflict-resolution consistency | `>= 0.98` |
| 37.3 | Reviewer agreement | `>= 0.95` |
| 37.4 | Held-out candidate gain | `>= 0.02` |
| 37.4 | Regression safety | `>= 0.99` |
| 37.4 | Promotion reproducibility | `>= 0.99` |
| 37.4 | Provenance completeness | `>= 1.00` |

These are provisional suite defaults. A project may declare stricter thresholds before evaluation. It may not lower a threshold after observing candidate results without creating a new evaluation profile and decision record.

## Determinism and rollback

- Seeds `3701` through `3704` are unique and fixed by sub-suite.
- Dataset, model, preprocessing, optimizer, scheduler, precision, runtime, and fixture identities are versioned.
- Checkpoints are emitted before consequential registry state changes.
- Metric aggregation order, tie-breaking, missing-value handling, and tolerance logic are fixed by the evaluation profile.
- A replay must use the same candidate, baseline, data snapshot, fixture set, seed, and runtime profile.
- A failed or rolled-back candidate retains its metrics and lineage record.
- Rollback restores the exact prior registry identity; it does not approximate or retrain the prior state.

## Smithson 8S and R12 preservation

Where the source records carry Smithson 8S Coupled Mechanics metadata:

- SOPHIA may propose an elucidation coordinate only with a declared independent semantic or mechanical meaning.
- CHARLOTTE must retain the independence test, held-out efficacy test, tolerance band, and explicit uncertainty.
- LANDON must preserve latent and projected geometry separately and keep coupling support sparse and reproducible.
- Professor must describe the framework as proposed rather than as an established physical law.
- Podium must publish the 8S, R12, threshold, evidence, and lineage receipts without upgrading an indeterminate result.

No training outcome is evidence of physical quantum entanglement, and no projected visual overlap is treated as proof of latent contact.

## Validation matrix

| Validation area | Required evidence |
| --- | --- |
| Syntax profile | Source level, module, Training import, experiment, policy, and emit declarations |
| Dataset identity | Dataset version, artifact hashes, split identity, and leakage report |
| Training determinism | Model, preprocessing, optimizer, scheduler, batch, precision, seed, runtime, and checkpoint |
| Example quality | Schema, annotations, source evidence, uncertainty, rights policy, and provenance |
| Fixture quality | Oracle, tolerances, edge cases, protected baselines, and deterministic replay |
| Feedback quality | Subject, reviewer, evidence, confidence, conflict set, resolution, and policy |
| Promotion safety | Baseline comparison, held-out gain, regression suite, reproducibility, provenance, and rollback |
| Publication | Podium decision, metric, checkpoint, hash, R12/MCRT, provenance, and final-state receipts |

## Final acceptance gate

A Training Suite artifact is admissible only when:

- its syntax matches the demonstrated JA Training experiment profile;
- every referenced input and output has stable identity and provenance;
- dataset split and leakage checks pass;
- all mandatory metrics meet their predeclared thresholds;
- protected baselines show no disallowed regression;
- deterministic replay reproduces the decision;
- policy, rights, privacy, and safety checks pass;
- rollback remains available for a promoted candidate; and
- Podium can bind the decision to the exact evidence and MCRT lineage.

Any unmet requirement produces rejection or quarantine, never silent promotion.
