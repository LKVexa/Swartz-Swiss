# GFM Console 2.0.0 — downloaded-package startup fix — 2026-10-12

- Fixed the .NET Framework assembly-load error after extracting a GitHub ZIP.
- The native launcher accepts only the two bundled WebView2 managed libraries
  after checking their exact paths, pinned SHA-256 digests and assembly identities.
- Added download-marked startup and tampered-library regression checks.

# JA21 Blank Console 1.1.0 — 2026-10-11

Copyright (C) 2026 RUSSELL PHILIP SMITHSON

- Added GPL-3.0-only LICENSE, COPYRIGHT, NOTICE and accurate component licensing.
- Replaced the inherited browser README with console setup and verification instructions.
- Hardened host path containment, network policy, WebView2 resources, downloads and evidence persistence.
- Hardened SDK integrity, provisioning, portable workspace initialization, snapshot generation and launcher failures.
- Repaired active native engine URL/entity handling, CSS loading and hidden content rendering; rebuilt the x64 DLL.
- Added executable security/native regressions and a unified Windows release verifier.
- Hardened integrity manifest paths, excluded mutable/Git metadata and preserved exact checkout bytes.
- Preserved the original source archive, inherited notices and missing-reference inventory.

The console release is 1.1.0. Inherited presenter compatibility remains 9.8.7.
See docs/AUDIT-1.1.0.md and VALIDATION.txt for evidence and remaining limitations.

---
# 9.8.7

- Hardened the 9.8.6 omni focus repair against Windows PowerShell `Add-Type` warning-as-error behavior by removing the direct `Keyboard.Focus(_address) == _address` cross-type reference comparison.
- Retained synchronous + dispatcher URL/Search focus reclamation, first-keystroke recovery, Backspace/Delete recovery, and explicit page typing-ownership release.
- Added persistent startup stage logging under `workspace/logs/boot-latest.log`.
- Added a startup trap that records terminating setup, WebView2 provisioning, C# compilation, and presenter-run failures.
- Updated `Start JA21 Portable Desktop.cmd` to print the persisted boot log and pause on launch failure.
- Added `tests/test_boot_hardening_987.py` and corresponding Python/Windows verifier gates.
- Version-bumped the application/profile/runtime/package contract to 9.8.7.

## 9.8.6 — Post-navigation omni keyboard focus recovery
- Fixes the URL/Search field becoming visually clickable but unable to accept typing, Backspace, or Delete after a live WebView2 navigation.
- Reclaims TextBox keyboard focus synchronously on click and verifies it again at Input and ContextIdle dispatcher stages.
- Adds first-keystroke text and Backspace/Delete recovery if WebView2 wins the native focus race.
- Separates dirty-draft preservation from active typing ownership so clicking page content returns keyboard input to the website without discarding the uncommitted omni draft.
- Adds release-gate coverage for focus scope, page-focus release, first-keystroke recovery, and delete recovery.

## 9.8.5 — Windows Add-Type omni edit-state compile repair
- Fixed the target-machine `Add-Type` failure where `BrowserWindow._omniUserEditing` was assigned but never read.
- Restored `_omniUserEditing` as a read-side guard in `HasProtectedOmniDraft` while preserving tab-scoped dirty and empty-draft protection.
- Hardened Windows and cross-platform verification against recurrence and added the 9.6.1/9.6.2 interaction suites to the mandatory package verification run.

## 9.8.4 — native hard-coded Windows ribbon landing
- Replaced the raster home artwork with native WPF paths, gradients, haze, panes, particles, and floor reflection.
- Landing page remains text-free; the movable omni bar and bottom control island remain separate live chrome.

# JA21 Portable Optical Instrument Desktop 9.8.1

## 9.8.1 — bottom control island + shape-changing omni search

