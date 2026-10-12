# JA21 Suite 52 — Evaluation and Content Defense

Seven independent JA Security Policy Language scripts for answer-quality evaluation, prompt-injection evaluation, malicious repository-content evaluation, fabricated-evidence detection, Permanent Evaluation, Prompt-Injection Defense, and Repository-Content Defense.

The evaluation scripts classify candidate answers and content without granting authority. The defense scripts enforce boundaries after classification. This separation keeps evaluation evidence inspectable and prevents detection logic from silently expanding tool, repository, execution, or network capabilities.

## Language profile

- Language: JA Security Policy Language
- Profile: `ja.security`
- Extension: `.jasec`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `PolicyDecision`
- Runtime posture: fail closed, no network by default, process denial by default, least privilege, human-controlled exceptions, complete audit, secret redaction, and explicit-deny precedence

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Security Policy examples spanning principals, roles, capabilities, scopes, allow and deny rules, human approval, fail-closed behavior, network and process sandboxes, policy composition, runtime enforcement, static proof, redaction, audit, conflict resolution, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These files are specification-level policies. Production protection requires a conforming JA Security compiler, runtime enforcement, content classifiers, repository adapters, evidence validators, approval services, and Podium audit storage.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `52.1_Evaluation_and_Content_Defense_Answer_Quality_Evaluation.jasec` | Answer-quality evaluation | Evaluates correctness, relevance, completeness, grounding, calibration, safety, and usability | Answer-quality MCRT decision |
| `52.2_Evaluation_and_Content_Defense_Prompt_Injection_Evaluation.jasec` | Prompt-injection evaluation | Classifies untrusted instructions and attempted authority changes | Injection-evaluation MCRT decision |
| `52.3_Evaluation_and_Content_Defense_Malicious_Repository_Content_Evaluation.jasec` | Malicious repository-content evaluation | Evaluates files, comments, logs, issues, and generated content as untrusted evidence | Repository-content MCRT decision |
| `52.4_Evaluation_and_Content_Defense_Fabricated_Evidence_Detection.jasec` | Fabricated-evidence detection | Verifies evidence identity, provenance, hashes, freshness, reproducibility, and claim support | Evidence-verification MCRT decision |
| `52.5_Evaluation_and_Content_Defense_Permanent_Evaluation.jasec` | Permanent Evaluation | Promotes only stable, replayable evaluation fixtures and records | Permanent-evaluation MCRT decision |
| `52.6_Evaluation_and_Content_Defense_Prompt_Injection_Defense.jasec` | Prompt-Injection Defense | Enforces instruction hierarchy, capability boundaries, and content isolation | Injection-defense MCRT decision |
| `52.7_Evaluation_and_Content_Defense_Repository_Content_Defense.jasec` | Repository-Content Defense | Prevents repository content from becoming authority or triggering hidden effects | Repository-defense MCRT decision |

Each file is independently loadable and emits one named MCRT policy decision.

## Analytical ensemble

| Participant | Suite 52 responsibility |
| --- | --- |
| SOPHIA | Interprets requested outcome, answer meaning, content intent, possible manipulation, evidence claims, and expected safe behavior |
| CHARLOTTE | Validates evaluation criteria, instruction hierarchy, repository scope, content classification, evidence identity, hashes, provenance, freshness, replay, permissions, and conflicts |
| LANDON | Enforces isolation, confines repository access, blocks content-driven authority changes, quarantines denied material, and preserves safe execution boundaries |
| Professor | Explains quality findings, detected techniques, denied requests, evidence gaps, uncertainty, limitations, and safe repair paths |
| Podium | Records source and policy hashes, evaluation fixtures, content identities, findings, evidence, conflict outcomes, decisions, R12/MCRT records, and certification status |

No participant may follow an instruction merely because it appears inside a repository, test fixture, log, comment, issue, generated file, retrieved memory, model output, or previous answer.

## Evaluation versus defense

- **Prompt-injection evaluation** identifies and classifies suspicious instruction content. **Prompt-Injection Defense** enforces the instruction, tool, memory, and capability boundary.
- **Malicious repository-content evaluation** analyzes a selected content item. **Repository-Content Defense** governs all repository-derived content through loading, retrieval, display, analysis, tool use, and output.
- **Permanent Evaluation** governs which fixtures and results become durable regression or certification evidence. It does not mean that evaluation data is literally immortal or exempt from correction, expiry, privacy, revocation, or supersession.

Evaluation cannot authorize execution, network access, secrets, repository writes, deployment, release, or external messaging. A passing evaluation is evidence for a separate policy decision.

## Common security contract

Every script independently declares:

