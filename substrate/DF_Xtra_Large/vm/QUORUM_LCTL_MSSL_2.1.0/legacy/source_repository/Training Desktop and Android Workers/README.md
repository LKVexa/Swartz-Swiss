# JA21 Suite 64 — Training Desktop and Android Workers

Four independent JA Training and Evaluation Language experiments for the Training Worker, Desktop Module, Android Module, and Knowledge Repository.

## Language profile

- Language: JA Training and Evaluation Language
- Profile: `ja.training`
- Extension: `.jate`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Training posture: deterministic, split-safe, evidence-bound, checkpointed, platform-aware, and promotion-gated
- Corpus SHA-256: `bf3666fba75cdb5b7f89be76eef90a12c8b06fd50bd85244f3745fc3c1695b3a`

The attached corpus contains 10,000 generated specification-model records and explicitly reports `provisional-generated-not-production-compiler-validated`. These files therefore stay within the demonstrated experiment form: model and dataset references, fixed dataset splits, normalization, AdamW and cosine declarations, bounded batching, mixed precision, fixed seeds, checkpoints, evaluation metrics, threshold gates, registry promotion, reproducibility assertions, and MCRT lineage output.

The scripts are specification-level JA21 artifacts. Production compiler acceptance, runtime behavior, platform integration, model quality, and security certification still require validation in the target JA toolchain.

## Files

| File | Sub-suite | Responsibility | Primary result |
| --- | --- | --- | --- |
| `64.1_Training_Worker.jate` | Training Worker | Runs only admitted training or evaluation work with frozen inputs, deterministic configuration, bounded resources, checkpoints, and complete result evidence | Reproducible worker result and lineage receipt |
| `64.2_Desktop_Module.jate` | Desktop Module | Qualifies desktop-specific fixtures across supported operating, input, display, accessibility, offline, and resource profiles | Versioned desktop evaluation result |
| `64.3_Android_Module.jate` | Android Module | Qualifies Android-specific fixtures across API, ABI, lifecycle, input, permission, accessibility, offline, and device-resource profiles | Versioned Android evaluation result |
| `64.4_Knowledge_Repository.jate` | Knowledge Repository | Governs datasets, fixtures, feedback, checkpoints, evaluation results, promotion decisions, and provenance as immutable versioned records | Validated knowledge snapshot and MCRT lineage |

## Analytical ensemble

Every script uses the composite SOPHIA–CHARLOTTE–LANDON–Professor–Podium model reference.

| Participant | Suite 64 responsibility |
| --- | --- |
| SOPHIA | Interprets training intent, identifies applicable evidence, proposes labels or learning hypotheses, compares desktop and Android observations, and states uncertainty |
| CHARLOTTE | Validates dataset admission, licensing, privacy, split integrity, fixture authority, platform compatibility, metric gates, safety, and promotion eligibility |
| LANDON | Executes approved worker plans, freezes configuration and seeds, stages bounded platform fixtures, manages checkpoints, captures results, and restores failed states |
| Professor | Explains dataset purpose, platform assumptions, evaluation criteria, failures, metric changes, limitations, and promotion or rejection rationale |
| Podium | Publishes manifests, hashes, split identities, checkpoints, metrics, platform evidence, decisions, R12/MCRT lineage, retention events, and rollback receipts |

No participant may fabricate evidence, infer consent, move a record between splits after evaluation starts, reveal hidden-test outcomes to training, weaken a threshold, bypass a platform permission, suppress a negative result, or promote an unverified artifact.

## Common experiment contract

Each file independently declares:

1. `ja source 0.3`, a stable module name, `use Training`, and `policy no_network`.
2. A sub-suite-specific SOPHIA–CHARLOTTE–LANDON–Professor–Podium model reference.
3. A versioned dataset reference with fixed `0.8/0.1/0.1` train, validation, and test splits.
4. Deterministic preprocessing.
5. AdamW optimization and a cosine scheduler.
6. Bounded batch and gradient-accumulation settings.
7. Mixed precision under a recorded execution profile.
8. A unique fixed seed.
9. Periodic checkpoints.
10. Named quality, safety, and provenance metrics with explicit thresholds.
11. Registry promotion only after every threshold passes.
12. A reproducibility assertion and a named MCRT lineage result.

Registry promotion in these scripts means admission of the exact validated worker result, platform fixture profile, or knowledge snapshot to its governed registry. It does not deploy a production model, alter a release, approve unrestricted execution, or erase the protected baseline. Production promotion remains a separate approval-bearing action.

