# JA Interface Language Specification 1.0.0

## 1. Scope

JA Interface Language (`.jaui`) is the governed interface-definition language for the
JA21 suite. It describes components, typed properties, state, dependency bindings,
layout, accessibility, navigation, target profiles, motion bridges, resource loading,
and controlled interaction with services and host capabilities.

This suite is reconstructed from the uploaded 10,000-record corpus. Where the corpus
models compiler or runtime behavior, this specification records that behavior as a
**conformance target**. It does not claim that a native compiler or runtime was supplied.

## 2. Design principles

- **Typed before rendered.** Interface graphs are validated before target materialization.
- **Declarative by default.** State and derived values define dependencies; imperative
  actions are explicit and capability-governed.
- **Accessibility is semantic.** Roles, names, focus order, and keyboard paths are part
  of the typed artifact and certification evidence.
- **Targets are profiles, not forks.** Desktop, mobile, web, and headless targets share
  one semantic graph and resolve through target adapters.
- **Motion remains deterministic.** Animation, motion, timeline, scene, and VFX bindings
  carry identities, clocks, and replay expectations.
- **No ambient authority.** Network, file, host, service, and administrative actions
  require declared capabilities and policy approval.
- **Evidence travels with the artifact.** Source hash, semantic judgment, AST identity,
  R12 lowering, runtime expectation, and MCRT receipt remain linked.

## 3. Compilation unit

A unit begins with a JA source version, module declaration, imports, and policies.
At least one interface declaration and one emission statement are required for a
materializable interface artifact.

## 4. Interface graph

An interface is a named graph of state nodes, derived nodes, reactive nodes, components,
resources, localization bundles, navigation routes, themes, and target profiles.
Components may be nested, but stable component identity must survive optimization.

## 5. State and binding

`state` owns local mutable interface data. `shared state` exposes governed state to
declared scopes. `derived` values are pure graph nodes. `reactive` values may subscribe
to approved effects. Bindings must be typed and cycle-safe. A compiler may collapse
pure nodes only when observable update order and diagnostics are preserved.

## 6. Interaction

Events identify runtime occurrences. Commands identify intentional operations.
Actions that cross an effect boundary require a capability reference. Forms combine
typed fields, validation rules, submission commands, and recovery behavior.

## 7. Layout and responsive behavior

Constraints are solved against a target viewport and target policy. Required
constraints must be satisfiable. Responsive rules alter presentation without changing
semantic identity or accessibility meaning.

## 8. Accessibility

Interactive components require meaningful roles, accessible names, focus behavior,
and keyboard reachability. Validation may reject hidden focus targets, incomplete
keyboard paths, contradictory roles, or missing names.

## 9. Visual and motion systems

Design tokens and themes provide governed values for typography, spacing, materials,
and appearance. Animation, motion, timeline, and VFX bindings reference stable
external identities and deterministic clocks. Reduced-motion behavior is a target
and accessibility concern, not an optional cosmetic branch.

## 10. Navigation, resources, and localization

Routes map semantic destinations to components. Resources must resolve through
declared adapters. Localization uses stable message identities, locale fallbacks,
and evidence of missing-key handling. Network resolution is forbidden under
`policy no_network` unless an explicit policy profile overrides it.

## 11. Targets

Desktop, mobile, web, and headless profiles materialize the same typed interface graph.
A target adapter may reject unsupported capabilities or provide a certified lowering.
Headless targets retain interaction, state, accessibility, and evidence semantics even
when no visual surface is produced.

## 12. Compiler evidence

The compiler emits a typed AST, semantic judgment, diagnostics, stable source identity,
and an R12 record. Optimization must preserve type, effect, capability, policy,
accessibility, deterministic replay, and diagnostic obligations.

## 13. Runtime evidence

The runtime resolves resources and targets, schedules state propagation, dispatches
authorized commands, records observed effects, and produces an MCRT receipt. The
receipt must distinguish modeled expectations, test execution, and production evidence.
