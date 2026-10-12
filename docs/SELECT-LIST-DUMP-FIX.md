# Select / option country-wall dump fix

## Problem
DuckDuckGo (and similar pages) put region/language menus in `<select>` / `<option>` markup. DF_Medium treated every option as normal page text, so the document surface painted a bare alphabetical country list with no page chrome.

## Fix (live now)
`host/JA21VirtualBrowser.cs` → `JaHtmlChrome.Prepare` runs before `dfweb_feed_document`:
- collapses each `<select>` into one quiet "choice control · N choices" chip
- strips orphan `<option>` / `<optgroup>`
- strips `<script>`, `<noscript>`, `<svg>`, `<template>`, and raw `<textarea>` dumps
- document surface gets clearer type and paper padding

Engine source staged the same skip for the next native DLL rebuild:
- `engine/df_medium/source/ja21_webengine.c`
- `engine/df_medium/patches/ja21_webengine.8.0.3.c`

Also: `file://` fetch support, and `JA21_START_URL` now navigates the active tab directly.

## How to confirm
1. `Verify JA21 Virtual Browser.cmd` (PASS)
2. `Start JA21 Virtual Browser.cmd`
3. Open the DuckDuckGo page that previously dumped countries and reload — the wall of names should be gone; at most a single choice chip remains.
4. Fixture: `tests/select_list_regression.html`

## Unit check
Prepare() on the fixture removes every country name and keeps "Visible document content".