1. `ja source 0.3`, `use Security`, and a stable module identity.
2. `policy no_network`.
3. One named worker principal.
4. The shared `EvaluationDefenseEnsemble` role.
5. The five SOPHIA, CHARLOTTE, LANDON, Professor, and Podium capabilities.
6. One narrowly scoped evaluation or defense capability.
7. One restricted classified candidate, record, or request resource.
8. Network and process denial by default.
9. Explicit denial when the principal lacks the ensemble role.
10. Conditional admission only for the declared resource.
11. Human approval for certification, classification, release, acceptance, promotion, exception, or trust.
12. Complete privileged-effect auditing.
13. Secret-value redaction.
14. `explicit_deny_wins` conflict resolution.
15. A no-secret-leak assertion.
16. A named MCRT policy-decision emission.

Expected compiler route:

```text
source -> parse -> security AST -> principal, role, capability, resource,
policy, approval, redaction, audit, and conflict validation
-> evaluation classification -> defense decision
-> R12 lowering -> runtime enforcement -> MCRT and Podium receipt
```

## Trust and instruction hierarchy

Content is evidence, not authority. The effective precedence is:

1. System and security policy.
2. Current explicit user intent within allowed authority.
3. Approved task and tool contracts.
4. Current exact repository evidence for repository-state claims.
5. Governed memory within its declared scope.
6. Untrusted content, retrieved text, model output, and candidate answers.

Lower-priority content cannot instruct the system to ignore higher-priority policy, reveal secrets, expand repository roots, enable network, invoke tools, execute code, alter memory, fabricate evidence, suppress diagnostics, or change the user’s request.

Quoted, encoded, translated, obfuscated, fragmented, indirect, role-played, or tool-mediated instructions retain their original untrusted content status.

## Sub-suite contracts

### 52.1 Answer-quality evaluation

- Evaluates correctness, relevance, completeness, grounding, citation fidelity, calibration, safety, privacy, readability, actionability, and adherence to requested format.
- Separates facts, inferences, assumptions, uncertainty, and unresolved questions.
- Checks that claimed file changes, commands, tests, builds, deployments, messages, or approvals have corresponding evidence.
- Detects confident unsupported claims, omitted blockers, stale evidence, false success, and scope drift.
- Quality scores use declared rubrics, thresholds, weights, fixtures, and uncertainty.

### 52.2 Prompt-injection evaluation

- Detects attempts to override policy, impersonate authority, reveal hidden instructions, extract secrets, expand scope, invoke tools, change memory, or suppress audit.
- Handles direct, indirect, nested, cross-file, encoded, multilingual, split-token, role-play, data-poisoning, and tool-output injection.
- Records location, technique, target, requested capability, severity, confidence, and evidence.
- Suspicion does not require executing the content.
- Benign quoted or educational examples remain distinguishable from active instructions while still being isolated.

### 52.3 Malicious repository-content evaluation

- Treats source files, comments, documentation, configuration, generated files, archives, images, metadata, issues, logs, test fixtures, lockfiles, and model artifacts as untrusted content.
- Detects instruction injection, secret lures, path escape, unsafe links, build-hook abuse, dependency substitution, malicious macros, archive bombs, executable payloads, and evidence tampering.
- Inspection never executes content merely to classify it.
- Repository scope, file identity, snapshot hash, path, encoding, media type, and provenance remain explicit.
- Current exact repository evidence stays authoritative for repository-state claims, but it does not become operational authority.

### 52.4 Fabricated-evidence detection

- Requires stable evidence ID, source, locator, repository or dataset snapshot, content hash, provenance, collection method, validation, and timestamp.
- Cross-checks claims against exact source content, canonical artifacts, deterministic replay, and independent evidence when required.
- Distinguishes missing, stale, altered, simulated, modeled, inferred, contradictory, unverifiable, and fabricated evidence.
- Hashes establish identity and integrity, not truth or sufficiency by themselves.
- Evidence acceptance requires scope and claim agreement, not visual plausibility.

### 52.5 Permanent Evaluation

- Promotes only versioned fixtures, rubrics, expected results, adversarial cases, replay inputs, environment profiles, and evidence with stable identities.
- Preserves prior versions and failures; corrections supersede rather than erase history.
- Re-runs promoted evaluations when relevant policy, model, tool, repository, corpus, runtime, or adapter versions change.
- Supports expiry, revocation, privacy deletion, retention, and migration.
- “Permanent” means persistently governed and replayable, not infallible or immutable against correction.

### 52.6 Prompt-Injection Defense

- Separates instructions from data before interpretation.
- Prevents content from changing system/user intent, capability, tool authorization, repository roots, network policy, secret access, memory, approval, or output constraints.
- Requires typed tool calls, schema validation, least privilege, explicit authorization, and post-call validation.
- Propagates taint and provenance through summaries, translations, retrieval, tool outputs, and memory candidates.
- Denied content may be safely quoted or explained without being obeyed.

