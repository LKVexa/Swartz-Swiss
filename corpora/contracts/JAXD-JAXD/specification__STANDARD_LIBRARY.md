# JAXD Standard Library 0.1

## Modules

```text
Experience.Core
Experience.Token
Experience.Theme
Experience.Layout
Experience.Component
Experience.Screen
Experience.Journey
Experience.Interaction
Experience.Accessibility
Experience.Responsive
Experience.Content
Experience.Motion
Experience.Effect
Experience.Resource
Experience.Target
Experience.Evidence
Experience.Installer
Experience.Portal
```

## Core constructors

```text
color(hex_or_profile)
token(path)
font(family, size, line_height, weight)
shadow(x, y, blur, spread, color)
border(width, style, color)
cubic(x1, y1, x2, y2)
spring(mass, stiffness, damping)
minmax(min, max)
clamp(min, preferred, max)
locale(tag)
content_key(path)
resource_ref(path)
capability(path)
seed(number)
```

## Semantic token roles

```text
surface.canvas, surface.panel, surface.elevated, surface.overlay
text.primary, text.secondary, text.muted, text.on_action
border.subtle, border.strong, focus.ring
action.primary, action.secondary, action.destructive
status.info, status.success, status.warning, status.danger
space.0..space.12, radius.none..radius.full, depth.0..depth.6
motion.instant, motion.fast, motion.medium, motion.slow
breakpoint.compact, breakpoint.medium, breakpoint.wide, breakpoint.ultrawide
```

## Baseline components

```text
AppShell, TopBar, StatusBar, NavigationRail, RepositoryTree, TabStrip
CodeEditor, TerminalPane, InspectorPane, DocumentViewer, SceneViewport
Button, IconButton, SplitButton, Menu, CommandPalette, TextField, Select
Checkbox, RadioGroup, Toggle, Slider, Progress, Toast, Dialog, Drawer
Card, Table, Tree, List, Grid, Form, EmptyState, ErrorState, Skeleton
InstallerStep, PermissionSummary, VerificationPanel, RollbackPanel
```

## Accessibility helpers

```text
accessible_button(name, description?)
accessible_field(label, hint?, error?)
announce_status(priority)
focus_trap(modal_only)
restore_focus(target)
keyboard_roving(axis)
minimum_target(size)
contrast_pair(foreground, background, ratio)
reduced_motion(result)
```

## UX helpers

```text
feedback_immediate(max_latency=100ms)
confirmation_for_destructive()
progress_determinate(total)
progress_indeterminate(message)
recoverable_error(message, retry, details?)
undo_window(duration)
safe_checkpoint(name)
empty_state(title, guidance, action?)
```

## Effects and capabilities

UI-only effects may be implicitly provided by the experience runtime:

```text
ui.render, ui.focus, ui.announce, ui.navigate
```

All other effects require explicit capabilities:

```text
state.read, state.write, file.read, file.write, directory.read,
directory.write, process.spawn, process.control, service.call,
package.read, package.write, host.inspect, privilege.elevate,
ledger.append, network.access
```
