# JA21 Portable Optical Instrument Desktop 9.8.7 Audit

## Trigger
The 9.8.6 Windows-safe package was reported to terminate its PowerShell host during boot before normal browser qualification could proceed.

## Finding
The 9.8.6 focus-reclaim path introduced a direct reference comparison between `Keyboard.Focus(_address)` (declared as `IInputElement`) and `_address` (`TextBox`). JA21 dynamically compiles its WPF presenter through Windows PowerShell `Add-Type`, and this release line has already demonstrated that compiler warnings can become launch-blocking errors. The expression was therefore treated as a release-blocking compiler-hygiene risk even though package/static integrity tests cannot reproduce the target Windows compiler.

## Repair
`ClaimOmniKeyboardFocus` now calls `Keyboard.Focus(_address)` for its side effect and evaluates success only through `_address.IsKeyboardFocusWithin`. The 9.8.6 focus-transfer behavior is otherwise retained.

## Boot hardening
Startup now records durable stages to `workspace/logs/boot-latest.log`: portable layout ready, live-web provisioning begin/complete, presenter compile begin/complete, presenter run begin/exit. A script-level trap records terminating PowerShell errors. The CMD launcher prints this file before pausing whenever PowerShell returns a non-zero exit code.

## Verification scope
Cross-platform verification checks package integrity, runtime seals, version coherence, VEC1 control-plane tests, the existing omni draft/focus/navigation regressions, the absence of the warning-risk expression, and the presence of persistent boot diagnostics. The actual WPF/WebView2 `Add-Type` compile and keyboard interaction remain Windows target-machine qualification gates.
