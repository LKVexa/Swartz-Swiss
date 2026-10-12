## 9.8.7 — Windows PowerShell boot hardening
9.8.7 hardens the 9.8.6 post-navigation URL/Search repair for the Windows PowerShell 5.x `Add-Type` compiler path. The focus-reclaim code no longer directly compares the `IInputElement` returned by `Keyboard.Focus(...)` with the URL `TextBox`; focus success is determined from `IsKeyboardFocusWithin` instead. Startup now writes durable stages to `workspace/logs/boot-latest.log`, traps terminating setup/compile/run errors, and the launcher prints that log before pausing on a non-zero exit. The 9.8.6 URL/Search typing, Backspace/Delete, dirty-draft, WebView2 focus-transfer, and page-click ownership protections remain in place.

## 9.8.6 — Post-navigation URL/Search editing repair
9.8.6 repairs a keyboard-focus ownership race between the popup omni field and the live WebView2 composition surface. After a site loaded, WebView2 could retain keyboard ownership even when the URL/Search field was clicked, making typing and deletion appear disabled. The field now reclaims focus synchronously, verifies it twice through the dispatcher, preserves the first text/Delete/Backspace input if the race still occurs, and explicitly returns typing ownership to page content when the page itself is clicked.

## 9.8.4 — native hard-coded Windows ribbon landing
- Replaced the raster home artwork with native WPF paths, gradients, haze, panes, particles, and floor reflection.
- Landing page remains text-free; the movable omni bar and bottom control island remain separate live chrome.

# JA21 Portable Optical Instrument Desktop 9.8.1

## 9.8.1 — bottom control island + shape-changing omni search

JA21 now exposes one URL/search instrument: the movable elongated floating omni bar. The home/new-tab surface no longer contains a hard card, duplicate search/address surface, or address-focus button. The landing page is intentionally unboxed so the movable omni bar is the only navigation/search object.

The omni bar is hosted in its own browser-owned WPF `Popup` surface rather than inside the page overlay visual tree. That gives it a separate presentation/input surface above the WebView2 composition document, so navigating to a modern web page does not take away the drag grip. Drag the grip to reposition it, double-click the grip or press **Ctrl+Shift+L** to recenter it, and JA21 persists normalized placement only under `workspace/state/ui/omni-bar.position`.

The visible **LIVE / NATIVE** renderer chooser has been removed. JA21 now selects rendering automatically: HTTP/HTTPS uses WebView2 when the bridge/runtime is ready, while DF_Medium remains the sealed inspection/fallback path when live rendering cannot initialize. The trust surface shows origin and VEC1 state; renderer detail remains available in contextual diagnostics without becoming a user mode switch.

The Optical Instrument Design System advances to **2.8.0**. Portable workspace semantics, four-node VEC1 placement, DF0 evidence discipline, AppData-free JA21-owned mutable state, WebView2 managed-loader ordering, and immersive video behavior are preserved.

## 9.2.1 — warning-as-error compile hygiene + version-coherent launcher

- Completes the renderer selection indicator that was declared but unused in 9.1.1, eliminating the Windows `Add-Type` warning-as-error failure.
- Keeps the indicator zero-jitter by animating only a `TranslateTransform`, with a reduced-motion snap path.
- Adds joined-C# dead-private-field regression gates before the Windows compiler and in the cross-platform verifier.
- Makes the portable launcher read its banner version from the top-level `VERSION` file instead of a stale hard-coded `9.1.0` string.
- Retains the run-in-place workspace, AppData redirection, DF-tier placement, VEC1 evidence discipline, portable WebView2 state, and snapshot architecture.

## 9.1.1 — joined C# compile repair

- Fully qualifies portable filesystem operations as `System.IO.Path.*` so the merged WPF `Add-Type` compilation unit cannot confuse `System.IO.Path` with `System.Windows.Shapes.Path`.
- Adds static and Windows verification gates that reject any recurrence of bare `Path.*` in the joined C# sources.
- Retains the 9.1.0 run-in-place workspace, DF-tier placement, portable WebView2/VEC1 state, and snapshot architecture unchanged.

## 9.1.0 — run-in-place portable desktop + DF-tier placement

