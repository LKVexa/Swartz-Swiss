# JA21 Omni Bin design system (8.1.0)

The brief asked for an ultrasmooth, hairline-light interface built on glassmorphism, soft
contrast, hairline geometry, ambient gradients and whitespace-dominant layout, with
frictionless interaction, predictive affordances, progressive disclosure, cubic-bezier
micro-motion and subpixel smoothing — calm, flow-state, trust-forward, emotionally neutral.

8.0.3 asserted those properties in prose. 8.1.0 implements them as a **token system** in
`host/JA21VirtualBrowser.cs` (`Ja21Design`, `Ja21Motion`, `BezierEase`) so each claim maps to
something a reader can check, and the package verifier fails if a token class disappears.

## Material

One ambient field, four glass levels, three hairline weights, five ink steps. Nothing else.

| Token group | Values | Rule |
|---|---|---|
| Glass | `Glass0`–`Glass4` (`0x26`–`0xEC` white) | level rises with how much the surface is asking for |
| Hairline | `Hair`, `HairSoft`, `HairFocus` | 1 px, low alpha; the only kind of division in the shell |
| Ink | `InkStrong`, `Ink`, `InkAccent`, `InkMuted`, `InkFaint` | soft-contrast slate; hierarchy by weight and step, never by size jumps |
| Semantic | `Settled`, `Attention` | desaturated; no red, no alarm |
| Geometry | `RadiusPill/Control/Panel/Card`, `GutterX/Y`, `Gap` | one radius scale, one whitespace scale |

**Hairline geometry.** Every division is a `Rule()` — one device pixel of low-alpha slate. The
8.0.3 chrome stacked bordered boxes (command rail box, tab rail box, status pills, content
frame), which read as five competing rectangles. 8.1.0 keeps closed shapes only where something
is genuinely a surface: the address capsule, the document frame, floating panels. Everything
else is separated by a rule or by space.

**Whitespace-dominant.** Gutters went from 18 px to 28 px, the status band lost its pills
entirely, the tab rail lost its container, and window controls lost their fills. The document
frame is now the heaviest object on screen by a wide margin, which is the point.

**Soft contrast.** Body ink is `#5C6C7E` on `Glass2`, not black on white. Display text steps to
`#0F1923` by weight, not by a large size jump.

**Ambient gradients.** Two radial fields at 0.17 and 0.13 opacity, fixed, never animated.

## Motion

Two vocabularies, each with a meaning, and nothing that runs on a timer.

| Vocabulary | Curve | Used for |
|---|---|---|
| Settle | `cubic-bezier(0.22, 1.00, 0.36, 1.00)` | anything appearing or resolving |
| Reveal | `cubic-bezier(0.40, 0.00, 0.20, 1.00)` | reversible reveals |
| Spring | critically damped, stiffness 360, damping 32 | anything following the pointer or a selection |

`BezierEase` pins `EasingMode.EaseIn` so the authored control points are the control points on
screen — `EasingFunctionBase` defaults to `EaseOut`, which silently evaluates the mirror of the
curve, and 8.0.3's `CubicEase` was a generic approximation of neither. WPF's own `KeySpline`
would express the same curve, but its evaluator is internal to PresentationCore, so `BezierEase`
inverts the cubic itself (Newton-Raphson on x, then y) from the four control coordinates.

**Zero jitter.** `SpringScalar` takes a `snapToPixel` flag. Anything that moves a *position*
(the drawer, the tab indicator) rounds to whole device pixels so a travelling hairline does not
shimmer; scale transforms deliberately do not snap. The window sets `UseLayoutRounding`,
`SnapsToDevicePixels`, `TextFormattingMode.Display`, `TextRenderingMode.ClearType` and
`TextHintingMode.Fixed`, which is the subpixel-smoothing requirement.

**Semantically meaningful.** The selected-tab indicator is one shared hairline that *travels*
between tabs rather than appearing and disappearing, so the motion states "the same selection
moved". Hover scale is spring-driven, so it tracks the pointer's arrival instead of playing back
at it.

**Calm.** There is exactly one repeating animation in the shell — the load sweep — and it exists
only while a document is in flight, at low contrast, and stops the moment the document settles.
Nothing animates at idle.

## Components

| Brief | Implementation |
|---|---|
| Hairline input bars | `BuildAddressCapsule` — one capsule, one hairline, a focus ring that fades in on keyboard focus only |
| Floating action bubbles | `BubbleButton`, and the scene-vessel FAB — the only elements with real elevation |
| Pill-shaped controls | `Pill()` is the single interactive primitive; tabs, actions and chips are all the same material |
| Ghost buttons | `GhostButton` / `GlyphButton` — no fill at rest, glass only under the pointer |
| Layered panels | scene vessel, contextual drawer, document frame — three distinct depths |
| Contextual drawers | `ContextDrawerWindow`, spring-positioned, cubic opacity |

## Frictionless and predictive

The address bar shows an **intent chip** stating what Enter will actually do — *Search*,
*Open · encrypted*, *New tab*, *Not opened* — and the decision comes from the JA21 policy VM,
not from a guess in the presenter. The chip therefore cannot promise an outcome the policy
would refuse. The sub-line states the resolved host. Keyboard-first throughout: `Ctrl+L`,
`Ctrl+T`, `Ctrl+W`, `Ctrl+R`, `Ctrl+B`, `Ctrl+Shift+N`, `Alt+Left/Right`, `F11`, `Esc`.

## Progressive disclosure

The drawer is built from one `Disclosure()` primitive. Each header carries the section name and
its current condition in two or three words — "VEC1 electron substrate · bound", "Auxiliary
DF_Small helper · offline" — so a reader can decide whether to open a section without opening
it. Bodies are collapsed by default and reveal on the Settle curve; a section that needs
attention starts open.

## Trust-forward, emotionally neutral

The trust line states only what is true of the current tab: transport, host (with the resolved
ASCII form when the displayed host is not ASCII), script isolation, and whether the VEC1
substrate is genuinely sealing state. It reports `DEGRADED` and `BLOCKED` as readily as `BOUND`.

Microcopy was rewritten away from system voice and alarm voice:

| 8.0.3 | 8.1.0 |
|---|---|
| "Invalid address." | "That address could not be read as a web address." |
| "Navigation blocked by JA21 policy." | "JA21 policy does not open that kind of address." |
| "The JA21 web workload could not be completed." | "This document did not finish." |
| "Load stopped · current generation retired" | "Stopped." |
| "Native helper needs attention." | "The helper reported something to look at." |
| "A calm native window for the web." | "A quiet window for the web." |

The error surface now also offers the two actions a reader actually wants — *Try again* and
*New tab* — instead of only describing the failure.
