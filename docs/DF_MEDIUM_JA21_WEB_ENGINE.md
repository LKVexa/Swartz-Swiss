# DF_Medium JA21 Web Engine — 8.0.2

## Runtime boundary

The browser document engine is the DF_Medium derivative, not WPF and not an external browser engine.

`browser.ja -> JA21 policy IR -> DF_Medium Web Device ABI -> HTML/CSS/resource/layout engine -> typed scene graph -> WPF presenter`

The native engine is built from the supplied DF_Medium Bottle Rocket `brvm`/`brtrust` lineage plus `ja21_webengine.c`. The source archive SHA-256 is recorded in `engine/df_medium/ENGINE_PROVENANCE.json`.

## What runs inside the engine boundary

- document-byte ingress through the DF_Medium Device ABI;
- HTML token/tag/attribute interpretation;
- bounded CSS rule parsing/cascade;
- resource discovery and URL resolution;
- block/inline/flex-row layout subset;
- text/rect/rule/image/video scene generation;
- script isolation accounting;
- resource, scene and byte budgets.

## What the Windows adapter does

- creates the hairline/glass omni window;
- performs the bounded TLS/HTTP byte transport requested by the browser;
- decodes/presents image bytes selected by the engine;
- presents direct video resources selected by the engine using OS media primitives;
- paints the scene records emitted by DF_Medium.

The adapter contains no DOM, HTML parser, CSS parser or document layout engine.

## JA21 binding

`source/web_engine.ja` is compiled to `engine/ja21/web_engine.ir.json`. Its SHA-256 is embedded into `dfmedium-ja21-web.dll`; startup compares the DLL-reported digest to the live JA21 source before opening the window.
