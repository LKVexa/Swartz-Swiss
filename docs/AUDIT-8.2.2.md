# JA21 8.2.2 audit — Windows case-collision repair

## Trigger
Windows-safe installation stopped after 7,000+ extracted files because `FileStream(..., FileMode.CreateNew, ...)` reported that `substrate\DF_Xtra_Large\vm\QUORUM_LCTL_MSSL_2.1.0\vm\world\evidence\input_provenance.json` already existed.

## Root cause
The payload contained two byte-distinct evidence documents at paths that differed only by case: `INPUT_PROVENANCE.json` and `input_provenance.json`. The build/verification environment was case-sensitive; the target Windows filesystem is case-insensitive by default. The installer correctly refused to overwrite the first file with the second.

## Repair
The static artifact/source provenance record is now `SOURCE_INPUT_PROVENANCE.json`. The generated world-qualification record remains `input_provenance.json`. All affected nested integrity documents were regenerated and the DF_Xtra_Large node verifier was rerun.

## Hardening
A Windows compatibility preflight now canonicalizes every package-relative path using Unicode NFC plus case-folding and fails on collisions. It also rejects Windows reserved device names, forbidden filename characters, trailing dots/spaces and path components longer than 255 UTF-16 code units. The Windows installer performs an equivalent preflight before it creates the staging tree.

The installer is transactional at the destination boundary: it extracts into a unique staging directory, validates `VERSION`, then promotes the staging tree. Existing destinations are refused unless `-Force` is explicitly supplied.

## Claim boundary
Linux validation can prove archive consistency, absence of Windows-name collisions, checksums, manifests and regression suites. The actual WPF/WebView2 compilation and live video behavior remain Windows-machine qualification items.
