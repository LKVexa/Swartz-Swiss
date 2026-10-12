# JA21 Portable Optical Instrument Desktop 9.8.6 Audit

## Reported defect
After a live site was visited, the floating URL/Search field could still receive mouse interaction but would not reliably accept typing, Backspace, or Delete.

## Root cause
The live WebView2 composition surface and the floating WPF `Popup` are separate focus surfaces. The 9.8.5 handler began an omni edit session on mouse-down but only queued a later `Focus()`/`Keyboard.Focus()` request. On affected Windows/WebView2 timing, WebView2 remained the native keyboard-focus owner after navigation. The field therefore appeared active while subsequent key input continued to target the page. A second state issue kept `_omniUserEditing` true after some focus-loss paths even though dirty-draft preservation no longer requires active typing ownership.

## Repair
- The popup shell is an explicit WPF focus scope.
- Clicking the URL/Search `TextBox` claims keyboard focus synchronously before normal caret placement and queues two verification/recovery attempts (`Input` and `ContextIdle`).
- Ctrl+L and the clear control use the same focus-claim path.
- `PreviewTextInput` preserves the first textual key if WebView2 wins the focus race.
- Backspace/Delete have a narrow first-key recovery path with selection-aware editing.
- Losing address focus clears active typing ownership while retaining dirty draft state.
- Clicking the page surface explicitly returns typing ownership to page content without discarding a dirty omni draft.
- Static/package verification now checks the complete focus-recovery contract.

## Qualification boundary
Cross-platform source, integrity, package, and regression tests are run in the build environment. Final WPF/WebView2 runtime behavior and the Windows PowerShell `Add-Type` compilation still require `Verify JA21 Virtual Browser.cmd` and an interactive post-navigation edit test on Windows.
