# JA21 9.1.0 — Portable Reproducible Virtual Desktop Architecture

## Goal

JA21 9.1.0 runs in place. The sealed application tree is read-mostly and all JA21-owned mutable state is rooted at `workspace/` beside the browser. The portable launch envelope redirects `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP`, `HOME`, Python bytecode cache, WebView2 user data, VEC1 state, downloads, logs and provisioning scratch space into that workspace before child runtimes are started.

This is a JA21 process-boundary guarantee, not a claim that Windows or an independently installed Microsoft runtime can never touch its own operating-system profile locations.

## Reproducibility layers

1. **Application layer** — `package.integrity.json` and `engine/ja21/runtime.integrity.json` seal executable application inputs.
2. **Portable mutable layer** — `workspace/` contains all JA21-owned changing state and is deliberately excluded from the application seal.
3. **Workspace snapshots** — `Snapshot JA21 Portable Workspace.cmd` creates a content-addressed archive of mutable workspace state (excluding cache/temp/prior snapshots) with a SHA-256 file inventory, without changing application bytes.
4. **Web engine** — the SDK adapter is pinned at 1.0.4191.47. Full binary-identical web-engine replay requires a WebView2 Fixed Version Runtime in `runtime/webview2-fixed/` or `workspace/runtime/webview2-fixed/`. Evergreen remains a supported external fallback, but its binary version can vary.
5. **Fabric evidence** — `workspace/evidence/fabric-placement.jsonl` records host-mediated service placement. These receipts explicitly carry `fabric_verdict:null`.

## Technical-suite node allocation

### N_SMALL — bootstrap, policy and bounded guard
The Technical Institute describes DF_Small as a compact bounded C11 reference VM for deterministic witness execution, signed-image evaluation and constrained device/service experiments. JA21 therefore assigns it boot guard, package-integrity/security policy, heartbeat/reference checks and safe fallback decisions.

### N_MEDIUM — semantic authority and native browser inspection
DF_Medium is described as the authoritative Columned-LCTL compiler/verifier and provenance/trust node. JA21 assigns command/policy semantics, DF_Medium native HTML/CSS inspection, semantic validation and native witness generation to this tier.

### N_LARGE — host/device/I/O boundary
DF_Large is explicitly device-oriented, with HAL adapters, Device ABI and qualified virtual services. JA21 assigns WebView2 host integration, network/device portals, portable downloads/uploads, permission brokerage, clipboard/OS composition boundaries and other external host resources to Large.

### N_XLARGE — workspace, snapshots, replay and long-running state
DF_Xtra_Large is the hosted QVM/QUORUM tier with trace/snapshot evidence and world-runtime scaffolding. JA21 assigns the tab/workspace graph, VEC1 mutable state, session snapshots, history/replay, long-running context jobs and restore/crash evidence to Xtra Large.

### DF0 — fabric control
The Technical Institute says DF0 federates heterogeneous nodes by moving sealed PA-LCTL row sequences rather than VM images, with replica/pipeline/BSP programs, placement/ownership tracking, per-node lowering, differential witnesses and deterministic event-log replay. JA21 uses that as the coordination model: service ownership is registered, host events are routed to the appropriate tier, ownership/replay evidence is recorded, and any real fabric verdict remains an explicit separate control-plane operation.

## Claim boundary

The WPF shell and WebView2 composition surface remain Windows-host presentation/device components. `ja21_portable_placement.json` is a service-placement contract and the generated receipts are host-mediated evidence. They do not claim the WPF window executes inside a DF VM, and they do not synthesize `CROSS_NODE_DIFFERENTIAL_AGREEMENT`.

## Portable operator commands

- `Start JA21 Portable Desktop.cmd` — starts JA21 in the redirected run-in-place environment.
- `Verify JA21 Portable Desktop.cmd` — validates path redirection and the DF-tier placement contract.
- `Snapshot JA21 Portable Workspace.cmd` — creates a content-addressed workspace snapshot; close JA21 first.

