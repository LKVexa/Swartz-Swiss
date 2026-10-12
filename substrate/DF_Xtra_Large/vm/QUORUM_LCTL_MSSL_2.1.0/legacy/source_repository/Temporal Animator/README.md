# JA21 Suite 23 — Temporal Animator

Three independent DeepML Motion Animation Language scripts for frame evaluation, continuity preservation, and deterministic frame-state emission.

## Language profile

- Language: Motion Animation Language (DeepML)
- Profile: `deepml.motion`
- Extension: `.deepml`
- Header: `deepml motion 0.3`
- Namespace: `deepml.motion`
- MCRT profile: `DEEPML_MOTION_R12`
- Primary artifact: `MotionPackage`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 shards
- Runtime posture: deterministic and no network

The attached corpus was gzip-validated and includes grammar, compiler and runtime contracts, semantic operators, conformance cases, and native sample scripts. These files are specification-level Temporal Animator programs; execution by a production DeepML Motion compiler or runtime is not claimed.

## Files

| File | Sub-suite | Temporal responsibility | Principal output |
| --- | --- | --- | --- |
| `23.1_Temporal_Animator_Frame_Evaluation.deepml` | Frame Evaluation | Samples an accepted motion plan at ordered frame checkpoints | Sampled pose sequence, R12 lowering, and motion package |
| `23.2_Temporal_Animator_Continuity_Preservation.deepml` | Continuity Preservation | Preserves matched transform state at segment boundaries | Boundary evidence, synchronized timeline, and strict certification |
| `23.3_Temporal_Animator_Deterministic_Frame_States.deepml` | Deterministic Frame States | Names sampled frame states and disables nondeterministic channels | Canonical frame-state sequence and replayable motion package |

## Analytical ensemble

| Participant | Temporal Animator responsibility |
| --- | --- |
| SOPHIA | Interprets the accepted motion plan and proposes frame checkpoints, continuity intent, and state boundaries |
| CHARLOTTE | Validates clip bounds, sample order, transition order, continuity tolerances, deterministic policy, and replay equivalence |
| LANDON | Resolves stable rig, clip, frame, scene, and timeline identities; compiles samples; lowers and packages outputs |
| Professor | Explains interpolation choices, boundary assumptions, uncertainty, discontinuities, limitations, and repair paths |
| Podium | Records source and semantic hashes, sample identities, R12/MCRT evidence, replay result, package identity, and certification receipt |

Every script contains a five-pose evidence graph ordered as SOPHIA, CHARLOTTE, LANDON, Professor, and Podium. The normalized blend weights sum to `1.0`; this records ensemble participation and does not average away a denial, discontinuity, contradiction, or missing input.

## Common temporal contract

Every file independently declares:

1. `deepml motion 0.3` and a stable module identity.
2. Deterministic and no-network policies.
3. A rooted, acyclic skeleton.
4. Bounded clips with monotonic key times.
5. Ordered `sample ... at ... as ...` frame checkpoints.
6. Stable scene and timeline synchronization.
7. A five-role evidence graph with normalized weights.
8. Semantics-preserving optimization.
9. `DEEPML_MOTION_R12` lowering.
10. A named `.msslb` motion package.
11. Strict motion certification.

Expected compiler route:

```text
lex -> parse -> AST -> skeleton, clip, and type resolution
-> policy, timing, transition, and continuity validation
-> deterministic sampling -> timeline synchronization
-> optimization -> DEEPML_MOTION_R12 lowering
-> MCRT emission -> MotionPackage -> replay certification
```

The corpus grammar provides native `sample <motion> at <time> as <identifier>` statements. Named samples are the script-level frame-state emissions used here; the consuming runtime is responsible for serializing those states into its canonical frame-state representation.

## Sub-suite contracts

### 23.1 Frame Evaluation

- The accepted clip and rig identity are immutable during one evaluation pass.
- Sample times are monotonic, unique, and inside the clip duration.
- Position and rotation channels are evaluated using one declared interpolation profile and timebase.
- State transitions follow frame order and never skip or duplicate a named checkpoint.
- Scene, actor, and timeline identities resolve before sampling begins.

