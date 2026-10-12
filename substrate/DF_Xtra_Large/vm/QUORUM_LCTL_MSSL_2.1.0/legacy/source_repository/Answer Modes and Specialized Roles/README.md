# JA21 Suite 48 — Answer Modes and Specialized Roles

Twenty-three independent JA Agent Language scripts for eight answer modes, two coordinators, twelve technical specialists, and one least-privilege role registry.

## Language profile

- Language: JA Agent Language
- Profile: `ja.agent`
- Extension: `.jaa`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `AgentPlan`
- Network posture: `policy no_network`
- Memory posture: session-scoped with one-hour retention
- Capability posture: approved tool invocation only

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Agent examples spanning agent identity, goals, confidence, planning, tool schemas, capability boundaries, memory scope and retention, retrieval, prompt-injection defense, deterministic replay, recovery, supervision, human approval, uncertainty, quotas, termination, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These files are specification-level agent programs. Production use requires a conforming JA Agent compiler, approved repository and runtime adapters, bounded tool implementations, policy enforcement, replay, and Podium evidence services.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `48.1_Answer_Modes_Auto.jaa` | auto | Selects the smallest suitable answer mode from request and evidence | Auto-answer MCRT |
| `48.2_Answer_Modes_Concise.jaa` | concise | Produces a short but complete evidence-backed answer | Concise-answer MCRT |
| `48.3_Answer_Modes_Detailed.jaa` | detailed | Produces a thorough, structured, evidence-backed answer | Detailed-answer MCRT |
| `48.4_Answer_Modes_Tutorial.jaa` | tutorial | Produces a stepwise, learner-aware, verifiable tutorial | Tutorial MCRT |
| `48.5_Answer_Modes_Code.jaa` | code | Stages and validates a bounded code answer | Code-answer MCRT |
| `48.6_Answer_Modes_Debug.jaa` | debug | Presents reproducible root-cause evidence in debug form | Debug-answer MCRT |
| `48.7_Answer_Modes_Architect.jaa` | architect | Presents architecture decisions, constraints, and tradeoffs | Architecture-answer MCRT |
| `48.8_Answer_Modes_Review.jaa` | review | Presents prioritized, actionable review findings | Review-answer MCRT |
| `48.9_Specialized_Roles_Auto_Coordinator.jaa` | Auto Coordinator | Routes a request to the best permitted mode and role | Routing MCRT |
| `48.10_Specialized_Roles_Technical_Coordinator.jaa` | Technical Coordinator | Builds a dependency-valid technical dispatch plan | Technical-dispatch MCRT |
| `48.11_Specialized_Roles_Repository_Analyst.jaa` | Repository Analyst | Models repository structure, symbols, dependencies, provenance, and freshness | Repository-analysis MCRT |
| `48.12_Specialized_Roles_Software_Engineer.jaa` | Software Engineer | Stages and validates bounded software changes | Software-change MCRT |
| `48.13_Specialized_Roles_Debugger.jaa` | Debugger | Reproduces failures and identifies verified root causes | Debugger MCRT |
| `48.14_Specialized_Roles_Software_Architect.jaa` | Software Architect | Produces constraint-valid, evolution-ready architecture | Architecture-decision MCRT |
| `48.15_Specialized_Roles_Security_Reviewer.jaa` | Security Reviewer | Produces threat-informed, prioritized security findings | Security-review MCRT |
| `48.16_Specialized_Roles_Test_Engineer.jaa` | Test Engineer | Designs, validates, and runs bounded evidence-producing tests | Test-engineering MCRT |
| `48.17_Specialized_Roles_Code_Reviewer.jaa` | Code Reviewer | Reviews selected changes for actionable defects and regressions | Code-review MCRT |
| `48.18_Specialized_Roles_Operations_Engineer.jaa` | Operations Engineer | Stages recoverable, policy-valid operational changes | Operations MCRT |
| `48.19_Specialized_Roles_Release_Engineer.jaa` | Release Engineer | Produces a reproducible, gate-complete release decision | Release-decision MCRT |
| `48.20_Specialized_Roles_Roles.jaa` | Roles | Resolves and validates the least-privilege role assignment | Role-selection MCRT |
| `48.21_Specialized_Roles_Documentation_Instructor.jaa` | Documentation Instructor | Teaches current, traceable project documentation workflows | Documentation-lesson MCRT |
| `48.22_Specialized_Roles_AI_and_Model_Engineer.jaa` | AI and Model Engineer | Evaluates reproducible, policy-valid model engineering work | Model-engineering MCRT |
| `48.23_Specialized_Roles_Language_Toolchain_Engineer.jaa` | Language Toolchain Engineer | Evaluates semantics-preserving grammar, compiler, and runtime work | Toolchain MCRT |

