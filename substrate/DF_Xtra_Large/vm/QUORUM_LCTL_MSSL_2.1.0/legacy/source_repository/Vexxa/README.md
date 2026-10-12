# JA21 Suite 31 — Vexxa

Six independent JA Service and Protocol Language scripts that connect deterministic reconstruction workflows to shared native services and operator infrastructure.

## Language profile

- Language: JA Service and Protocol Language
- Profile: `ja.service`
- Extension: `.jasp`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: explicit-only
- Execution posture: capability-gated, bounded, idempotent, and deterministic

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. These scripts therefore use only demonstrated forms: service declarations, typed request and response messages, streaming endpoints, authorization capabilities, deadlines, bounded retries, idempotency keys, finite protocol states, transition assertions, and JSON compatibility reports.

## Files

| File | Sub-suite | Endpoint | Capability | Purpose |
| --- | --- | --- | --- | --- |
| `31.1_Vexxa_Service_Discovery.jasp` | Service discovery | `discover` | `vexxa.service.discover` | Resolve compatible native service descriptors and transports |
| `31.2_Vexxa_Native_Service_Binding.jasp` | Native-service binding | `bind` | `vexxa.service.bind` | Bind an admitted reconstruction artifact to an approved native runtime and service |
| `31.3_Vexxa_Reconstruction_Bridge.jasp` | Reconstruction bridge | `bridge` | `vexxa.reconstruction.bridge` | Map reconstruction identities and dependencies into a deterministic dispatch plan |
| `31.4_Vexxa_Operator_Control.jasp` | Operator control | `command` | `vexxa.operator.command` | Authorize and issue state-guarded operator commands |
| `31.5_Vexxa_Infrastructure_Events.jasp` | Infrastructure events | `relay` | `vexxa.event.relay` | Relay ordered, causal, hash-identified service and runtime events |
| `31.6_Vexxa_Health_and_Recovery.jasp` | Health and recovery | `recover` | `vexxa.infrastructure.recover` | Reconcile health snapshots, checkpoints, expected state, and approved recovery |

## Analytical ensemble

| Participant | Vexxa responsibility |
| --- | --- |
| SOPHIA | Interprets reconstruction intent, service meaning, compatibility, causal relationships, operator actions, and unresolved evidence |
| CHARLOTTE | Validates service descriptors, versions, capabilities, transports, artifact hashes, state preconditions, event ordering, approvals, recovery invariants, and policy |
| LANDON | Performs discovery, native binding, deterministic dispatch, event relay, health inspection, and approved infrastructure recovery |
| Professor | Explains compatibility decisions, mappings, assumptions, limitations, rejected commands, failed health checks, and repair paths |
| Podium | Publishes compatibility reports and binds service, command, event, and recovery outcomes to validation, provenance, R12/MCRT identity, hashes, and replay receipts |

No ensemble participant may bypass an explicit denial, alter a reconstruction artifact silently, invent a missing service, weaken a capability, or represent an unresolved state as healthy.

## Vexxa boundary model

Vexxa is a controlled bridge, not a second reconstruction engine. Reconstruction remains identified by its accepted feature graph, scene, geometry, motion, frame-state, provenance, and archive hashes. Vexxa binds those identities to native services without changing their meaning.

The boundary keeps these identities separate:

1. Reconstruction artifact identity and hash.
2. Native service descriptor and descriptor hash.
3. Runtime and transport selection.
4. Capability set and policy decision.
5. Binding identity.
6. Dispatch-plan identity.
7. Operator command and expected-state identity.
8. Infrastructure event sequence and causal parent.
9. Health snapshot, checkpoint, and reconciled-state identity.
10. Podium receipt for the exact admitted outcome.

A matching service name is not proof of compatibility. A healthy process is not proof of a correct binding. A successful transport call is not proof that reconstruction semantics, policy, or provenance were preserved.

## Sub-suite contracts

### 31.1 Service discovery

