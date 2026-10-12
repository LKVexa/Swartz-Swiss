# VEC1 Electron Substitute — integration candidate v0.1.1

> 0.1.1 is a hardening overhaul of the 0.1.0 control plane: integrity checks on every load, lifecycle and clone-equivalence fixes, locking, quotas, an `audit` command, tests and CI. See `CHANGELOG.md`.

This package applies the supplied **VEC1 v1.3.0 hardened component/prompt/workflow contract** to the supplied DF VM suite and DF_Fabric, using the **DF Portable VM Technical Institute v2.1.2** as the assembly model.

It is a **classical virtual-electron software substrate**: a portable VEC identity/state/clone/evidence control plane whose canonical PA-LCTL workload is lowered by the existing DF adapters into each VM's native dialect. It is **not** a physical-electron simulator, a QPU, or the Chromium/Node.js Electron desktop framework.

## Assembly

| Node | VEC role | Native path |
|---|---|---|
| `DF_Small / N_SMALL` | minimal/reference manifestation and bounded baseline | PA-LCTL → MSSL/ASM-1 → BRIM/1-v3 → C11 VM |
| `DF_Medium / N_MEDIUM` | semantic/compiler validation and independent image verification | PA-LCTL → LCTLC/1.1 → BRIR/1.1 → BRIM/BRPV → native VM |
| `DF_Large / N_LARGE` | virtual devices, host I/O/service boundary | PA-LCTL → LCTLC/1.2 → BRIM/1 → C11/HAL + Device ABI |
| `DF_Xtra_Large / N_XLARGE` | large-state, long-running and QAM-oriented hosted manifestation | PA-LCTL → LCTLC/1.0 → QVM-BRIR/1 → QBRIM 2 → Python QVM |
| `DF_Fabric / DF0` | scheduler, placement, replica/pipeline/BSP, differential comparison, event-log replay | sealed rows moved across nodes; VM images are not treated as portable |

The default execution policy is strict: all four nodes must bind, the same sealed PA-LCTL row sequence is exercised through the fabric, the fabric must return `CROSS_NODE_DIFFERENTIAL_AGREEMENT`, and the sealed event log must pass deterministic replay. Otherwise the VEC execution fails closed.

## Windows start

For the shortest extraction paths, extract the ZIP to something like `D:\VEC1_ES`.

1. Double-click `WINDOWS_PREFLIGHT.cmd`.
2. If the C nodes are unbound, install/use a GNU-compatible C11 + make + OpenSSL environment (MSYS2/MinGW is one viable route), then run `BUILD_VEC1.cmd`. You may set `DF_MAKE` if the make executable has a nonstandard name.
3. Run `VERIFY_VEC1.cmd`.
4. Run `DEMO_VEC1.cmd` to create a VEC, execute the strict fabric proof workload, snapshot it, fork it, and generate dashboard data.
5. Run `OPEN_LAB.cmd` for the offline laboratory dashboard.
6. Run `RUN_TESTS.cmd` for the hermetic control-plane tests (no toolchain required). Set `VEC1_INTEGRATION=1` to include the strict four-node fabric test.

`DF_Xtra_Large` is a hosted Python QVM and does not require native compilation; Small/Medium/Large require the toolchains declared by their original packages.

## VEC control commands

```text
python vec1\vecctl.py doctor --verbose
python vec1\vecctl.py build
python vec1\vecctl.py verify
python vec1\vecctl.py verify --full
python vec1\vecctl.py create
python vec1\vecctl.py list [--long]
python vec1\vecctl.py show <electron-id>
python vec1\vecctl.py audit
python vec1\vecctl.py run <electron-id>
python vec1\vecctl.py snapshot <electron-id>
python vec1\vecctl.py fork <electron-id>
python vec1\vecctl.py diff <electron-a> <electron-b>
python vec1\vecctl.py equivalence <electron-a> <electron-b>
python vec1\vecctl.py restore <electron-id> <snapshot-hash>
python vec1\vecctl.py suspend <electron-id>
python vec1\vecctl.py resume <electron-id>
python vec1\vecctl.py retire <electron-id>
python vec1\vecctl.py dashboard --open
```

Exit codes: `0` ok · `1` fail · `2` usage/unknown id · `3` blocked (nodes unbound) · `4` integrity failure · `5` policy refusal. `VEC1_TIMEOUT` (seconds) bounds each build/fabric subprocess.

## Applied hardening decisions

- **Fail closed:** strict four-node binding, cross-target agreement, replay verification, schema/integrity errors, and security policy failures block promotion.
- **Network deny:** preserved from DF_Fabric; this package does not add network transport.
- **Image portability is not assumed:** only sealed PA-LCTL rows are portable. Each node lowers rows into its own native guest/image format.
- **Filesystem confinement:** VEC mutable state is written only below `runtime/`.
- **Plugins and host calls:** denied by default except the explicitly named DF execution/build surfaces.
- **Integrity on load:** every state read recomputes the sealed canonical hash; ledgers must verify (sequence, chain, torn tail) before they can be extended; mutations are serialised by an inter-process lock.
- **Lifecycle is monotonic:** retirement is terminal and neither retirement nor suspension is rolled back by `restore`; restore only accepts snapshots from the same lineage.
- **Clone semantics:** deterministic freeze → canonical snapshot → sealed hash → logical copy-on-write base reference → child lineage record.
- **Evidence:** execution receipts and hash-chained VEC event ledgers are emitted under `runtime/evidence/`; DF_Fabric event logs are retained separately.

## Important closure boundary

The source VEC1 package contains **286,440 actionable checkboxes and 286,440 unique prompt/workflow pairs**. This candidate uses that package as the governing contract and maps all 110 components to concrete runtime owners/artifacts, but it does **not** falsely mark all VEC1 component checklists `PASS`. Each component evidence record remains `BLOCKED` until its full 2,604-item component closure and independent review are completed. See `evidence/components/` and `evidence/COMPONENT_APPLICATION_MATRIX.csv`.

## Supplied evidence

`evidence/reference/REFERENCE_EVIDENCE_SUMMARY.json` indexes the preserved assembly-host proofs. `FABRIC_ALL_MODES_STRICT_RUN.json` records strict DF0 replica + pipeline + BSP cross-node differential agreement; `INTEGRATED_QUICK_VERIFY.json` records the integrated candidate strict four-node replica verification; and `VEC_LIFECYCLE_DEMO.json` records create → execute → snapshot → fork/equivalence. These are assembly-host reference results, not a claim that another Windows host is already built or that all 286,440 VEC1 work items are closed.

The untouched institute is retained under `Technical_Institute/` for the detailed role/gate explanation.
