# External browser engine -> JA21 Mirror replacement ledger

## Removed

- Electron executable, BrowserWindow shell, preload/IPC and Node launch dependency.
- Chromium DLLs/resources/locales, V8 snapshots, FFmpeg, ANGLE/Vulkan and ASAR payloads.
- WinForms `WebBrowser` / MSHTML compatibility renderer.
- `WindowsFormsHost` bridge.
- proposed Edge Chromium / WebView2 renderer path.

## Added

- sealed JA21 browser/control IR;
- sealed JA21 renderer-policy IR;
- bounded HTTP/HTTPS fetch primitive;
- native JA Mirror HTML tokenizer and DOM;
- native JA Mirror CSS profile/cascade;
- native JA Mirror flow reconstruction and link semantics;
- WPF-only final paint/window primitives;
- luxury glass/hairline/ambient-gradient omni shell;
- DF_Small offline helper bridge and byte-pinned source capsule.

## Preserved

Address/search normalization, tab lifecycle, history controls, reload/stop, 32-tab bound, explicit effect brokerage, forbidden-scheme policy, hardened `$PSScriptRoot` launch resolution, DF_Small integrity checks and F11/context-drawer UX.

## Deliberately not claimed

- Chromium/WebKit/Gecko standards parity;
- arbitrary website JavaScript execution in 7.0.0;
- complete CSS layout compatibility;
- media/WebRTC/WebGL/WebGPU or browser extension APIs;
- kernel/compositor replacement by JA21;
- native execution of every attached JA21 language-suite feature.
