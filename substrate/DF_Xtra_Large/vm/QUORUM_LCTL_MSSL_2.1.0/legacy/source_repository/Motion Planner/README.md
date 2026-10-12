# JA21 Suite 22 — Motion Planner

Five independent DeepML Motion Animation Language scripts for transforms, constraints, timing, camera motion, and continuity.

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

The attached corpus was gzip-validated and includes grammar, compiler and runtime contracts, semantic operators, conformance cases, and native sample scripts. These files are specification-level motion plans; execution by a production DeepML Motion compiler or runtime is not claimed.

## Files

| File | Sub-suite | Motion responsibility | Principal output |
| --- | --- | --- | --- |
| `22.1_Motion_Planner_Transforms.deepml` | Transforms | Keyframed translation and rotation | Transform motion package and R12 lowering |
| `22.2_Motion_Planner_Constraints.deepml` | Constraints | IK chain and deterministic contact constraint | Constraint motion package and validation evidence |
| `22.3_Motion_Planner_Timing.deepml` | Timing | Monotonic keys, state timing, and timeline synchronization | Timing motion package and timeline binding |
| `22.4_Motion_Planner_Camera_Motion.deepml` | Camera motion | Camera position/rotation path and scene/timeline synchronization | Camera motion package and R12 lowering |
| `22.5_Motion_Planner_Continuity.deepml` | Continuity | Boundary-matched motion segments and deterministic transitions | Continuity motion package and strict certification |

## Analytical ensemble

| Participant | Motion Planner responsibility |
| --- | --- |
| SOPHIA | Interprets scene intent and proposes paths, poses, timing, camera framing, and continuity goals |
| CHARLOTTE | Validates skeletons, transforms, constraints, key ordering, tolerances, continuity, determinism, and policy |
| LANDON | Resolves stable motion identities, stages clips, compiles graphs, schedules IK, synchronizes timelines, and packages outputs |
| Professor | Explains motion choices, assumptions, uncertainty, constraint conflicts, limitations, and repair paths |
| Podium | Records source and semantic hashes, R12/MCRT evidence, package identity, replay result, and certification receipt |

Every script contains a five-pose evidence graph ordered as SOPHIA, CHARLOTTE, LANDON, Professor, and Podium. The normalized blend weights sum to `1.0`; this evidence blend records participation and does not average away a validation denial or contradiction.

## Common motion contract

Every file independently declares:

1. `deepml motion 0.3` and a stable module identity.
2. Deterministic and no-network policies.
3. A rooted, acyclic skeleton.
4. The motion construct required by its sub-suite.
5. A five-role evidence graph with normalized weights.
6. Semantics-preserving optimization.
7. `DEEPML_MOTION_R12` lowering.
8. A named `.msslb` motion package.
9. Strict motion certification.

Expected compiler route:

```text
lex -> parse -> AST -> skeleton and type resolution
-> constraint and policy validation -> motion graph compilation
-> optimization -> DEEPML_MOTION_R12 lowering
-> MCRT emission -> MotionPackage
```

## Adapter and runtime boundary

The scripts declare motion rather than acquiring camera tracking, solving unknown external models, or driving hardware. Approved adapters must provide stable scene, actor, rig, camera, target, and timeline identities with source hashes and coordinate conventions.

Runtime providers must declare whether sampling, IK, motion inference, and physics coupling are exactly deterministic, deterministic within tolerance, or backend-dependent. A backend-dependent provider cannot claim exact replay equivalence.

## Sub-suite contracts

### 22.1 Transforms

- Translations and rotations use one declared coordinate convention and unit scale.
- Quaternion representation is canonicalized without changing the represented rotation.
- Key times are monotonic and fall within clip duration.
- Transform optimization preserves stable channels, endpoints, and declared curve tolerance.

### 22.2 Constraints

