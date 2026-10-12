# JA21 Suite 55 — Capability Manifests and Permissions

Four independent JA Security Policy Language scripts define capabilities,
command permissions, action scope, and policy-bound execution rights.

The separation is deliberate:

```text
capability != permission != scope != execution right
```

A principal can possess a valid capability while still lacking permission for a
specific command, exceeding the action's admitted scope, or lacking a current
policy-bound right to execute.

## Language profile

- Language: JA Security Policy Language
- Profile: `ja.security`
- Extension: `.jasec`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Runtime posture: fail closed, no network by default, no process authority by
  default, explicit-deny precedence, privileged-effect audit, and secret
  redaction

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Security Policy Language examples spanning capabilities,
scope, identities, principals, roles, groups, delegation, attenuation,
revocation, time-bounded permission, allow/deny/require rules, human approval,
policy composition, conflict resolution, static proof, runtime enforcement,
sandboxing, auditing, redaction, explanations, and fail-closed behavior.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level policy contracts. Production enforcement requires the
intended JA Security compiler/runtime plus trusted identity, approval,
revocation, sandbox, command-dispatch, and audit-ledger adapters.

## Files

| File | Sub-suite | Restricted resource | Governed commitment |
| --- | --- | --- | --- |
| `55.1_Capabilities.jasec` | Capabilities | `CapabilityManifest` | Publishing a validated capability manifest |
| `55.2_Command_Permissions.jasec` | Command permissions | `CommandPermissionRequest` | Granting permission for an exact command contract |
| `55.3_Action_Scope.jasec` | Action scope | `ActionScopeRequest` | Expanding the resources, effects, duration, or boundary of an action |
| `55.4_Policy_Bound_Execution_Rights.jasec` | Policy-bound execution rights | `ExecutionRightRequest` | Exercising a current, fully resolved execution right |

Each file is independently loadable and emits one named MCRT policy-decision
artifact.

## Analytical ensemble

Every script defines the shared `CapabilityPermissionEnsemble` role:

| Participant | Suite 55 responsibility |
| --- | --- |
| SOPHIA | Interprets intent, principal context, requested command or action, target resources, effects, and expected outcome |
| CHARLOTTE | Validates manifest identity, authority, permission predicates, scope, approval, revocation, policy composition, conflicts, and evidence |
| LANDON | Enforces the resolved decision, narrows effects, confines targets, blocks denial, and prevents execution-right reuse |
| Professor | Explains the decision, risk, failed predicate, unresolved evidence, limitation, and least-privilege repair path |
| Podium | Records principal, capability, command, scope, policy, approval, decision, enforcement result, hashes, and R12/MCRT provenance |

The role receives five explicit analytical grants plus one narrowly scoped
sub-suite evaluation capability. It does not receive ambient network, process,
filesystem, repository, tool, model, secret, or approval authority.

## Common policy contract

All four scripts independently declare:

1. `ja source 0.3`, a unique module, `use Security`, and `policy no_network`.
2. One named worker principal.
3. The five SOPHIA–CHARLOTTE–LANDON–Professor–Podium grants.
4. One narrowly scoped evaluation grant.
5. One restricted classified resource.
6. Network and process denial by default.
7. Resource denial when the principal lacks the ensemble role.
8. Conditional resource admission only for the exact ensemble role.
9. Human approval for publication, permission grant, scope expansion, or
   execution-right exercise.
10. Complete auditing of privileged effects.
11. Redaction of secret values.
12. `explicit_deny_wins` conflict resolution.
13. A no-secret-leak assertion.
14. A deterministic MCRT policy-decision emission.

The `allow` rules admit evaluation of the named restricted resource. They do
not themselves authorize the downstream process, command, filesystem, network,
tool, or model effect being evaluated.

## Layered authorization model

An execution request is admitted only if all predicates resolve positively:

```text
Admit(request) =
    valid_identity
    AND active_role
    AND valid_capability_manifest
    AND matching_command_permission
    AND request_within_action_scope
    AND current_policy_bound_execution_right
    AND required_approval_valid
    AND no_active_revocation
    AND sandbox_can_enforce
    AND evidence_complete
    AND no_explicit_deny
```

Missing, stale, contradictory, malformed, unverifiable, or unresolved evidence
fails closed. Human approval can satisfy a declared `require` rule but cannot
erase an explicit deny or create an undeclared capability.