- Replaced the in-tree movable omni layer with a browser-owned WPF `Popup` surface so the floating URL/search instrument remains above WebView2 and preserves drag hit-testing after navigation.
- Kept normalized portable placement persistence at `workspace/state/ui/omni-bar.position`; drag movement now updates Popup offsets from owner-window cursor coordinates and does not reflow content.
- Removed the segmented LIVE/NATIVE selector, its command-palette actions, selection indicator, and renderer-switch interaction surface.
- Removed the visible tab rail from the permanent chrome. Internal tabs still exist for Ctrl+T / Ctrl+Tab workflows, but the tab strip is no longer rendered.
- Replaced the former top command clusters with a bottom-centered control island that contains only Back, Forward, Minimize, Enlarge/Restore, and Exit.
- Refined the omni URL/search control into a shape-changing floating search box: it stays page-independent, expands when active or populated, and uses more text-box-like rounded-rectangle geometry instead of a fixed pill.
- Made renderer selection automatic: HTTP/HTTPS prefers WebView2 when available and falls back to DF_Medium inspection when live rendering cannot initialize.
- Rebuilt the home/new-tab surface as an unboxed ambient landing state with no duplicate URL/search field, card, panel, or address-focus button.
- Simplified the trust pill to origin + VEC1 state while retaining renderer details only in contextual diagnostics.
- Advanced the Optical Instrument Design System to 2.8.0 and added regression gates for popup ownership, page-independent omni movement, unboxed home, and absence of user renderer selection.

## 9.2.1 — verifier path/content separation repair

- Fixed `host/Verify-JA21Browser.ps1` so `$portableSource` remains source text and is never passed to `Get-Content -LiteralPath` as though it were a path.
- The verifier now audits portable C# source directly from the already-loaded string while `$portableCs` remains the authoritative filesystem path.
- Added `tests/test_verifier_path_content_921.py` plus package-verifier regression checks for this exact failure class.
- Preserves the 9.2.x floating elongated URL/search pill, portable workspace, four-node VEC1 placement, and WebView2 composition architecture.


## Floating URL/search instrument
- Reworked the top chrome into three independent floating instruments instead of one large toolbar.
- Made the centered URL/search surface the dominant elongated 46-DIP pill with a single-line interaction model.
- Added a restrained search glyph, blank-state watermark, trailing intent chip, device-pixel hairline focus ring, and low-energy optical shadow.
- Moved brand/navigation and renderer/window actions into smaller peripheral glass pills to reduce permanent visual mass.
- Preserved Ctrl+L, Ctrl+K, LIVE/NATIVE routing, portable workspace semantics, VEC1 evidence boundaries, and full-bleed WebView2 composition.

# 9.1.2

- Fixed Windows `Add-Type` warning-as-error failure caused by declaration-only `BrowserWindow._modeIndicator`.
- Completed `_modeIndicator` as the LIVE/NATIVE renderer selection underline with transform-only easing and reduced-motion behavior.
- Added joined-C# dead-private-field preflight to Windows and cross-platform verification.
- Replaced stale hard-coded `JA21 Portable Desktop 9.1.0` launcher text with a banner sourced from top-level `VERSION`.
- Added release/banner coherence tests and advanced portable/runtime/VEC1/package metadata to 9.1.2.
- Portable workspace, no-AppData-target policy, DF-tier placement, and WebView2 runtime architecture are otherwise unchanged.

# 9.1.1

- Fixed Windows `Add-Type` CS0104 ambiguity between `System.IO.Path` and `System.Windows.Shapes.Path` introduced by the portable desktop source in the merged WPF compilation unit.
- Qualified every portable filesystem call as `System.IO.Path.*`.
- Added regression gates to Python package verification, Windows verification, and the portable desktop test suite.
- Portable run-in-place/AppData-redirection, DF-tier placement, workspace snapshot, and WebView2/VEC1 architecture remain unchanged from 9.1.0.

# 9.1.0

- Added run-in-place portable virtual desktop workspace; removed active JA21 AppData state fallback.
- Redirected WebView2 user data, VEC1 state, downloads, temp/cache/logs and SDK provisioning scratch space to `workspace/`.
- Added DF technical-suite service placement contract and host-mediated fabric placement receipts.
- Added N_SMALL/N_MEDIUM/N_LARGE/N_XLARGE responsibilities aligned to Technical Institute tier roles.
- Added WebView2 Fixed Version Runtime slot with Evergreen fallback clearly marked as an external reproducibility dependency.
- Added portable environment, launch, verification and workspace qualification gates.
- Version advanced to 9.1.0.

