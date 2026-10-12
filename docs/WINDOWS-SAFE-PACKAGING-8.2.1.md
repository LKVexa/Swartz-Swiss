# Windows-safe packaging — 8.2.1

## Finding
The 8.2.0 application archive is a valid standard Deflate ZIP and passes CRC validation. The extraction failure shown by Windows Explorer is caused by the archive's deep VEC1/DF_Xtra_Large evidence paths: 424 files exceed 220 characters relative to the application tree, and the longest archive entry is 294 characters. Adding a normal `C:\Users\<name>\OneDrive\Desktop\...` destination exceeds legacy Windows shell path limits. Explorer can surface this as “The Compressed (zipped) Folder ... is invalid.”

## 8.2.1 transport
The Windows-safe release uses two layers:

1. A shallow bootstrap ZIP that Windows Explorer can extract normally.
2. A sealed `.ja21pkg` payload containing the complete browser/VEC1 tree. `INSTALL.cmd` runs `Install-WindowsSafe.ps1`, verifies the payload SHA-256, rejects traversal/absolute-path entries, and extracts through `System.IO.Compression.ZipArchive` using long-path-prefixed filesystem targets.

The payload is not pruned or flattened. This preserves VEC1 evidence paths, DF_Large/DF_Xtra_Large node contents, package integrity metadata, and provenance.

## Recommended installation
Extract the bootstrap ZIP anywhere convenient, then run `INSTALL.cmd`. The default destination is `%LOCALAPPDATA%\VBJA21\8.2.1`. A custom destination can be passed to the PowerShell installer, but a local non-synchronised path is preferred over OneDrive for runtime/cache isolation and path stability.
