# JA21 Omni Bin Window (8.0.3 presenter)

This release treats the Windows WPF host as a **native JA21 Omni Bin window substitute**: glass chrome only. DF_Medium remains the web-engine VM.

## Design system (implemented)

| Criterion | Implementation |
|-----------|----------------|
| Ultrasmooth / zero-jitter | Event-driven spring motion (`SpringScalar`) on hover and drawer; layout rounding + device-pixel snapping |
| Hairline-light | 1 px low-alpha borders |
| Glassmorphism | Translucent command rail, tabs, content frame, status pills, contextual drawer, Omni Bin vessel |
| Ambient gradients | Soft aqua/violet radial fields (quiet opacity) |
| Whitespace-dominant | Wider chrome margins; document surface keeps priority |
| Frictionless / predictive | Address predictive affordance; Ctrl+L / Enter |
| Progressive disclosure | Context drawer + floating Omni Bin scene vessel (Ctrl+B / FAB) |
| Spring micro-motion | Critically damped spring hover scale; cubic drawer opacity |
| Subpixel smoothing | Display + ClearType + fixed hinting + HQ bitmap scaling |
| Calm / trust-forward / neutral copy | New-tab and About microcopy without alarm language |

## Components

Hairline input bar, floating action bubbles, pill tabs and status, ghost buttons, layered panels, contextual drawer, Omni Bin scene vessel.

## How to run

1. `Verify JA21 Virtual Browser.cmd`
2. `Start JA21 Virtual Browser.cmd`
3. Optional: FAB or `Ctrl+B` for Omni Bin vessel; `···` for context drawer.
