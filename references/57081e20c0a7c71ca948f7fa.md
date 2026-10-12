# QUORUM Stage 11 Master Remediation — Visibility / Rendering Authority

**PARTIAL requirements in this stage:** 26

## Engineering focus

fold-safe rendering/audio presentation, temporal stability, visibility semantics, artifact detection and overload degradation.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/presentation_transition_remediation.mssl`
- `vm/world/qualification/`
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

- `RCPW-11-R01` — Render visibility is never used as persistent existence authority.
- `RCPW-11-R02` — Folded rendering is coherent with canonical direction, landmarks, routes, and horizon semantics.
- `RCPW-11-R03` — Temporal transitions are stable and free of visible popping/jitter within declared thresholds.
- `RCPW-11-R04` — Rendering overload sheds visual quality before simulation authority.
- `RCPW-11-R05` — Long-distance silhouettes, lighting, atmospheric effects, shadows/reflections, and audio landmarks have declared fidelity policies.
- `RCPW-11-R07` — Rendering exposes a fold-artifact detector for scale discontinuity, horizon inversion, repeated landmarks, and topology leaks.
- `RCPW-11-R09` — Render culling cannot suppress simulation events or event ledger emission.
- `RCPW-11-R10` — Quality degradation is ordered and measurable, with simulation truth protected above visual fidelity.
- `RCPW-11-R11` — Visibility uses fold-aware hierarchical occlusion while acoustics uses canonical propagation rules or an explicitly qualified approximation.
- `RCPW-11-R12` — Weather, fog, smoke, cloud cover, night lighting, and atmospheric perspective may mask streaming but cannot become correctness dependencies.
- `RCPW-11-R13` — Temporal rendering history is invalidated or transformed correctly when fold parameters, reference origins, portals, or shell representations change.
- `RCPW-11-R15` — Visibility/rendering consumes a world-compiler-produced hierarchy of regions, visibility cells, portals, landmarks, and fold-safe representation tiers.
- `RCPW-11-R16` — Rendering and audio use separate fidelity/budget policies while sharing canonical identity and event timing.
- `RCPW-11-R17` — Temporal effects have explicit reset/reprojection rules for portal transitions, fold-parameter changes, origin rebases, teleports, and moving-frame handoffs.
- `RCPW-11-R18` — Visual landmark substitution at extreme fold distance records canonical identity so materialization cannot swap one landmark for another.
- `RCPW-11-R19` — Qualification includes automated image/telemetry comparison for seam popping, landmark duplication, horizon inversion, temporal ghosting, and frame-time spikes.
- `RCPW-11-R20` — Rendering consumes immutable per-frame world-view snapshots or equivalent coherent views so parallel canonical updates cannot tear a visible frame.
- `RCPW-11-R21` — Render workers may be decoupled from simulation workers, but presentation lag is measured and cannot be mistaken for canonical state.
- `RCPW-11-R22` — Fold/LOD/reference metadata carried into rendering is version stamped so mixed-frame state is detected.
- `RCPW-11-R23` — Asset/visual hot reload supports transactional frame-boundary activation and rollback without changing canonical identity.
- `RCPW-11-R24` — Rendering qualification includes worker restart, asset version rollback, fold-policy change, origin rebase, portal crossing, and presentation backlog.
- `RCPW-11-R25` — Visibility/rendering represents world age and historical change through canonical condition/state rather than static content assumptions.
- `RCPW-11-R26` — Folded horizon rendering can summarize newly expanded world extent without exposing undefined or not-yet-canonical geography as interactable fact.
- `RCPW-11-R27` — Long-distance landmark replacement reflects canonical construction/destruction/abandonment history and never resurrects obsolete landmarks from stale caches.
- `RCPW-11-R28` — Historical presentation layers such as weathering, vegetation succession, infrastructure decay, and settlement growth remain derived from authoritative state/provenance.
- `RCPW-11-R29` — Qualification compares pre/post-era visual state, expansion-horizon continuity, archive rehydration, and stale-cache rejection.
