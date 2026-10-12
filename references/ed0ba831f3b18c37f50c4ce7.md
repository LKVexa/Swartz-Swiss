# QUORUM Stage 07 Master Remediation — Ecology Authority

**PARTIAL requirements in this stage:** 14

## Engineering focus

individual↔cohort ecology, deterministic stochastic outcomes, conservation, habitat topology and long-horizon ecology.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/ecology_economy.mssl`
- `vm/world/tests/`

## Stage workflow

1. Freeze stage-specific baseline state, tests, requirement statuses, and canonical digests.
2. Convert each PARTIAL requirement into an explicit semantic assertion and direct executable evidence contract.
3. Extend the implementation rather than only the documentation when current fidelity is insufficient.
4. Add deterministic positive, boundary, negative, property, replay/recovery, and resource tests applicable to the stage.
5. Use requirement IDs in test output and the evidence registry so status can be derived mechanically.
6. Run the stage in isolation, then in integrated world scenarios, then with all prior stages.
7. Execute worker/fabric, rendering/physics, scale/soak, or production qualification when the exact requirement calls for it.
8. Preserve every existing OPERATIONAL requirement and canonical invariant.
9. Emit per-requirement receipts and stage summary with evidence hashes.
10. Promote only requirements whose exact acceptance predicates pass.

## Requirements in this stage

- `RCPW-07-R02` — Promotion/demotion between individuals and cohorts is mass/population consistent within declared tolerances.
- `RCPW-07-R03` — Remote ecological interactions create durable consequences that can later materialize locally.
- `RCPW-07-R05` — Random ecological resolutions are deterministic under recorded seeds.
- `RCPW-07-R07` — Ecological time-step adaptation is bounded and conservation error is measured per species/resource system.
- `RCPW-07-R08` — Remote stochastic outcomes expose reproducible seeds and probability models.
- `RCPW-07-R11` — Habitat connectivity is canonical and cannot be altered merely by visual fold distance; migration uses canonical route/topology cost.
- `RCPW-07-R13` — Local depletion and remote regeneration use one conserved resource model with declared approximation bounds.
- `RCPW-07-R19` — Ecology qualification includes long-soak biodiversity, resource depletion/recovery, seasonal migration, and repeated individual↔cohort cycling.
- `RCPW-07-R20` — Ecological regions may execute on different workers/partitions while migration and shared-resource boundaries use canonical transfer events.
- `RCPW-07-R21` — Cohort split/merge across partition boundaries is deterministic and conservation-audited.
- `RCPW-07-R22` — Ecological worker restart resumes from checkpoint plus ledger without population duplication or lost resource debt.
- `RCPW-07-R25` — Ecology supports long-term succession, habitat transformation, local extinction/reintroduction, resource regeneration, and climate/season coupling across world ages.
- `RCPW-07-R27` — Ecological inheritance tracks persistent habitat changes caused by settlement growth, infrastructure, fire, resource depletion, and restoration.
- `RCPW-07-R29` — Qualification includes multi-era ecological succession, settlement expansion pressure, climate variation, region synthesis, archive, and later rehydration.
