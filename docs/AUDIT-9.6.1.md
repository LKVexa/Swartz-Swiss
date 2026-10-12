# JA21 Portable Optical Instrument Desktop 9.8.4 — Interaction Reliability Audit

This patch addresses three target-machine defects reported against 9.8.4.

1. **Pointer disappears over video** — the live WebView2 bridge now injects a narrow cursor guard that changes only DOM elements whose computed cursor is explicitly `none`, leaving ordinary link/text cursor semantics intact.
2. **Floating omni box cannot be dragged across the page** — dragging is no longer dependent on popup-local `MouseMove` delivery. While the left button is held, JA21 polls the system pointer from the owner window on the WPF composition frame and updates Popup offsets globally, including while crossing WebView2/video content.
3. **Omni contents cannot be edited on a site** — clicking the popup text box explicitly reclaims keyboard focus from WebView2, and `SyncChrome()` no longer overwrites the field while it has keyboard focus.

The portable workspace, bottom control island, hidden tab rail, automatic renderer routing, Copilot button, and four-node VEC1 placement remain unchanged.
