# JA21 Portable Virtual Desktop 9.8.7

9.8.7 preserves the portable run-in-place desktop architecture and retains hardened keyboard-focus transfer between the WebView2 page plane and the floating popup omni field. The dirty omni draft remains tab-scoped, while active typing ownership is explicitly acquired by the field and released back to page content on page interaction.


## 9.8.7 boot hardening
Startup now persists boot-stage diagnostics at `workspace/logs/boot-latest.log` and the Windows launcher surfaces that log on any non-zero PowerShell exit. The URL/Search focus repair avoids direct cross-type reference comparison in the dynamically compiled C# presenter.
