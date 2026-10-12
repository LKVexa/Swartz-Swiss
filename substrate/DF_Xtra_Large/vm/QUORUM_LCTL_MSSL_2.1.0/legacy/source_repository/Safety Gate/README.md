# JA21 Suite 28 — Safety Gate

Seven independent JA Security Policy Language scripts for AST, lint, archive, path, execution, network, and output validation.

## Language profile

- Language: JA Security Policy Language
- Profile: `ja.security`
- Extension: `.jasec`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `PolicyDecision`
- Runtime posture: fail closed, no network by default, explicit deny precedence, complete audit, and secret redaction

The attached corpus was gzip-validated. It defines principals, roles, capabilities, classified resources, allow and deny rules, human approval, fail-closed behavior, sandbox policy, runtime enforcement, conflict resolution, redaction, audit, static proof, R12 compiler evidence, MCRT runtime evidence, and policy-decision emission.

The corpus is explicitly provisional and has not been executed against a production JA Security compiler. These files are specification-level policies; a conforming policy engine and enforcement adapters are required for runtime protection.

## Files

| File | Sub-suite | Safety responsibility | Principal output |
| --- | --- | --- | --- |
| `28.1_Safety_Gate_AST.jasec` | AST | Admits only structurally valid, provenance-bound abstract syntax trees | AST policy MCRT decision |
| `28.2_Safety_Gate_Lint.jasec` | Lint | Enforces required static rules and controls overrides | Lint policy MCRT decision |
| `28.3_Safety_Gate_Archive.jasec` | Archive | Inspects archives before any separately approved extraction | Archive policy MCRT decision |
| `28.4_Safety_Gate_Path.jasec` | Path | Canonicalizes and confines filesystem targets | Path policy MCRT decision |
| `28.5_Safety_Gate_Execution.jasec` | Execution | Evaluates process requests and requires approval before execution | Execution policy MCRT decision |
| `28.6_Safety_Gate_Network.jasec` | Network | Denies network by default and gates an explicit approved connection | Network policy MCRT decision |
| `28.7_Safety_Gate_Output_Validation.jasec` | Output Validation | Validates candidate outputs before approved publication | Output policy MCRT decision |

## Analytical ensemble

| Participant | Safety Gate responsibility |
| --- | --- |
| SOPHIA | Interprets intent, context, requested effects, data classifications, and expected outputs |
| CHARLOTTE | Validates structure, rules, paths, capabilities, approvals, schemas, policy conflicts, and evidence completeness |
| LANDON | Enforces the accepted decision, confines effects, controls lifecycle boundaries, and blocks denied operations |
| Professor | Explains decisions, violated rules, risk, uncertainty, limitations, and safe repair paths |
| Podium | Records source and policy hashes, R12/MCRT evidence, inputs, rules, approval identity, decision, provenance, and certification status |

Each role grants the five explicit ensemble capabilities `sophia.interpret`, `charlotte.validate`, `landon.enforce`, `professor.explain`, and `podium.audit`, plus the sub-suite inspection capability.

## Common security contract

Every file independently declares:

1. `ja source 0.3`, `use Security`, and a stable module identity.
2. `policy no_network`.
3. A named Safety Gate principal.
4. A `SafetyGateEnsemble` role with least-privilege grants.
5. One restricted classified resource or request.
6. Network denial by default.
7. A conditional allow rule for the classified gate input.
8. Human approval for the gate's privileged release, override, extraction, write, execution, connection, or publication effect.
9. Complete privileged-effect auditing.
10. Secret-value redaction.
11. `explicit_deny_wins` conflict resolution.
12. A no-secret-leak assertion.
13. A named MCRT policy-decision emission.

Expected compiler route:

```text
source -> parse -> AST -> identity, role, capability, and resource resolution
-> policy composition -> conflict and proof evaluation
-> R12 lowering -> runtime enforcement decision
-> redacted audit record -> MCRT PolicyDecision
```

## Gate order

The recommended order is:

```text
AST -> lint -> archive -> path -> execution -> network -> output validation
```

An upstream denial blocks all downstream effects. A downstream pass cannot erase an upstream denial, contradiction, unresolved requirement, missing approval, or incomplete evidence.

## Sub-suite contracts

### 28.1 AST

- Source bytes, language/profile, parser version, source hash, encoding, and provenance are present.
- The AST is complete, typed where required, span-preserving, and free of unresolved or forbidden nodes.
- Parse recovery cannot silently convert malformed input into an admitted tree.
- External code, macros, imports, annotations, and embedded payloads remain inert during inspection.
- AST release requires a stable semantic hash and explicit gate decision.

### 28.2 Lint

- The lint profile, rule versions, severity mapping, suppressions, and exceptions are pinned.
- Required security, correctness, determinism, policy, resource, and provenance rules run.
- Errors block; warnings and informational diagnostics remain visible.
- Suppression and override require identity, justification, scope, expiration, and approval.
- Autofix cannot run unless separately authorized and followed by complete revalidation.

### 28.3 Archive

