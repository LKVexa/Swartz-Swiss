# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Requested interaction changes
- Permit the floating omni search box to move across the complete browser client area.
- Make selected text visibly highlighted.
- Preserve text editing after a live WebView2 site has loaded.
- Double-click the move grip to collapse the search box to the Copilot button footprint and double-click again to restore it.

## Implementation
- Drag clamping uses a zero-inset full `BrowserWindow.ActualWidth/ActualHeight` domain with owner-relative popup coordinates.
- The TextBox selection brush is an opaque Windows-blue highlight and Ctrl+L reclaims keyboard focus before `SelectAll()`.
- Active user-edit state continues to block page URL synchronization until Enter/Escape/tab-switch ends the edit session.
- Collapse is a reversible presentation state: 30x30 DIP, preserving text, URL state, normalized position and navigation state. The compact control remains draggable.
- Ctrl+Shift+L remains the explicit recenter command.
