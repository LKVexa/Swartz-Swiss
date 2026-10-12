# DF Portable VM Technical Institute v2.1.2
## Crash Audit and Remediation Record

### Scope
Static audit of the uploaded `DF-VM-Technical-Institute-v2.0.0.exe` plus the v2.0.0 source/build package. The uploaded Windows executable was **not executed** in the Linux build environment. Its PE/resource strings and the retained source package were inspected to identify launcher and packaging failure modes.

## Findings

### F-01 — Browser candidate scalar/array collapse — HIGH
**v2.0.0 behavior**

```powershell
$candidates = @(paths...) | Where-Object { ... }
if ($candidates.Count -gt 0) {
  Start-Process -FilePath $candidates[0] ...
}
```

The pipeline assignment does not guarantee an array. When exactly one browser path survives the filter, PowerShell may hold a scalar string; indexing `[0]` can then address the first character of that string rather than the complete executable path. This creates an immediate `Start-Process` failure on a common configuration where only one Edge/Chrome candidate is detected.

**v2.1.2 remediation**
- Browser discovery is accumulated in `System.Collections.Generic.List[string]`.
- Final candidates are forced through `@(...)` before indexing.
- The selected browser is explicitly cast to `[string]`.
- A default-file-association fallback remains available when no direct Edge/Chrome path resolves.
- Launch failures are written to a timestamped log and surfaced through a visible Windows popup instead of disappearing.

### F-02 — Fragile inline `Expand-Archive` quoting in the IExpress bootstrap — HIGH / PATH-DEPENDENT
**v2.0.0 behavior**

The embedded batch launcher constructed a PowerShell `-Command` string with path quoting embedded inside the command line. This is fragile under paths containing spaces, special characters, or quoting transformations introduced by the extraction environment.

**v2.1.2 remediation**
- Removed inline archive-expansion code from the batch command.
- Added a dedicated `Launch-DF-VM-Technical-Institute-Embedded.ps1` and invokes it with `-File`.
- All paths are passed as PowerShell variables and used with `-LiteralPath`.
- The embedded payload is hashed before use.
- Extraction occurs to a staging directory and required assets are validated before promotion to the persistent cache.

### F-03 — Ephemeral random extraction with no integrity/cache validation — MEDIUM
**v2.0.0 behavior**

Every EXE run generated a new random `%TEMP%` application directory. The archive was expanded and launched without a post-extraction asset census.

**v2.1.2 remediation**
- Uses `%LOCALAPPDATA%\DF-VM-Technical-Institute\2.1.0\app` as a versioned cache.
- Stores the payload SHA-256 marker beside the installed cache.
- Re-extracts only when the payload hash or required-file validation changes.
- Uses a staging directory so a partial extraction cannot replace a known-good cached application.

### F-04 — No visible fault path — HIGH DIAGNOSTIC IMPACT
**v2.0.0 behavior**

IExpress hid the install window and launcher errors had no durable log or user-visible failure report. A failed `Start-Process` could therefore look like a crash or a program that simply vanished.

**v2.1.2 remediation**
- Timestamped launcher and embedded-extraction logs under `%LOCALAPPDATA%\DF-VM-Technical-Institute\logs`.
- Windows popup on launch/extraction failure with the log path.
- `Run-Diagnostics.cmd` produces a static asset/browser/launcher report.
- Front-end `window.error` and `unhandledrejection` containment display a local diagnostic panel rather than leaving a blank page.

### F-05 — “Fullscreen” launcher was functionally identical to normal launcher — QUALITY
**v2.0.0 behavior**

`Launch-Fullscreen.ps1` duplicated the normal `--start-maximized` behavior.

**v2.1.2 remediation**
- Fullscreen launcher now calls the hardened common launcher with `-Fullscreen`.
- Normal mode uses `--start-maximized`; presentation mode uses `--start-fullscreen` in browser app mode.

### F-06 — Front-end initialization had no defensive data/DOM checks — MEDIUM
**v2.0.0 behavior**

A missing or malformed local asset could stop rendering with no in-app explanation.

**v2.1.2 remediation**
- Verifies `DF_ATLAS_DATA` before render.
- Verifies key shell elements.
- Wraps initialization in a fail-visible exception boundary.
- Adds a `noscript` recovery notice and a runtime diagnostic panel.

