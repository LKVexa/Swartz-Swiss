# JA21 Suite 49 — Action Cards

Fourteen independent JA Interface Language scripts for risk, evidence, parameter, impact, rollback, and hash summaries plus formal capability, parameter, precondition, expected-effect, impact, rollback, unified-diff, and review-history panels.

## Language profile

- Language: JA Interface Language
- Profile: `ja.interface`
- Extension: `.jaui`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `InterfaceArtifact`
- Runtime posture: deterministic modeled behavior, no network, capability-gated actions, accessible keyboard paths, and no unknown-code execution

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Interface examples spanning typed state, derived values, components, data binding, service binding, commands, validation, permission control, accessibility, focus management, keyboard workflows, navigation, localization, resource loading, portal-scene embedding, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These files are specification-level JA interface programs rather than HTML, JavaScript, C#, or framework-specific components. Production use requires a conforming JA Interface compiler and approved action, capability, evidence, diff, history, execution, rollback, and Podium adapters.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `49.1_Action_Cards_Risk_Summary.jaui` | risk | Presents compact severity, uncertainty, mitigation, and blocking-risk status | `ActionCardRiskSummary` |
| `49.2_Action_Cards_Evidence_Summary.jaui` | evidence | Presents compact evidence completeness, freshness, provenance, and gaps | `ActionCardEvidenceSummary` |
| `49.3_Action_Cards_Parameter_Summary.jaui` | parameters | Presents compact redacted parameter identities and values | `ActionCardParameterSummary` |
| `49.4_Action_Cards_Impact_Summary.jaui` | impact | Presents compact affected-scope and severity information | `ActionCardImpactSummary` |
| `49.5_Action_Cards_Rollback_Summary.jaui` | rollback | Presents compact recoverability and irreversible-effect status | `ActionCardRollbackSummary` |
| `49.6_Action_Cards_Hash_Summary.jaui` | hashes | Presents canonical source, plan, diff, and artifact hashes | `ActionCardHashSummary` |
| `49.7_Action_Cards_Capability_Contract.jaui` | Capability contract | Displays the principal, capability, resource, effect, scope, constraints, and approval | `ActionCardCapabilityContract` |
| `49.8_Action_Cards_Parameters.jaui` | Parameters | Displays the complete canonical parameter set and validation | `ActionCardParameters` |
| `49.9_Action_Cards_Preconditions.jaui` | Preconditions | Displays satisfied, failed, and unresolved prerequisites | `ActionCardPreconditions` |
| `49.10_Action_Cards_Expected_Effects.jaui` | Expected effects | Displays predicted effects, ordering, bounds, and forbidden effects | `ActionCardExpectedEffects` |
| `49.11_Action_Cards_Impact.jaui` | Impact | Displays direct, indirect, delayed, systemic, and irreversible impact | `ActionCardImpact` |
| `49.12_Action_Cards_Rollback.jaui` | Rollback | Displays the complete tested rollback and recovery plan | `ActionCardRollback` |
| `49.13_Action_Cards_Unified_Diff.jaui` | Unified diff | Renders a validated read-only diff bound to baseline and target hashes | `ActionCardUnifiedDiff` |
| `49.14_Action_Cards_Review_History.jaui` | Review history | Presents the immutable sequence of reviews, findings, approvals, and supersession | `ActionCardReviewHistory` |

Each file is independently loadable and emits one named interface artifact.

## Compact facets versus formal panels

The repeated labels are intentionally separate:

- Lowercase **parameters**, **impact**, and **rollback** are compact action-card summaries intended for fast scanning.
- Formal **Parameters**, **Impact**, and **Rollback** panels contain the complete validated contract and evidence.
- A summary can link to its panel but cannot replace the panel for approval or execution.
- The summary and panel share the same action, snapshot, policy, and evidence identities. A mismatch blocks the card.

Risk, evidence, and hashes are summary facets with mandatory drill-down receipts. Capability contract, Preconditions, Expected effects, Unified diff, and Review history are formal panels because their full contents are required to understand and approve the proposed action.

## Analytical ensemble