- Every IK joint and target resolves within one connected hierarchy or an explicitly typed external target.
- Iteration count and solver profile are bounded and deterministic.
- Contact constraints identify effector, surface, phase condition, tolerance, and conflict priority.
- Contradictory joint limits, unreachable targets, or nonconvergence remain explicit and block strict certification.

### 22.3 Timing

- Clip duration covers every keyframe.
- State transition conditions and equal-priority ordering are deterministic.
- Scene and timeline bindings use the same timebase and stable motion identity.
- Timing optimization cannot move contacts, events, holds, or camera cuts outside declared tolerance.

### 22.4 Camera motion

- Camera position and rotation channels remain distinct from actor root motion.
- Camera rig, target, scene entity, timeline, projection profile, and coordinate frame are identified.
- Framing, clipping, collision avoidance, and angular-rate constraints are validated by the consuming scene/runtime profile.
- Timeline sampling and camera priority remain deterministic.

### 22.5 Continuity

- Segment A's end transform equals Segment B's start transform for positional and rotational `C0` continuity.
- Velocity is checked for `C1` continuity where required.
- Acceleration is checked for `C2` continuity only when the plan declares that profile.
- Root motion, contact state, event ordering, and transition identity remain stable across boundaries.
- Loop closure is validated independently from the A-to-B join.

## Motion admission gate

A motion plan is admitted only when:

- Skeleton identity, hierarchy, bind transforms, source hashes, and coordinate convention are present.
- Referenced joints, channels, targets, scene entities, and timelines resolve.
- Clip duration and keyframe order are valid.
- Blend weights and masks satisfy their declared rules.
- IK and contact constraints are satisfiable within declared tolerance.
- Camera and actor motion do not silently share or overwrite root channels.
- Required continuity class passes at every join.
- No network or unapproved external effect is requested.
- R12, MCRT, package, and replay identities refer to the same accepted motion graph.

The planner must not invent a missing pose, target, constraint, timing event, camera frame, or continuity condition.

## Validation matrix

| Class | Motion Planner test | Expected result |
| --- | --- | --- |
| Positive | Valid hierarchy, clips, constraints, timing, continuity, package, and receipts | Pass |
| Negative | Joint cycle, missing bind pose, invalid retarget map, unreachable state, or replay mismatch | Expected fail |
| Boundary | Zero-duration hold, maximum clip length, exact joint limit, camera cut, or continuity tolerance | Pass or explicit boundary diagnostic |
| Integration | All five scripts preserve shared scene, rig, actor, camera, timeline, and motion identities | Pass |
| Security | Hidden network, unknown model/kernel, source substitution, or untrusted payload execution | Deny |
| Performance | Curve compression, interval indexing, IK scheduling, and batching remain within declared budget | Pass within profile |
| Determinism | Repeated sampling produces identical pose order and canonical tuple hash | Pass |
| Interoperability | Compatible scene/timeline/rig adapters preserve coordinate and timebase semantics | Pass |
| Recovery | Interrupted motion planning resumes without duplicate keys, states, or package sequences | Pass or explicit repair requirement |
| Certification | R12, MCRT, package, constraint, and replay evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes pose constant folding, curve compression, dead-channel removal, blend normalization, retarget caching, IK scheduling, and state minimization only when semantic equivalence is preserved.

Optimization must not change contact timing outside tolerance, change joint-limit or root-motion semantics, merge distinct bone/channel identities, reorder equal-priority transitions, alter camera framing silently, erase continuity diagnostics, or approximate deterministic output beyond the declared profile.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, motion planning preserves latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, phase, support, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, `Delta_8S`, relation class, motion identities, timebase, solver profile, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. A visually continuous path is not proof of latent coupling. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 22 is certifiable only when all five scripts preserve deterministic/no-network policy, rooted skeletons, stable motion identities, valid transforms and constraints, monotonic timing, separated camera motion, required continuity, normalized ensemble evidence, semantics-preserving optimization, `DEEPML_MOTION_R12`, MCRT provenance, and replayable `.msslb` packages.
