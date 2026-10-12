# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Reported defect
After navigating through multiple live sites, the omni URL/search/task field could not be reliably cleared because page-driven URL synchronization and a single coarse `_omniUserEditing` flag could race with user edits.

## Root cause
- `SyncChrome()` only knew whether editing was generally active; it did not own a tab-scoped dirty draft.
- An empty string was not represented as a first-class protected draft value.
- Focus transitions between WPF popup chrome and WebView2 could leave synchronization state ambiguous.
- There was no deterministic clear action independent of selection/delete timing.

## Repair
- Added tab-scoped omni edit state: `_omniEditTabId`, `_omniEditDirty`, `_omniDraftText`.
- Dirty drafts, including the empty string, now outrank all `NavigationCommitted`/`SyncChrome()` page URL refreshes until explicit commit/cancel/tab switch.
- Added `BeginOmniEditSession`, `EndOmniEditSession`, `HasProtectedOmniDraft`.
- Added a dedicated clear button inside the omni field.
- Pressing Enter with an empty field now preserves the empty draft instead of triggering navigation/synchronization.
- Clean focus loss can return to page-synchronized URL state; dirty focus loss remains protected.

## Hardening
Regression tests cover empty-draft persistence, multi-navigation callbacks, clear-button semantics, explicit cancel/commit, and tab-scoped edit ownership.