## 55.1 Capabilities

A capability manifest should identify:

- manifest ID, schema version, issuer, subject, and principal;
- capability name and semantic version;
- resource selectors and permitted effect classes;
- purpose, constraints, and protection domain;
- issue time, not-before time, expiry, and maximum use count;
- delegation permission and maximum delegation depth;
- attenuation rules;
- revocation handle and current revocation evidence;
- source, policy, and canonical manifest hashes; and
- approval and provenance receipts.

Manifest rules:

- absence of a capability is denial;
- wildcard resources or effects require a separately declared policy and
  approval and remain subject to explicit deny;
- derived capabilities can only narrow the parent;
- a child cannot outlive, out-scope, or exceed the delegation depth of its
  parent;
- any identity-bearing change creates a new manifest hash;
- revocation propagates to descendants and invalidates cached decisions; and
- publication does not activate a permission or execution right.

Display names, successful prior use, familiar tool names, installed software,
or repository content are not capability evidence.

## 55.2 Command permissions

A command-permission request should bind:

- exact executable or trusted command identity and hash;
- argument vector as structured values rather than a concatenated shell string;
- working directory and repository/worktree identity;
- allowed environment-variable names and redacted secret references;
- permitted standard-input source and output destinations;
- target paths, path modes, file types, and mutation class;
- network, process, subprocess, tool, model, and device effects;
- time, memory, output-size, and concurrency budgets;
- expected result, side effects, rollback, and idempotency class; and
- principal, capability, scope, policy, approval, and request hashes.

Command permissions deny shell metacharacter reinterpretation, argument
injection, path traversal, unresolved links, executable substitution, ambient
environment inheritance, hidden subprocesses, undeclared downloads, and
permission reuse for a changed command.

Read-only inspection, reversible workspace mutation, privileged mutation,
network access, package installation, external messaging, release signing, and
destructive actions are distinct permission classes. A grant for one is not a
grant for another.

## 55.3 Action scope

Action scope is the bounded set of resources and effects to which a permission
may apply. It should include:

- exact repository, worktree, directory, file, service, model, job, or ledger
  selectors;
- allowed operations and denied operations;
- recursion depth, traversal boundary, and symbolic-link behavior;
- data classifications and maximum input/output sizes;
- namespace, tenant, user, and protection-domain boundaries;
- time window, use count, concurrency, and resource budgets;
- local, offline, or explicitly approved network destinations;
- required sandbox and isolation profile;
- allowed evidence, logs, receipts, and retention behavior; and
- parent scope and attenuation lineage.

Normalization occurs before comparison. Relative paths are resolved against the
declared root, and case, separators, links, mount points, and platform aliases
cannot widen scope.

Scope expansion is a new privileged action requiring fresh policy evaluation
and human approval. LANDON may reduce scope automatically but cannot expand it.

## 55.4 Policy-bound execution rights

An execution right is the final, short-lived commitment that joins the exact:

- principal and active role;
- capability-manifest hash;
- command-permission hash;
- action-scope hash;
- composed-policy hash and decision;
- approval receipt and validity interval;
- command/action request hash;
- target and expected-state hashes;
- sandbox profile and resource lease;
- use counter, nonce, deadline, and revocation state; and
- Podium decision receipt.

Execution rights are single-use unless a bounded use count is explicit. They
are non-transferable, non-amplifying, purpose-bound, time-bound, and invalid
after any material input changes.

The enforcement point must revalidate the right immediately before the effect.
Time-of-check/time-of-use drift, revocation, changed target state, expired
approval, policy update, sandbox failure, or hash mismatch denies execution and
emits a new decision. A right cannot be converted into a general bearer token.

## Command decision flow

```text
request
-> canonicalize principal, command, arguments, target, and expected state
-> verify capability manifest and delegation lineage
-> evaluate exact command permission
-> normalize and intersect action scopes
-> compose policies with explicit-deny precedence
-> bind required human approval
-> issue short-lived execution right
-> revalidate at the enforcement point
-> execute in the declared sandbox
-> compare observed effects with admitted effects
-> Podium audit and MCRT decision
```

If the effect outcome is unknown, the right is not replayed blindly. The system
reconciles the target state, request ID, use counter, enforcement record, and
Podium receipt before deciding whether another right may be issued.

