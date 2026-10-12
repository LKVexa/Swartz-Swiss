# QUORUM Stage 12 Master Remediation — Save / Replay Authority

**PARTIAL requirements in this stage:** 14

## Engineering focus

canonical save/checkpoint/replay, compatibility/migration, crash recovery, headless replay and recovery objectives.

## Primary repository targets

- `vm/world/world_runtime.py`
- `vm/world/authority/history_replay_remediation.mssl`
- `vm/world/qualification/headless_verify.py`
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

- `RCPW-12-R01` — Save state is canonical authority plus ledger/checkpoint metadata, not transient reference/render state.
- `RCPW-12-R04` — Incremental checkpoints bound recovery time for large worlds.
- `RCPW-12-R05` — Schema migrations are explicit and test backward/forward compatibility policy.
- `RCPW-12-R08` — Load verifies dependency/schema compatibility before mutating live canonical state.
- `RCPW-12-R12` — Replay tools can seek to canonical checkpoints and verify state digests without requiring full real-time rendering.
- `RCPW-12-R14` — Recovery objectives declare maximum acceptable data loss, recovery time, and checkpoint age for each qualification profile.
- `RCPW-12-R17` — Incremental checkpoints identify dirty canonical partitions and prove cross-partition consistency at the checkpoint barrier.
- `RCPW-12-R19` — Long-soak qualification repeatedly checkpoints, crashes, recovers, migrates, and replays while measuring recovery time and storage growth.
- `RCPW-12-R21` — Checkpoint metadata records partition membership/ownership so recovery can remap partitions without changing canonical semantics.
- `RCPW-12-R22` — Concurrent checkpoint and content-patch activation are serialized or coordinated by a declared compatibility protocol.
- `RCPW-12-R23` — Headless replay can recover a multi-partition save into a different worker layout and reproduce canonical checkpoint digests.
- `RCPW-12-R24` — Save qualification includes partial partition loss, incomplete replica, stale checkpoint fragment, remapping, migration, and repeated recovery.
- `RCPW-12-R28` — Replay can verify long-horizon world evolution by canonical semantic checkpoints even when detailed historical telemetry has been compacted.
- `RCPW-12-R29` — Qualification includes ancient-save migration, world expansion after save, archival restoration, generational state, and headless multi-era replay.
