# JA21 Movable Floating Omni Bar 9.3.0

## Interaction contract

The URL/search control is an independent optical plane rather than a toolbar cell. It is a 46-DIP elongated pill with a dedicated leading drag grip, search glyph, single-line omni input, blank-state watermark and trailing policy-derived intent chip. The grip owns movement; the text surface keeps ordinary caret/selection behavior.

## Movement

- Drag uses a `TranslateTransform`; page, tabs and peripheral controls do not reflow.
- The bar is clamped to a 16-DIP viewport inset.
- Position is represented as normalized X/Y coordinates in `[0,1]`, not absolute screen pixels.
- Near left/center/right and top/center/bottom anchor positions, values snap to `0`, `0.5`, or `1`.
- Window resize and DPI/layout changes recompute pixel placement from the normalized state.
- Double-clicking the grip or pressing `Ctrl+Shift+L` recenters the bar at normalized `(0.5, 0.0)`.

## Portable state

Placement is written to `workspace/state/ui/omni-bar.position`. The record contains only two invariant-culture normalized numbers. It is excluded from the sealed immutable application manifest and belongs to the portable mutable workspace. The service is recorded as `workspace.state`, which maps to `N_XLARGE` in the JA21 host-mediated placement contract.

## Optical-plane contract

The bar uses `Ja21Design.ZFloating`, above content/tab chrome and below drawers/palette/critical UI. Fullscreen/immersive mode temporarily withdraws it; exit restores the same normalized position.

## Claim boundary

Movement and persistence are WPF host presentation behavior. The node-placement receipt describes service ownership only; it does not claim that WPF executes inside a DF VM and it never produces a fabric verdict.