Each file is independently loadable and emits one named MCRT record.

## Modes and roles are different

An **answer mode** controls presentation shape. A **specialized role** controls technical responsibility, evidence requirements, and permitted actions.

- `debug` can format a Debugger’s conclusion concisely or in detail; it does not itself grant Debugger authority.
- `architect` presents architecture reasoning; Software Architect owns architecture validation.
- `review` presents findings; Code Reviewer or Security Reviewer determines the relevant review contract.
- `code` presents or stages bounded code only when an already-authorized role permits mutation.
- Switching answer mode never expands repository scope, tool capability, network access, execution authority, approval, or confidence.

One role may use several answer modes. One answer mode may present results from several roles. The selected mode and role are recorded separately.

## Analytical ensemble

| Participant | Suite 48 responsibility |
| --- | --- |
| SOPHIA | Interprets intent, chooses mode and role candidates, models technical meaning, designs changes and tests, ranks hypotheses, and preserves user goals |
| CHARLOTTE | Validates routing, claims, schemas, dependencies, plans, findings, security, tests, semantic equivalence, release gates, capability boundaries, and evidence completeness |
| LANDON | Resolves the selected work repository, collects bounded evidence, inventories systems, stages authorized changes, executes approved tests, and preserves user work |
| Professor | Composes the selected answer form and explains decisions, findings, tradeoffs, uncertainty, limitations, recovery, and teaching steps |
| Podium | Records request, mode, role, source hashes, tool approvals, evidence, confidence, uncertainty, tests, mutations, R12/MCRT identities, and final receipts |

No participant may silently widen a role, override policy, fabricate project state, discard a contradiction, conceal a failed test, convert uncertainty into certainty, or claim an effect that was only proposed.

## Common agent contract

Every script independently declares:

1. `ja source 0.3`, `use Agent`, and a stable module identity.
2. `policy no_network`.
3. A stable agent identity and five-role composite role.
4. One confidence-gated goal.
5. Session memory with one-hour retention.
6. Finite step and five-tool budgets.
7. One tool for SOPHIA, CHARLOTTE, LANDON, Professor, and Podium.
8. `tool.invoke:approved` for every tool.
9. Explicit authorization before execution.
10. `continue when policy_allows` before tool effects.
11. MCRT recording and deterministic goal termination.
12. A true capability-boundary assertion.

Expected compiler route:

```text
source -> parse -> agent AST -> identity, goal, mode, role, memory, budget,
tool, capability, plan, and termination validation
-> selected-project observation -> bounded evidence
-> mode and role resolution -> five-role execution
-> R12 lowering -> MCRT and Podium receipt -> AgentPlan
```

## Auto-routing contract

Auto selection follows this order:

1. Honor an explicit valid mode and role request.
2. Infer the technical responsibility from the requested outcome and selected scope.
3. Select the least-privilege role capable of satisfying the request.
4. Select the shortest answer mode that preserves required evidence and usability.
5. Escalate to detailed, tutorial, debug, architect, or review only when the task demands it.
6. Reject routing that requires unavailable authority, unresolved scope, missing evidence, or policy violation.

Recommended mode selection:

