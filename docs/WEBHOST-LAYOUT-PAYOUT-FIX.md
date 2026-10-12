# Webhost layout payout fix

## Problem
The Windows presenter was not delivering the layout the web host (site) designated:
1. Text scene nodes were height-clipped to DF_Medium’s estimate, so designated copy was cut off.
2. Layout always ran at a fixed 1280×1600 viewport, ignoring the live Omni Bin surface width.
3. Stylesheet fetch failures were swallowed, so host CSS often never recommitted into the scene.
4. Horizontal overflow was disabled, hiding wide designated content.

## Fix
- Text nodes use wrap width without forced height clip.
- `Build(html, uri, hostWidth)` lays out to the live surface width (640–1920).
- Up to 32 stylesheets; relative CSS URLs resolve against the document base; failures counted.
- Status reports: `Webhost layout · {px} · {scene} · {CSS} · …`
- `file://` navigation allowed for local fixtures.

## Confirm
`Verify JA21 Virtual Browser.cmd`, then open `https://example.com` or reload the prior site. Status strip should show a real layout width and scene/CSS counts.
