# JA21 Portable Optical Instrument Desktop 9.8.4 Audit

## Trigger
Windows PowerShell `Add-Type` rejected the 9.8.0 landing-page source because the new command-palette bubble called `ToggleCommandPalette()` with zero arguments while the existing method signature is `ToggleCommandPalette(bool? force)`.

## Root cause
The new landing-page action was added after the method had already standardized on nullable-boolean toggle semantics. Cross-platform verification checked source markers and package integrity but did not check C# method arity.

## Repair
- Replaced the zero-argument call with `ToggleCommandPalette(null)`.
- Corrected the landing-page private-tab action from unsupported `new_private` to the existing `private_tab` event.
- Added a regression test that rejects zero-argument `ToggleCommandPalette()` calls and the unsupported `new_private` action.

## Claim boundary
The package can statically verify the source contract on Linux, but Windows PowerShell `Add-Type` remains the authoritative compile qualification.
