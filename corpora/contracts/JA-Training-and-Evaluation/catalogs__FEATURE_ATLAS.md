# JA Training and Evaluation Feature Atlas

This atlas turns the corpus feature names into an implementation and teaching map. Counts distinguish the complete technical corpus from the curated script pack.

| Feature | Track | Corpus | Pack | Purpose |
|---|---|---|---|---|
| acceptance_threshold | 03 Evaluation And Decisions | 313 | 26 | Declares measurable release gates that a candidate must satisfy before promotion. |
| adapter | 05 Search Adapters And Provenance | 313 | 32 | Defines governed data or model adapters and their compatibility boundaries. |
| augmentation | 01 Experiment Foundations | 314 | 34 | Applies deterministic or explicitly seeded transformations to training examples. |
| baseline | 03 Evaluation And Decisions | 312 | 33 | Establishes a reference result against which candidate quality and cost are compared. |
| batch_rule | 02 Training Mechanics | 314 | 35 | Controls batch size, accumulation, ordering, and memory-sensitive execution. |
| checkpoint | 04 Registry And Recovery | 312 | 30 | Captures recoverable model, optimizer, scheduler, and provenance state. |
| comparison_rule | 03 Evaluation And Decisions | 312 | 34 | Specifies how candidates, baselines, and prior releases are compared. |
| dataset_reference | 01 Experiment Foundations | 312 | 33 | Names a versioned dataset artifact without embedding uncontrolled data access. |
| dataset_split | 01 Experiment Foundations | 313 | 27 | Defines train, validation, test, and holdout partition contracts. |
| distributed_training | 02 Training Mechanics | 313 | 32 | Coordinates workers, replicas, reductions, and deterministic synchronization. |
| evaluation_suite | 03 Evaluation And Decisions | 312 | 32 | Groups metrics, robustness tests, safety checks, and acceptance rules. |
| fine_tuning | 02 Training Mechanics | 312 | 31 | Constrains adaptation of a pretrained model to a governed task or dataset. |
| gradient_accumulation | 02 Training Mechanics | 312 | 30 | Combines multiple microbatches before an optimizer step while preserving semantics. |
| hardware_provenance | 05 Search Adapters And Provenance | 312 | 28 | Records accelerator, driver, memory, and execution-device identity. |
| hyperparameter_search | 05 Search Adapters And Provenance | 314 | 30 | Defines bounded candidate spaces, budgets, objectives, and selection rules. |
| loss | 02 Training Mechanics | 312 | 35 | Declares the optimization signal and its reduction, weighting, and numerical requirements. |
| metric | 03 Evaluation And Decisions | 313 | 31 | Defines a measurable evaluation quantity with scope, aggregation, and interpretation. |
| mixed_precision | 02 Training Mechanics | 312 | 31 | Controls lower-precision execution, scaling, fallbacks, and numerical evidence. |
| model_reference | 01 Experiment Foundations | 312 | 35 | Names an immutable or versioned model artifact used by an experiment. |
| objective | 02 Training Mechanics | 312 | 31 | Declares the quantity or ordered set of quantities optimized by training. |
| optimizer | 02 Training Mechanics | 313 | 27 | Defines update dynamics, parameters, state, and deterministic step semantics. |
| preprocessing | 01 Experiment Foundations | 312 | 33 | Transforms raw examples into model-ready data through governed local operations. |
| promotion | 04 Registry And Recovery | 313 | 31 | Moves an accepted candidate into a registry state only after declared gates pass. |
| registry_state | 04 Registry And Recovery | 312 | 29 | Models candidate, staged, accepted, rejected, promoted, and rolled-back states. |
| reinforcement_learning | 02 Training Mechanics | 312 | 31 | Defines environment, policy, reward, rollout, and safety constraints. |
| rejection | 04 Registry And Recovery | 312 | 34 | Records a failed candidate and prevents accidental release or silent reuse. |
| robustness_evaluation | 03 Evaluation And Decisions | 313 | 30 | Measures behavior under perturbations, shifts, stress, and adversarial conditions. |
| rollback | 04 Registry And Recovery | 312 | 36 | Restores a prior approved state when post-promotion evidence violates policy. |
| safety_evaluation | 03 Evaluation And Decisions | 312 | 27 | Evaluates prohibited behavior, misuse risk, rights, and operational guardrails. |
| scheduler | 02 Training Mechanics | 312 | 30 | Controls learning-rate or optimization schedules and their step/time interpretation. |
| seed_provenance | 01 Experiment Foundations | 313 | 28 | Records all randomness sources so runs can be replayed and compared. |
| software_provenance | 05 Search Adapters And Provenance | 313 | 34 | Records compiler, runtime, library, container, and dependency identities. |
