# JA21 Suite 44 — Capability and Security Plane

Nine independent JA Security Policy Language scripts for capability manifests, permissions, trust boundaries, approvals, policy enforcement, the Capability Plane, Security, the Trust Plane, and the Evaluation Suite.

## Language profile

- Language: JA Security Policy Language
- Profile: `ja.security`
- Extension: `.jasec`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `PolicyDecision`
- Runtime posture: fail closed, no network by default, explicit-deny precedence, complete audit, and secret redaction

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Security Policy Language examples spanning capability, scope, role, delegation, approval, revocation, trust-relevant sandboxing, policy composition, static proof, runtime enforcement, redaction, audit, and conflict resolution.

The corpus status is `provisional-generated-not-production-compiler-validated`. These files therefore define specification-level policy contracts. A conforming JA Security compiler, policy-decision runtime, identity provider, approval service, enforcement adapters, and audit ledger are required for production enforcement.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `44.1_Capability_and_Security_Plane_Capability_Manifests.jasec` | Capability manifests | Validates, scopes, and gates publication of capability declarations | Capability-manifest MCRT decision |
| `44.2_Capability_and_Security_Plane_Permissions.jasec` | Permissions | Evaluates bounded grants and denies implicit privilege | Permission MCRT decision |
| `44.3_Capability_and_Security_Plane_Trust_Boundaries.jasec` | Trust boundaries | Classifies and gates individual boundary crossings | Boundary-transition MCRT decision |
| `44.4_Capability_and_Security_Plane_Approvals.jasec` | Approvals | Verifies approval identity, scope, freshness, and commitment | Approval MCRT decision |
| `44.5_Capability_and_Security_Plane_Policy_Enforcement.jasec` | Policy enforcement | Applies resolved policy and controls exceptional overrides | Enforcement MCRT decision |
| `44.6_Capability_and_Security_Plane_Capability_Plane.jasec` | Capability Plane | Coordinates capability lifecycle without widening grants | Capability-plane MCRT decision |
| `44.7_Capability_and_Security_Plane_Security.jasec` | Security | Supplies the suite-wide protective control surface | Security MCRT decision |
| `44.8_Capability_and_Security_Plane_Trust_Plane.jasec` | Trust Plane | Coordinates trust state, attenuation, and promotion | Trust-plane MCRT decision |
| `44.9_Capability_and_Security_Plane_Evaluation_Suite.jasec` | Evaluation Suite | Exercises positive, negative, boundary, and adversarial policy cases | Evaluation MCRT decision |

Each file is independently loadable and emits one named MCRT policy-decision artifact.

## Analytical ensemble

| Participant | Suite 44 responsibility |
| --- | --- |
| SOPHIA | Interprets requested intent, actor context, resource sensitivity, desired effect, and expected outcome |
| CHARLOTTE | Validates manifest structure, identity, scope, rules, boundaries, approvals, conflicts, proof obligations, and evidence completeness |
| LANDON | Enforces the accepted decision, attenuates privileges, isolates effects, blocks denied operations, and preserves revocation |
| Professor | Explains the decision, risk, violated rule, uncertainty, limitations, and bounded repair path |
| Podium | Records source and policy hashes, principal, role, capability, resource, approval, R12/MCRT evidence, enforcement result, and certification status |

Every script grants the five explicit ensemble capabilities `sophia.interpret`, `charlotte.validate`, `landon.enforce`, `professor.explain`, and `podium.audit`, plus one narrowly scoped sub-suite capability.

## Common security contract

Every script independently declares:

1. `ja source 0.3`, `use Security`, and a stable module identity.
2. `policy no_network`.
3. One named worker principal and the shared `CapabilitySecurityEnsemble` role.
4. One restricted classified resource.
5. Default denial for network and process effects.
6. Explicit denial when the principal lacks the ensemble role.
7. Conditional admission only for the named restricted resource.
8. Human approval for publication, grant, crossing, commitment, override, activation, exception, promotion, or certification.
9. Complete privileged-effect auditing.
10. Secret-value redaction.
11. `explicit_deny_wins` conflict resolution.
12. A no-secret-leak assertion.
13. A named MCRT policy-decision emission.

Expected compiler route:

```text
source -> parse -> AST -> identity, role, capability, and resource resolution
-> policy composition -> deny/require/allow evaluation -> approval binding
-> R12 lowering -> runtime enforcement -> redacted audit
-> deterministic MCRT PolicyDecision
```

## Distinct but coupled layers

The similarly named sub-suites are intentionally separate:

- **Capability manifests** validate one declarative capability document. The **Capability Plane** coordinates the lifecycle of many accepted manifests, including activation, attenuation, delegation, revocation, and expiry.
- **Trust boundaries** evaluate one attempted crossing between protection domains. The **Trust Plane** maintains and composes trust state across identities, resources, adapters, runtimes, and time.
- **Policy enforcement** applies a resolved decision at an effect point. **Security** is the broader control surface that composes identity, capability, boundary, approval, redaction, audit, and enforcement outcomes.
- The **Evaluation Suite** never grants production authority merely because a test passes; it produces evidence for a separately governed certification decision.

## Sub-suite contracts

### 44.1 Capability manifests

- Manifest identity, issuer, subject, capability name, resource scope, allowed effects, constraints, issue time, expiry, delegation depth, revocation handle, schema version, and source hash are explicit.
- Wildcards, ambient authority, unbounded delegation, missing expiry, unknown effects, and scope expansion are denied.
- Canonicalization must not alter the capability’s semantic scope.
- Publication requires validation, issuer authority, approval, stable policy identity, and a deterministic manifest hash.

### 44.2 Permissions

