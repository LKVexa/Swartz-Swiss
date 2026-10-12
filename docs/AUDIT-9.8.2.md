# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Change
Encoded the approved text-free Windows-spectrum pixel-smoke landing/home artwork directly into the browser package.

## Implementation
- Added `assets/landing-windows-pixel-smoke-9.8.4.png`.
- Replaced the text-heavy WPF landing composition with a full-bleed `Image` surface.
- Uses `Stretch.UniformToFill` and high-quality bitmap scaling.
- Keeps the movable omni search box and bottom control island as live WPF chrome above the artwork.
- Keeps Windows high-contrast mode on a neutral gradient fallback.
- No duplicate search bar, descriptive paragraph, headline, or landing-page copy is created by `ShowHome(...)`.