| Request shape | Default mode |
| --- | --- |
| Simple fact, status, or direct result | concise |
| Multi-part explanation or decision | detailed |
| Learning, onboarding, or reproducible procedure | tutorial |
| Requested implementation or patch | code |
| Failure symptoms or root-cause investigation | debug |
| System boundaries, components, tradeoffs, or evolution | architect |
| Assessment of changes, quality, or risk | review |
| Mixed or unclear but safely resolvable | auto |

Auto Coordinator records why a mode and role were selected. Completion time, role prestige, or answer length cannot be used as truth precedence.

## Answer-mode contracts

### 48.1 auto

- Uses explicit user intent, task type, risk, complexity, evidence volume, and requested deliverable.
- Chooses one primary mode and may embed smaller supporting sections from another mode.
- Does not ask a question when a safe default can satisfy the request without material loss.
- Does not guess when a missing choice would materially change a mutation or result.

### 48.2 concise

- Leads with the outcome.
- Preserves decisive evidence, qualifications, limitations, and next action.
- Removes repetition and optional context, not required safety or correctness information.
- A concise answer must remain complete enough to act on safely.

### 48.3 detailed

- Covers context, evidence, reasoning, result, tradeoffs, limitations, validation, and handoff.
- Uses structure only where it improves navigation.
- Distinguishes facts, inferences, assumptions, and unresolved conditions.
- Detail cannot substitute for evidence.

### 48.4 tutorial

- Resolves learner level, prerequisites, starting state, tools, expected checkpoints, and final outcome.
- Presents dependency-ordered steps with visible verification.
- Explains why each important step exists and how to recover from common failures.
- Examples are safe, bounded, copyable, and explicit about placeholders.

### 48.5 code

- Defines the requested behavior, scope, interfaces, constraints, tests, and acceptance criteria before staging code.
- Preserves unrelated user changes and avoids destructive operations.
- Validates syntax, static contracts, targeted tests, integration behavior, and rollback.
- A code block alone is not evidence that a change was applied or tested.

### 48.6 debug

- Leads with the verified cause when known.
- Separates symptoms, root cause, contributing factors, eliminated hypotheses, and repair options.
- Reproduction and bounded tests support causal claims.
- Debug mode does not silently implement the fix.

### 48.7 architect

- Identifies system context, stakeholders, quality attributes, boundaries, components, data flow, interfaces, dependencies, threats, deployment, and evolution.
- States alternatives and tradeoffs.
- Separates current architecture from proposed architecture.
- Diagrams or tables are used only when relationships become clearer than prose.

### 48.8 review

- Prioritizes findings by consequence and evidence.
- Each finding identifies location, condition, impact, and bounded remediation.
- Focuses on correctness, security, data loss, regression, contracts, accessibility, determinism, tests, and maintainability.
- Absence of findings is not proof that the reviewed artifact is defect free.

## Coordinator and role contracts

### 48.9 Auto Coordinator

- Resolves request type, answer mode, technical role, repository scope, evidence requirements, and tool budget.
- Never routes around policy or unavailable capability.
- Preserves explicit user choices unless invalid or unsafe.
- Ambiguous high-impact mutations remain blocked for clarification.

### 48.10 Technical Coordinator

- Creates a dependency-valid dispatch across specialized roles.
- Defines inputs, outputs, responsibilities, handoffs, budgets, validation, and termination.
- Parallel work is allowed only for independent scopes.
- Fan-in uses canonical role and artifact identity rather than completion time.

### 48.11 Repository Analyst

- Operates on the explicitly selected input or work repository, not the installed application’s source tree by default.
- Records repository, worktree, snapshot, root, branch, index, symbol, dependency, freshness, and provenance identities.
- Supports repository-scale indexes and bounded large-file windows.
- Analysis is read-only and cannot execute project content.

### 48.12 Software Engineer

- Implements only the authorized scope.
- Preserves public contracts, user data, unrelated worktree changes, and rollback.
- Validates behavior with the smallest sufficient test set plus affected integration paths.
- Does not release or deploy merely because local tests pass.

