# VB JA21 DF_Medium Browser 8.2.1 — Windows Packaging Audit

## Trigger
Windows Explorer displayed **Compressed (zipped) Folders Error** and reported the 8.2.0 archive as invalid while extracting from a OneDrive/Desktop path.

## Root cause
The 8.2.0 file is not corrupt. A complete ZIP CRC test passes. The issue is Windows Explorer's legacy compressed-folder/path handling when the archive contains a very deep tree.

Measured 8.2.0 payload characteristics:

- 7,763 archive entries.
- Standard Deflate compression only.
- No Zip64 requirement.
- No Windows-illegal path components were found.
- 424 payload files have package-relative paths longer than 220 characters.
- Longest archive entry: 294 characters.
- The long paths are concentrated in `substrate/DF_Xtra_Large/vm/QUORUM_LCTL_MSSL_2.1.0/vm/workflow_application/...` evidence/workflow material.

A normal destination such as `C:\Users\<user>\OneDrive\Desktop\...` pushes these entries well beyond legacy `MAX_PATH` handling. Explorer can surface the failure as an invalid compressed folder rather than as a precise path-length diagnostic.

## Corrective action
8.2.1 keeps the complete application and VEC1/DF node evidence tree intact but changes the Windows delivery mechanism:

1. The downloadable outer archive is deliberately shallow so Explorer can extract it normally.
2. The complete sealed 8.2.1 application is carried as `payload.ja21pkg`, a ZIP-format payload that Explorer does not need to enumerate.
3. `INSTALL.cmd` invokes `Install-WindowsSafe.ps1`.
4. The installer verifies the payload SHA-256 before writing anything.
5. Each entry is canonicalized and checked to ensure it stays below the chosen destination (zip-slip / absolute-path rejection).
6. Filesystem writes use Windows extended-length path syntax (`\\?\`) so the deep evidence tree can be materialized without Explorer's compressed-folder limitation.
7. Existing destinations are refused by default; `-Force` is required to replace them.
8. Failed partial extraction is removed before returning an error.

## Versioning
Application, profile, VEC1 host-integration metadata, runtime integrity seal, and package integrity manifest were advanced to **8.2.1**. The WebView2/live-web and four-node VEC1 architecture from 8.2.0 is otherwise unchanged.

## Verification
- Package integrity: PASS — 7,764 sealed files after this audit document was added.
- Browser/integration tests: 67/67 PASS.
- VEC1 control-plane tests: 29 PASS / 1 environment-dependent skip.
- Original 8.2.0 ZIP: CRC-valid under independent ZIP tooling; failure reproduced analytically as a Windows shell path-handling risk.
