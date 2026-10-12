# JA Experience Design Language — Language Specification 0.1.0

## 1. Purpose

JA Experience Design Language (JAXD) is a human-readable, deterministic authoring language for interfaces, design systems, user journeys, responsive behavior, accessibility, interaction policy, motion, evidence, and multi-target projections. It unifies UI structure, UX intent, and visual design without collapsing their responsibilities into one opaque style sheet.

A JAXD program answers five questions:

1. **What exists?** Components, screens, regions, content, state, resources, and targets.
2. **How does it look?** Semantic tokens, themes, layout, typography, surfaces, depth, motion, and effects.
3. **How does it behave?** Events, actions, journeys, transitions, validation, permissions, recovery, and lifecycle.
4. **Who can use it?** Accessibility semantics, keyboard paths, focus behavior, localization, input modes, and reduced-motion alternatives.
5. **How is it trusted?** Explicit capabilities, no hidden network behavior, deterministic lowering, evidence, provenance, validation, and claim boundaries.

## 2. Profile

```text
Language: JA Experience Design Language
Short name: JAXD
Profile ID: ja.experience.design
Version: 0.1.0
Header: ja experience.design 0.1
Namespace root: ja.experience
Primary extension: .jxd
Primary artifact: ExperiencePackage
Shared kernel: ja-kernel-0.3
MCRT profile: EXPERIENCE_DESIGN_R12
```

## 3. Architectural relationship

JAXD is a composition profile. Its canonical lowering is:

```text
.jxd source
  -> lexical envelope
  -> CHARLOTTE experience graph
  -> SOPHIA semantic/accessibility/policy judgment
  -> canonical ExperienceIR + R12
  -> LANDON projections
       -> .jaui interface source
       -> .dmk deterministic detail/style source
       -> optional portal.scene / timeline / motion / vfx bindings
       -> target manifest + MCRT evidence
```

The `.jxd` source remains authoritative. Generated files are readable projections, not Base64 payloads.

## 4. Design principles

### 4.1 Semantic before visual

Authors name intent (`surface.canvas`, `action.primary`, `status.danger`) rather than scattering raw values. Raw values are legal inside token definitions but discouraged inside components.

### 4.2 Explicit interaction states

Interactive components must define relevant states from:

```text
idle, hover, focus, active, selected, disabled, busy, success, warning, error
```

### 4.3 Accessibility is structural

Accessibility is not an optional annotation. Every interactive component must have a role, an accessible name or binding, keyboard activation, focus policy, and visible focus treatment. Every motion declaration must provide a reduced-motion result.

### 4.4 Capability-bound actions

Actions that produce effects must declare a required capability. A backend cannot silently add `network.access`, `file.write`, `process.spawn`, or privilege elevation.

### 4.5 Deterministic design

Canonical token resolution, component identity, graph ordering, target projection, and evidence output use stable IDs and source hashes. Random visual effects require explicit seeds.

### 4.6 Recovery is part of UX

Destructive, transactional, or long-running flows must declare confirmation, progress, cancellation or rollback behavior, and user-readable recovery states.

## 5. Top-level declarations

A program contains:

```text
header
module
imports
policies
tokens
themes
resources
components
screens
journeys
targets
evidence
emissions
```

Minimal program:

```jxd
ja experience.design 0.1
module examples.hello
use Experience.Core
policy no_network

experience Hello {
  tokens Foundation {
    color surface.canvas = color("#101014")
    color text.primary = color("#F8F8FA")
    length space.2 = 8px
    radius control.medium = 10px
  }

  component GreetingCard {
    property message: Text = "Hello"
    layout stack vertical gap token(space.2)
    style {
      background token(surface.canvas)
      radius token(control.medium)
    }
    accessibility {
      role group
      name "Greeting"
    }
    text bind message
  }

  screen Main target [desktop, web] {
    place GreetingCard in content
  }

  evidence { emit r12; emit mcrt; emit accessibility_report; }
  emit package "hello.experience"
}
```

## 6. Types

### 6.1 Scalar and semantic types

```text
Bool, Flag, Int, UInt, Float, Decimal, Text, RichText, Identifier
Color, Length, Ratio, Angle, Duration, Frequency, Easing, Shadow
FontFamily, FontWeight, Typography, Icon, Image, Vector, Rect, Insets
Locale, Direction, Breakpoint, InputMode, Capability, Effect, SemanticId
```

### 6.2 Container types

```text
Option<T>, List<T>, Set<T>, Map<K,V>, Range<T>, Result<T,E>, Stream<T>
```

