# JA21 Portable Optical Instrument Desktop 9.8.5 Audit

## Reported defect
Windows PowerShell `Add-Type` aborted before the JA21 window opened because `BrowserWindow._omniUserEditing` was assigned but never read. On the target Windows compiler this produced a warning promoted to a terminating compiler error.

## Root cause
9.8.4 introduced tab-scoped omni draft state (`_omniEditDirty`, `_omniEditTabId`, `_omniDraftText`) and routed URL synchronization through `HasProtectedOmniDraft`. The older `_omniUserEditing` state was still written by `BeginOmniEditSession` and `EndOmniEditSession`, but the 9.8.4 guard no longer consumed it. The static release gate counted assignments as field references, so it did not distinguish a write-only private field from a genuinely read field. Two interaction tests still encoded the expected edit-protection behavior but were not part of the package verifier's release test list.

## Repair
- Restored `_omniUserEditing` as a read-side member of `HasProtectedOmniDraft`.
- Preserved the 9.8.4 tab-scoped dirty-draft and intentionally-empty-draft semantics.
- Updated interaction regression tests to assert the combined edit-session/dirty/focus guard.
- Added an explicit warning-as-error regression gate to both the Windows verifier and the cross-platform package verifier.
- Added the interaction reliability suites to the package verifier's mandatory release test run.

## Qualification boundary
Cross-platform/static integrity and regression tests can be run in the build environment. The final WPF/WebView2 `Add-Type` compilation must still be run on Windows using `Verify JA21 Virtual Browser.cmd`; no Windows target-machine PASS is claimed by this audit until that command succeeds there.
