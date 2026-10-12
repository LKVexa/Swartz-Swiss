# JA21 Suite 36 — Visual Correction System

Six independent JA Training and Evaluation Language experiments that detect visual defects and coordinate bounded corrective render or interaction passes.

## Language profile

- Language: JA Training and Evaluation Language
- Profile: `ja.training`
- Extension: `.jate`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Correction posture: evidence-gated, scope-bounded, checkpointed, regression-tested, and rollback-ready

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. These scripts therefore use only demonstrated forms: experiments, model and dataset references, deterministic splits, normalization, optimizer and scheduler declarations, batch and precision settings, fixed seeds, checkpoints, evaluation metrics, acceptance thresholds, gated registry promotion, reproducibility assertions, and MCRT lineage output.

## Files

| File | Sub-suite | Correction responsibility | Principal evidence |
| --- | --- | --- | --- |
| `36.1_Visual_Correction_Defect_Detection.jate` | Defect detection | Detect candidate visual failures with high precision and recall | Defect candidates and evidence coverage |
| `36.2_Visual_Correction_Defect_Classification_and_Localization.jate` | Classification and localization | Classify severity and bind defects to exact frames, regions, layers, components, or states | Localized defect record |
| `36.3_Visual_Correction_Correction_Planning.jate` | Correction planning | Produce feasible, bounded, policy-compliant, rollback-complete plans | Admissible correction plan |
| `36.4_Visual_Correction_Corrective_Render_Passes.jate` | Corrective render passes | Evaluate tightly scoped render corrections under pass and replay budgets | Render correction result |
| `36.5_Visual_Correction_Corrective_Interaction_Passes.jate` | Corrective interaction passes | Evaluate bounded UI state, layout, focus, or interaction corrections | Interaction correction result |
| `36.6_Visual_Correction_Verification_and_Rollback.jate` | Verification and rollback | Confirm resolution and protected-baseline safety or require exact rollback | Verification or rollback evidence |

## Relationship to Suite 33

Suite 33 Visual Feedback Loop compares generated outputs with targets and publishes evidence-backed correction proposals. Suite 36 governs what happens after a proposal is selected:

```text
Suite 33 proposal
  -> independent defect confirmation
  -> classification and localization
  -> bounded correction plan
  -> one approved render or interaction branch
  -> protected-baseline verification
  -> accept or rollback
  -> Podium evidence publication
```

Suite 36 never converts a proposal directly into an unbounded recursive correction loop.

## Analytical ensemble

The composite model reference in every script identifies the five-part analytical ensemble.

| Participant | Visual Correction System responsibility |
| --- | --- |
| SOPHIA | Interprets defect meaning, groups related findings, proposes causal explanations, and drafts minimum-scope correction plans |
| CHARLOTTE | Validates detection evidence, severity, localization, scope, pass budgets, permissions, safety, accessibility, protected baselines, rollback, policy, and replay |
| LANDON | Stages exact baseline and target identities, coordinates approved render or interaction adapters, enforces budgets, checkpoints state, and records results |
| Professor | Explains the defect, proposed correction, expected gain, risks, limitations, verification outcome, and rollback reason |
| Podium | Publishes defect, plan, approval, pass, metric, checkpoint, rollback, R12/MCRT, hash, provenance, and final decision receipts |

No participant may invent a defect, extend scope silently, increase a pass budget, execute an unapproved change, hide a regression, or discard failed correction evidence.

## Bounded correction envelope

Every admitted correction preserves:

| Field | Contract |
| --- | --- |
| `correction_id` | Stable identity for one correction branch |
| `proposal_id` | Exact Suite 33 proposal or other approved source |
| `baseline_hash` | Exact pre-correction scene, render, interface, or interaction state |
| `target_hash` | Exact admitted comparison target |
| `defect_ids` | Complete localized defect set in scope |
| `pass_kind` | `render` or `interaction`; never both implicitly |
| `allowed_scope` | Exact frames, regions, layers, passes, components, routes, states, actions, files, or parameters |
| `denied_scope` | Protected identities and operations that cannot change |
| `max_passes` | Hard pass count that cannot be raised within the branch |
| `resource_budget` | Time, compute, memory, frame, event, and output bounds |
| `required_capabilities` | Exact adapter and execution capabilities |
| `expected_gain` | Versioned metric expectation with uncertainty |
| `protected_baselines` | Security, accessibility, geometry, behavior, performance, provenance, and policy invariants |
| `checkpoint_id` | Restorable state created before any effect |
| `rollback_id` | Exact restoration operation and target state |
| `approval_receipt` | Current approval bound to scope, budget, and baseline |
| `podium_receipt` | Final evidence bound to the exact result or rollback |