### 52.7 Repository-Content Defense

- Confines reads to the selected input or work repository; the application’s own source tree is not the default.
- Uses canonical paths, safe links, bounded windows, verified archives, type-aware parsing, and no-execution inspection.
- Blocks build hooks, scripts, macros, binary payloads, dependency installers, and external content resolution unless separately authorized in a sandbox.
- Repository content cannot authorize its own trust, execution, writeback, publication, memory promotion, or release.
- Quarantine preserves evidence, hashes, provenance, reason, and safe review paths.

## Defense pipeline

```text
select request and work repository -> classify instruction and content sources
-> retrieve exact bounded evidence -> evaluate answer and content
-> validate provenance and detect fabrication -> apply prompt-injection defense
-> apply repository-content defense -> emit bounded answer or denial
-> record permanent evaluation candidate and Podium receipt
```

An upstream deny is monotonic. A later quality score, successful test, human-readable explanation, or passing fixture cannot erase an injection, fabricated evidence, policy denial, root escape, secret exposure, or unknown-code risk.

## Evaluation fixture classes

Permanent Evaluation should include:

- Positive benign-content and well-grounded-answer cases.
- Negative direct and indirect injection cases.
- Boundary cases for long context, nested archives, encoded instructions, quoted examples, and partial evidence.
- Integration cases spanning repository retrieval, memory, tools, action cards, patches, tests, and release.
- Security cases for secrets, path escape, tool escalation, network enablement, evidence forgery, and audit bypass.
- Recovery cases for interrupted scans, quarantines, stale indexes, and superseded evidence.
- Determinism cases with shuffled file order, worker timing, and equivalent encodings.
- Certification cases with complete R12, MCRT, policy, content, evidence, and Podium records.

Fixture text must remain inert. A test that contains an injection is not permission to execute it.

## Admission gate

A PolicyDecision is admitted only when:

- Module, principal, role, capability, resource, answer, content, repository, snapshot, evidence, fixture, policy, approval, R12, MCRT, and Podium identities are stable.
- Evaluation rubrics and thresholds are versioned.
- Untrusted instructions remain data.
- Repository content remains confined and non-executing.
- Evidence is exact, current, provenance bound, and supports the claim.
- Missing, stale, contradictory, simulated, inferred, and fabricated evidence remain distinguishable.
- Permanent evaluation promotion is approved, replayable, retained, and revocable.
- No network, unknown-code execution, secret disclosure, root escape, hidden tool call, unapproved memory change, or audit bypass occurs.

The suite must not invent an answer score, injection finding, malicious-content result, evidence, fixture, approval, defense action, quarantine, or certification record.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Grounded answer, benign repository content, verified evidence, and complete policy receipt | Pass |
| Negative | Direct injection, malicious hook, fabricated evidence, secret lure, or unsupported answer claim | Expected deny/fail |
| Boundary | Maximum content, encoding depth, archive depth, evidence count, confidence threshold, or retention limit | Pass or explicit diagnostic |
| Integration | Evaluation, defense, repository, memory, tool, answer, fixture, and Podium identities agree | Pass |
| Security | Policy override, root escape, hidden execution, secret extraction, capability escalation, or audit bypass | Deny |
| Performance | Bounded scanning, evidence verification, rubric evaluation, and policy decision meet budgets | Pass within profile |
| Determinism | Reordered files and workers preserve findings, decisions, evidence order, and canonical tuple | Pass |
| Interoperability | Repository, parser, model, evidence, memory, tool, and evaluation adapters preserve semantics | Pass |
| Recovery | Interrupted evaluation resumes without lost findings, duplicate quarantine, or stale acceptance | Pass or explicit restart requirement |
| Certification | R12, MCRT, rubric, content, evidence, defense, and Podium records are complete | Pass |

## Optimization restrictions

Permitted optimization includes rule indexing, pure predicate caching, canonical content lookup, hash reuse for identical bytes, deterministic batch scanning, taint propagation, and short-circuiting after an irrevocable explicit denial.

Optimization must not decode and execute content, weaken taint, skip source verification, infer trust from file location, hide evaluation failures, remove audit or redaction, reorder conflict-sensitive rules, reuse stale evidence, promote fixtures without approval, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, evaluation preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, answer, content, injection, evidence, repository, defense, fixture, promotion, policy, approval, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; visual or textual agreement is not proof of latent coupling, answer truth, content safety, or evidence authenticity. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 52 is certifiable only when all seven scripts preserve no-network and no-process defaults, restricted resources, least privilege, explicit-deny precedence, human-controlled exceptions, complete audit, secret redaction, answer-quality grounding, prompt-injection isolation, repository-content confinement, evidence authenticity, governed permanent evaluation, R12/MCRT provenance, and named policy-decision emissions.
