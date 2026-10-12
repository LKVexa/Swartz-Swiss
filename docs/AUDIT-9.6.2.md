# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Repairs
- Added an explicit omni edit-session latch so clearing or editing the field is not overwritten by live-page URL synchronization.
- Enter ends the edit session and navigates; Escape ends the edit session and restores the current page URL; intentional tab switching also ends the edit session.
- Changed popup placement from overlay-relative `PlacementMode.Relative` to owner-window `PlacementMode.RelativePoint`.
- Changed drag clamp and normalized placement math to use the full `BrowserWindow.ActualWidth/ActualHeight`, eliminating the overlay-coordinate half-screen constraint.