## Governed lifecycle

```text
Source evidence
  -> policy and rights screening
  -> immutable admission candidate
  -> duplicate and contamination analysis
  -> frozen split and fixture identities
  -> approved Training Worker plan
  -> deterministic desktop and/or Android execution
  -> metrics, checkpoints, logs, and artifacts
  -> independent threshold and regression validation
  -> Knowledge Repository snapshot
  -> promote, reject, quarantine, or roll back
  -> Podium MCRT lineage receipt
```

Raw telemetry, logs, crash reports, user interactions, repository content, and platform traces do not become training data automatically. They remain operational evidence until explicit collection authority, consent or lawful basis, redaction, minimization, rights, retention, purpose, and admission checks pass.

## Canonical identities

### Training work order

| Field | Contract |
| --- | --- |
| `training_job_id` | Stable identity for one bounded worker attempt |
| `request_hash` | Hash of the approved task and parameters |
| `capability_manifest` | Exact data, compute, accelerator, storage, and artifact rights |
| `dataset_snapshot_hash` | Immutable admitted dataset and split membership |
| `fixture_snapshot_hash` | Exact evaluation fixtures and protected baselines |
| `model_baseline_hash` | Restorable model or rule baseline |
| `configuration_hash` | Preprocessing, optimizer, scheduler, batch, precision, and seed |
| `platform_scope` | Worker, desktop, Android, or declared cross-platform scope |
| `resource_envelope` | CPU, GPU/NPU, memory, storage, time, thermal, and energy limits |
| `checkpoint_policy` | Interval, retention, validation, and restore behavior |
| `approval_receipt` | Human or policy approval for the exact work order |

### Platform fixture

| Field | Contract |
| --- | --- |
| `fixture_id` | Stable identity for one platform behavior case |
| `platform_profile_id` | Exact desktop or Android execution profile |
| `input_hashes` | Immutable application, model, assets, state, and event sequence |
| `oracle` | Expected output, state transition, trace, or bounded measurement |
| `tolerance_profile` | Units, tolerances, rendering rules, timing bounds, and uncertainty handling |
| `accessibility_contract` | Required keyboard, touch, focus, semantic, contrast, scale, and assistive behavior |
| `offline_contract` | Permitted local resources and proof of no hidden network dependency |
| `resource_contract` | Maximum memory, storage, latency, energy, and thermal behavior |
| `evidence_requirements` | Logs, frames, traces, hashes, metrics, and reviewer receipts |
| `fixture_version_hash` | Hash binding inputs, oracle, profile, and policy |

### Knowledge record

| Field | Contract |
| --- | --- |
| `knowledge_record_id` | Stable identity for one versioned claim or artifact |
| `record_kind` | Dataset, fixture, feedback, checkpoint, metric, decision, limitation, or rollback |
| `subject_hash` | Exact artifact, platform run, model, or decision described |
| `evidence_refs` | Immutable supporting records and content hashes |
| `claim` | Structured assertion with bounded scope |
| `confidence` | Calibrated confidence and explicit uncertainty |
| `policy_receipt` | Rights, privacy, consent, retention, access, and purpose decision |
| `validity_window` | Creation, review, expiry, and supersession information |
| `causal_parents` | Records from which the current record was derived |
| `lineage_hash` | Hash binding identity, content, evidence, policy, and history |

## 64.1 Training Worker

The Training Worker is an execution component, not an authority to select arbitrary data or promote a model.

- Accepts only approved work orders with resolvable dataset, fixture, baseline, configuration, policy, and platform hashes.
- Revalidates inputs immediately before execution; a hash change creates a new work order.
- Uses fixed splits and seeds, declared preprocessing state, bounded batch settings, and recorded software and hardware provenance.
- Keeps training, validation, and hidden-test access paths separate.
- Writes only to the declared checkpoint, result, log, and artifact namespaces.
- Captures stdout, stderr, exit status, resource usage, checkpoint hashes, metric values, and termination reason.
- Stops safely on policy denial, exhausted resources, invalid values, divergence, checkpoint corruption, cancellation, or lost platform identity.
- Makes retries explicit. A retry receives a new attempt identity and retains causal linkage to the failed attempt.
- Produces candidates and evidence; it cannot authorize production release.

### Worker terminal states

