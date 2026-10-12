# JA21 Portable Optical Instrument Desktop 9.1.2 — Warning-as-Error Compile Repair Audit

## Trigger
Windows target-machine qualification of 9.1.1 reached the real merged WPF `Add-Type` compilation unit and failed because `BrowserWindow._modeIndicator` was a private field declaration with no use. Windows PowerShell surfaced compiler warning CS0169/CS0414-class dead-field behavior as a terminating `Add-Type` compiler error. The same run also exposed a release-coherence defect: the portable launcher banner still printed `JA21 Portable Desktop 9.1.0` while executing the 9.1.1 tree.

## Root cause
The Optical Instrument renderer-control refactor declared `_modeIndicator` in the BrowserWindow state surface but never completed the corresponding visual indicator. Cross-platform structural tests validated the architecture markers but did not statically reject declaration-only private fields, so the Windows warning-as-error compiler was the first gate to catch it. The launcher banner was hard-coded rather than derived from the authoritative top-level `VERSION`.

## Repair
- Completed `_modeIndicator` as the renderer segmented-control selection underline.
- The indicator uses `TranslateTransform` with a 180 ms settled easing transition and a reduced-motion snap path; it does not animate layout dimensions.
- Added a joined-C# compile-hygiene gate that rejects declaration-only private underscore fields before Windows `Add-Type`.
- Added an equivalent cross-platform regression test across all merged C# sources.
- Replaced the hard-coded launcher banner with a `VERSION`-driven banner.
- Added version-coherence gates to both package and Windows verification.
- Advanced presenter, runtime policy, VEC1 host binding, portable placement contract, runtime seal, package seal, tests and operator docs to 9.1.2.

## Claim boundary
Cross-platform static/package verification can reject the exact dead-field condition and prove version/banner coherence. The final Microsoft C# compiler execution inside Windows PowerShell remains a target-machine gate and is not claimed from the Linux build environment.
