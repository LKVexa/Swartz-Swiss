# JA21 Portable Qualification 9.8.6

The 9.8.6 release retains the 9.8.5 portable workspace, path, integrity, VEC1, and WebView2 boundaries and adds a mandatory post-navigation omni keyboard-focus regression gate.

On Windows, run `Verify JA21 Portable Desktop.cmd`, then `Verify JA21 Virtual Browser.cmd`. Launch JA21, navigate to a live site, click in the URL/Search field, type characters, use Backspace and Delete, press Ctrl+L, and then click a page form field to confirm keyboard ownership returns to the page. A target-machine PASS is not claimed by the package until those checks succeed.