| State | Meaning |
| --- | --- |
| `SUCCEEDED` | Execution completed and all expected artifacts are present; qualification is still separate |
| `FAILED` | Execution ended with a deterministic or runtime failure |
| `CANCELLED` | An authorized cancellation reached a safe boundary |
| `QUARANTINED` | Evidence, policy, contamination, safety, or integrity is unresolved |
| `REJECTED` | A mandatory admission or evaluation gate failed |
| `QUALIFIED` | Independent validation confirms every declared threshold |

## 64.2 Desktop Module

The Desktop Module owns desktop fixture preparation and evaluation evidence. It does not silently generalize desktop observations to Android.

The declared platform matrix should include, where supported:

- Operating-system family, version, edition, architecture, locale, and patch identity.
- Runtime, driver, GPU/NPU, display scale, color profile, monitor topology, and window-manager identity.
- Keyboard, pointer, wheel, pen, focus, drag, clipboard, file picker, and shortcut behavior.
- Window creation, resize, minimize, restore, suspend, resume, shutdown, and crash recovery.
- Installer, upgrade, rollback, local service, local model-provider, filesystem, and repository integration.
- Screen reader, keyboard-only navigation, focus visibility, contrast, reduced motion, scaling, and localization.
- Offline startup, local resource discovery, no-network operation, and deterministic recovery.
- Large-file, repository-scale, CPU, accelerator, memory, storage, latency, and thermal boundaries.

Desktop evidence must preserve exact screen state, input sequence, application build, platform profile, fixture version, expected result, actual result, tolerances, resource measurements, and artifact hashes. Screenshots or screen recordings may support a result but cannot replace structured state and execution evidence.

## 64.3 Android Module

The Android Module owns Android fixture preparation and evaluation evidence. Device- or emulator-specific evidence is never represented as universal without matrix coverage.

The declared Android matrix should include, where supported:

- Android API level, security patch, device or emulator identity, form factor, OEM profile, and ABI.
- Runtime, graphics backend, accelerator delegate, density, font scale, orientation, refresh rate, and color mode.
- Activity and process creation, foreground/background transitions, pause, resume, recreation, process death, and saved-state restoration.
- Touch, multi-touch, gesture, back navigation, keyboard, focus, window insets, rotation, and configuration changes.
- Runtime permissions, scoped storage, content providers, local files, secrets, and denied-permission behavior.
- TalkBack semantics, traversal order, touch target size, contrast, text scaling, captions, and reduced motion.
- Airplane/offline operation, local model/resource discovery, retry behavior, and proof of no hidden network dependency.
- CPU, GPU/NPU, memory pressure, storage pressure, battery, thermal throttling, latency, and background limits.

Android fixtures must distinguish emulator evidence from physical-device evidence and record whether a metric is functional, visual, accessibility, performance, power, or policy related. A fixture that depends on unavailable hardware is unresolved or skipped with reason; it is not counted as passed.

## 64.4 Knowledge Repository

The Knowledge Repository is the authoritative governed store for Suite 64 records. Agent memory may help locate or interpret records but cannot override repository evidence.

- Stores content-addressed datasets, split manifests, fixtures, labels, feedback, checkpoints, metric reports, platform profiles, decisions, limitations, and rollback records.
- Preserves the original record and every subsequent correction; it does not rewrite earlier decision evidence.
- Separates operational logs from admitted learning records.
- Enforces least-privilege read, write, promotion, retention, and deletion capabilities.
- Prevents training-time access to hidden-test labels and outcome summaries.
- Records consent withdrawal, legal hold, deletion, expiry, supersession, and access review as explicit events.
- Links every promoted item to its source, transformation, reviewer, policy, run, metric, and decision history.
- Marks conflicting or insufficient evidence as unresolved and excludes it from automatic training targets.
- Requires the exact promoted content hash to match the qualified content hash.

### Repository namespaces

| Namespace | Contents | Mutation rule |
| --- | --- | --- |
| `source/` | Immutable source evidence and admissibility receipts | Append-only; corrections create new versions |
| `datasets/` | Admitted records, group identities, and frozen split manifests | Split membership immutable per snapshot |
| `fixtures/` | Versioned desktop, Android, cross-platform, and protected regression cases | Oracle changes create a new fixture version |
| `runs/` | Worker plans, attempts, logs, metrics, resource evidence, and artifacts | Append-only attempt history |
| `checkpoints/` | Restorable baseline and candidate states | Content-addressed with verified restore evidence |
| `feedback/` | Reviewer feedback, conflict sets, resolutions, and abstentions | Original feedback retained |
| `decisions/` | Promotion, rejection, quarantine, supersession, and rollback receipts | Signed or approval-bound and append-only |
| `lineage/` | R12, MCRT, causal parents, hashes, and replay identifiers | Immutable per record |