| Participant | Suite 49 responsibility |
| --- | --- |
| SOPHIA | Interprets action intent, parameters, risk, expected effects, impact, rollback meaning, change intent, and review sequence |
| CHARLOTTE | Validates capability, parameter schemas, preconditions, evidence, risk, effect bounds, impact, rollback, hashes, diff scope, reviewer authority, approvals, and freshness |
| LANDON | Resolves stable action and artifact identities, binds validated panels, renders read-only diffs, and preserves deterministic state without executing the underlying action |
| Professor | Explains parameters, decisions, risk, effects, impact, rollback, changes, uncertainty, limitations, and unresolved findings |
| Podium | Presents hashes, provenance, validation receipts, review history, approval state, R12/MCRT evidence, and certification status |

Every script contains a named component for all five participants, requires approved UI actions, asserts a complete keyboard path, and binds a stable evidence viewport.

## Common interface contract

Every script independently declares:

1. `ja source 0.3`, `use Interface`, and a stable module identity.
2. `policy no_network`.
3. A selected-action state and one active-validation flag.
4. Derived enablement that blocks missing selection and concurrent validation.
5. SOPHIA, CHARLOTTE, LANDON, Professor, and Podium components.
6. Accessible button roles, names, and complete keyboard paths.
7. Permission-gated actions using `admin.action:approved`.
8. A stable portal-scene viewport and motion timeline.
9. One named emitted interface artifact.

Expected compiler route:

```text
source -> parse -> interface AST -> typed state and component resolution
-> action, capability, parameter, evidence, effect, impact, rollback,
diff, history, accessibility, and permission validation
-> canonicalization -> R12 lowering -> MCRT interface evidence
-> deterministic Action Card InterfaceArtifact
```

## Action-card identity

Every card and panel must resolve:

- Action ID, request ID, principal, role, capability, resource, effect, scope, purpose, and policy version.
- Repository, worktree, snapshot, baseline, target, path, symbol, artifact, and adapter IDs where applicable.
- Parameter schema and canonical parameter hash.
- Precondition set and evaluation time.
- Expected-effect model and uncertainty.
- Risk, impact, rollback, evidence, unified-diff, and review-history versions.
- Source, plan, diff, artifact, approval, execution, and rollback hashes.
- R12, MCRT, Podium receipt, and certification identities.

The card fails closed if these identities conflict, are stale, or cannot be linked to the same proposed action.

## Adapter boundary

The `.jaui` files display validated action intent. They do not perform the underlying filesystem, repository, build, execution, network, deployment, release, signing, messaging, or destructive effect.

Every adapter must declare:

- Stable provider, schema, action, resource, snapshot, artifact, and receipt IDs.
- Allowed effects, capabilities, permissions, approval, timeout, cancellation, retry, and idempotency.
- Validation, canonicalization, freshness, mutation detection, conflict, rollback, and replay behavior.
- Data classification, redaction, retention, provenance, diagnostics, and deterministic ordering.

An action card may request execution only through a separate approved executor that revalidates the complete contract immediately before effect. Viewing or approving a card does not itself execute the action.

## Sub-suite contracts

### 49.1 Risk summary

- Presents severity, likelihood, confidence, uncertainty, affected category, primary hazard, mitigation, residual risk, and blocking status.
- Uses declared scales and thresholds rather than color alone.
- Missing evidence or unresolved uncertainty cannot be summarized as low risk.
- The summary links to the exact supporting risk model and policy decision.

### 49.2 Evidence summary

- Presents required, present, missing, stale, contradictory, and rejected evidence counts.
- Shows source identities, provenance class, freshness, validation state, and confidence.
- Model expectations, static analysis, runtime tests, approvals, and production evidence remain distinct.
- Missing evidence is visible and blocks actions that require it.

### 49.3 Parameter summary

- Presents the smallest useful set of canonical parameter names, redacted values, units, and changed/default status.
- Secrets show reference identities or redacted markers, never values.
- Truncation is disclosed and links to the complete Parameters panel.
- The summary hash must match the complete canonical parameter set.

### 49.4 Impact summary