The default profile admits at most three candidate plans per defect cluster, at most two corrective render passes, and at most one corrective interaction pass followed by one deterministic replay. A project may declare stricter bounds. Raising a bound requires a new correction identity and approval.

## Common experiment contract

Every file independently declares:

1. `ja source 0.3`, a stable module, `use Training`, and `policy no_network`.
2. A composite SOPHIA–CHARLOTTE–LANDON–Professor–Podium model reference.
3. A versionable dataset with `0.8/0.1/0.1` train, validation, and test splits.
4. Deterministic normalization.
5. A declared AdamW optimizer and cosine scheduler.
6. Bounded batch and accumulation settings.
7. Mixed precision under a fixed runtime profile.
8. A unique fixed seed.
9. Periodic checkpoints.
10. Named metrics and acceptance thresholds.
11. Promotion only when every threshold passes.
12. A reproducibility assertion and named MCRT lineage record.

Registry promotion admits evidence or a controller profile to the Visual Correction registry. It does not itself execute a render, mutate an interface, update a model, alter source, or publish a release.

## Sub-suite contracts

### 36.1 Defect detection

- Detection compares the exact generated output, target, alignment profile, masks, metric profile, and protected baselines.
- Precision limits false defects; recall limits missed defects.
- Each candidate retains frame, region, layer, pass, component, state, metric, measured delta, threshold, evidence, and uncertainty.
- Misalignment, unsupported target transformations, missing provenance, or incomplete evidence blocks promotion.

### 36.2 Classification and localization

- Defects are classified by visual, geometry, material, lighting, effects, compositing, temporal, layout, accessibility, focus, state, event, performance, security, or provenance class.
- Severity reflects user impact, protected invariants, scope, reproducibility, and downstream risk.
- Localization identifies the smallest evidence-supported correction scope.
- Correlation without causal evidence remains `UNRESOLVED`; it cannot authorize a correction.

### 36.3 Correction planning

- SOPHIA proposes the minimum change expected to resolve the admitted defect.
- CHARLOTTE checks plan feasibility, scope closure, capabilities, pass limits, dependencies, policy, protected baselines, checkpoint, and rollback completeness.
- LANDON canonicalizes the approved adapter request without executing it.
- Plans with missing dependencies, scope ambiguity, stale baseline, unavailable rollback, or policy denial are rejected.
- Alternative plans retain separate identities and evidence rather than being blended.

### 36.4 Corrective render passes

- A render branch may change only declared frames, regions, layers, materials, effects, passes, shaders, cameras, lights, or bounded parameters.
- The default hard limit is two passes; a failed second pass halts and rolls back or escalates.
- Random streams, timebase, render graph, color, alpha, depth, provider, target, cache, and deterministic profile remain explicit.
- Each pass records inputs, output hash, metrics, resources, diagnostics, remaining budget, and Podium receipt.
- No pass may expand scope based solely on its own output.

### 36.5 Corrective interaction passes

- An interaction branch may change only declared components, layout constraints, tokens, routes, states, events, actions, focus transitions, accessibility properties, or bounded parameters.
- The default hard limit is one corrective pass followed by one deterministic replay.
- Permissions, destructive-action safeguards, keyboard paths, reading order, focus visibility, error/recovery states, and adapter contracts remain protected.
- A replay failure, accessibility regression, stale state, duplicate effect, or unauthorized action triggers rollback.

### 36.6 Verification and rollback

- Verification reruns defect metrics and every protected baseline against the exact corrected artifact.
- Resolution of one defect cannot conceal a new defect elsewhere.
- Acceptance requires defect resolution, regression safety, deterministic replay, complete provenance, and a valid rollback checkpoint.
- Any failed required threshold rejects the branch.
- Rollback restores the exact baseline hash and then verifies restoration; unknown or partial rollback blocks further correction.

## Pass controller rules

