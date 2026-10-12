
# DeepML Motion/Animation 1,000-Script Example Pack

This is a curated, source-faithful subset of the complete 10,000-record corpus. Programs are not rewritten, so their original source hashes remain verifiable.

## Composition

| Class | Scripts |
|---|---:|
| Positive | 760 |
| Negative | 210 |
| Certification | 30 |
| **Total** | **1,000** |

All 45 corpus topics and all six tiers are represented. Every certification holdout is included.

## Organization

1. `01_motion_foundations` — transforms, skeletons, joints, poses, clips, channels, keyframes, and interpolation.
2. `02_rigs_blending_state` — blend trees, masks, IK, retargeting, root motion, parameters, and state machines.
3. `03_procedural_motion` — procedural systems, motion matching, trajectory prediction, contacts, and constraint composition.
4. `04_integrated_animation_systems` — character rigs, locomotion, physics coupling, portals, crowds, cinematics, and scene/timeline synchronization.
5. `05_compiler_optimization` — folding, compression, channel removal, normalization, caching, scheduling, minimization, and R12/MCRT lowering.
6. `06_validation_certification` — invalid rigs, missing bind poses, unreachable states, replay failures, IK failures, tolerances, and certification holdouts.

Use `../catalogs/SCRIPT_CATALOG.csv` to connect each file to its source ID, expected stage, diagnostic, hashes, semantic operator, R12 relation, MCRT relation, and teaching explanation.
