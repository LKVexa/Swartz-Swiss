
# DeepML Core 1,000-Script Example Pack

The pack is a curated, source-faithful subset of the 10,000-record technical corpus. Programs are not decorated or rewritten, so their source hashes remain valid.

## Composition

| Class | Scripts |
|---|---:|
| Positive | 720 |
| Negative | 141 |
| Certification | 139 |
| **Total** | **1,000** |

All 48 corpus topics and all six tiers are represented. Every one of the 139 certification records is included.

## Organization

1. `01_foundations` — tensors, constants, variables, shapes, dtypes, broadcasting, modules, and elementary graphs.
2. `02_graphs_training` — functions, inference, losses, optimizers, autodiff, targets, and control dependencies.
3. `03_distributed` — sharding, collectives, checkpoints, mixed precision, custom gradients, and distributed execution.
4. `04_integrated_systems` — multimodal graphs, train/infer systems, model packages, and JA21 scene/timeline/logic bindings.
5. `05_compiler_optimization` — graph optimization, fusion, simplification, memory planning, device partitioning, and R12/MCRT lowering.
6. `06_validation_certification` — type, semantic, safety, runtime-validation, and certification programs.

Use `../catalogs/SCRIPT_CATALOG.csv` or `.jsonl` to connect each file to its expected stage, diagnostic, semantic operator, hashes, R12 relation, MCRT relation, and teaching explanation.