1. No correction begins without a checkpoint and current approval.
2. Render and interaction correction branches are separate.
3. The adapter receives exact allowed and denied scopes.
4. Each pass consumes one immutable budget unit.
5. The controller cannot allocate additional units to itself.
6. Every result is independently evaluated before another pass.
7. A threshold failure, policy denial, scope violation, nondeterministic result, or protected regression halts the branch.
8. Recursive self-correction, hidden retries, silent fallback, and cross-branch mutation are prohibited.
9. Acceptance or rollback closes the branch.

## Threshold profile

| Stage | Required thresholds |
| --- | --- |
| Detection | Precision and recall `>= 0.95`; evidence coverage `>= 0.99` |
| Classification/localization | Classification accuracy `>= 0.95`; localization precision `>= 0.90`; severity consistency and evidence coverage `>= 0.99` |
| Planning | Feasibility `>= 0.95`; bounded-scope accuracy `>= 0.99`; rollback coverage and policy compliance `= 1.00` |
| Render passes | Correction gain `>= 0.90`; regression safety `>= 0.99`; budget compliance and deterministic replay `= 1.00` |
| Interaction passes | Correction gain `>= 0.90`; transition safety `>= 0.99`; accessibility preservation and budget compliance `= 1.00` |
| Verification/rollback | Defect resolution `>= 0.95`; regression safety `>= 0.99`; replay and rollback readiness `= 1.00` |

Thresholds are versioned defaults. A stricter project profile may replace them, but prior results retain the original profile identity.

## Determinism and leakage controls

- Baseline, target, proposal, defect set, split membership, preprocessing, evaluator versions, metrics, seeds, runtime profile, scope, budgets, checkpoints, and thresholds are immutable within one correction identity.
- The same accepted inputs must yield the same findings, plan order, pass decisions, metric records, rollback result, and MCRT tuple hash.
- Related sources and derivations remain in one dataset partition to prevent near-duplicate leakage.
- Test evidence used to tune a correction cannot later be represented as untouched verification.
- Hardware or mixed-precision variation outside the declared tolerance creates a new profile or an unresolved replay.
- Filesystem order, worker timing, locale, and wall-clock timestamps do not influence canonical ordering.

## Validation matrix

| Class | Visual Correction test | Expected result |
| --- | --- | --- |
| Positive | Reproducible defect, localized evidence, feasible bounded plan, approved pass, resolved defect, and protected baselines | Pass |
| Negative | False detection, ambiguous cause, scope expansion, budget breach, failed replay, regression, or incomplete rollback | Expected fail |
| Boundary | Zero defects, exact threshold, final pass, largest allowed region, deepest interaction flow, and exhausted budget | Pass or explicit boundary diagnostic |
| Integration | Proposal, defect, plan, checkpoint, adapter, pass, artifact, rollback, and Podium identities remain linked | Pass |
| Security | Hidden network, unknown code, path escape, source substitution, permission bypass, secret leakage, or self-expanded scope | Deny |
| Performance | Detection, localization, pass execution, rendering, replay, and verification stay within declared resources | Pass within budget |
| Determinism | Shuffled inputs and worker timing yield identical defects, plans, pass decisions, outputs, and rollback evidence | Pass |
| Interoperability | Compatible render/UI adapters preserve identity, schema, units, color, time, state, accessibility, capability, and provenance | Pass |
| Recovery | Interrupted correction reconciles checkpoint, pass, and receipt before resuming or rolling back | Pass or explicit repair requirement |
| Certification | R12/MCRT replay reproduces exact baseline, target, defect, scope, budget, result, policy, relation class, and interaction order | Pass |

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics appears in correction evidence, the system preserves fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, provenance, projection version, tolerance profile, phase, support, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Defects, plans, passes, verification, rollback, R12/MCRT evidence, and Podium receipts retain `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, phase/support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result. If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`; visual correction cannot rewrite projected overlap as latent coupling.

R12 replay requires an independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, wrapped phase difference at most `1e-6` radians, and identical relation class, tuple hash, and interaction order.

Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 36 is certifiable only when all six experiments preserve fixed references, splits, preprocessing, seeds, checkpoints, metrics, thresholds, hashes, provenance, bounded scopes, hard pass budgets, capability checks, pre-effect checkpoints, rollback readiness, protected-baseline safety, and reproducibility; corrections cannot self-expand or recurse; hidden network and unknown-code execution are absent; and R12/MCRT replay preserves exact policy, result, relation class, tuple hash, interaction order, and Podium receipt target.