# Changelog

## 9.0.0 — JA21 Optical Instrument major UI/XD integration

- Applied the 12,500-item Optical Instrument Prompt + Workflow series through shared architectural convergence and added one-to-one work-item traceability.
- Rebuilt the browser as full-bleed content plus deterministic WPF optical planes instead of permanent command/tab/status layout rows.
- Replaced the LIVE WPF `WebView2` host with `WebView2CompositionControl` so floating WPF chrome, drawers and command palette can render above live web content without the HwndHost airspace defect.
- Moved the contextual drawer into the omni window; added Ctrl+K command palette and segmented LIVE/NATIVE renderer instrument.
- Advanced the design system to 2.0.0: single cyan accent family, semantic Glass0–Glass4 materials, named spacing scale, DPI-aware one-physical-pixel hairlines, dark override, Windows high-contrast semantics, and reduced-motion handling.
- Hardened fullscreen/immersive behavior to use the monitor containing the JA21 window, withdraw transient chrome, and restore prior window state.
- Added compact trust/origin/renderer/VEC1 presentation and expanded keyboard/UI Automation coverage.
- Added `tests/test_optical_instrument_9.py`, master-series application evidence, and explicit Windows target qualification gates.
- Preserved VEC1 claim discipline: presenter readiness/evidence still cannot assert a fabric execution verdict.
- Retained 8.2.3 WebView2 managed-loader ordering and Windows-safe shortcut installer behavior.

## 8.2.3 — WebView2 managed-assembly binding repair and shortcut integration
- Diagnosed the post-provision startup exception as a CLR managed-assembly resolution failure: `Add-Type -ReferencedAssemblies` gave the C# compiler the WebView2 DLL paths but did not make `Microsoft.Web.WebView2.Core` / `Microsoft.Web.WebView2.Wpf` reliably resolvable when `Program.Run` executed.
- Added `host/Import-WebView2Adapter.ps1`, which validates the pinned strong-name identities/version, ensures the native loader directory is on the process PATH, loads Core before WPF with `Assembly.LoadFrom`, and reports Evergreen Runtime discovery separately from managed-adapter readiness.
- Changed startup to select the real WebView2 bridge only after managed loading succeeds; failed adapter binding now falls back to the sealed Native DF_Medium bridge instead of terminating the application before the first window.
- Changed the Windows verifier to exercise the same managed loader before compiling the real bridge, closing the gap where compilation could pass but runtime binding could still fail.
- Added `host/Install-WebView2Bridge.ps1` and upgraded `Install Live Web Bridge.cmd` so explicit bridge setup verifies both provisioning and CLR loadability.
- Integrated Desktop, Start Menu → JA21, and install-directory shortcut creation into the Windows-safe installer using the packaged `assets\vb.ico`; Explorer icon presentation is refreshed after shortcut creation.
- Added regression tests for WebView2 loader ordering/fallback semantics and advanced/resealed browser, VEC1, runtime and package metadata to 8.2.3.

## 8.2.2 — Windows case-collision repair and transactional extraction hardening
- Diagnosed the 8.2.1 install failure as a Windows case-insensitive filename collision inside the DF_Xtra_Large VM evidence tree: `world/evidence/INPUT_PROVENANCE.json` and `world/evidence/input_provenance.json` were distinct on Linux but map to one NTFS/Win32 path.
- Preserved both evidence records by renaming the static source-artifact record to `SOURCE_INPUT_PROVENANCE.json`; retained the generated hosted-world record as `input_provenance.json`.
- Rebuilt the world and VM release manifests, VM SHA256SUMS, DF_Xtra_Large payload digest, node descriptor, container manifest and container SHA256SUMS around the corrected path.
- Added a package-level Windows filesystem preflight that rejects case-insensitive/Unicode-normalized collisions, reserved device names, invalid Windows filename characters, trailing dots/spaces and overlong path components.
- Reworked the Windows-safe installer to preflight the entire archive before extraction, extract into a unique staging directory, preserve CreateNew/no-overwrite semantics, and promote the staged tree only after the release marker validates.
- Advanced browser/VEC1 integration metadata to 8.2.2 and resealed the configuration, runtime seal and package manifest.

