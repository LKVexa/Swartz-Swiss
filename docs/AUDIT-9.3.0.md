# JA21 Portable Optical Instrument Desktop 9.3.0 — Movable Omni Bar Audit

## Baseline
9.2.1 provided an elongated floating URL/search pill, but it was still anchored to the center column of the top command carrier. The user requested a floating omni bar that could be repositioned.

## Applied changes
1. The address capsule is now a direct child of the composition overlay at `ZFloating`.
2. A dedicated drag grip captures the pointer and moves only a `TranslateTransform`.
3. Movement is clamped to a 16-DIP viewport inset.
4. Position is normalized and persisted under the portable workspace.
5. Edge/center snap points, resize reflow, double-click recenter, Ctrl+Shift+L, and command-palette recenter were added.
6. Immersive mode withdraws/restores the omni bar independently of the peripheral command carrier.
7. Portable UI state is assigned to the existing `workspace.state` / `N_XLARGE` service boundary.

## Qualification boundary
Static/package tests can verify source structure, state path, placement metadata, integrity and regression rules. Actual pointer capture, mixed-DPI movement and WPF frame pacing remain target-Windows qualification items.
