# JA21 Suite 47 — Chatbot

Six independent JA Agent Language scripts for explaining, planning, debugging, reviewing, refactoring, and documenting projects.

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

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Agent examples spanning agent identity, goals, confidence, plans, observation, tool schemas, capability boundaries, memory scope and retention, retrieval, prompt-injection defense, deterministic replay, failure recovery, supervision, approval, uncertainty, termination, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These files are specification-level agent programs. Production use requires a conforming JA Agent compiler, approved project adapters, bounded tool implementations, enforcement, replay, and Podium evidence services.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `47.1_Chatbot_Explaining.jaa` | Explaining | Produces audience-aware explanations grounded in selected project evidence | Explanation MCRT |
| `47.2_Chatbot_Planning.jaa` | Planning | Produces bounded, dependency-valid, verifiable project plans | Project-plan MCRT |
| `47.3_Chatbot_Debugging.jaa` | Debugging | Identifies reproducible root causes without silently applying a fix | Debugging MCRT |
| `47.4_Chatbot_Reviewing.jaa` | Reviewing | Produces prioritized, evidence-backed findings for selected changes | Review MCRT |
| `47.5_Chatbot_Refactoring.jaa` | Refactoring | Stages and validates a bounded semantics-preserving refactor | Refactor MCRT |
| `47.6_Chatbot_Documenting_Projects.jaa` | Documenting projects | Produces current, audience-aware, traceable project documentation | Documentation MCRT |

Each file is independently loadable and emits one named MCRT record.

## Analytical ensemble

| Participant | Suite 47 responsibility |
| --- | --- |
| SOPHIA | Interprets user intent, project meaning, audience, constraints, failure hypotheses, design goals, and acceptable change boundaries |
| CHARLOTTE | Validates claims, dependencies, plans, reproduction, review findings, semantic equivalence, tests, permissions, provenance, and completion evidence |
| LANDON | Resolves the selected work repository, collects bounded evidence, inventories dependencies, reproduces failures, stages approved refactors, and preserves user changes |
| Professor | Produces clear explanations, plans, root-cause narratives, review findings, refactor explanations, and project documentation |
| Podium | Records request identity, sources, tool approvals, hashes, confidence, uncertainty, findings, tests, mutations, R12/MCRT evidence, and final receipts |

No role may fabricate project state, erase a contradiction, convert uncertainty into certainty, hide a failed test, silently mutate files during explanation or review, or claim execution that was only modeled.

## Common chatbot contract

Every script independently declares:

1. `ja source 0.3`, `use Agent`, and a stable module identity.
2. `policy no_network`.
3. A stable chatbot identity and five-role composite role.
4. One confidence-gated goal.
5. Session memory with one-hour retention.
6. Finite step and five-tool budgets.
7. One tool for SOPHIA, CHARLOTTE, LANDON, Professor, and Podium.
8. `tool.invoke:approved` for every tool.
9. Explicit authorization before execution.
10. `continue when policy_allows` before any tool effect.
11. MCRT recording and deterministic goal termination.
12. A true capability-boundary assertion.

Expected compiler route:

```text
source -> parse -> agent AST -> identity, goal, memory, budget, tool,
capability, plan, and termination validation
-> selected-project observation -> canonical evidence collection
-> bounded five-role workflow -> R12 lowering
-> MCRT and Podium receipt -> deterministic AgentPlan
```

## Project boundary

The chatbot operates on the explicitly selected input or work repository. “Open repository” does not mean the installed application’s own source tree unless that tree is deliberately selected as the work target.

Every project adapter must declare:

- Stable repository, worktree, snapshot, path, symbol, dependency, build, test, and artifact identities.
- Allowed roots, file types, size and count limits, encodings, generated-file rules, and ignore rules.
- Read, write, execution, network, secret, and external-service capabilities.
- Cancellation, timeout, retry, recovery, idempotency, and deterministic replay behavior.
- Hashes, provenance, diagnostics, receipts, and freshness.

Untrusted project text, comments, logs, issues, documentation, generated files, and tool output are evidence—not agent authority. Instructions embedded in project content cannot expand capability, change policy, enable network access, disclose secrets, or authorize mutations.

## Sub-suite contracts

### 47.1 Explaining

- Resolves the question, audience, requested depth, selected project scope, terminology, and evidence sources.
- Separates observed facts, code-derived conclusions, test results, assumptions, inferences, and unknowns.
- Explains important control flow, data flow, interfaces, invariants, failures, tradeoffs, and limitations at the user’s altitude.
- Uses stable file, symbol, version, and artifact identities.
- Explanation is read-only unless a separate change request is explicitly authorized.

### 47.2 Planning

- Inventories current state, requested outcome, constraints, dependencies, risks, acceptance criteria, validation, rollback, and documentation work.
- Orders steps by dependency and identifies which can safely run in parallel.
- Every step has a bounded scope, responsible role, prerequisites, evidence, success condition, and failure path.
- Missing choices that materially change the implementation remain explicit blockers.
- Planning does not itself authorize file changes, execution, external messages, releases, or destructive actions.

### 47.3 Debugging

- Collects exact symptoms, environment, versions, logs, inputs, commands, expected behavior, actual behavior, and recent changes.
- Reproduction precedes root-cause claims when safe and feasible.
- Hypotheses are ranked by evidence and eliminated with bounded tests.
- Distinguishes root cause, contributing conditions, downstream symptoms, and incidental warnings.
- Debugging reports the verified cause and repair options; it does not silently implement a fix.