## 8.2.1 — Windows Explorer transport repair and long-path hardening
- Diagnosed the prior “Compressed (zipped) Folders Error / folder is invalid” as a Windows shell extraction-path limitation, not ZIP corruption: the sealed 8.2.0 payload validates with a full CRC pass, but its longest VEC1 evidence path is 294 characters.
- Added a short-path Windows bootstrap distribution whose outer ZIP contains no deep package paths.
- Added a SHA-256 verified, zip-slip-resistant PowerShell/.NET extractor that emits the unchanged sealed payload with long-path support.
- Added destination validation, overwrite refusal by default, extraction cleanup on failure, and post-extraction package verification guidance.
- Advanced application/package metadata to 8.2.1 and resealed the VEC1 configuration, runtime seal, and package manifest.

## 8.2.0 — VEC1 / live-web omni integration
- Bound and vendored DF_Large + DF_Xtra_Large alongside DF_Small + DF_Medium.
- Added pinned WebView2 SDK adapter provisioning and runtime detection for modern JavaScript/video sites.
- Added per-tab LIVE/NATIVE engine selection with Native DF_Medium fallback.
- Routed back/forward/reload/stop/data-clear semantics to the active live web surface.
- Kept new-window requests inside the omni surface and denied elevated web permissions by default.
- Added ephemeral private-tab WebView2 profiles and persistent normal-profile state under mutable runtime/.
- Made F11 true full-bleed omni mode by withdrawing all browser chrome and card geometry.
- Updated VEC1 presentation evidence with an explicit presentation_engine field; fabric_verdict remains null.
- Updated trust/microcopy so the shell truthfully states whether scripts are enabled or isolated.

## 8.1.1 — presenter compile repair, seal binding and regression hardening

- Fixed `ContextDrawerWindow` calls to the shared WPF color helper by qualifying them as
  `BrowserWindow.Brush(...)`. The previous unqualified `Brush(...)` token resolved to the
  `System.Windows.Media.Brush` type and caused `Add-Type` compilation to fail before startup.
- Added package-verifier and Windows-verifier gates that reject unqualified `Brush(...)` in the
  drawer source range, so the exact compile regression is caught before launch.
- Bound `engine/ja21/runtime.integrity.json` release metadata to `BrowserVersion.Full`; a mixed
  runtime seal/presenter version now fails closed at boot.
- Updated the 8.1.x regression suite to test current behavior instead of stale 8.0.3
  implementation strings (`BezierEase`, growing native string buffers, hardened link
  sanitization).
- Updated package/profile/VEC1 host-integration release metadata to 8.1.1 and resealed the
  VEC1 configuration, runtime seal and package manifest.

## 8.1.0 — VEC1 electron substrate integration, audit and hardening

The VEC1 Electron Substitute candidate (`VEC1_ES 0.1.1-candidate`) is applied under
`substrate/` and bound to the browser's application lifecycle. The DF_Medium native engine
and its JA21 profile binding are unchanged.

### Added — VEC1 electron substrate

- `substrate/` — the VEC1 control plane, DF_Fabric, governance, component evidence and the
  Technical Institute reference.
- `host/Vec1Substrate.cs` — the presenter half. One **session electron** per browser launch,
  one **tab electron** forked from a sealed session snapshot per tab, `PRESENTATION` events per
  navigation, terminal `RETIRE` on close. State is written in the control plane's own canonical
  format and hash-chained ledger, so `vecctl` can re-derive every byte independently.
- `substrate/vec1/binding.py` + `substrate/NODES.json` — nodes bind to containers already in
  this package (`N_SMALL` -> `helper/DF_Small`, `N_MEDIUM` -> `engine/df_medium/baseline`)
  through the DF_Fabric adapter's existing `DF_<NODE>_ROOT` overrides. Nothing is duplicated
  and DF_Fabric is not forked.
- `substrate/vec1/presenter.py` and `vecctl presenter-audit` / `presenter-gc` / `nodes`.
- `substrate/evidence/presenter/CANONICAL_VECTORS.json` — golden canonical-JSON vectors. The
  presenter checks itself against them at startup and refuses to seal anything if it disagrees.