## Conflict resolution

`explicit_deny_wins` is monotonic:

- an allow cannot erase a deny;
- human approval cannot erase a deny;
- a broader parent capability cannot widen an attenuated child;
- a role cannot manufacture a missing capability;
- trust or familiarity cannot replace identity and provenance;
- a successful prior command cannot authorize a changed command;
- repository text cannot grant authority to itself;
- a dashboard or explanation cannot mutate policy state; and
- missing evidence cannot be converted into an implicit allow.

When policies differ in scope, the effective allowed scope is their
intersection. Denied effects are the union of applicable denies. Requirements
are cumulative unless a policy explicitly and validly defines an alternative.

## Audit and explanation contract

Podium records, with secret redaction:

- decision ID and canonical request hash;
- principal, role, group, and protection domain;
- capability, delegation, attenuation, and revocation lineage;
- command identity, structured arguments, target, and expected state;
- effective action scope;
- policy identities, versions, rules, conflicts, and proof obligations;
- required and accepted approval identity;
- execution-right identity, nonce, use count, and validity;
- decision, reason codes, and Professor explanation;
- enforcement point, sandbox, observed effects, and result; and
- source, R12, MCRT, and previous-record hashes.

Audit failure prevents a privileged mutation from being reported as complete.
Audit records must not contain secret values, unrestricted environment data,
private prompt content, or unbounded repository content.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Active least-privilege capability, exact command permission, bounded scope, current right, and complete evidence | Pass |
| Negative | Missing capability, changed executable, argument mismatch, out-of-scope target, expired right, or absent approval | Expected deny |
| Boundary | Exact expiry, final use, maximum path depth, output limit, resource ceiling, or delegation-depth edge | Pass or explicit boundary denial |
| Integration | Manifest, permission, scope, execution right, sandbox, enforcement, and Podium identities agree | Pass |
| Security | Wildcard escalation, confused deputy, command injection, path escape, hidden network, secret leak, replay, or audit bypass | Deny |
| Recovery | Interrupted or unknown effect reconciles without duplicate mutation or right reuse | Pass or explicit operator action |
| Performance | Indexed policy lookup and deterministic scope intersection stay within the declared decision budget | Pass within budget |
| Determinism | Repeated evaluation preserves canonicalization, conflict result, effective scope, and MCRT tuple | Pass |
| Interoperability | Identity, path, sandbox, approval, command, and ledger adapters preserve JA policy semantics | Pass |
| Certification | Static proof, runtime decision, enforcement evidence, redaction, audit, and provenance are complete | Pass |

## Optimization restrictions

Permitted optimizations include canonical identity lookup, rule indexing, pure
predicate caching, stable scope normalization, deterministic batch evaluation,
hash reuse, and short-circuiting after an irrevocable explicit denial.

Optimization must not:

- infer a capability or permission;
- widen scope;
- merge principals, roles, tenants, repositories, or protection domains;
- reorder conflict-sensitive rules;
- skip approval, revocation, or enforcement-point revalidation;
- reuse a right across changed hashes or state;
- remove sandboxing, auditing, explanation, or redaction;
- delay revocation propagation; or
- change stable R12/MCRT identities.

## Smithson 8S and R12 preservation

When Smithson 8S Coupled Mechanics records are governed, capabilities,
permissions, scopes, execution rights, and Podium receipts preserve latent
geometry, projected geometry, product-state separation, semantic distance,
uncertainty, provenance, projection version, tolerance profile, and interaction
order as independent evidence.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 evidence retains the fifth-coordinate meaning, `eta_ind`, `Delta_8S`,
`g5`, `delta8`, `g3`, `gJ`, phase/support state, uncertainty, provenance,
relation class, interaction order, limitations, and exact policy/request
identity. If `g5 > tol5` while `g3 <= tol3`, the result remains
`PROJECTION_ONLY`; visible overlap is not evidence of shared authority,
permission, scope, or trust.

Smithson 8S is treated as a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 55 is certifiable only when all four MCRT decisions preserve stable
identity, least privilege, bounded scope, attenuation, revocation, current
approval, default denial, explicit-deny precedence, enforcement-point
revalidation, sandbox confinement, redaction, audit, deterministic evaluation,
and matching R12/MCRT provenance.
