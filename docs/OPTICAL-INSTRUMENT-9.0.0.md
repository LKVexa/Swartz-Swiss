# JA21 Optical Instrument UI/UX/XD — 9.0.0

## Purpose

9.0.0 is the first major release that treats JA21 as an **optical instrument shell** rather than a conventional browser toolbar wrapped around a renderer. The implementation applies the shared architectural outcomes of the 12,500-item Prompt + Workflow series while preserving the existing VEC1 evidence boundary, DF_Medium native-inspection path, and explicit WebView2 live-web dependency.

## Architectural changes

### Full-bleed content plane

The renderer occupies the entire client area. Browser chrome no longer reserves permanent command/tab/status rows. WPF chrome is composed above the renderer through `host/JA21VirtualBrowser.cs`.

For LIVE mode, `host/LiveWebBridge.cs` uses `Microsoft.Web.WebView2.Wpf.WebView2CompositionControl`. This is required so WPF controls can be layered above the live web surface without the traditional `HwndHost` airspace problem.

### Optical planes

The shell defines deterministic optical planes:

- ambient field — z 0
- content — z 100
- floating chrome — z 300
- action surfaces — z 400
- contextual drawer — z 500
- command palette — z 600
- critical browser-owned surface — z 900

The overlay root intentionally has no background hit target. Empty overlay space therefore remains pointer-transparent to the website.

### Design system 2.0.0

`Ja21Design` is the authoritative semantic token source.

- one JA21 cyan accent family
- neutral optical canvas
- Glass0 through Glass4
- structural / soft / focus hairlines
- primary / secondary / tertiary ink
- named 2–96 DIP whitespace scale
- pill / control / panel / card radii
- deterministic z-plane constants
- explicit light / dark override / high-contrast variants
- device-pixel hairline conversion through the active `PresentationSource`
- reduced-motion override through `JA21_REDUCED_MOTION=1`

Dark appearance can be explicitly selected with `JA21_THEME=dark`. 9.0.0 does **not** claim automatic Windows light/dark preference tracking.

### Floating omni rail

The command surface is one floating glass rail containing:

- JA21 optical identity and drag affordance
- Back / Forward / Reload
- predictive omni input
- segmented LIVE / NATIVE renderer instrument
- New Tab
- contextual diagnostics
- minimal window controls

The private-tab action moved out of permanent chrome and remains available from the command palette and contextual drawer.

### Renderer instrument

LIVE and NATIVE are separate controls in one segmented instrument. Visual selection is derived from actual renderer state; LIVE is disabled when the adapter/runtime boundary is unavailable.

### In-window contextual drawer

The previous auxiliary top-level drawer window is replaced by an in-window optical drawer. It contains progressively disclosed VEC1, renderer, JA21/DF_Medium, helper, and runtime information. It cannot fabricate a VEC1 fabric verdict.

### Command palette

`Ctrl+K` opens an in-window command palette for high-value browser actions:

- new tab
- private tab
- switch to LIVE
- switch to NATIVE
- context / VEC1 diagnostics
- downloads
- immersive mode
- focus omni input

The palette is browser-local. 9.0.0 does not claim an external AI model/service behind this control.

### Calm motion

The shell uses semantic cubic-bezier reveals and a critically damped spring implementation. Reduced-motion mode snaps spring values and directly resolves fades. High-frequency geometry is moved with transforms where practical.

### Device-pixel hairlines

Controls and separators update their border/line thickness after connection to a presentation source. One physical pixel is expressed in DIPs from the active device transform. This is distinct from the 1-DIP fallback used before a visual is connected.

### Compact trust layer

The bottom-right trust pill exposes compact renderer/origin/VEC1 state and retains the longer factual trust statement as detail. Clicking it opens the contextual drawer.

### Immersive video

WebView2 `ContainsFullScreenElementChanged` remains the site-fullscreen signal. Immersive mode now:

- closes contextual/transient surfaces
- hides command, tab, trust/status, action-bubble and load chrome
- uses the monitor nearest the current window instead of forcing the primary display
- makes content edge-to-edge
- restores the previous window state/bounds when application fullscreen exits

### Accessibility

The runtime adds automation names to shared buttons, glyph controls, omni input and command palette. Keyboard behavior includes root-level Escape recovery and Ctrl+K / Ctrl+L / Ctrl+T / Ctrl+W / Ctrl+R / Ctrl+Tab / Ctrl+Shift+Tab / F11.

## Trust and runtime boundaries

- VEC1 lifecycle/presentation evidence is not a fabric execution verdict.
- LIVE uses the installed Microsoft Edge WebView2 Runtime and pinned SDK adapter.
- NATIVE uses the sealed DF_Medium inspection path and isolates arbitrary site JavaScript.
- Camera, microphone, geolocation, notifications, clipboard escalation and similar WebView2 permissions remain denied by default unless the existing explicit launch override is used.
- Electron and Node remain absent as bundled runtime requirements.

## Qualification boundary

Cross-platform source, package, manifest, VEC1, version, traceability, and static regression tests can be run in the build environment. The following still require the target Windows machine:

- WPF `Add-Type` compile using the installed Windows framework assemblies
- WebView2CompositionControl rendering above a real live page
- site fullscreen/video behavior
- mixed-DPI monitor movement
- Windows high-contrast and screen-reader execution
- HDR/color-profile inspection
- ETW/frame-time performance measurement
- DRM/protected media

No target-machine PASS is claimed until those gates are actually run.