### 6.3 Experience types

```text
ExperiencePackage, TokenSpace, Theme, Component, Screen, Region, Journey
Interaction, AccessibilityContract, ResponsiveContract, MotionContract
Resource, TargetProfile, ExperienceIR, EvidenceBundle
```

## 7. Token system

Token kinds:

```text
color, length, radius, duration, easing, typography, shadow, opacity,
border, icon, zindex, breakpoint, grid, motion, effect, content
```

Tokens form a directed acyclic dependency graph. Aliases use `token(...)` and theme mappings use `<-`.

```jxd
tokens Foundation {
  color neutral.950 = color("#0D0912")
  color violet.500 = color("#8C4DFF")
  color action.primary = token(violet.500)
  length space.1 = 4px
  length space.2 = 8px
  length space.4 = 16px
  radius surface.large = 18px
  duration motion.fast = 120ms
  easing motion.standard = cubic(0.2, 0.0, 0.0, 1.0)
}
```

A token cannot change kind across a theme. Cycles are rejected.

## 8. Themes

Themes map semantic roles to tokens and may define modes.

```jxd
theme VaporMarble inherits Foundation {
  map canvas <- neutral.950
  map action <- action.primary

  mode dark {
    map text.primary <- white
  }

  mode high_contrast {
    minimum_contrast text 7.0
    minimum_contrast control 4.5
  }
}
```

Themes must preserve semantic role compatibility. High-contrast mode cannot reduce an existing contrast requirement.

## 9. Components

A component may declare properties, typed slots, local/shared state, derived values, layout, style, content, accessibility, interactions, responsive behavior, motion, validation, and evidence.

```jxd
component RunButton variant primary {
  property label: Text
  property enabled: Flag = true
  state busy: Flag = false
  derived can_run = enabled and not busy
  slot leading: Icon?

  layout stack horizontal gap token(space.2) align center

  style {
    background token(action.primary)
    foreground token(text.on_action)
    radius token(control.medium)
    padding [token(space.2), token(space.4)]
    on focus { outline token(focus.ring) width 2px }
    on disabled { opacity 0.45 }
  }

  accessibility {
    role button
    name bind label
    keyboard activate [Enter, Space]
    focus visible
  }

  interaction activate {
    when can_run
    action dispatch RunTask requires task.execute
    feedback busy within 100ms
    recover message "The task could not be started."
  }

  motion state_change using motion.fast reduced instant
}
```

## 10. Layout

Supported layout models:

```text
stack, grid, flow, overlay, dock, absolute, constraint, virtual_list
```

JAXD uses typed lengths and explicit overflow behavior. Layout declarations must not depend on source-order accidents.

```jxd
layout grid {
  columns [minmax(240px, 1fr), 2fr, minmax(280px, 1fr)]
  rows [44px, 1fr, 28px]
  gap token(space.3)
  overflow clip
}
```

Constraint declarations are solver-visible and must include priorities when potentially competing.

## 11. Responsive behavior

Breakpoints are semantic tokens. Responsive blocks may change layout, visibility, density, or navigation, but cannot remove required functionality without an alternate path.

```jxd
responsive {
  at compact {
    layout stack vertical
    move Inspector to drawer
  }
  at wide {
    layout grid columns [280px, 1fr, 340px]
  }
  input touch { minimum_target 44px }
  input keyboard { focus_path required }
}
```

## 12. Screens and regions

Screens compose components into named regions. Regions provide stable navigation and accessibility landmarks.

```jxd
screen Workspace target [desktop, web] {
  region navigation role navigation
  region editor role main
  region inspector role complementary
  region status role status

  place RepositoryTree in navigation
  place CodeEditor in editor
  place DocumentInspector in inspector
  place TaskStatus in status
}
```

## 13. Journeys and UX contracts

A journey models user intent, not merely page order.

```jxd
journey TranslateRepository {
  actor developer
  goal "Translate a repository while preserving readable formatting"
  start SelectRepository

  step SelectRepository {
    require repository.path.read
    success ConfigureTranslation
    recover stay with message "Choose a readable repository."
  }

  step ConfigureTranslation {
    decision output_language from language_catalog
    success ReviewPlan
  }

  step ReviewPlan {
    confirm summary
    success RunTranslation
    cancel ConfigureTranslation
  }

  step RunTranslation {
    progress determinate
    cancel safe_checkpoint
    success InspectResults
    failure Recovery
  }

  measure completion_rate
  measure time_to_first_feedback target <= 100ms
}
```

