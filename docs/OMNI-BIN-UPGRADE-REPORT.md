# JA21 Omni Bin Window — 8.0.3 presenter upgrade

Date: 2026-09-16 (PT)

## Result

`Start JA21 Virtual Browser.cmd` / `host\Start-JA21Browser.ps1` now opens a live window titled **JA21 Omni Bin · DF_Medium 8.0.3**.

Verify (`host\Verify-JA21Browser.ps1`) **PASS** (compile + package + DF_Medium provenance).

## What changed

- `host\JA21VirtualBrowser.cs` — native Omni Bin glass presenter: spring hover (`SpringScalar`), quieter glass/hairline chrome, Omni Bin FAB + panel (Ctrl+B / ▣), calm new-tab copy, brand **OMNI BIN**
- `host\Verify-JA21Browser.ps1` — avoid PowerShell `$host` clash; case-sensitive `out`/`ref` property guard
- `docs\OMNI-BIN-WINDOW-8.0.3.md` — design-system map
- `docs\OMNI-EXPERIENCE-SPEC.md` — Omni Bin substitute note
- Seals refreshed: `package.integrity.json`, `engine\ja21\runtime.integrity.json`

## Architecture (unchanged)

DF_Medium remains the web-engine VM. WPF is presenter-only (no Chromium / WebView2 / Electron).

## How to use

1. `Verify JA21 Virtual Browser.cmd`
2. `Start JA21 Virtual Browser.cmd`
3. **▣** or Ctrl+B for Omni Bin scene vessel; **···** for context drawer

Backup of pre-Omni host CS: `host\JA21VirtualBrowser.cs.bak-omni-pre`