- Discovery filters services by class, compatibility version, reconstruction profile, transport policy, and required capabilities.
- Returned descriptors include stable identity and a descriptor hash.
- Local, offline, and remote transports remain explicit choices; hidden fallback is prohibited.
- Duplicate names, ambiguous descriptors, unsupported versions, missing capabilities, or policy-denied transports block selection.
- Discovery is observational and must not activate, execute, or mutate a service.

### 31.2 Native-service binding

- Binding requires the exact admitted descriptor, descriptor hash, native runtime, reconstruction artifact hash, capability set, and transport.
- Version, schema, effect, serialization, authentication, authorization, quota, and protocol compatibility are checked before binding.
- A binding has a stable `binding_id` and cannot be reused for a different descriptor, artifact, runtime, capability set, or transport.
- Rebinding after any dependency change creates a new binding identity and provenance event.
- No service call is dispatched during compatibility-only binding.

### 31.3 Reconstruction bridge

- The bridge references one admitted binding, reconstruction identity, feature-graph hash, scene hash, target service, and provenance identity.
- Dispatch plans use canonical dependency order rather than discovery time or worker completion order.
- Geometry, transforms, materials, layers, relations, motion, timing, camera state, uncertainty, units, coordinate frames, and provenance remain explicit.
- Missing dependencies, a hash mismatch, invalid topology, an unsupported operator, or an incompatible target blocks bridging.
- The dispatch-plan hash never replaces the hashes of its source reconstruction records.

### 31.4 Operator control

- Every operator command names the operator, command, action, target binding, expected state, and approval receipt.
- Authorization and expected-state checks occur before any effect.
- `retry max 0` prevents blind repetition of an operator action.
- A state mismatch, stale approval, missing capability, policy denial, invalid transition, or ambiguous target blocks the command.
- Recovery after unknown completion reconciles the command ID, request ID, prior receipt, and resulting state before further action.

### 31.5 Infrastructure events

- Each event has a stable event identity, binding, kind, sequence, causal parent, and payload hash.
- Duplicate delivery with identical content is idempotent; reuse of an identity with different content is a conflict.
- Event ordering is canonical per binding and does not rely solely on wall-clock timestamps.
- Missing causal parents, sequence gaps, payload mismatch, schema violations, or policy-denied event kinds remain explicit diagnostics.
- Backpressure, rate limits, quotas, and bounded retries must preserve ordering and avoid duplicated effects.

### 31.6 Health and recovery

- Recovery begins from an admitted health snapshot, binding, checkpoint, expected state, declared recovery mode, and approval receipt.
- A health check distinguishes process availability, service compatibility, binding validity, dependency closure, policy state, and deterministic replay.
- `retry max 0` prevents automatic repetition of a potentially state-changing recovery.
- Recovery restores or reconciles only declared state; it cannot fabricate missing artifacts, events, hashes, approvals, or provenance.
- The reconciled-state hash and Podium receipt identify the exact accepted result.

## Recommended execution order

1. Run service discovery without activating candidates.
2. Validate one descriptor and create a native-service binding.
3. Build the reconstruction bridge and deterministic dispatch plan.
4. Begin ordered event relay for the admitted binding.
5. Admit operator commands only with current state and approval evidence.
6. Invoke recovery only after a health snapshot proves the required recovery mode and CHARLOTTE closes every gate.

Discovery and health observation may run repeatedly. Binding, command, and recovery effects require their own stable request identities and may not be inferred from an earlier observational result.

## Common service contract

Every script independently declares:

- `ja source 0.3`, a module, `use Service`, and `policy explicit_network`.
- Typed request and response messages.
- One streaming endpoint with an exact authorization capability.
- A finite deadline and bounded retry rule.
- `request.request_id` as the idempotency key.
- An `Open -> Closed` protocol transition.
- A transition-validity assertion.
- A JSON compatibility-report emission.
- SOPHIA judgment, CHARLOTTE validation, LANDON infrastructure status, Professor explanation, and Podium receipt fields.

