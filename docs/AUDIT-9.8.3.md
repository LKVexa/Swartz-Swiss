# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Request
Hard-code the approved text-free Windows-spectrum landing design directly into the home page.

## Implementation
- Replaced the 9.8.2 raster landing asset with native WPF geometry.
- Hard-coded translucent blue/cyan/green/gold/orange/red ribbon paths using `Geometry.Parse`.
- Added translucent four-pane Windows architecture, atmospheric blur fields, crest hairlines, pixel/bokeh accents, and a reflective glass-floor wash.
- The landing page contains no descriptive text or duplicate search field.
- The movable omni box and bottom command island remain live overlay chrome.

## Runtime
The design scales through a 1600×900 `Canvas` hosted in `Viewbox Stretch=UniformToFill`; no image decoding or OCR is needed at runtime.
