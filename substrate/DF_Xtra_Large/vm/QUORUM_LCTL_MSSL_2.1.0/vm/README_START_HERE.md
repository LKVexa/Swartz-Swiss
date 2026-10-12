# QUORUM Generic VM 5.0.0 Candidate + RC-PW 7.0 Applied World Extension

This repository retains the **5.0.0-candidate hosted QVM core** and applies the QUORUM Reference-Centric Penteract World 7.0 prompt/workflow series as a separate hosted world subsystem.

## Core VM

Linux/macOS:

```sh
./RUN_VM.sh
```

Windows:

```bat
RUN_VM.cmd
```

## RC-PW world demo

Linux/macOS:

```sh
./RUN_WORLD.sh
```

Windows:

```bat
RUN_WORLD.cmd
```

The world demo compiles `src/WORLD_DEMO.lctlc` with the bundled LCTL 1.6.1-RC1 column verifier, signs the QBRIM image with the development key, then executes QVM ABI 2 world services.

## Qualification

```sh
make world-test
make world-qualify
make operational
```

Key evidence:

- `world/evidence/QUALIFICATION_REPORT.md`
- `world/evidence/qualification_summary.json`
- `world/evidence/RCPW_7_WORKFLOW_APPLICATION_LEDGER.json`
- `world/evidence/golden_world_matrix.json`
- `evidence/QUALIFICATION_REPORT.md`

## Applied world capabilities

The hosted reference subsystem implements canonical world/entity state, reference-relative finite-horizon folding, S0-S8 shells, L0-L8 simulation view, no-unload persistence, deterministic world time, aggregate remote ecology/economy, causal ledger, deterministic frontier generation, archive/rehydration, observer-local knowledge, role succession, authority wells, idempotent inventory transactions, save/load/replay, partition metadata, and a deterministic world-package compiler.

See `world/spec/WORLD_CLAIM_BOUNDARY.md` before interpreting any maturity label. The complete RC-PW 7.0 production/fabric/renderer scope is **not** claimed operational.