## Dataset admission and split safety

1. Verify source identity, collection authority, purpose, rights, privacy, consent, retention, and deletion obligations.
2. Redact secrets and minimize personal or irrelevant data before admission.
3. Hash originals and derived artifacts; retain parent-child transformation lineage.
4. Detect exact, perceptual, semantic, temporal, identity-linked, and augmentation-related duplicates.
5. Group related records before partitioning so a family cannot cross train, validation, or test boundaries.
6. Freeze split membership and record the partition algorithm and seed.
7. Fit normalization and preprocessing state on the training split only.
8. Keep validation evidence for selection separate from hidden-test evidence for final qualification.
9. Block feedback, repository text, UI content, and model output from becoming ground truth without evidence review.
10. Re-run contamination analysis when any source, grouping rule, fixture, or baseline changes.

## Cross-platform comparison

Desktop and Android results may be synthesized only when:

- The user-visible or model behavior being compared has the same declared semantic contract.
- Platform-specific input, lifecycle, permission, accessibility, rendering, and resource differences are preserved.
- Fixture versions identify equivalent inputs and bounded tolerances.
- Unsupported or unavailable cases remain visible rather than being removed from the denominator.
- Aggregate scores preserve platform-level failures and do not allow success on one platform to hide regression on the other.

When platform expectations conflict, the platform-specific contract controls. Professor explains the difference, CHARLOTTE validates its legitimacy, SOPHIA may propose a shared abstraction, LANDON executes distinct fixtures, and Podium records both results and their synthesis rule.

## Promotion state machine

| State | Entry condition | Permitted next states |
| --- | --- | --- |
| `DRAFT` | Candidate record and intended scope created | `ADMISSION_REVIEW`, `REJECTED` |
| `ADMISSION_REVIEW` | Rights, privacy, policy, schema, and provenance under review | `ADMITTED`, `QUARANTINED`, `REJECTED` |
| `ADMITTED` | Mandatory admission checks pass and split identity is frozen | `RUNNING`, `REJECTED` |
| `RUNNING` | Approved worker executes within its resource envelope | `EVALUATING`, `FAILED`, `CANCELLED`, `QUARANTINED` |
| `EVALUATING` | Candidate and baseline are compared on frozen fixtures | `QUALIFIED`, `REJECTED`, `QUARANTINED` |
| `QUALIFIED` | Every declared metric, safety, regression, and provenance gate passes | `PROMOTED`, `QUARANTINED` |
| `PROMOTED` | Exact qualified hash admitted with approval and lineage receipts | `ROLLED_BACK`, `SUPERSEDED` |
| `FAILED` | Worker execution did not complete successfully | `RUNNING` only as a new attempt |
| `CANCELLED` | Authorized cancellation completed | `RUNNING` only as a new attempt |
| `QUARANTINED` | Evidence, contamination, integrity, policy, or platform support is unresolved | `ADMISSION_REVIEW`, `EVALUATING`, `REJECTED` |
| `REJECTED` | Any mandatory gate fails | `DRAFT` only under a new candidate identity |
| `ROLLED_BACK` | Exact protected checkpoint restored after a regression or policy trigger | `DRAFT` only under a new candidate identity |
| `SUPERSEDED` | A later qualified version replaces the old record | Terminal for the old version |

## Acceptance thresholds

| Script | Required metric | Threshold |
| --- | --- | ---: |
| 64.1 | Training admission integrity | `>= 0.99` |
| 64.1 | Deterministic worker replay | `>= 0.99` |
| 64.1 | Held-out evaluation integrity | `>= 1.00` |
| 64.1 | Artifact provenance completeness | `>= 1.00` |
| 64.2 | Desktop fixture coverage | `>= 0.98` |
| 64.2 | Desktop behavior consistency | `>= 0.99` |
| 64.2 | Desktop offline safety | `>= 1.00` |
| 64.2 | Desktop provenance completeness | `>= 1.00` |
| 64.3 | Android platform-matrix coverage | `>= 0.97` |
| 64.3 | Android lifecycle and input consistency | `>= 0.99` |
| 64.3 | Android permission and offline safety | `>= 1.00` |
| 64.3 | Android provenance completeness | `>= 1.00` |
| 64.4 | Knowledge-record schema validity | `>= 0.99` |
| 64.4 | Knowledge lineage completeness | `>= 1.00` |
| 64.4 | Knowledge split confidentiality | `>= 1.00` |
| 64.4 | Knowledge retention-policy compliance | `>= 1.00` |