## Visual/technical additions in v2.1.2

Each dedicated VM page now contains:

1. **Control plane vs execution plane circuit** — separates package/core/native/adapter gates from the semantic-row → lowering → execution → witness → evidence path.
2. **Fail-closed promotion spine** — clickable gate-family stages with PASS/SKIP/BLOCK census and a separate refusal rail.
3. **VM-specific mechanism atlas**:
   - **DF_Small:** BRIM/1-v3 signed-image anatomy, 16 capability slots, APDU/state/recovery edge, register/memory geometry.
   - **DF_Medium:** LCTLC → brlctlc → BRIR → BRIM → verifier → BRTM compiler path plus a 15-work-package BR-500 qualification heatmap.
   - **DF_Large:** BR/1.1 Device ABI bus with console, persistent block, monotonic, entropy, clock, mailbox, APDU, diagnostic, network-policy, discovery and quota surfaces.
   - **DF_Xtra_Large:** 12-plane / 66-module distribution bars and L4–L9 reference-opening ladder.
   - **DF_Fabric:** 240-row segmented-pipeline example, explicit accumulator handoffs, federation execution-mode panel and the existing four-node topology.
4. **Fail-closed consequence matrix** — explains what claim is withheld when a gate family is skipped, blocked or fails.
5. **Interactive gate-family jump/filter behavior** — mechanism-level gate visual can jump directly to the detailed evidence lane.
6. **Family gate-posture visualization** on the institute and comparison pages. It is explicitly labeled as a census, not a quality score or ranking.

## Validation performed in the build environment
- `assets/site.js` passed Node.js syntax validation.
- A DOM-stub harness executed all eight page render paths against the real `data.js` without initialization exceptions.
- Page asset references and distribution archive integrity are checked before release.
- The Linux container's headless Chromium instance was not usable for a reliable screenshot pass because its local D-Bus/headless process did not terminate normally; this is an environment limitation and is not treated as Windows runtime qualification.

## Deployment note
The supplied build script uses Windows IExpress and does not apply an Authenticode signature. Organizations that require signed executables should sign the generated EXE using their normal code-signing process after `Build-Single-EXE.cmd` completes.

## v2.1.2 packaging failure audit

Observed return from v2.1.0:

- Payload ZIP creation succeeded and produced a SHA-256.
- `iexpress.exe /N /Q <sed>` returned without a final `DF-VM-Technical-Institute-v2.1.0.exe` at the requested distribution path.
- The v2.1.0 builder then failed only on its postcondition check because the expected EXE did not exist.

The application payload itself was therefore not implicated by this return. The failure boundary was the legacy IExpress packaging step.

### Problems in the v2.1.0 build design

1. IExpress was a hard dependency and single point of failure.
2. The generated SED pointed IExpress directly at the user's nested distribution path for both source and output.
3. `/Q` suppressed useful IExpress UI/error detail, while the script captured no durable IExpress diagnostic output beyond the missing-file postcondition.
4. The build path depended on legacy SED/CAB parsing even though the payload was already a validated ZIP.
5. A successful payload hash could misleadingly look like the EXE had been built even though only the intermediate ZIP existed.

### v2.1.2 remediation

- Primary packaging no longer uses IExpress.
- Windows PowerShell compiles a small Windows GUI bootstrap through `.NET Framework Add-Type`.
- The payload ZIP is base64-embedded into the bootstrap at build time and is SHA-256 checked before extraction at runtime.
- Extraction rejects path traversal and validates required application files before promotion.
- Runtime files are cached under `%LOCALAPPDATA%\DF-VM-Technical-Institute\2.1.2\app`.
- Runtime diagnostics are written under `%LOCALAPPDATA%\DF-VM-Technical-Institute\logs`.
- If the .NET bootstrap compiler is unavailable, an optional IExpress fallback builds only inside a short disposable `%TEMP%\DFVMTI-xxxxxxxx` workspace and copies the finished EXE back afterward.
- Every build writes a timestamped build log under the package `build` directory and records which packaging method actually succeeded.

This changes the old IExpress failure from a fatal mandatory dependency into a fallback-only condition.