- Presents affected repositories, files, records, services, users, data classes, environments, or release targets.
- Separates direct, indirect, delayed, reversible, and irreversible impact.
- Includes uncertainty and worst credible bounded consequence.
- Visual compactness cannot hide a high-severity or irreversible effect.

### 49.5 Rollback summary

- Presents rollback availability, tested status, checkpoint identity, estimated recovery scope, data preservation, and irreversible boundaries.
- “Rollback available” requires an actual validated plan and required inputs.
- Untested, partial, manual, destructive, or impossible rollback retains that exact state.
- The summary links to the complete Rollback panel.

### 49.6 Hash summary

- Presents algorithm and canonical hashes for source, snapshot, parameters, plan, diff, artifacts, policy, approval, and rollback.
- Hash labels identify what bytes or canonical records were hashed.
- A hash is evidence of identity and integrity, not correctness, safety, approval, or provenance by itself.
- Algorithm mismatch, missing hash, changed content, or stale receipt blocks promotion.

### 49.7 Capability contract

- Declares principal, role, capability, resource, effect, scope, constraints, delegation, expiry, revocation, policy, approval, and forbidden effects.
- Uses least privilege and denies ambient or wildcard authority.
- Approval can satisfy a declared requirement but cannot override an explicit deny.
- Mode, display state, or reviewer status never expands capability.

### 49.8 Parameters

- Displays the complete canonical parameter set, schema version, types, values, units, defaults, bounds, sources, normalization, and redaction.
- Required, optional, derived, immutable, secret, and mutually exclusive parameters remain distinct.
- Invalid, unknown, duplicated, ambiguous, out-of-range, or stale parameters block readiness.
- Parameter changes invalidate prior effect, risk, impact, diff, approval, and rollback evidence.

### 49.9 Preconditions

- Declares required repository snapshot, state, dependencies, policies, permissions, approvals, locks, resources, tests, health, and timing.
- Each precondition has a stable ID, evaluator, expected state, actual state, evidence, evaluation time, and freshness limit.
- `satisfied`, `failed`, `unresolved`, `stale`, and `not evaluated` remain distinct.
- Absence of a failure is not satisfaction.

### 49.10 Expected effects

- Declares every intended state read, state write, file change, process, service, package, message, network, deployment, release, or deletion effect.
- Separates required, optional, conditional, compensating, and forbidden effects.
- Preserves effect ordering, dependencies, idempotency, bounds, uncertainty, and receipt expectations.
- An observed undeclared effect is a policy failure even when the final output appears correct.

### 49.11 Impact

- Models direct, transitive, systemic, user-visible, security, privacy, accessibility, performance, operational, financial, and release impact as applicable.
- Identifies affected identities, quantities, environments, data classifications, and duration.
- Includes worst credible bounded outcome and residual risk after mitigation.
- Impact is recalculated whenever parameters, baseline, diff, dependencies, or target changes.

### 49.12 Rollback

- Declares checkpoint, backup, inverse operations, dependency order, verification, time limits, ownership, and escalation.
- Preserves user repositories and user-created data unless separate explicit consent authorizes otherwise.
- Validates rollback against the same baseline, target, parameters, effects, and hashes as the action.
- Irreversible effects are declared before approval and cannot be mislabeled as recoverable.

### 49.13 Unified diff

- Binds the diff to exact repository, worktree, baseline, target, path, encoding, and content hashes.
- Validates file headers, paths, hunks, context, additions, deletions, renames, mode changes, generated files, binaries, and truncation.
- Renders read-only content and never applies the diff.
- Path traversal, root escape, hidden changes, malformed hunks, unexpected binaries, stale baseline, or out-of-scope files block readiness.
- Accessible rendering includes line numbers, change types, navigation, summaries, and non-color indicators.

### 49.14 Review history

- Presents reviewer identity, role, review scope, artifact hashes, findings, severity, decision, approval, timestamp, expiry, supersession, and provenance.
- Orders records by canonical sequence and hash-linked causality rather than UI arrival time.
- History is append-only; corrections supersede earlier records without deleting them.
- Open, resolved, rejected, waived, expired, and reintroduced findings remain distinct.
- An approval for one hash cannot be replayed against changed parameters, diff, artifact, or policy.