JA21 now uses a package-local `workspace/` for browser profile data, VEC1 state, downloads, documents, desktop files, logs, cache and temporary/provisioning files. The portable launcher establishes redirected process environment variables before PowerShell, Python or WebView2 adapter provisioning starts. The prior `%LOCALAPPDATA%/VBJA21/...` default is removed from active JA21 runtime code.

The embedded DF Portable VM Technical Institute is now also used as the placement authority for the browser service map: Small owns bounded boot/security/reference controls; Medium owns semantic/native inspection; Large owns WebView2/device/I/O/permissions; Xtra Large owns workspace/snapshot/replay/long-running state; DF0 owns registry/routing/replay/differential coordination. See `docs/PORTABLE-VIRTUAL-DESKTOP-9.2.1.md`.

## 9.0.0 — JA21 Optical Instrument UI/UX/XD major integration

9.0.0 applies the shared architecture of the 12,500-item JA21 Optical Instrument Prompt + Workflow series. The renderer is now a full-bleed content plane with floating optical chrome; LIVE uses `WebView2CompositionControl` so WPF controls can actually overlay live web content; the contextual drawer is in-window; LIVE/NATIVE is a segmented instrument; Ctrl+K opens a command palette; hairlines are DPI-aware; immersive mode uses the current monitor; trust state is compact and contextual; and the design system advances to 2.0.0 with one accent family, light/dark/high-contrast semantics, reduced-motion handling, and explicit optical-plane z contracts.

The release includes a one-to-one 12,500-work-item traceability ledger. Cross-platform/static gates are recorded in-package; Windows-only visual, performance, mixed-DPI, screen-reader, HDR, protected-media, and real WebView2 composition gates remain explicitly pending until run on the target machine. See `docs/OPTICAL-INSTRUMENT-9.0.0.md`, `docs/MASTER-SERIES-APPLICATION-9.0.0.md`, and `docs/WINDOWS-QUALIFICATION-9.0.0.md`.


## 8.2.3 — WebView2 CLR binding repair + integrated Windows shortcuts

8.2.3 fixes the startup failure that occurred after the WebView2 SDK adapter had been provisioned but before the JA21 window appeared: `Program.Run` could throw `FileNotFoundException` for `Microsoft.Web.WebView2.Core, Version=1.0.4191.47`. The prior launcher supplied the Core/WPF DLL paths to `Add-Type` as compiler references, but that did not guarantee that the CLR could resolve the same strong-named assemblies later when the compiled presenter executed.

The launcher now validates the pinned adapter assembly identities, prepends the exact adapter directory for native `WebView2Loader.dll` discovery, explicitly loads **Core first and WPF second** into the current AppDomain with `Assembly.LoadFrom`, and only selects the real Live Web bridge after that managed binding succeeds. If adapter loading or runtime discovery fails, JA21 compiles the stub bridge and still opens in sealed Native DF_Medium mode instead of dying before the first window. `Verify JA21 Virtual Browser.cmd` exercises the same loader boundary.

The Windows-safe installer also incorporates the 8.2.2 shortcut/icon repair as an installation step. After a successful staged payload promotion it creates `JA21 Virtual Browser.lnk` on the current user's Desktop, under **Start Menu → JA21**, and in the install directory, using `assets\vb.ico`, then asks Explorer to refresh icon presentation.

Run `INSTALL.cmd`, then `Verify JA21 Virtual Browser.cmd`, then launch from the new **JA21 Virtual Browser** icon.

---

## 8.2.2 — Windows case-collision repair and transactional installer

8.2.2 fixes the Windows install failure that appeared after more than 7,000 files had extracted. The DF_Xtra_Large evidence payload contained two different provenance files whose paths differed only by case (`INPUT_PROVENANCE.json` and `input_provenance.json`). Linux can store both; the default Windows filesystem cannot. The detailed source-input record is now preserved as `SOURCE_INPUT_PROVENANCE.json`, while the generated hosted-world record keeps `input_provenance.json`. Nested VM, node, container and browser integrity ledgers are resealed around that unambiguous layout.