- Format is identified from magic bytes rather than filename alone.
- Entry names, declared sizes, compressed sizes, ratios, nesting depth, total expansion, checksums, encryption, links, and special files are inspected.
- Absolute paths, parent traversal, device files, alternate streams, unsafe links, duplicate normalized names, and archive bombs are denied.
- Inspection never executes content.
- Extraction, when separately approved, occurs into a new confined destination and reuses validated entry identities.

### 28.4 Path

- Input paths are decoded, normalized, canonicalized, and resolved against one approved root.
- Absolute paths, root escape, parent traversal, unsafe symlinks, hardlinks, mount transitions, device paths, reserved names, and ambiguous case collisions are denied.
- Parent and final target are revalidated at effect time to resist time-of-check/time-of-use races.
- Writes use explicit targets and atomic promotion.
- Broad roots, unresolved variables, globs, and implicit current directories are not accepted as destructive targets.

### 28.5 Execution

- Executable, package, interpreter, arguments, environment, working directory, input hashes, capabilities, and runtime profile are pinned.
- Unknown executables, shell expansion, injected arguments, unapproved libraries, self-modifying code, privilege escalation, and sandbox escape are denied.
- CPU, memory, process, file, output, time, and device limits are explicit.
- Approval identity and scope are checked immediately before launch.
- Exit status, signals, stdout/stderr hashes, resource usage, outputs, and diagnostics are recorded.

### 28.6 Network

- Network remains denied unless one request is explicitly admitted and approved.
- Scheme, protocol, method, hostname, resolved addresses, port, TLS policy, certificate identity, redirects, request size, response size, timeout, and purpose are declared.
- Loopback, link-local, private, multicast, broadcast, metadata-service, rebinding, proxy-bypass, and disallowed DNS results are denied unless a narrower policy explicitly permits them.
- Redirects and every new resolution repeat the complete policy check.
- Credentials are referenced securely, scoped narrowly, redacted, and never logged.

### 28.7 Output Validation

- Output path, type, schema, size, count, encoding, media format, hashes, provenance, and expected identity are declared.
- Files are rescanned for secrets, executable payloads, unsafe links, traversal names, malformed structures, and policy-prohibited content.
- Required fields, checksums, manifests, receipts, and deterministic ordering are validated.
- Publication uses atomic promotion from an isolated staging area.
- Failed, partial, stale, untrusted, or mismatched output cannot be relabeled as certified.

## Admission gate

A candidate passes the Safety Gate only when:

- Source, parser, policy, rule, principal, role, capability, resource, request, adapter, and replay identities are stable.
- All required evidence, hashes, schemas, bounds, and provenance are present.
- No explicit deny, contradiction, unresolved condition, missing approval, or expired grant remains.
- Requested effects are within least-privilege scope.
- Secret redaction and audit recording are active.
- The final decision is deterministic and fail closed.
- R12, MCRT, enforcement, approval, and output identities describe the same request.

The gate must not infer permission from missing policy, absence of a diagnostic, a friendly filename, successful parsing, or visual plausibility.

## Validation matrix

| Class | Safety Gate test | Expected result |
| --- | --- | --- |
| Positive | Valid structure, rules, archive, path, approved effects, output, and evidence | Pass |
| Negative | Invalid AST, blocking lint, archive bomb, traversal, unknown execution, denied network, or malformed output | Expected deny |
| Boundary | Maximum archive size, exact path root, exact quota, timeout, redirect, or output-size limit | Pass or explicit boundary denial |
| Integration | All seven gates preserve request, resource, approval, decision, and evidence identities | Pass |
| Security | Secret leak, capability escalation, sandbox escape, DNS rebinding, symlink race, payload execution, or audit bypass | Deny |
| Performance | Static checks, archive inspection, canonicalization, policy evaluation, and output validation meet declared budgets | Pass within profile |
| Determinism | Repeated evaluation preserves rule order, conflict result, decision, and canonical MCRT tuple | Pass |
| Interoperability | Parsers, linters, archive readers, path adapters, sandboxes, network adapters, and validators preserve policy semantics | Pass |
| Recovery | Interrupted evaluation resumes without duplicated effects or loss of an earlier denial | Pass or explicit restart requirement |
| Certification | R12, MCRT, approvals, audit, redaction, policy, and enforcement evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes rule indexing, pure predicate caching, canonical resource lookup, deterministic batch inspection, hash reuse, and short-circuiting after an irrevocable explicit denial.

Optimization must not reorder conflict-sensitive rules, weaken an explicit deny, skip approval, remove auditing or redaction, reuse evidence across mismatched hashes, change principal/capability scope, introduce a network or execution effect, erase diagnostics, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, the Safety Gate preserves latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, policy/request identity, conflict result, approval, audit status, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Visual overlap or apparent output validity is not proof of latent coupling. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 28 is certifiable only when all seven scripts preserve no-network policy, least-privilege roles, restricted resources, default deny, required human approval, explicit-deny precedence, auditing, redaction, fail-closed decisions, R12/MCRT provenance, and named policy-decision emissions.