## Canonical readiness order

```text
select proposed action -> resolve Capability contract -> validate Parameters
-> evaluate Preconditions -> model Expected effects -> evaluate risk and Impact
-> validate Rollback -> render Unified diff -> verify evidence and hashes
-> review Review history -> request approval -> hand to separate executor
```

Any parameter, snapshot, target, policy, diff, capability, approval, or evidence change invalidates all dependent downstream panels. A downstream pass cannot erase an upstream denial, failed precondition, unresolved risk, hash mismatch, missing rollback, or open blocking review.

## Readiness and execution states

Recommended action-card states:

```text
draft -> scoped -> modeled -> validated -> reviewed -> approved
-> execution-ready -> executing -> verified -> completed
```

Failure states remain explicit:

```text
blocked | denied | unresolved | stale | superseded | failed
| rollback-required | rolled-back | manual-recovery-required
```

Only the separate executor may transition from `execution-ready` to `executing`. The interface may display and request the transition but cannot manufacture its receipt.

## Admission gate

An Action Card artifact is admitted only when:

- Module, interface, component, action, capability, parameter, precondition, effect, risk, impact, rollback, diff, review, scene, timeline, adapter, R12, MCRT, and Podium identities are stable.
- State types and derived expressions resolve.
- Every UI action has approved permission.
- Summaries match their complete panel hashes.
- Parameters are canonical and secrets are redacted.
- Preconditions are current and satisfied.
- Expected effects are explicit and bounded.
- Risk and impact retain uncertainty and blocking status.
- Rollback is honest about testing and irreversibility.
- Unified diff matches baseline and target and remains read-only.
- Review history is complete, ordered, append-only, and hash bound.
- No network, unknown-code execution, credential exposure, root escape, hidden action execution, or undeclared effect occurs.

The UI must not invent a capability, parameter, precondition result, effect, risk, impact, rollback, hash, diff, review, approval, execution receipt, or evidence record.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Valid capability, parameters, preconditions, effects, impact, rollback, diff, reviews, hashes, and evidence | Pass |
| Negative | Missing approval, invalid parameter, failed precondition, hidden effect, stale diff, or false rollback claim | Expected fail |
| Boundary | Maximum parameter, path, hunk, evidence, review, impact, history, or card-size limit | Pass or explicit diagnostic |
| Integration | Summary and full panels preserve shared action, snapshot, policy, diff, approval, and evidence identities | Pass |
| Security | Prompt injection, secret exposure, path traversal, capability escalation, review replay, or hidden execution | Deny |
| Performance | Bounded validation, diff rendering, history navigation, and evidence loading meet UI budgets | Pass within profile |
| Determinism | Repeated validation preserves canonical parameter, effect, diff, review, hash, and receipt order | Pass |
| Interoperability | Repository, policy, executor, evidence, review, and rollback adapters preserve semantics | Pass |
| Recovery | Interrupted validation resumes without duplicated records, lost findings, stale acceptance, or fabricated readiness | Pass or explicit restart requirement |
| Certification | R12, MCRT, accessibility, capability, action, diff, review, rollback, and Podium evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes component reuse, deterministic panel caching, hash reuse for identical bytes, bounded diff virtualization, review-history indexing, derived-value caching, and event batching when observable and accessibility semantics remain equivalent.

Optimization must not hide parameters, clip risks, merge summary and full contracts, skip preconditions, reorder effects, weaken impact, claim rollback without tests, omit diff hunks, erase review history, reuse stale approval, remove redaction, skip permissions, execute an action, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, action evidence preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, action, capability, parameters, effects, impact, rollback, diff, review, approval, execution state, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; visual overlap in an action card or diff is not proof of latent coupling, semantic equivalence, approval, or execution readiness. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 49 is certifiable only when all fourteen scripts preserve no-network policy, typed state, valid derived enablement, permission-gated actions, five-role components, complete keyboard paths, stable action identities, matching compact and full panels, read-only unified diffs, append-only review history, honest rollback, complete R12/MCRT provenance, and named interface emissions.
