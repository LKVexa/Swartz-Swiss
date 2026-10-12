# DeepML Motion/Animation Semantic Operators

The machine-readable registry is `semantic_operators.json`. The corpus exercises these operator families:

- `deepml.motion.operator.blend_normalization`
- `deepml.motion.operator.blend_tree`
- `deepml.motion.operator.channel`
- `deepml.motion.operator.character_rig`
- `deepml.motion.operator.cinematic_motion`
- `deepml.motion.operator.clip`
- `deepml.motion.operator.constraint`
- `deepml.motion.operator.contact_constraint`
- `deepml.motion.operator.crowd_motion`
- `deepml.motion.operator.curve_compression`
- `deepml.motion.operator.dead_channel_removal`
- `deepml.motion.operator.foot_slide_tolerance`
- `deepml.motion.operator.ik_nonconvergence`
- `deepml.motion.operator.ik_scheduling`
- `deepml.motion.operator.interpolation`
- `deepml.motion.operator.invalid_retarget_map`
- `deepml.motion.operator.inverse_kinematics`
- `deepml.motion.operator.joint`
- `deepml.motion.operator.joint_cycle`
- `deepml.motion.operator.keyframe`
- `deepml.motion.operator.layered_state_machine`
- `deepml.motion.operator.locomotion_controller`
- `deepml.motion.operator.locomotion_parameter`
- `deepml.motion.operator.mask`
- `deepml.motion.operator.missing_bind_pose`
- `deepml.motion.operator.motion_matching`
- `deepml.motion.operator.motion_module`
- `deepml.motion.operator.physics_aware_animation`
- `deepml.motion.operator.portal_traversal`
- `deepml.motion.operator.pose`
- `deepml.motion.operator.pose_constant_folding`
- `deepml.motion.operator.procedural_animation`
- `deepml.motion.operator.r12_mcrt_lowering`
- `deepml.motion.operator.replay_mismatch`
- `deepml.motion.operator.retarget_cache`
- `deepml.motion.operator.retargeting`
- `deepml.motion.operator.root_motion`
- `deepml.motion.operator.scene_timeline_sync`
- `deepml.motion.operator.skeleton`
- `deepml.motion.operator.state_machine`
- `deepml.motion.operator.state_minimization`
- `deepml.motion.operator.trajectory_prediction`
- `deepml.motion.operator.transform`
- `deepml.motion.operator.unreachable_state`
- `deepml.motion.operator.zero_length_bone`

Each operator is governed by typed motion inputs and outputs, hierarchy and coordinate assumptions, effects, policy requirements, preconditions, postconditions, diagnostics, stable semantic relations, and R12/MCRT lowering behavior.
