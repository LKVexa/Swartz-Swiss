# QUORUM RC-PW 7.0.0 — Qualification Profiles

## QP0 — Mathematical / Reference Model
Equations, schemas, deterministic fixtures, property tests, and small-scale reference simulation.

## QP1 — Hosted Operational
Executable implementation on a declared host runtime with save/replay, fault injection, and measured resource budgets.

## QP2 — Native VM Authority
Columned LCTL lowers to canonical LCTL and executes/verifies under the claimed VM/runtime without hidden hosted substitutes for the qualified behavior.

## QP3 — Production-Scale
Declared target hardware profile, sustained scale/stress, large world/entity populations, traversal storms, recovery, performance, and storage-growth qualification.

## QP4 — Independently Qualified
Fresh rebuild/replay/verification by an independent environment or party using published manifests, tool versions, test corpus, commands, and expected equivalence criteria.

A stage may be OPERATIONAL for QP1 and BLOCKED for QP2–QP4. Always state the profile.

## World-quality dimension (4.0)

Execution qualification (QP) and world-quality qualification (WQ) are orthogonal. Report results as a pair, for example `QP2/WQ3`.

See `00_RELEASE_ACCEPTANCE.md` for WQ0–WQ4.
