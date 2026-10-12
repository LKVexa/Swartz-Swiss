# JA21 9.8.4 — Page-Independent Floating Omni Bar

## Objective
Make the elongated omni URL/search instrument the only search/navigation surface, keep it movable across home and navigated WebView2 pages, and remove user-facing renderer selection.

## Architecture
The omni bar is hosted by a WPF `Popup` with `PlacementTarget` set to the browser overlay root, `PlacementMode.Relative`, `AllowsTransparency=true`, and `StaysOpen=true`. This creates a separate browser-owned presentation/input surface above WebView2 composition content. Its position is represented as normalized viewport coordinates and persisted in `workspace/state/ui/omni-bar.position`.

Dragging uses pointer capture on the dedicated grip plus owner-window cursor coordinates from `GetCursorPos`/`PointFromScreen`, then updates Popup `HorizontalOffset`/`VerticalOffset`. No page layout dimensions are animated or modified.

## Home surface
`ShowHome` contains no Border card, TextBox, GhostButton, renderer selector, or duplicate address surface. Only low-opacity noninteractive watermark text is retained.

## Automatic renderer policy
There is no LIVE/NATIVE segmented control and no command-palette renderer action. HTTP/HTTPS navigation prefers the WebView2 composition surface when available. If live initialization fails, the existing DF_Medium inspection path remains the internal fallback. Renderer state remains diagnostic evidence, not a user-selected mode.

## Qualification boundary
Static/package verification can prove the Popup architecture, absence of selector code, portable persistence, and unboxed landing surface. Windows qualification must still verify real WebView2 z-order/hit-testing, popup focus, mixed-DPI dragging, fullscreen withdrawal/restore, and accessibility behavior.
