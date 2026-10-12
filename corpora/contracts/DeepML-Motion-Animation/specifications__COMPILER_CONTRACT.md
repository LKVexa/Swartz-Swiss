
# DeepML Motion/Animation Compiler Contract

## Required evidence chain

A conforming compiler preserves the route from source text to syntax tree, resolved motion identities, typed motion declarations, semantic validation, policy admission, normalization, optimization evidence, R12 emission, and MCRT emission. Source identity and provenance survive every accepted transformation.

## Motion-specific obligations

- Prove skeleton hierarchy is acyclic and each joint has valid parentage.
- Resolve coordinate spaces before composing transforms.
- Validate clip duration, channel targets, keyframe order, and interpolation mode.
- Normalize blend weights under the declared tolerance profile.
- Validate state-machine guards, priorities, reachability, and deterministic transition order.
- Bound IK iterations, scheduling, contact constraints, and nonconvergence behavior.
- Verify retarget maps, bind poses, joint semantics, and cache identity.
- Preserve root-motion extraction or retention policy.
- Admit procedural, physics, crowd, cinematic, and timeline integrations only through declared capabilities.
- Reject network access and unknown code execution under the standalone profile.

## Optimization boundary

Pose folding, curve compression, dead-channel removal, blend normalization, retarget caching, IK scheduling, and state minimization are valid only when the compiler emits the declared equivalence or tolerance evidence. An optimization must not silently alter joint identity, topology, event time, contact state, root displacement, transition semantics, provenance, or replay identity.

## 8S boundary

Smithson 8S evidence is preserved as a structured editorial and computational profile. It does not silently redefine normative motion syntax or establish physical claims beyond the declared claim boundary.
