# VB JA21 DF_Medium Browser 8.2.0 — Integration Audit

## Findings
1. **Modern video sites could not load correctly.** The 8.1.1 document path intentionally isolated arbitrary site JavaScript and rendered only the bounded DF_Medium scene profile. Modern video applications commonly require JavaScript, MSE/adaptive streaming, cookies/site storage and browser media capabilities.
2. **VEC1 was only partially vendored.** N_SMALL and N_MEDIUM were bound; N_LARGE and N_XLARGE were marked unvendored even though the supplied Electron-substitute candidate contained them.
3. **F11 was not a true omni content state.** It resized/topmosted the window but left command/tab/status/card chrome visible.
4. **Trust copy overstated native-only architecture for the requested use case.** A modern browser surface must truthfully identify its rendering dependency rather than imply DF_Medium has Chromium-equivalent compatibility.

## Remediation
- VEC1 owns application/session/tab lifecycle and hash-chained evidence.
- WebView2 is the preferred HTTP/HTTPS presentation engine when available; Native DF_Medium remains a selectable inspection path.
- All four supplied DF node containers are vendored and bound in substrate/NODES.json.
- Live web uses per-profile user data under LocalAppData (not the OneDrive/package tree), ephemeral private-tab state, same-window popup routing, top-level address-policy revalidation, default-deny permission escalation and opt-in devtools.
- WebView2 HTML fullscreen events drive JA21 immersive mode so video fullscreen expands to the omni window rather than remaining inside the content card.
- F11 now withdraws all chrome and visual card boundaries for a full-bleed omni window.
- UI retains hairline glass tokens, soft contrast, whitespace, pills/bubbles/ghost controls, predictive intent, contextual drawers, cubic-bezier and spring motion, layout rounding and subpixel/ClearType text.

## Boundary
This release does **not** claim that VEC1 or DF_Medium is a Chromium implementation. It replaces Electron application-shell/lifecycle responsibilities, while Live mode explicitly hosts the installed Microsoft Edge WebView2 Runtime as the modern web engine. Strict DF fabric execution remains fail-closed and separate from presenter evidence.
