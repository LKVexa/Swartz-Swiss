# JA21 9.1.2 — Portable Desktop Qualification

JA21 remains run-in-place with all JA21-owned mutable state under the sibling `workspace/` tree. Release 9.1.2 adds joined-C# warning-as-error hygiene and version-driven launcher identity on top of the 9.1.1 qualified portable-path repair.

## Windows qualification order
1. `Verify JA21 Portable Desktop.cmd`
2. `Verify JA21 Virtual Browser.cmd` — performs the actual merged WPF/WebView2 `Add-Type` compile gate.
3. `Start JA21 Portable Desktop.cmd`
4. Verify the banner reports the same value as `VERSION`.
5. Exercise LIVE/NATIVE switching and confirm the thin renderer indicator moves without layout jitter.
6. Close JA21 and run `Snapshot JA21 Portable Workspace.cmd` when a reproducible mutable-state capture is required.

## 9.1.2 specific gates
- No declaration-only private underscore fields in any joined C# compilation unit.
- `_modeIndicator` is instantiated, rendered and state-synchronized.
- The portable launcher reads its displayed version from `VERSION`; no hard-coded 9.1.x banner remains.
- The portable/AppData-redirection and DF-tier placement contracts are unchanged.