The Windows-safe bootstrap now performs a complete Windows-name/case-collision preflight before writing any payload file, extracts into a unique staging directory, verifies the installed release marker, and only then promotes the staged tree to the requested destination. A failed install therefore cannot leave a partially installed destination that interferes with the next run.

Run `INSTALL.cmd`, then `Verify JA21 Virtual Browser.cmd`, then `Start JA21 Virtual Browser.cmd`.

---

## 8.2.1 — Windows-safe transport and long-path extraction hardening

8.2.1 is a packaging/hardening patch over 8.2.0. The 8.2.0 payload was a structurally valid ZIP, but it contains 424 VEC1/DF_Xtra_Large evidence paths longer than 220 characters and a maximum archive path of 294 characters. Windows Explorer's Compressed Folders shell can report such a package as “invalid” when extracting from a normal Desktop/OneDrive path.

The Windows-safe distribution therefore ships the exact sealed application payload inside a short-path bootstrap archive. `INSTALL.cmd` verifies the payload SHA-256 and extracts it with a traversal-safe long-path-aware .NET routine instead of asking Explorer to materialize the deep VEC1 evidence tree. No VEC1 evidence, DF node, browser runtime, or WebView2 integration is removed.

After bootstrap extraction, run `Verify JA21 Virtual Browser.cmd`, then `Start JA21 Virtual Browser.cmd`.

---

## 8.2.0 — integrated VEC1 + modern Live Web omni surface

This release fixes the architectural gap that prevented JavaScript-heavy video sites from behaving like real browser content. The borderless JA21 omni shell and VEC1 application lifecycle remain the application substrate; HTTP/HTTPS tabs prefer a Microsoft Edge WebView2 live-web surface when the pinned SDK adapter and installed WebView2 Runtime are available. The sealed DF_Medium renderer remains selectable as **Native** inspection mode. Electron and Node are not required.

All four VEC1 DF node containers are now vendored and bound: DF_Small, DF_Medium, DF_Large and DF_Xtra_Large. This removes the earlier unvendored-node integration gap. Presenter lifecycle evidence remains separate from strict fabric execution verdicts.

### Omni experience
The 8.2.0 shell uses the existing hairline-light glass design system, adds an explicit LIVE/NATIVE rendering pill, preserves predictive address affordances and progressive drawers, and makes F11—and HTML video fullscreen requests—a true full-bleed omni content mode: command rail, tabs, load sweep, status band, floating bubble, card radius and shadow all withdraw while content owns the entire window. Motion remains cubic-bezier/spring based with layout rounding and pixel snapping.

### First run
`Start JA21 Virtual Browser.cmd` attempts to provision the pinned WebView2 SDK adapter (`1.0.4191.47`) from the official NuGet package. If the adapter or installed Evergreen Runtime is unavailable, the browser starts in Native DF_Medium mode instead of failing. `Install Live Web Bridge.cmd` can provision/check the adapter explicitly. Set `JA21_NATIVE_ONLY=1` to force Native mode.

> Live Web is an explicit browser-engine dependency, not a claim that DF_Medium itself implements Chromium-equivalent JavaScript/video. Video/DRM behavior remains subject to the installed Edge/WebView2 runtime, Windows components, network conditions and the target site.

---

# VB JA21 DF_Medium Browser 8.1.1

A pure-JA21 browser candidate in which **DF_Medium is the web-engine VM**, the Windows WPF
layer is only an omni-window / pixel / media presenter, and the **VEC1 electron substrate**
owns the application lifecycle. It does not parse HTML or CSS.

No Chromium, Edge Chromium, WebView2, Electron, Node or MSHTML engine is included.

## 8.1.1 — Windows presenter compile repair and verification hardening

8.1.1 is a patch release over the 8.1.0 substrate/audit baseline. It repairs the WPF presenter
compile failure in `ContextDrawerWindow`: calls to the shared color helper are now explicitly
qualified as `BrowserWindow.Brush(...)`, preventing C# from resolving `Brush` as the
`System.Windows.Media.Brush` type. The package and Windows verifiers now contain a regression
gate for this exact failure class, and the runtime integrity seal version is checked against
`BrowserVersion.Full` before any sealed runtime file is accepted. Stale 8.0.3-era regression
assertions were brought forward to the current 8.1.x implementation without weakening their
behavioral checks.

