# JA21 9.8.4 Omni Draft-State Hardening

The omni field now treats user text as a tab-scoped draft. Once modified, that draft is authoritative even if it is empty. Live WebView2 navigation may update the tab's logical URL, but it cannot overwrite the user's dirty draft. Enter commits a non-empty draft, Escape cancels it, and an intentional tab switch ends the draft session.
