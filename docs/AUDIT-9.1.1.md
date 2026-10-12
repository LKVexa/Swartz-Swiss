# JA21 Portable Optical Instrument Desktop 9.1.1 — Compile Repair Audit

## Trigger

Windows target-machine qualification of 9.1.0 reached the real WPF `Add-Type` compilation path and failed in the generated merged C# unit because `Path` resolved ambiguously between `System.IO.Path` and `System.Windows.Shapes.Path`.

The failing portable source used bare calls such as `Path.Combine(packageRoot, "workspace")`. `Start-JA21Browser.ps1` intentionally hoists the `using` directives from all presenter sources into one compilation unit. The main WPF presenter imports `System.Windows.Shapes`, while the portable layer imported `System.IO`; therefore bare `Path` is not legal in the merged unit even though `PortableDesktop.cs` appears unambiguous when read in isolation.

## Repair

- Qualified every filesystem-path operation in `host/PortableDesktop.cs` as `System.IO.Path.*`.
- Kept `System.Windows.Shapes` available for the presenter; no WPF feature was removed to hide the collision.
- Added a Python package-verification gate that scans every joined C# source for any unqualified `Path.*` use.
- Added a portable-desktop regression test for the same merged-compilation ambiguity.
- Added a Windows PowerShell verification gate before `Add-Type` so the exact defect is rejected with a direct diagnostic before compile.
- Advanced application, profile, portable runtime policy, placement contract, VEC1 host binding, runtime seal and package seal to 9.1.1.

## Architecture impact

No portable-node placement changed. DF_Small remains the bounded boot/security/reference tier; DF_Medium remains semantic/native verification; DF_Large remains live-web/device/I/O brokerage; DF_Xtra_Large remains workspace/snapshot/replay state; DF0 remains deterministic registry/routing/replay/differential coordination with no presenter-generated fabric verdict.

No AppData policy was relaxed. JA21-owned mutable state remains under `workspace/`, and the WebView2/VEC1 portable roots remain unchanged.

## Verification

The cross-platform package verifier, browser/integration suites, Windows path/case preflight, VEC1 configuration seal, four-node binding checks, 12,500-item Optical Instrument traceability checks and the VEC1 control-plane suite are rerun after resealing. The final Windows `Add-Type` compiler remains a target-machine qualification gate, but 9.1.1 now statically rejects the exact merged-namespace condition that produced the 9.1.0 failure.