See `docs/AUDIT-8.1.1.md`.

## Engine path

```
JA21 policy -> DF_Medium Bottle Rocket VM -> Web Device ABI -> HTML/CSS/resource/layout
            -> scene graph -> native presenter
VEC1 electron substrate -> session and tab identity, sealed state, snapshot/clone, evidence
```

## Start

1. `Verify JA21 Virtual Browser.cmd` — package integrity, native provenance, WPF compile
   preflight, 8.1.0 hardening markers, VEC1 substrate and node binding.
2. `Start JA21 Virtual Browser.cmd`
3. Optional: `Verify VEC1 Substrate.cmd`, then `Audit VEC1 Electrons.cmd` after a session.

## 8.1.0 — VEC1 electron substrate

The browser already had no Electron. What was still unrepresented is the part an Electron-class
framework actually owns: the **application lifecycle**. 8.1.0 gives that to VEC1.

- one **session electron** per launch, one **tab electron** forked from a sealed session
  snapshot per tab, a `PRESENTATION` ledger event per navigation, terminal `RETIRE` on close;
- the presenter writes sealed state and hash-chained ledgers in the control plane's own
  canonical format, and `python substrate\vec1\vecctl.py presenter-audit` re-derives every byte
  independently — the browser embeds no Python and the two halves never trust each other;
- nodes bind to containers already in this package (`N_SMALL` -> `helper/DF_Small`,
  `N_MEDIUM` -> `engine/df_medium/baseline`) rather than duplicating them;
- `N_LARGE` and `N_XLARGE` are **not vendored here**, so strict four-node fabric execution is
  reported `BLOCKED` and fails closed. `substrate/NODES.json` says how to drop them in.
- A presenter electron **never** records a fabric execution event and never carries a fabric
  verdict. Rendering a page is a presentation, not cross-node differential agreement.

Details: `docs/VEC1-ELECTRON-SUBSTRATE.md`.

## 8.1.0 — audit and hardening

Twenty findings against the shipped 8.0.3 package, eighteen fixed here. The significant ones:
the fetch primitive could reach loopback, link-local and private addresses; `file:` bypassed the
JA21 policy VM entirely; the DF_Small helper deadlocked on full pipes with an unreachable
timeout; TLS was widened rather than assigned; image fetching was unbounded; video preloaded
without user action; bidi and zero-width characters passed through the address bar.

Full report with dispositions: `docs/AUDIT-8.1.0.md`. Still open: the 8.0.3 HTML
character-reference engine patch needs a Windows DLL rebuild; the presenter-side workaround
remains and the seal stays honest about it.

## 8.1.0 — interface

The design brief — hairline-light glassmorphism, soft contrast, ambient gradients,
whitespace-dominant layout, predictive affordances, progressive disclosure, cubic-bezier
micro-motion, calm and trust-forward — is implemented as a **token system** rather than asserted
in prose, and the package verifier fails if a token class disappears.
See `docs/OMNI-DESIGN-SYSTEM-8.1.0.md`.

## Media

The engine discovers and resolves image and video resources and emits typed scene records. The
presenter uses OS image and media device primitives to decode and present those bytes, the way
a browser uses GPU and audio/video drivers. Document semantics stay in DF_Medium. In 8.1.0
media is attached only when the reader activates it.

## Current compatibility boundary

Static and server-rendered HTML, CSS, images and direct video resources are supported within an
expanding bounded profile. Arbitrary site JavaScript is isolated and not executed, so
JavaScript-only web applications are not Chromium-equivalent.

Addresses on loopback, link-local and private networks are refused by default. Set
`JA21_ALLOW_PRIVATE_HOSTS=1` to opt in deliberately.

## Earlier releases

`CHANGELOG.md` carries 8.1.0 in full. 8.0.3 repaired DuckDuckGo result links (HTML
character-reference decoding and the `/l/` redirector); 8.0.2 repaired the Windows presenter
compile and the native/managed string ABI that made a generated scene appear empty.
## 9.2.1 interaction update
The primary URL/search surface is now a centered floating elongated pill. Navigation and renderer/window controls are smaller peripheral glass clusters so the content plane remains visually dominant.
