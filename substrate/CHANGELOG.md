# Changelog

## 0.1.1-candidate — chop-shop overhaul (2026-09-16)

Control plane (`vec1/`) hardened; DF nodes, DF_Fabric, Technical Institute, governance and
evidence trees are unchanged. Existing 0.1.0 electron state, snapshots and ledgers remain readable.

### Correctness fixes (each reproduced against 0.1.0 before fixing)
- **Clone equivalence false positive.** `equivalence` returned `true` for a parent and child that
  shared a base snapshot even after one of them had executed. It now proves both current states
  still match the sealed snapshot; otherwise `basis: shared_snapshot_diverged`.
- **Restore could un-retire an electron.** Restoring a pre-retirement snapshot cleared
  `security.retired` and set `READY`. Retirement and suspension are now never rolled back, and
  restoring a retired electron is refused.
- **Resume/suspend on a retired electron** reported `READY`/`SUSPENDED`. Now refused; resume
  also requires the electron to actually be suspended.
- **Strict mode accepted fewer than four bound nodes** at the receipt layer. `record_execution`
  now enforces `strict_four_node_execution` against `nodes_bound`.
- **Stranded `RUNNING` state.** Any error while recording an execution now faults the electron
  (`EXECUTION_ERROR` ledger event) instead of leaving it `RUNNING`.
- **Stale fabric results.** The bridge deletes the previous `--out`/event-log file before a run,
  so a crashed run can never be judged on an older result file.
- **`--non-strict`** silently bypassed the configured strict policy; it is now refused while
  `strict_four_node_execution` is `true`.
- `doctor` ran the fabric attestation twice per call.

### Integrity and security
- Sealed state is **verified on every load** (canonical hash recomputed); out-of-band edits fail
  closed with exit code 4 and are recoverable via `restore`.
- Ledger verification now checks sequence continuity, rejects malformed records, detects torn
  trailing writes, and **refuses to append to a broken chain**. Appends are fsync'd.
- Inter-process **file lock** around every state/ledger mutation (fcntl / msvcrt): concurrent
  `vecctl` invocations can no longer fork a hash chain.
- Electron ids and snapshot hashes are validated by pattern before any path is built.
- Restore refuses snapshots from an unrelated lineage.
- Quotas now enforced: `max_program_bytes`, `max_execution_receipts` (previously declared only).
- Genome records `program_sha256`; running a genome whose program changed is refused.
- Subprocess timeouts/launch failures are returned as results (124/127), never raw tracebacks;
  `VEC1_TIMEOUT` overrides the 1800 s default.
- Dashboard: all state values HTML-escaped, and `</` escaped in `generated_state.js`
  (a tampered state file could previously inject markup into the lab page).
- `doctor`/`verify` check security-policy drift, not just `network`.

### New
- `vecctl audit` — state hash, ledger chain, base snapshot and last receipt for every electron.
- `vecctl list --long`, `vecctl --version`, documented exit codes
  (0 ok · 1 fail · 2 usage · 3 blocked · 4 integrity · 5 policy).
- `tests/` — 21 hermetic tests (no toolchain needed) + opt-in strict-fabric integration test;
  `RUN_TESTS` / `RUN_TESTS.cmd`.
- `.github/workflows/vec1-ci.yml` — Linux + Windows control-plane matrix and a strict-fabric job.
- `VERIFY_PACKAGE.py` reports unmanifested files (`--strict` to fail on them), survives closed pipes.
- Lab dashboard: audit status per electron, parent lineage, component filter.
