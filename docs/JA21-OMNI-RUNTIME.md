# JA21 Omni Runtime + JA Mirror

JA21 Omni Runtime replaces application-shell responsibilities; JA Mirror replaces the document-renderer responsibility. Together they form the self-hosted JA21 browser candidate.

WPF is not treated as a browser engine. It supplies native windows, layout/drawing primitives and text rasterization. .NET/Windows supplies the socket/TLS primitive. Browser semantics remain inside the package.

Electron-era responsibilities are replaced by JA21 typed events/actions, WPF window bootstrap, JA Mirror DOM/CSS reconstruction, DF_Small helper brokerage, and sealed runtime/package manifests.