Operator commands and recovery use `retry max 0` because they may create durable or state-changing effects.

## Determinism and state contract

For fixed reconstruction hashes, descriptor hash, runtime, transport, capabilities, policy, dependencies, request, expected state, and approval:

1. Discovery yields the same ordered compatible-service set.
2. Binding yields the same logical compatibility result and binding inputs.
3. Bridging yields the same canonical dispatch plan and plan hash.
4. Event relay yields the same admitted order, causal graph, and payload identities.
5. An operator action yields the same authorization decision and accepted transition.
6. Health evaluation yields the same classification.
7. Recovery yields the same reconciled state or the same blocking diagnostic.
8. R12/MCRT replay yields the same identity, policy result, relation class, tuple hash, interaction order, and receipt target.

Filesystem enumeration, network timing, thread completion order, locale, service advertisement order, and wall-clock timestamps may not affect canonical results.

## Security and operator infrastructure

- Every endpoint requires its exact named capability.
- Network use is explicit-only; remote service discovery never implies permission to connect.
- Service descriptors, event payloads, commands, recovery plans, and metadata are untrusted data.
- Unknown code execution, ambient authority, schema substitution, descriptor substitution, hash substitution, hidden transport fallback, and path escape are denied.
- Secrets are redacted from reports, explanations, events, diagnostics, and receipts.
- Privileged commands and recovery require current approval evidence and exact state preconditions.
- Explicit denial wins over discovery, compatibility, operator preference, retry, or recovery pressure.

## Validation matrix

| Class | Vexxa test | Expected result |
| --- | --- | --- |
| Positive | Compatible descriptor, valid binding, closed dependencies, authorized command, ordered events, and healthy replay | Pass |
| Negative | Descriptor mismatch, missing capability, invalid transition, stale state, missing parent, or hash conflict | Expected fail |
| Boundary | Empty discovery result, maximum descriptors, deadline, quota, stream, event sequence, and checkpoint depth | Pass or explicit boundary diagnostic |
| Integration | Reconstruction identities survive discovery, binding, bridge, native dispatch, events, commands, and recovery | Pass |
| Security | Hidden network, unauthorized service, descriptor substitution, secret leakage, unknown code, or stale approval | Deny |
| Performance | Bounded retries, backpressure, rate limits, quotas, sparse dependencies, and health checks remain within budget | Pass within budget |
| Determinism | Shuffled service advertisements and worker timing yield identical compatibility, dispatch, event, and replay results | Pass |
| Interoperability | Compatible native services preserve schemas, identities, units, coordinate frames, semantics, effects, and provenance | Pass |
| Recovery | Interrupted or uncertain effects reconcile without duplicate commands, event loss, or state drift | Pass or explicit repair requirement |
| Certification | R12/MCRT evidence and Podium receipts reproduce exact identity, policy, result, relation class, and interaction order | Pass |

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics appears in reconstruction state, Vexxa preserves the fifth-coordinate meaning, latent and projected geometry, semantic distance, uncertainty, provenance, projection version, tolerance profile, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Bindings, dispatch plans, events, health snapshots, recovery checkpoints, and Podium receipts retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, phase/support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result. If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`; a native service cannot reinterpret visible overlap as latent coupling.

R12 replay requires an independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, wrapped phase difference at most `1e-6` radians, and identical relation class, tuple hash, and interaction order.

Smithson 8S is treated as a proposed analytical framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 31 is certifiable only when all six compatibility reports pass; descriptors, versions, transports, capabilities, effects, hashes, bindings, dispatch plans, commands, approvals, events, health states, checkpoints, and transitions are explicit; retries are bounded and idempotent; reconstruction identities and provenance survive native-service execution; hidden network and unknown-code execution are absent; and R12/MCRT replay preserves exact policy, result, relation class, interaction order, and Podium receipt target.