- `tools/vec_seal.py`, `Verify VEC1 Substrate.cmd`, `Audit VEC1 Electrons.cmd`.
- `tests/test_vec1_integration.py` (25 tests) and `substrate/tests/test_presenter_format.py`
  (8 tests) alongside the substrate's own 22.

**Claim discipline.** A presenter electron never records a fabric execution event and never
carries a fabric verdict; its event vocabulary is closed and `presenter-audit` rejects anything
outside it. `N_LARGE` and `N_XLARGE` are not vendored here, so strict four-node execution is
reported `BLOCKED` and fails closed rather than falling back to a relaxed profile.

### Fixed — security and correctness (see `docs/AUDIT-8.1.0.md`)

- **Address boundary.** The fetch primitive reached loopback, link-local (including cloud
  metadata), RFC1918, CGNAT and unique-local addresses. `JaAddressPolicy` now refuses them
  before connecting, re-checks resolved addresses, and re-checks after every redirect.
- **`file:` scheme** bypassed the JA21 policy VM and could read any local path; it is now
  confined to the package root.
- **DF_Small helper deadlock.** Both pipes were read to the end sequentially, which deadlocks on
  a full buffer and made the 90-second timeout unreachable. Both are drained asynchronously.
- **TLS** was OR-ed onto framework defaults, leaving legacy protocols enabled; an explicit
  modern set is now assigned.
- **Subresource budget.** Unbounded concurrent image fetches at 12 MB each are now 6 concurrent
  slots, 96 images, 8 MB each and 48 MB per document.
- **Video preload.** Every video opened a connection and started a decoder on load; media is now
  attached on first activation only.
- **HTTPS to HTTP redirect downgrades** are refused; a 45-second deadline spans the whole
  navigation.
- **Address spoofing.** Bidi, zero-width and control characters are stripped before an address
  is used; non-ASCII hosts show their resolved punycode form on the trust line.
- **Seal containment.** Sealed paths are resolved and proven inside the package root instead of
  being screened by substring; SHA-256 fields are validated before comparison.
- `lock(typeof(DfMediumNative))` replaced with a private monitor.
- Native string reads grow their buffer instead of silently truncating.
- Boot now rejects `chromium`, `webview2`, `mshtml`, `bundled_chromium`, `edge_chromium` and
  `node_runtime_required` in the profile, not just `electron`, and pins the profile version.
- Tab count capped; the version string is a single constant.

### Changed — interface

The design brief is now implemented as a token system (`Ja21Design`, `Ja21Motion`, `BezierEase`)
rather than asserted in prose, and the package verifier fails if a token class disappears. See
`docs/OMNI-DESIGN-SYSTEM-8.1.0.md`.

- Hairline geometry throughout: stacked bordered boxes replaced by one-pixel rules; closed
  shapes only where something is genuinely a surface.
- Whitespace-dominant: gutters 18 -> 28 px, status pills removed, tab-rail container removed,
  window controls de-filled.
- Address capsule with a keyboard-focus ring and a **predictive intent chip** stating what Enter
  will do — the decision comes from the JA21 policy VM, so the chip cannot over-promise.
- Selected-tab indicator is one shared hairline that travels between tabs (semantic motion).
- `BezierEase` pins `EasingMode.In` so the authored control points are the ones on screen;
  `SpringScalar` gained device-pixel snapping for positional motion.
- The one repeating animation in the shell is the load sweep, and it runs only while a document
  is in flight.
- Contextual drawer rebuilt on a single progressive-disclosure primitive, with the VEC1
  substrate as its first section.
- Trust line states transport, host, script isolation and the real substrate verdict —
  `DEGRADED` and `BLOCKED` as readily as `BOUND`.
- Microcopy moved out of system and alarm voice; the error surface now offers actions.

### Unchanged / still open

- The DF_Medium Windows DLL still predates
  `engine/df_medium/patches/8.0.3-html-character-references.patch`; that patch needs a Windows
  rebuild. The presenter-side workaround remains and the seal stays honest about the gap.
- Site JavaScript remains isolated; this is not Chromium parity.
- Closure of the source VEC1 package's 286,440 checklist items is not claimed.

## 8.0.3 search-result link repair

(see README.md)
