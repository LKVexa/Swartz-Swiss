JA21 Blank Console 1.1.0
Copyright (C) 2026 RUSSELL PHILIP SMITHSON
GNU GPL version 3 only; component notices are retained in licenses/.

Extract to a short writable path and double-click Start Console.cmd.
The blank, resizable window has no tabs, address field, toolbar or buttons.
Alt+F4 closes it; Alt+Space opens the Windows move/resize menu.

Requirements: Windows x64, Windows PowerShell 5.1 and .NET/WPF.
The pinned WebView2 SDK adapter is included; live content also requires the
separately installed Microsoft Edge WebView2 Evergreen Runtime.

Edit start_url and exact local_origins in console.json to load a local app.
This package does not contain or start the GFM simulation. Mutable state stays
under workspace/. The original full-browser launchers remain for development.

The active native engine is rebuilt as 8.1.0; presenter compatibility remains
9.8.7. README.md explains configuration and verification. VALIDATION.txt and
docs/AUDIT-1.1.0.md record checks and limits, including 191 absent references
already present in the original archive and untested desktop/live integration.
