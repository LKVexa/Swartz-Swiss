# DeepML Core Semantic Operators

The machine-readable registry is `semantic_operators.json`. The corpus exercises the following semantic operator families:

- `deepml.core.operator.algebraic_simplification`
- `deepml.core.operator.autodiff`
- `deepml.core.operator.broadcasting`
- `deepml.core.operator.checkpoint`
- `deepml.core.operator.checkpoint_incompatibility`
- `deepml.core.operator.checkpointed_execution`
- `deepml.core.operator.collective`
- `deepml.core.operator.computation_graph`
- `deepml.core.operator.constant`
- `deepml.core.operator.constant_folding`
- `deepml.core.operator.control_dependency`
- `deepml.core.operator.cse`
- `deepml.core.operator.custom_gradient`
- `deepml.core.operator.cyclic_graph`
- `deepml.core.operator.device_partitioning`
- `deepml.core.operator.distributed_execution`
- `deepml.core.operator.distributed_model`
- `deepml.core.operator.dtype`
- `deepml.core.operator.dtype_loss`
- `deepml.core.operator.execution_target`
- `deepml.core.operator.function`
- `deepml.core.operator.illegal_broadcast`
- `deepml.core.operator.inference_graph`
- `deepml.core.operator.layout_conversion`
- `deepml.core.operator.loss`
- `deepml.core.operator.memory_planning`
- `deepml.core.operator.mixed_precision`
- `deepml.core.operator.model_package`
- `deepml.core.operator.module`
- `deepml.core.operator.multimodal_graph`
- `deepml.core.operator.nondeterministic_kernel`
- `deepml.core.operator.operator_fusion`
- `deepml.core.operator.optimizer`
- `deepml.core.operator.pure_graph`
- `deepml.core.operator.r12_mcrt_lowering`
- `deepml.core.operator.random_stream`
- `deepml.core.operator.scene_timeline_logic_binding`
- `deepml.core.operator.shape`
- `deepml.core.operator.shape_inference`
- `deepml.core.operator.shape_mismatch`
- `deepml.core.operator.sharding`
- `deepml.core.operator.tensor_declaration`
- `deepml.core.operator.tensor_operator`
- `deepml.core.operator.tolerance_failure`
- `deepml.core.operator.train_infer_pipeline`
- `deepml.core.operator.unsafe_custom_op`
- `deepml.core.operator.unsupported_device`
- `deepml.core.operator.variable`

Each operator is governed by typed inputs and outputs, effects, preconditions, postconditions, policy requirements, stable semantic relations, and R12/MCRT lowering behavior. Implementations should treat the registry and corpus records together: the registry states the operator contract, while positive, negative, and certification records show its accepted and rejected boundaries.