- Permission is derived from a valid principal, active role, admitted capability, matching resource, allowed effect, current time, and satisfied conditions.
- Absence of a deny is not an allow.
- Grants are least privilege, purpose bound, time bound, attenuable, revocable, and non-transferable unless delegation is explicit.
- Cache reuse is prohibited after policy, identity, scope, approval, revocation, or resource-version changes.

### 44.3 Trust boundaries

- Each source domain, destination domain, principal, resource, data classification, adapter, requested effect, and crossing direction is identified.
- Data is validated and reclassified at the boundary; secrets and executable payloads are not silently transported.
- Boundary crossings cannot inherit source-side authority in the destination domain.
- Missing provenance, ambiguous identity, stale attestation, or incompatible policy fails closed.

### 44.4 Approvals

- Approver identity, authority, separation of duties, request hash, resource, effect, scope, justification, issue time, expiry, nonce, and revocation status are verified.
- Approval applies to exactly one stable request or explicitly bounded set.
- Self-approval, replay, approval laundering, expired approval, and approval for changed content are denied.
- Approval satisfies only the declared requirement; it cannot override an explicit deny.

### 44.5 Policy enforcement

- Enforcement consumes the exact policy decision, principal, capability, resource, effect, approval, and request hashes that were evaluated.
- Time-of-check/time-of-use drift causes re-evaluation.
- Explicit deny, missing requirement, contradiction, unresolved condition, or incomplete evidence blocks the effect.
- Overrides are exceptional, approved, time bounded, fully audited, and incapable of bypassing mandatory safety invariants.

### 44.6 Capability Plane

- Capability issuance, activation, attenuation, delegation, suspension, revocation, expiry, and garbage collection preserve stable identities.
- Derived capabilities can only narrow the parent’s resources, effects, duration, delegation depth, and constraints.
- Revocation propagates deterministically to descendants and cached decisions.
- Plane state is replayable from ordered, hash-linked lifecycle records.

### 44.7 Security

- Security composes identity, classification, sandbox, secret, network, process, data-retention, deletion, tool, and model-access policy.
- Controls remain fail closed when a component is unavailable.
- Security exceptions never erase the original denial or supporting evidence.
- Output decisions are explainable, redacted, deterministic, and bound to their enforcement result.

### 44.8 Trust Plane

- Trust is evidence backed, scoped, time varying, and specific to a principal-resource-effect relation.
- Attestations declare issuer, subject, claim, measurement, policy, validity interval, provenance, and revocation.
- Trust promotion requires fresh compatible evidence and cannot be inferred from familiarity, successful execution, or visual plausibility.
- Contradictory, stale, missing, or unverifiable evidence produces deny or unresolved, never silent promotion.

### 44.9 Evaluation Suite

- Positive, negative, boundary, integration, security, recovery, performance, determinism, interoperability, and certification fixtures are represented.
- Fixtures pin input, policy, expected decision, diagnostic, evidence, and canonical output identity.
- Mutation and adversarial cases cover privilege escalation, confused deputy, stale approval, replay, revocation lag, scope widening, secret leakage, sandbox escape, and audit bypass.
- Evaluation is isolated from production authority and cannot mutate live policy or trust state.

## Recommended decision order

```text
capability manifests -> permissions -> trust boundaries -> approvals
-> policy enforcement -> Capability Plane -> Security -> Trust Plane
-> Evaluation Suite
```

An upstream deny is monotonic: a downstream allow, approval, trust score, successful effect, or passing test cannot erase it. Any change to the principal, capability, resource, effect, boundary, approval, policy, trust evidence, or request hash requires a new decision.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Valid least-privilege capability, matching scope, current approval, and complete evidence | Pass |
| Negative | Missing capability, wrong role, implicit permission, expired approval, or untrusted boundary | Expected deny |
| Boundary | Exact expiry, delegation-depth limit, scope edge, classification edge, or approval timeout | Pass or explicit boundary denial |
| Integration | Manifest, permission, boundary, approval, enforcement, trust, and audit identities agree | Pass |
| Security | Capability escalation, confused deputy, replay, secret leak, sandbox escape, or audit bypass | Deny |
| Recovery | Interrupted evaluation resumes without duplicate grant or loss of revocation | Pass or explicit restart requirement |
| Performance | Indexed lookup and decision evaluation meet declared budgets without semantic change | Pass within profile |
| Determinism | Repeated evaluation preserves rule order, conflict result, and canonical MCRT tuple | Pass |
| Interoperability | Identity, approval, policy, sandbox, and ledger adapters preserve JA semantics | Pass |
| Certification | R12, MCRT, approval, enforcement, redaction, audit, and provenance evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes canonical principal/resource lookup, rule indexing, pure predicate caching, deterministic batch evaluation, hash reuse, and short-circuiting after an irrevocable explicit denial.

Optimization must not reorder conflict-sensitive rules, widen capability scope, infer permission, skip approval, delay revocation, cross a trust boundary without revalidation, weaken sandboxing, remove auditing or redaction, reuse a decision across mismatched hashes, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, policy evaluation preserves latent geometry, projected geometry, product-state separation, semantic distance, uncertainty, provenance, phase, and interaction order as independent evidence:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the declared meaning of the fifth coordinate, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, uncertainty, provenance, interaction order, relation class, policy/request identity, approval, conflict result, enforcement result, and limitations.

If `g5 > tol5` while `g3 <= tol3`, the result is `PROJECTION_ONLY`; apparent visual overlap is not evidence of shared trust, permission, or capability. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 44 is certifiable only when all nine scripts preserve stable identities, least privilege, bounded scope, default deny, explicit-deny precedence, current approval, trust-boundary revalidation, revocation, redaction, audit, deterministic enforcement, and matching R12/MCRT provenance.