Every journey should define success, failure, cancel, and recovery where applicable. Dead ends are certification errors.

## 14. Interaction and effects

Canonical interaction triggers:

```text
activate, change, submit, open, close, select, deselect, drag, drop,
focus, blur, hover, key, gesture, timer, service_result, lifecycle_event
```

Canonical effects include:

```text
ui.render, ui.navigate, ui.announce, ui.focus, state.read, state.write,
file.read, file.write, process.spawn, service.call, ledger.append,
package.read, package.write, privilege.elevate, network.access
```

Every non-UI effect requires a matching capability. `policy no_network` statically rejects `network.access`.

## 15. Accessibility contract

Certification checks include:

- role and accessible name for interactive controls;
- complete keyboard path;
- visible focus;
- no keyboard trap;
- reading order compatible with semantic order;
- status and error announcements;
- text scaling and reflow;
- minimum target size declared for touch profiles;
- color not used as the sole carrier of meaning;
- reduced-motion alternative;
- localization and bidirectional-layout readiness when declared.

JAXD records the target standard and conformance level but does not claim legal or external certification unless evidence is attached.

## 16. Motion and VFX

Motion declarations describe intent and lower to MCRT Portal Timeline or DeepML Motion. Effects lower to DeepML VFX. UI motion must never be the only feedback channel.

```jxd
motion PanelReveal {
  duration token(motion.medium)
  easing token(motion.standard)
  from { opacity 0; translate_y 8px }
  to { opacity 1; translate_y 0px }
  reduced { opacity 1; translate_y 0px; duration 0ms }
}
```

Randomized effects require a seed and a deterministic stream identity.

## 17. Content and localization

User-facing strings may be literal during prototyping, but deployable packages should use content keys.

```jxd
content action.run {
  en "Run"
  es "Ejecutar"
  fallback en
}
```

Localization validation checks missing keys, variable compatibility, expansion tolerance, plural forms, and direction changes.

## 18. Installer and lifecycle UX

When bound to `.jai`, installer experiences must expose product identity, target, scope, requested privileges, progress, verification, rollback, repair, upgrade, and complete uninstall behavior. Hidden host mutations are forbidden.

Destructive uninstall must distinguish application removal from user-data removal. Network-denied packages cannot present controls that imply online retrieval.

## 19. 8S experience coupling

The supplied 8S corpus is adapted as a design computation profile:

- **site:** component, region, screen, journey step, or action node;
- **latent center:** intent, content, context, capability, and evidence;
- **fiber:** target, theme, locale, and input-mode variants;
- **pairwise coupling:** declared dependency, navigation, binding, or layout edge;
- **triadic coupling:** interaction-state-policy or operation-host-recovery constraint;
- **projection:** target-specific interface/style/runtime artifact.

Relation classes are used for diagnostics and optimization, not as claims of physical quantum behavior.

## 20. Compiler responsibilities

### SOPHIA pass

- type/effect/capability judgment;
- policy and claim-boundary enforcement;
- accessibility and lifecycle invariants;
- admission/rejection diagnostics;
- proof-obligation and certification state.

### CHARLOTTE pass

- stable component, screen, journey, token, and interaction graph;
- token resolution and cycle detection;
- documentation visibility and operator-readable diagnostics;
- cross-reference graph and source map;
- interaction and accessibility reports.

### LANDON pass

- deterministic ExperienceIR lowering;
- readable `.jaui` and `.dmk` projections;
- optional motion/VFX/scene/timeline projections;
- target packaging and manifests;
- R12/MCRT evidence and replay metadata.

## 21. Diagnostics

Diagnostic families:

```text
JXD-P-* parser/structure
JXD-T-* type/token
JXD-A-* accessibility
JXD-U-* user journey/recovery
JXD-C-* capability/policy
JXD-D-* determinism
JXD-L-* lifecycle
JXD-X-* projection/interoperability
JXD-E-* evidence/certification
```

Examples:

```text
JXD-A-ROLE-MISSING
JXD-A-KEYBOARD-PATH-MISSING
JXD-A-REDUCED-MOTION-MISSING
JXD-C-CAPABILITY-MISSING
JXD-C-NETWORK-DENIED
JXD-U-DEAD-END
JXD-L-ROLLBACK-MISSING
JXD-T-TOKEN-CYCLE
JXD-D-SEED-MISSING
```

## 22. Provisional status

The specification is corpus-derived and the included compiler is a bootstrap implementation. Production claims require a separately verified parser, type checker, renderer, target adapters, accessibility test harness, and runtime provider.