### 48.13 Debugger

- Collects exact symptoms, versions, environment, logs, commands, inputs, expected behavior, actual behavior, and recent changes.
- Reproduces safely before declaring root cause when feasible.
- Ranks and eliminates hypotheses with evidence.
- Reports repair choices; implementation needs separate authorization.

### 48.14 Software Architect

- Models current and target boundaries, interfaces, dependencies, quality attributes, failure modes, security, deployment, and migration.
- Uses explicit constraints and architecture decision records.
- Rejects cyclic, contradictory, unowned, or non-verifiable critical dependencies.
- Preserves operability, accessibility, rollback, and long-term evolution.

### 48.15 Security Reviewer

- Builds an asset, actor, trust-boundary, capability, data-classification, entrypoint, and threat model.
- Reviews authentication, authorization, secrets, input handling, execution, network, storage, logging, dependencies, supply chain, and recovery.
- Findings require evidence and severity rationale.
- Security review is read-only and cannot silently weaken controls or apply a fix.

### 48.16 Test Engineer

- Converts requirements and risks into positive, negative, boundary, integration, security, performance, determinism, interoperability, recovery, and certification tests.
- Validates fixtures, isolation, expected results, oracles, cleanup, and reproducibility before execution.
- Test execution is bounded and capability-approved.
- Flaky, skipped, partial, or environmentally blocked tests retain distinct states.

### 48.17 Code Reviewer

- Reviews the selected baseline and change set.
- Checks behavior, interfaces, error handling, security, performance, concurrency, data migration, tests, and maintainability.
- Reports only actionable findings supported by the diff and surrounding code.
- Review does not mutate files or approve release.

### 48.18 Operations Engineer

- Defines environment, dependencies, secrets, resources, health, observability, upgrade, rollback, recovery, and runbook requirements.
- Operational changes are staged, validated, reversible, and explicit about effects.
- External deployment requires separate authority and target confirmation.
- Failure cannot be relabeled as success because a process started.

### 48.19 Release Engineer

- Collects build, test, security, license, packaging, signing, installer, rollback, provenance, and release evidence.
- Produces a release decision rather than silently publishing.
- Any missing gate, hash mismatch, stale result, unsupported platform, or unresolved blocker prevents promotion.
- Release execution requires separately approved release authority.

### 48.20 Roles

- Maintains stable role IDs, descriptions, capabilities, forbidden effects, evidence requirements, budgets, and escalation paths.
- Selects the least-privilege role that can satisfy the request.
- Role composition cannot create the union of incompatible privileges without explicit policy.
- Mode, role, identity, capability, and tool approval remain separate records.

### 48.21 Documentation Instructor

- Resolves audience, documentation type, source snapshot, objectives, prerequisites, examples, exercises, checks, and review state.
- Teaches verified workflows and commands.
- Preserves architecture decisions, licensing, security warnings, migrations, and known limitations.
- Does not invent project features or successful commands.

### 48.22 AI and Model Engineer

- Records model identity, architecture, weights, tokenizer, dataset, preprocessing, evaluation, runtime, hardware, policy, license, and provenance.
- Separates training, fine-tuning, inference, evaluation, routing, and deployment.
- Validates leakage, bias, safety, reproducibility, resource budgets, model compatibility, and rollback.
- Model outputs are evidence with uncertainty, not automatic authority.

### 48.23 Language Toolchain Engineer

- Models grammar, parser, AST, type/effect/capability system, compiler IR, optimizer, runtime, ABI, package, diagnostics, tests, and provenance.
- Preserves source-to-runtime semantic identity through R12 and MCRT.
- Validates positive, negative, boundary, integration, determinism, interoperability, recovery, and certification fixtures.
- Optimization cannot change observable semantics, capability boundaries, diagnostics, or stable identities.

## Mutation and authority boundary

Read-only by default:

