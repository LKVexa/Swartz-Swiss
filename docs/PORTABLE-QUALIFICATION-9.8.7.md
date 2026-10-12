# JA21 Portable Qualification 9.8.7

9.8.7 preserves the 9.8.6 portable workspace and post-navigation URL/Search focus repair while adding a mandatory boot-diagnostic and compiler-hygiene gate. On Windows, run `Verify JA21 Portable Desktop.cmd` and `Verify JA21 Virtual Browser.cmd` before launch. During launch, `workspace/logs/boot-latest.log` must progress through `presenter-compile-complete` and `presenter-run-begin`. If startup exits non-zero, the launcher prints the log automatically.

Target qualification should then navigate to a live WebView2 site, click the URL/Search field, confirm normal typing plus Backspace/Delete, click an input inside the page and confirm keyboard ownership returns to the page, then repeat Ctrl+L and clear-button paths.
