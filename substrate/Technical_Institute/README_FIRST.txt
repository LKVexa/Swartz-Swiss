DF Portable VM Technical Institute v2.1.2
==============================================

Purpose
-------
A multi-page, offline, institutional-grade technical explainer for the supplied DF_Small, DF_Medium, DF_Large, DF_Xtra_Large and DF_Fabric packages.

v2.1.2 formatting-remediation + hardened packaging release
-------------------------------------------------------------
This release retains the v2.1.1 launcher/build hardening and repairs the interface-formatting defects found in the technical pages, especially DF_Large and DF_Xtra_Large.

Formatting fixes:
* Corrects array-valued opcode metrics that previously rendered as full comma-separated strings and forced multi-thousand-pixel page widths.
* Summary opcode metrics now show authoritative counts; raw opcode names move into bounded, wrapping Instruction-set Atlas visuals.
* Adds deterministic width containment to hero panels, grids, VM cross-sections, device/service surfaces, gate cards, evidence cells and qualification blocks.
* Long package names and evidence identifiers now wrap inside their own panels instead of enlarging the application canvas.
* Device-bus decoration and all intentionally wide diagrams are contained in their own local overflow regions.
* Mobile navigation now centers the active VM page inside the horizontal dossier rail.
* Layout was browser-render audited at 1440, 1280, 900 and 390 CSS-pixel widths with no document-level horizontal overflow.

Retained reliability fixes:
* Forces browser discovery to a real array before selecting candidate [0]. This removes the single-browser scalar-index launch failure.
* Replaces fragile inline PowerShell Expand-Archive quoting with a dedicated embedded extraction script.
* Uses a versioned LOCALAPPDATA cache with payload SHA-256 validation and staging-directory promotion.
* Adds timestamped extraction/launch logs and visible Windows error popups.
* Adds Run-Diagnostics.cmd for local static diagnosis.
* Makes the fullscreen launcher genuinely distinct from normal maximized app mode.
* Adds front-end exception containment so a renderer problem displays a diagnostic panel instead of producing a blank/vanishing application.
* Replaces IExpress as the primary single-EXE builder with a .NET Framework embedded-bootstrap EXE compiled by Windows PowerShell Add-Type.
* Keeps IExpress only as an isolated TEMP-directory fallback, avoiding the original nested-path SED packaging failure.
* The bootstrap validates the embedded payload SHA-256, performs zip-slip-safe extraction, reuses a versioned LOCALAPPDATA cache, logs launch faults, and opens Edge/Chrome app mode directly.

Technical/visual expansion:
* Every VM retains its own dedicated page.
* New control-plane vs execution-plane circuit on every VM page.
* New clickable fail-closed gate-promotion spine with refusal rail.
* New VM-specific mechanism visualizations for signed images/capabilities, compiler/qualification, Device ABI/services, QUORUM planes and Fabric segmentation.
* New fail-closed consequence matrix on every VM page.
* Existing interactive per-gate evidence inspector retained and connected to gate-family navigation.
* Demonstrated behavior, specified behavior and possible adaptations remain explicitly separated.


Extraction layout
-----------------
This v2.1.2 ZIP is intentionally packaged flat. Create or choose one destination folder (for example `D:\DF_VM_Technical_Institute_v2.1.2`) and extract the ZIP contents directly into it. Do not create a second same-named folder inside that folder.

Launch without building an EXE
------------------------------
Extract this package and double-click:
  app\Launch-DF-VM-Technical-Institute.cmd

For presentation/fullscreen mode:
  app\Launch-Fullscreen.cmd

If a launcher problem occurs, run:
  Run-Diagnostics.cmd

Launcher logs are written to:
  %LOCALAPPDATA%\DF-VM-Technical-Institute\logs

The launcher prefers Microsoft Edge or Google Chrome app mode, which removes the ordinary browser toolbar. If neither is found, it opens index.html in the Windows default browser.
No web server, Node.js or internet connection is required.

Build the self-extracting Windows EXE
-------------------------------------
Double-click:
  Build-Single-EXE.cmd

Expected output:
  DF-VM-Technical-Institute-v2.1.2.exe

Diagnostic build modes:
  Build-Single-EXE-DotNet-Only.cmd          primary compiler only; no fallback
  Build-Single-EXE-IExpress-Fallback.cmd    legacy fallback only, isolated in %%TEMP%%

The primary EXE builder uses Windows PowerShell/.NET Framework Add-Type and embeds the institute payload directly. IExpress is only a fallback. The output is not Authenticode-signed by this package.

Pages
-----
  index.html          Institute overview, family visual and gate taxonomy
  vm-small.html       DF_Small / BOTTLE ROCKET 3.0.0-MODEL
  vm-medium.html      DF_Medium / BOTTLE ROCKET 5.0.0 qualification candidate
  vm-large.html       DF_Large / BOTTLE ROCKET 4.7.0 device/I/O/service architecture
  vm-xlarge.html      DF_Xtra_Large / QUORUM + hosted QVM
  fabric.html         DF0 federation / replica-pipeline-BSP mechanics
  comparison.html     Cross-system comparison
  methodology.html    Gate semantics and claim discipline

Audit record
------------
See:
  FORMAT_AUDIT_AND_REMEDIATION.md
  CRASH_AUDIT_AND_REMEDIATION.md

Evidence discipline
-------------------
The exhibit was built by static inspection of the supplied archives and their existing evidence records. Uploaded executables and guest images were not executed while creating the exhibit. The evidence_digest folder contains selected machine-readable source records copied from the packages for traceability.

Important claim boundary
------------------------
The supplied packages describe classical VMs and a local-process classical federation model. The exhibit does not convert quantum-oriented example names into physical QPU claims. Proposed adaptations are labeled as such.