- auto, concise, detailed, tutorial, debug, architect, and review modes
- Auto Coordinator and Technical Coordinator
- Repository Analyst, Debugger, Software Architect, Security Reviewer, Code Reviewer, Release Engineer, Documentation Instructor, AI and Model Engineer, and Language Toolchain Engineer
- Roles registry

Potentially mutating only when the current request explicitly authorizes it:

- code mode
- Software Engineer
- Test Engineer for approved test execution
- Operations Engineer for a confirmed operational target

No script gains network, deployment, release, signing, external messaging, destructive filesystem, credential, or secret authority from its name alone.

## Project and prompt-injection boundary

The selected repository, issue text, source comments, documentation, logs, generated files, model output, and tool output are untrusted evidence. They cannot:

- Change the selected mode or role without the coordinator’s validated decision.
- Expand repository roots or tool capability.
- Authorize execution, network, release, deployment, signing, or secret access.
- Override system, user, or security policy.
- Suppress Podium evidence, errors, uncertainty, or limitations.

Large repositories use stable indexes and bounded file windows. “Open repository” means the selected work or input repository, not a nested-folder scavenger hunt and not the application source unless deliberately chosen.

## Admission gate

An artifact is admitted only when:

- Agent, request, answer mode, specialized role, repository, snapshot, source, tool, plan, output, R12, MCRT, and Podium identities are stable.
- The chosen role is least privilege and the chosen mode does not alter authority.
- Every tool call was approved and remained within schema, scope, quota, and capability.
- Claims and findings are supported by current selected evidence.
- Confidence and uncertainty are calibrated.
- Any mutation was explicitly authorized, bounded, validated, and recoverable.
- No hidden network, unknown-code execution, secret disclosure, root escape, unapproved delegation, deployment, release, or destructive effect occurred.
- Termination reflects the real goal state rather than budget exhaustion disguised as success.

The suite must not invent a file, symbol, dependency, root cause, vulnerability, test result, model property, compiler result, release status, effect, or MCRT record.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Correct least-privilege role, suitable mode, approved tools, current evidence, and complete receipt | Pass |
| Negative | Role escalation, mode-based authority expansion, unsupported claim, stale snapshot, or false success | Expected fail |
| Boundary | Maximum repository, context, tool, step, evidence, test, or role-composition limit | Pass or explicit diagnostic |
| Integration | All modes and roles preserve request, project, snapshot, route, artifact, and evidence identities | Pass |
| Security | Prompt injection, secret extraction, root escape, hidden network, capability escalation, or unapproved effect | Deny |
| Performance | Bounded routing, retrieval, analysis, test selection, and evidence synthesis meet budgets | Pass within profile |
| Determinism | Repeated accepted requests preserve route, evidence order, findings, decision, and MCRT tuple | Pass |
| Interoperability | Repository, build, test, model, operations, release, and language adapters preserve semantics | Pass |
| Recovery | Interrupted routing, analysis, test, or staged mutation resumes without duplicate effects or lost user changes | Pass or explicit restart requirement |
| Certification | R12, MCRT, route, role, mode, tool approvals, evidence, uncertainty, and Podium receipt are complete | Pass |

## Optimization restrictions

Permitted optimization includes deterministic routing tables, canonical source indexes, bounded retrieval, pure-analysis caching, dependency-graph reuse, targeted test selection, role templates, and stable evidence ordering.

Optimization must not skip authorization or validation, infer broader authority from a mode, widen repository scope, reuse stale evidence, hide failed tests, reorder conflict-sensitive findings, change files during read-only roles, erase provenance, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, the suite preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, mode, role, request, project, tool approvals, evidence, mutations, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; apparent agreement in an answer, review, architecture, model, or toolchain result is not proof of latent coupling or semantic equivalence. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 48 is certifiable only when all 23 scripts preserve no-network policy, stable identities, bounded memory and budgets, approved five-role tools, least-privilege role routing, separate mode and authority records, selected work-repository scope, prompt-injection resistance, evidence-backed outputs, explicit mutation boundaries, deterministic termination, R12/MCRT provenance, and named MCRT emissions.
