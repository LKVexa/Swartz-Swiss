# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Requested change
Use a Copilot-like color treatment, but with Windows colors.

## Implemented
- Added a reusable `WindowsSpectrum(byte alpha)` brush using Windows blue, cyan, green, gold, and red.
- Changed the primary accent family to Windows blue.
- Applied the Windows spectrum to the floating omni border/focus ring, Copilot control, and bottom control island hairline.
- Added low-energy Windows-blue, green, and warm ambient blooms while preserving neutral white/graphite working surfaces.
- Preserved high-contrast mode and the existing portable/WebView2/VEC1 interaction architecture.
