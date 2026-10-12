# JA Mirror browser engine 7.0.0

## Objective

JA Mirror is the JA21-native substitute for a Chromium-style embedded document engine. It does not wrap Chromium, Edge, WebView2, Electron or MSHTML.

## Pipeline

1. `browser.ja` normalizes and authorizes navigation.
2. The host exposes one bounded OS networking primitive for HTTP/HTTPS.
3. `renderer.ja` defines document/resource acceptance budgets.
4. `JaMirrorHtml` tokenizes and builds a JA DOM tree.
5. `JaMirrorCss` parses a bounded CSS profile and resolves applicable declarations.
6. `JaMirrorDocumentSurface` reconstructs semantic blocks, text, links, separators, code and image placeholders.
7. WPF performs only final native layout/drawing/font primitives.
8. Link activation returns to JA21 navigation policy; it does not bypass the broker.

## Bounded profile

- 4 MiB maximum document body;
- 8 redirect maximum;
- HTTP/HTTPS only;
- credential-bearing URLs rejected;
- 7,000-node presentation budget;
- arbitrary site scripts not executed;
- no ambient local-file/data/javascript/vbscript/ftp navigation;
- DF_Small remains offline.

## Compatibility roadmap

This release is useful for server-rendered HTML, documentation, articles, simple sites and scriptless search results. Full browser parity would require progressively native JA implementations for HTML error recovery, CSS2/3 layout families, images/fonts, forms, cookies/cache, JavaScript/ECMAScript, Web APIs, accessibility tree, networking cache semantics, media and sandbox/process isolation.