`loss` is recorded for diagnosis and comparison but is not sufficient for acceptance by itself. Missing, non-finite, stale, or untraceable metric values fail the associated gate.

## Failure, retry, and rollback rules

- Preserve partial logs, checkpoints, metric state, resource evidence, and the exact failure boundary.
- Distinguish invalid input, policy denial, infrastructure failure, resource exhaustion, model divergence, platform incompatibility, and assertion failure.
- Do not retry deterministic input or policy failures unchanged.
- Revalidate dataset, fixture, baseline, configuration, software, hardware, and platform hashes before every retry.
- Never overwrite a failed attempt or reuse its terminal receipt.
- Validate a checkpoint before resume and compare the resumed trajectory against the declared reproducibility tolerance.
- Roll back only to a verified protected checkpoint and publish the trigger, restored hash, affected records, and post-restore validation.

## Evaluation and review gates

A candidate is eligible for registry promotion only when:

1. Every input and output has stable identity, hash, provenance, and policy status.
2. Rights, consent, privacy, retention, deletion, and purpose restrictions are satisfied.
3. Split and hidden-test confidentiality checks pass.
4. Training and evaluation use the frozen configuration, seed, dataset, fixtures, baseline, and platform profile.
5. Desktop or Android coverage meets the declared matrix threshold.
6. Every mandatory quality, accessibility, safety, offline, permission, and provenance metric passes.
7. No protected regression is hidden by an aggregate score.
8. Repeated execution stays within declared determinism or variance bounds.
9. The exact qualified artifact hash is the artifact proposed for promotion.
10. Podium can emit a complete MCRT lineage record and a restorable rollback reference.

## Optimization restrictions

Permitted optimization includes bounded batching, sparse retrieval, cached immutable preprocessing state, content-addressed deduplication, platform-matrix sharding, incremental evaluation of unaffected fixtures, checkpoint compaction, and parallel execution of independent jobs.

Optimization must not:

- Alter split membership, fixture oracles, thresholds, seeds, or protected baselines.
- Drop hard, negative, minority, accessibility, low-resource, or unsupported-platform cases to improve aggregate scores.
- Merge desktop and Android evidence without preserving platform identity.
- Reveal hidden-test results to training or candidate generation.
- Convert raw telemetry or model-generated content into labels without explicit admission.
- Remove capability, policy, provenance, retention, deletion, or approval checks.
- Change a promoted artifact after qualification.
- Remove negative results, unresolved conflicts, limitations, or rollback evidence.

## Smithson 8S and R12 preservation

The corpus carries Smithson 8S Coupled Mechanics and R12/MCRT annotations. Suite 64 treats them as declared corpus mechanics, not as independently established physical law.

If a training or evaluation record invokes those mechanics, it must preserve:

- The declared fifth-coordinate meaning and its nonredundancy evidence.
- Independent latent, product-state, projected, and semantic relation channels.
- Tolerance-band uncertainty and the distinction between projection-only and latent coupling.
- The interaction order that changes a result.
- Model, dataset, projection, threshold, software, hardware, platform, and replay identities.
- Held-out comparison between the declared models and the cost-benefit evidence required by the corpus admission gate.

No optimizer, worker, platform adapter, repository compaction, or promotion step may fold away contradiction, uncertainty, provenance, projection identity, or interaction order.

## Acceptance checklist

- [ ] Exactly one independent `.jate` file exists for each of the four requested sub-suites.
- [ ] Every script declares the JA Training profile form and `policy no_network`.
- [ ] Every script references SOPHIA, CHARLOTTE, LANDON, Professor, and Podium.
- [ ] Every script uses an immutable dataset reference and fixed split.
- [ ] Seeds, batch rules, precision, checkpoints, metrics, thresholds, and lineage outputs are explicit.
- [ ] Worker authority, data admission, execution authority, evaluation, registry promotion, and production release remain separate.
- [ ] Desktop and Android profiles, fixtures, results, and limitations remain distinguishable.
- [ ] Raw telemetry and operational logs cannot become learning data implicitly.
- [ ] Hidden-test confidentiality and cross-split leakage controls are enforced.
- [ ] Knowledge records preserve versions, conflicts, policy, retention, deletion, provenance, and causal history.
- [ ] A failed, rejected, quarantined, or rolled-back result remains visible.
- [ ] Promotion requires the exact qualified hash and complete MCRT evidence.
