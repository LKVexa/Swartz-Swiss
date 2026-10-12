# JA21 Suite 14 — Plug

Individual JA Service and Protocol Language scripts for the Plug suite.

## Language profile

- Language: JA Service and Protocol Language
- Profile: `ja.service`
- Extension: `.jasp`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: explicit-only
- Execution posture: capability-gated and deterministic

The attached source corpus describes specification-model expectations. It does not claim that these scripts have been executed by a production JA Service compiler or runtime.

## Files

| File | Sub-suite | Endpoint | Capability | Purpose |
| --- | --- | --- | --- | --- |
| `14.1_Plug_Interfaces.jasp` | Interfaces | `negotiate` | `interface.negotiate` | Negotiate typed request and response contracts |
| `14.2_Plug_Runtimes.jasp` | Runtimes | `activate` | `runtime.activate` | Bind an artifact to an approved runtime profile |
| `14.3_Plug_Data_Adapters.jasp` | Data adapters | `translate` | `data.adapt` | Convert between declared schemas while retaining provenance |
| `14.4_Plug_UI_Layers.jasp` | UI layers | `render` | `ui.render` | Present validated service state and evidence |
| `14.5_Plug_Execution.jasp` | Execution | `dispatch` | `execution.run` | Dispatch an authorized command with declared effects |
| `14.6_Plug_Endpoints.jasp` | Endpoints | `resolve` | `endpoint.discover` | Resolve compatible services and transports |

## Analytical ensemble

| Participant | Responsibility |
| --- | --- |
| SOPHIA | Interprets intent, contracts, mappings, effects, compatibility, and authorization |
| CHARLOTTE | Validates schemas, transitions, capabilities, policy, accessibility, security, and replay invariants |
| LANDON | Binds runtimes, operates adapters, renders UI contracts, dispatches authorized work, and reports transport state |
| Professor | Explains assumptions, service behavior, limitations, and repair paths |
| Podium | Publishes compatibility reports, provenance, hashes, R12/MCRT references, and operator-visible receipts |

No participant may silently override a denial. Missing provenance, an invalid state transition, an undeclared capability, or an `UNRESOLVED` decision prevents execution.

## Recommended execution order

1. Run `14.1_Plug_Interfaces.jasp` to negotiate the caller and message contracts.
2. Run `14.6_Plug_Endpoints.jasp` to resolve an approved local, remote, or offline transport.
3. Run `14.3_Plug_Data_Adapters.jasp` when source and target schemas differ.
4. Run `14.2_Plug_Runtimes.jasp` to bind the approved artifact hash to its runtime profile.
5. Run `14.4_Plug_UI_Layers.jasp` to present service state, evidence, and repair guidance.
6. Run `14.5_Plug_Execution.jasp` only after SOPHIA authorizes the declared intent and CHARLOTTE closes every policy gate.

## Common service contract

Every script independently declares:

- A module and `Service` import.
- `policy explicit_network`.
- Typed request and response messages.
- One named streaming endpoint.
- One explicit authorization capability.
- A finite deadline.
- A bounded retry rule.
- A stable request identifier as its idempotency key.
- An `Open -> Closed` protocol transition.
- A transition-validity assertion.
- A JSON compatibility-report emission.

The execution script uses `retry max 0` to prevent an automatic second execution of a command with effects.

## Required corpus record layers

Compiler, runtime, certification, and Podium outputs should preserve all eight corpus layers:

1. Source
2. Semantic interpretation
3. AST
4. Compiler representation with R12
5. Runtime representation with MCRT
6. Technical explanation
7. Validation result
8. Optimization notes

## Validation matrix

| Class | Plug test | Expected result |
| --- | --- | --- |
| Positive | Valid contract, capability, schema, transition, and artifact hash | Pass |
| Negative | Incompatible contract or invalid `Closed -> Open` finish transition | Expected fail |
| Boundary | Deadline, quota, payload, rate, and stream limits | Pass or explicit boundary diagnostic |
| Integration | All six modules preserve the same request and provenance identity | Pass |
| Security | Missing capability, secret leakage, hidden network, or unknown code | Deny |
| Performance | Bounded retry, backpressure, rate limit, and sparse execution | Pass within the declared budget |
| Determinism | Canonical input preserves result, relation class, and tuple hash | Pass |
| Interoperability | Compatible version and transport combination | Pass |
| Recovery | Interrupted work resumes without duplicated effects | Pass or explicit repair requirement |
| Certification | R12 and MCRT evidence are complete and replayable | Pass |

## 8S and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, preserve latent geometry, projection, semantic distance, uncertainty, provenance, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium receipts must retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, tolerance profile, projection version, relation class, uncertainty, provenance, and whether a pairwise or triadic interaction changed the result.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Visible overlap does not establish latent coupling.

## Acceptance gate

The Plug suite is certifiable only when all six compatibility reports pass, all capabilities and effects are declared, invalid transitions fail deterministically, secret redaction is active, hidden network and unknown-code execution are absent, and R12/MCRT replay preserves identity, policy, result, relation class, and interaction order.
