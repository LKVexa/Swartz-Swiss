# Console 1.1.0 release audit

Copyright (C) 2026 RUSSELL PHILIP SMITHSON

Audit date: 2026-10-11. Input: `JA21-Blank-Console.zip`. The supplied
archive remains unchanged locally. The public release preserves source,
component notices and historical evidence other than logs; this audit describes
the active Windows console path.

## Changes applied

| Area | Findings and resulting behavior |
| --- | --- |
| Native DF_Medium renderer | Rebuilt the actual Windows x64 DLL as 8.1.0. Fixed HTML character references, title/body separation, hidden and raw-text subtrees, external stylesheet persistence, URL resolution, bounded parsing and finite layout values. UTF-8 strings now cross the C#/C boundary correctly. |
| Address and content policy | Exact local-origin exceptions, robust IP/IPv6 and malformed URL checks, bounded helper output and downloads, resource/frame interception and failure handling. Native network video requires the live renderer because WPF media cannot enforce the same redirect policy. |
| Portable files | Package containment and reparse-point refusal precede writes. Downloads use atomic reservations and safe names. Snapshots hash actual archived bytes, refuse overlapping writers and overwrites, and keep manifests consistent. |
| WebView2 | Pinned SDK package and three adapter DLL hashes, confined extraction, verified native loader, live-web-disable precedence, InPrivate profiles, blocked external-app launches/host objects/messages, and popup rejection. Both live and fallback presenters compile. |
| Integrity and tools | Complete immutable payload coverage, validated manifest paths and duplicate detection, atomic seals and VEC state writes, Python expression/resource bounds, an authoritative reproducible native build, and a unified Windows release verifier. |
| Legacy bootstrap | Retired the unsafe IExpress route with a clear refusal. The supported .NET builder verifies immutable cache/source hashes and extraction paths and preserves an existing executable backup. |
| Release metadata | Console 1.0.0 becomes 1.1.0. The inherited presenter compatibility version remains 9.8.7. Added GPL-3.0-only licensing for owned material, copyright, NOTICE, component licensing map and Microsoft SDK notices. |

## Validation performed

`tools/Verify-Release.ps1` passed on Windows x64 using Windows PowerShell 5.1
and Python. The release check includes:

- 212 discovered Python tests, with 3 skips and no failures. This includes
  nested VEC1 control-plane checks, native ABI regressions and host hardening.
- Package integrity, source/IR binding, native DLL/source provenance and
  Windows presenter compilation.
- 15 launcher/security checks and 6 technical bootstrap checks.
- 12 headless console checks and 16 local-origin policy cases. The blank
  content tree and offscreen rendering were checked without showing a window.

Additional focused checks passed: the official cached SDK restore path (18
launcher checks), both presenter variants' native UTF-8 interop self-test,
300 deterministic malformed native documents, and an independent byte-identical
native DLL rebuild. These supplement the unified release run.
The DLL SHA-256 is
`dee923c3b378b26fd0aa666f11a16315b831bc0833aeeda26d8df7f5d1792731`.

Final documentation and metadata are resealed after executable checks;
the final archive is checked for file coverage and exact byte hashes.

The bundled DF_Medium and DF_Small source ZIPs omit 23 and 4 historical log
members, respectively. All 342 and 138 retained members are byte-identical to
the original archives and both filtered ZIPs pass CRC verification. Active
source-archive pins refer to the distributed ZIPs; original hashes and omitted
member inventories remain in `provenance/source-archive-filtering.json`.
Seven focused archive/distribution and native source-binding checks passed,
including byte comparisons with every retained extracted source member.
Filtering does not constitute a new qualification of historical DF/VM results.

At the user's request, published files exclude physical logs and log directory
contents. The two source ZIPs also omit their log members; retained archive
members remain byte-identical. Original archive hashes are recorded separately.
Historical evidence inventories may refer to these intentionally omitted logs;
their original qualification claims are not newly certified. Final verification
and regression tests are repeated after this packaging change.

## Limits and remaining upgrades

- Two legacy POSIX compiler tests were skipped on Windows; new Windows native
  ABI tests ran. Symlink creation was unavailable for this account. A separate
  Windows junction-creation probe was denied by the environment; implemented
  reparse checks were reviewed and ordinary path refusals ran.
- Desktop interaction, live network rendering, media playback and later GFM
  integration were not exercised end to end. Headless compilation and
  initialization do not establish those interactive outcomes.
- DNS preflight and WebView2 interception are application controls, not an OS
  socket sandbox. DNS rebinding and dependencies' network behavior need a
  separate operating-system isolation policy for a stronger boundary.
- Native document ingress is capped at 1 MiB and stylesheets at 512 KiB.
  The inherited profile's larger ceiling is not a promise of native capacity.
  The native renderer implements a bounded HTML/CSS subset; modern sites need
  WebView2. Malformed-input checks are not a sanitizer or exhaustive fuzz audit.
- InPrivate cleanup is best effort. Runtime or process crashes may leave local
  workspace files. Release hashes detect changes but are not signed publisher
  authentication; signed release provenance is a possible follow-up.
- 191 absent legacy reference files already existed in the supplied archive.
  Their inventory remains in `provenance/source-audit.json`. Missing references
  were not fabricated. Historical DF/VM qualification claims remain their
  original evidence and are not newly certified by this console audit.
- Full VEC1 research workflow, cross-machine replay, long-running soak and
  other platform qualification remain outside this release's tested scope.

Useful follow-up work is automated desktop/live-web testing, a Windows
sanitizer/fuzz campaign, stronger OS network isolation and signed releases.