### 23.2 Continuity Preservation

- Segment A's ending position and rotation equal Segment B's starting position and rotation for positional and rotational `C0` continuity.
- Velocity is checked for `C1` continuity whenever the consuming profile requires it.
- Acceleration is checked for `C2` continuity only when the plan explicitly declares that profile.
- Root motion, contact state, event order, and transition identity remain stable across the join.
- Loop closure is validated separately from the A-to-B boundary.

### 23.3 Deterministic Frame States

- Every emitted frame state has a stable identifier, clip identity, sample time, frame ordinal, and source hash.
- Repeated evaluation with the same accepted inputs produces identical sample order and canonical tuple hash.
- Disabled or backend-dependent channels cannot silently enter the strict output.
- State-machine, generator, random-stream, and clip-position checkpoints are preserved for replay.
- R12, MCRT, package, and replay evidence refer to the same frame-state sequence.

## Temporal admission gate

A temporal animation run is admitted only when:

- Rig identity, hierarchy, bind transforms, source hashes, coordinate convention, and timebase are present.
- Every referenced clip, channel, scene entity, actor, and timeline resolves.
- Clip duration covers all keys and samples.
- Key and sample times are monotonic and transition ordering is deterministic.
- Required continuity class passes at every segment boundary.
- Contact timing, root motion, and typed timeline events remain stable.
- Sampling and interpolation are exactly deterministic or within an explicitly accepted tolerance profile.
- No network, unapproved external effect, unknown code, or source substitution is requested.
- R12, MCRT, package, and replay identities match the accepted temporal graph.

The Temporal Animator must not invent a missing key, pose, timebase, frame, transition, contact state, continuity condition, or replay identity.

## Validation matrix

| Class | Temporal Animator test | Expected result |
| --- | --- | --- |
| Positive | Valid rig, bounded clips, monotonic samples, matched boundaries, package, and receipts | Pass |
| Negative | Missing clip, out-of-range sample, reversed time, discontinuity, duplicate frame ID, or replay mismatch | Expected fail |
| Boundary | First/last sample, exact clip end, zero-duration hold, exact continuity tolerance, or loop seam | Pass or explicit boundary diagnostic |
| Integration | All three scripts preserve shared rig, actor, scene, timeline, timebase, and motion identities | Pass |
| Security | Hidden network, unknown model/kernel, source substitution, or untrusted payload execution | Deny |
| Performance | Curve compression, ordered sampling, checkpoint capture, and batching remain within declared budget | Pass within profile |
| Determinism | Repeated sampling produces identical frame order, values, and canonical tuple hash | Pass |
| Interoperability | Compatible scene, timeline, rig, and serializer adapters preserve coordinate and time semantics | Pass |
| Recovery | Interrupted evaluation resumes from a certified checkpoint without duplicate or omitted frames | Pass or explicit repair requirement |
| Certification | R12, MCRT, sample, package, continuity, and replay evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes pose constant folding, curve compression, dead-channel removal, blend normalization, retarget caching, IK scheduling, and state minimization only when semantic equivalence is preserved.

Optimization must not move a sample, contact, event, or transition outside declared tolerance; change joint-limit or root-motion semantics; merge distinct clip, channel, or frame identities; reorder equal-priority transitions; alter boundary continuity silently; erase uncertainty or diagnostics; or approximate deterministic output beyond the declared profile.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, temporal evaluation preserves latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, temporal identities, sample times, continuity profile, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Apparent continuity in rendered frames is not proof of latent coupling. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 23 is certifiable only when all three scripts preserve deterministic/no-network policy, rooted skeletons, bounded clips, monotonic named samples, stable frame order, required continuity, synchronized scene/timeline identities, normalized ensemble evidence, semantics-preserving optimization, `DEEPML_MOTION_R12`, MCRT provenance, and replayable `.msslb` packages.
