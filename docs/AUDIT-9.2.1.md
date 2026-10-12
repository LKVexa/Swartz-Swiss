# JA21 9.2.1 Verification Repair Audit

## Trigger
Windows verification passed package, WPF source preflight, DF_Medium provenance, WebView2/VEC1 integration, Optical Instrument composition, and 12,500-item traceability, then failed at `Verify-JA21Browser.ps1:151` with `Get-Content : Illegal characters in path`.

## Root cause
`$portableSource` was populated at startup with the complete contents of `host/PortableDesktop.cs`. A late regression gate mistakenly passed that source-code string to `Get-Content -LiteralPath`. PowerShell therefore parsed several kilobytes of C# text as a filename and rejected illegal path characters. The correct path variable is `$portableCs`; however no second read is required because `$portableSource` already contains the authoritative text.

## Repair
The late audit now assigns `$portableAudit = $portableSource`. `$portableCs` remains the only path variable for `PortableDesktop.cs`. A new unit test and package-verifier rule reject any future `Get-Content -LiteralPath $portableSource` regression.

## Scope
No renderer, UI, VEC1, DF node, fabric, WebView2, portable-workspace, or evidence semantic was weakened. The 9.2.x floating URL/search pill remains unchanged.
