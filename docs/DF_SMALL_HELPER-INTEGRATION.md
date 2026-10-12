# DF_Small helper integration

## Supplied helper

The attached `DF_Small(8).zip` is retained exactly as `helper/source/DF_Small-source.zip` and extracted into `helper/DF_Small/`. `engine/ja21/dfsmall.lock.json` records the source archive digest plus every embedded helper file.

Identity from the supplied package:

- container: `DF_Small`
- node: `N_SMALL`
- release: `DF-PA21.2-1.0.0`
- VM: `BOTTLE ROCKET 3.0.0-MODEL`
- execution label: `CLASSICAL_NATIVE_VM_BOUNDED_EXECUTION`
- declared CLI step budget: 4096
- network policy: deny
- payload tree SHA-256: `1cf22c38121bcd3b6d56944426ca137129a0f7bfeac5803d38a1bd2b087adc3a`

## Browser-side static check

Before the helper is exposed in the UI, `DfSmallHelper` reads `node/PAYLOAD_DIGEST.json` and hashes all 20 embedded Bottle Rocket payload files. This check requires no Python or C compiler.

## Optional native helper execution

The context drawer provides two explicit actions:

- `Verify helper` runs the helper's own `VERIFY.cmd`.
- `Run pulse` runs `RUN.cmd examples\add42.mssl`.

These actions are deliberately not automatic. They inherit DF_Small's declared toolchain requirements and may fail or skip gates when Python/C11/Make/OpenSSL/POSIX tools are unavailable.

## Capability separation

DF_Small remains offline and receives no ambient page-renderer capability. It is a helper for bounded verification/execution tasks, not a transport proxy, renderer, or browser-security authority.
