# JA21 Blank Console

**Console release 1.1.0** · Windows x64 · GPL-3.0-only

Copyright (C) 2026 RUSSELL PHILIP SMITHSON

A portable, resizable, blank console host derived from the JA21 9.8.7 browser.
It starts at `about:blank`, with no visible tabs, address field, toolbar, buttons,
or landing screen. It provides an empty surface for a later local application.
The GFM simulation is not included or started by this package.

## Run

1. Extract the release into a short, writable path, such as `D:\Codex\JA21-Blank-Console`.
2. Run **Start Console.cmd**.
3. Close with **Alt+F4**. Use **Alt+Space** for the Windows move/resize menu.

Requirements: Windows x64, Windows PowerShell 5.1, .NET Framework/WPF, and a
writable package directory. Microsoft Edge WebView2 Evergreen Runtime is needed
for modern live web content. The pinned WebView2 SDK adapter is included; its
Microsoft license and notices are retained in `licenses/`. If live rendering
is unavailable, JA21 can use its native DF_Medium renderer.

The console opens at 760 × 640 pixels, with a minimum of 420 × 360.
Mutable profiles, logs, downloads, snapshots, and temporary files live under
`workspace/`, excluded from version control and release integrity seals.
The original full-browser launchers remain available for development.

## Configure content

Edit `console.json`:

```json
{
  "start_url": "about:blank",
  "local_origins": [
    "http://127.0.0.1:8788",
    "http://127.0.0.1:8791"
  ]
}
```

Or invoke the console with an explicit start URL:

```powershell
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\host\Start-Console.ps1 -StartUrl "http://127.0.0.1:8788/"
```

Local origin exceptions are exact scheme/host/port origins, with no credentials,
path, query, or fragment. Add only origins belonging to applications you intend
to load. Console mode rejects the legacy broad private-network bypass. Public
web navigation remains subject to the host's address policy. This is an
application-level policy; it does not replace operating-system network controls.

## Verify and develop

Python 3.10 or newer is used for build and verification tools; the console does
not require Node or Electron. Run the complete release check from the repository root with Windows PowerShell 5.1:

```powershell
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\tools\Verify-Release.ps1
```

Or run individual checks:

```powershell
python -m unittest discover -s tests -v
python -m unittest discover -s substrate/tests -v
python tools/verify_package.py
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\host\Verify-JA21Browser.ps1
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\tools\Verify-Console.ps1 -Work "$env:TEMP\JA21-console-verification"
```

Headless verification compiles the Windows presenter, checks the runtime seal,
instantiates the blank content tree, and checks local-origin policy without
opening a desktop window. The native build launcher is **Rebuild JA21 Engine.cmd**;
a compatible x64 C compiler is required. Run `python tools/reseal.py` after
intentional source/build changes, then verify again. The hashes detect changed
files; they are not a publisher signature.

The console's version is in `CONSOLE_VERSION` and `CONSOLE_BUILD.json`.
`VERSION` retains the inherited presenter compatibility version, **9.8.7**.
See [CHANGELOG.md](CHANGELOG.md), [docs/AUDIT-1.1.0.md](docs/AUDIT-1.1.0.md),
and [VALIDATION.txt](VALIDATION.txt) for fixes and actual validation results.
Log files and embedded archive logs are omitted from this published release.
Historical browser documentation is preserved in
[docs/LEGACY-BROWSER-README.md](docs/LEGACY-BROWSER-README.md).

## Known limits

The supplied archive already lacked 191 legacy reference files. Their original
inventory is retained in `provenance/source-audit.json`; absent files have not
been invented. Full VEC1 research-workflow qualification is outside the verified
console path. Live page behavior depends on the installed WebView2 Runtime and
the target application. See the audit for testing limits and remaining upgrades.

## License and attribution

The console and material owned by RUSSELL PHILIP SMITHSON are released under
**GNU GPL version 3 only**. See [LICENSE](LICENSE), [COPYRIGHT](COPYRIGHT),
[NOTICE](NOTICE), and [LICENSING.md](LICENSING.md).

Retained Apache-licensed source and third-party Microsoft components keep their
own terms and notices. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
The GPL license document itself retains the Free Software Foundation copyright.