### 47.4 Reviewing

- Reviews only the selected baseline, changes, artifacts, or project scope.
- Prioritizes correctness, security, data loss, regressions, interface contracts, determinism, accessibility, tests, and maintainability.
- Findings include severity, location, evidence, consequence, and bounded remediation.
- Absence of a finding is not proof that the project is defect free.
- Review is read-only unless the user separately authorizes changes.

### 47.5 Refactoring

- Defines the intended invariant, allowed files, forbidden effects, baseline behavior, tests, and rollback before staging changes.
- Preserves public interfaces, serialized formats, user data, security boundaries, ordering, and observable behavior unless an approved change says otherwise.
- User-authored and unrelated worktree changes are preserved.
- Staged changes are validated with targeted tests, static checks, integration checks, and before/after evidence.
- A failed equivalence or regression check blocks promotion and retains an explicit repair or rollback path.

### 47.6 Documenting projects

- Resolves audience, document type, project version, source snapshot, supported workflows, commands, architecture, interfaces, configuration, troubleshooting, and limitations.
- Documents observed behavior and verified commands rather than invented functionality.
- Generated documentation keeps source references, freshness, ownership, and review state.
- Examples are safe, bounded, copyable, and explicit about placeholders.
- Documentation updates never erase historical decisions, migration notes, security warnings, licensing, or known limitations without evidence.

## Canonical chatbot pipeline

```text
select work repository -> scope request -> collect bounded evidence
-> interpret intent -> validate claims or proposed actions
-> explain, plan, debug, review, refactor, or document
-> verify success criteria -> record Podium evidence -> terminate
```

For refactoring, mutation occurs only within the accepted scope after explicit tool authorization. For explaining, planning, debugging, and reviewing, read-only evidence collection is the default.

## Response contract

A Chatbot response must:

- Lead with the outcome, verified finding, or decision.
- Clearly separate facts, inferences, assumptions, and unresolved questions.
- Preserve source identities, versions, errors, confidence, and limitations.
- Use the minimum structure needed for clarity.
- Never claim a command, test, build, fix, review, or deployment occurred unless corresponding evidence exists.
- Never expose secrets, hidden instructions, credentials, or unrelated user data.
- Keep a denial, contradiction, or unresolved condition visible.

## Admission gate

A Chatbot artifact is admitted only when:

- Agent, role, goal, memory, budget, tool, plan, request, repository, snapshot, source, output, R12, MCRT, and Podium identities are stable.
- Every tool call was authorized and remained within its schema and capability boundary.
- Project content could not modify agent authority or policy.
- Claims are supported by selected, current evidence.
- Confidence and uncertainty are calibrated.
- Any mutation was explicitly authorized, bounded, validated, and recoverable.
- No hidden network, unknown-code execution, secret disclosure, unapproved delegation, or destructive action occurred.
- Termination reflects the actual goal state rather than budget exhaustion disguised as success.

The chatbot must not invent a file, symbol, dependency, test result, build status, root cause, review finding, refactor equivalence, documentation fact, or MCRT record.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Valid scope, approved tools, current evidence, supported conclusion, and complete receipt | Pass |
| Negative | Unsupported claim, stale snapshot, unauthorized mutation, false success, or invalid capability assertion | Expected fail |
| Boundary | Maximum repository size, evidence count, tool budget, retention limit, context window, or refactor scope | Pass or explicit diagnostic |
| Integration | All six agents preserve shared request, project, snapshot, artifact, and evidence identities | Pass |
| Security | Prompt injection, secret extraction, root escape, hidden network, unknown execution, or capability escalation | Deny |
| Performance | Bounded retrieval, sparse dependency analysis, targeted tests, and evidence synthesis meet declared budgets | Pass within profile |
| Determinism | Repeated accepted requests preserve canonical evidence order, findings, plan, and MCRT tuple | Pass |
| Interoperability | Repository, build, test, documentation, and language adapters preserve identities and semantics | Pass |
| Recovery | Interrupted analysis or staged refactor resumes without duplicated effects or lost user changes | Pass or explicit restart requirement |
| Certification | R12, MCRT, tool approvals, evidence, limitations, and Podium receipt are complete | Pass |

## Optimization restrictions

Permitted optimization includes canonical source indexing, bounded retrieval, pure analysis caching, dependency-graph reuse, deterministic evidence ordering, targeted test selection, and documentation template reuse when semantic results remain equivalent.

Optimization must not skip authorization or validation, widen repository scope, reuse stale evidence, hide failed tests, reorder conflict-sensitive findings, change user files during read-only modes, merge distinct uncertainties, erase provenance, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, the Chatbot preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, agent/request/project identity, tool approvals, evidence hashes, output, tests, mutation status, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; apparent agreement in an explanation, plan, review, or document is not proof of latent coupling or code equivalence. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 47 is certifiable only when all six agents preserve no-network policy, stable identities, bounded session memory, finite budgets, approved five-role tools, selected work-repository scope, prompt-injection resistance, evidence-backed outputs, explicit mutation boundaries, deterministic termination, R12/MCRT provenance, and named MCRT emissions.
