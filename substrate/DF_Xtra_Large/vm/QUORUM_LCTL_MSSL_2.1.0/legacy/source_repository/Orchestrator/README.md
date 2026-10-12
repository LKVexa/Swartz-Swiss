# JA21 Suite 15 — Orchestrator

Independent JA Agent Language scripts for suite fan-out, deterministic fan-in, load order, conflict resolution, and synthesis.

## Language profile

- Language: JA Agent Language
- Profile: `ja.agent`
- Extension: `.jaa`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Memory posture: session-scoped with one-hour retention
- Capability posture: approved tool invocation only

The attached corpus contains specification-model compiler and runtime expectations. It does not establish that these scripts have been executed by a production JA Agent compiler or runtime.

## Files

| File | Sub-suite | Goal | Principal output |
| --- | --- | --- | --- |
| `15.1_Orchestrator_Suite_Fan_Out.jaa` | Suite fan-out | Dispatch only approved suites | Fan-out manifest and dispatch evidence |
| `15.2_Orchestrator_Deterministic_Fan_In.jaa` | Deterministic fan-in | Merge suite results in canonical order | Replay-verified merged result |
| `15.3_Orchestrator_Load_Order.jaa` | Load order | Load dependencies before consumers | Approved load-order ledger |
| `15.4_Orchestrator_Conflict_Resolution.jaa` | Conflict resolution | Resolve supported conflicts or preserve escalation | Resolution or `UNRESOLVED` evidence |
| `15.5_Orchestrator_Synthesis.jaa` | Synthesis | Publish a certified evidence-bearing synthesis | Final synthesis and MCRT receipt |

## Analytical ensemble

| Participant | Orchestrator responsibility |
| --- | --- |
| SOPHIA | Models goals and dependencies, aligns meanings, classifies conflicts, and produces the candidate synthesis |
| CHARLOTTE | Validates capabilities, policy, load order, replay invariants, precedence rules, and final certification |
| LANDON | Stages artifacts and evidence, dispatches suites, collects results, loads approved modules, and preserves deterministic ordering |
| Professor | Explains plans, merge behavior, conflicts, limitations, and repair paths without changing the certified result |
| Podium | Publishes manifests, audit history, canonical hashes, MCRT records, decisions, and the final synthesis receipt |

No participant may silently override a policy denial, discard a contradiction, fabricate missing evidence, or treat visible projection as proof of latent agreement.

## Common JA Agent contract

Every file independently declares:

1. `ja source 0.3` and `use Agent`.
2. `policy no_network`.
3. A stable identity and audited composite role.
4. A confidence-gated goal.
5. Session memory with bounded retention.
6. A finite step and tool budget.
7. Five role-specific tools requiring `tool.invoke:approved`.
8. Explicit authorization before tool execution.
9. `continue when policy_allows` before effects.
10. MCRT recording and deterministic termination.
11. A true capability-boundary assertion.

## Canonical pipeline

```text
suite registry
  -> validated dependency graph
  -> approved fan-out manifest
  -> bounded suite dispatch
  -> canonical result collection
  -> deterministic fan-in
  -> conflict classification and resolution
  -> evidence-bearing synthesis
  -> certification and Podium publication
```

## Sub-suite behavior

### 15.1 Suite fan-out

SOPHIA builds the task-to-suite plan. CHARLOTTE validates each target, capability, budget, and dependency. LANDON dispatches only the approved manifest. Professor explains exclusions and limitations. Podium records the manifest, dispatch order, request identity, and suite-level evidence references.

Fan-out is bounded. It must not create undeclared agents, exceed the tool budget, open network access, or delegate through an unapproved capability.

### 15.2 Deterministic fan-in

LANDON collects results by canonical suite identity, not completion time. SOPHIA aligns semantic fields without flattening contradictions. CHARLOTTE verifies replay invariants and rejects missing or duplicated identities. Professor explains the merge. Podium records the canonical ordering and tuple hashes.

Canonical fan-in key:

```text
(load_rank, suite_id, artifact_id, record_sequence, canonical_hash)
```

The same accepted input set must produce the same order, result, relation class, and MCRT tuple hash.

### 15.3 Load order

Load order follows a stable topological sort:

1. Required schemas and identity profiles.
2. Policy and capability definitions.
3. Shared runtime and service dependencies.
4. Data adapters and repositories.
5. Suite implementations.
6. UI, reporting, and publication layers.

Within the same dependency rank, order by canonical suite identifier and artifact hash. A dependency cycle is `UNRESOLVED` and blocks loading until repaired or explicitly approved through a separate human-controlled process.

### 15.4 Conflict resolution

Apply this precedence order without deleting the losing evidence:

1. Missing provenance or tolerance-crossing uncertainty -> `UNRESOLVED`.
2. Capability, security, or policy denial -> denial prevails.
3. Certified contradiction -> `CONTRADICTION` is preserved.
4. A triadic interaction that changes the pairwise result -> `HIGHER_ORDER`.
5. Compatible evidence with identical scope -> higher certification status, then higher confidence.
6. Equal status and confidence -> canonical tuple hash establishes deterministic presentation order, not factual superiority.
7. Any materially unresolved tie -> halt and escalate; do not guess.

Load order, agent identity, or completion time must never be used as an undocumented truth-precedence rule.

### 15.5 Synthesis

LANDON stages only resolved or explicitly classified evidence. SOPHIA produces a synthesis that preserves sources, uncertainty, contradictions, relation classes, and limitations. CHARLOTTE certifies the candidate against capability, policy, determinism, and replay gates. Professor produces the human-readable explanation. Podium publishes the synthesis and its full audit receipt.

Synthesis may summarize evidence but may not erase provenance, downgrade a denial, conceal an unresolved result, or convert model expectations into claims of production execution.

## Required validation matrix

| Class | Orchestrator test | Expected result |
| --- | --- | --- |
| Positive | Approved tools, valid manifests, complete evidence, valid termination | Pass |
| Negative | Unbounded capability or false capability-boundary assertion | Expected fail |
| Boundary | Maximum suite, step, tool, memory, and result counts | Pass or explicit boundary diagnostic |
| Integration | All five scripts preserve shared request and artifact identities | Pass |
| Security | Prompt injection, undeclared delegation, hidden network, or secret leakage | Deny |
| Performance | Bounded fan-out, sparse comparison, stable fan-in | Pass within declared budget |
| Determinism | Shuffled completion times yield identical canonical output | Pass |
| Interoperability | Results from compatible suite versions normalize without identity loss | Pass |
| Recovery | Interrupted runs resume without duplicated dispatch or records | Pass or explicit repair requirement |
| Certification | R12 and MCRT evidence are complete and replayable | Pass |

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, the Orchestrator must keep latent geometry, product-state separation, projection, semantic distance, uncertainty, provenance, and interaction order independent.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium outputs retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, tolerances, projection version, relation class, uncertainty, interaction order, provenance, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Do not synthesize visible agreement into latent coupling. Selective triadic escalation is permitted only for unresolved, contradictory, high-risk, or certification-critical clusters.

## Acceptance gate

Suite 15 is certifiable only when:

- Fan-out is bounded and capability-approved.
- Fan-in is independent of completion timing.
- Load order is dependency-valid and stable.
- Conflicts follow the documented precedence rules.
- Unresolved cases remain unresolved or are escalated.
- Synthesis preserves provenance, uncertainty, contradictions, and limitations.
- All tools remain within `tool.invoke:approved`.
- No hidden network or unknown-code execution occurs.
- MCRT and R12 replay preserve identity, policy, result, relation class, and tuple hash.
