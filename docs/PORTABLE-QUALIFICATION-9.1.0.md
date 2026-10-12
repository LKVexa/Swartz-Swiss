# JA21 9.1.0 — Portable Desktop Qualification

Target-machine qualification should verify:

1. Launch from a writable non-AppData folder and confirm `workspace/` is created beside the application.
2. Confirm the process environment points `APPDATA`, `LOCALAPPDATA`, `TEMP`, `TMP`, `HOME`, and Python cache into `workspace/`.
3. Browse in LIVE mode; verify WebView2 profile/cache/cookies are under `workspace/state/webview2/`.
4. Download a file; verify it lands under `workspace/downloads/`.
5. Create/close tabs; verify VEC1 electrons/snapshots are under `workspace/state/vec1/` and the sealed `substrate/` tree remains unchanged.
6. Run VEC1 audit/verify and confirm mutable receipts remain under the portable workspace.
7. Confirm `workspace/evidence/fabric-placement.jsonl` records N_SMALL/N_MEDIUM/N_LARGE/N_XLARGE/DF0 placement without a fabric verdict.
8. Run from a second folder/drive and confirm no absolute path from the first location is required.
9. Snapshot/copy the application plus workspace, launch the copy, and compare sealed package hashes.
10. For full WebView2 binary reproducibility, provision a pinned Fixed Version Runtime into the documented slot and verify the runtime build is identical on both machines.

The cross-platform package verifier can prove static path policy, seals, configuration, and tests. It cannot prove that proprietary/OS components outside JA21 never write to Windows profile locations; that requires target-machine process/filesystem tracing.
