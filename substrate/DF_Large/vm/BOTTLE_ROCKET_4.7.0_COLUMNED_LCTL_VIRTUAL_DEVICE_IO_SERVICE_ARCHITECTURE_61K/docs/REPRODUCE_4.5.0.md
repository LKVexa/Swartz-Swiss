# Reproducing 4.5.0 host-reference qualification

Requirements: a C11 compiler, `make`, Python 3, OpenSSL/libcrypto development headers, and Python `cryptography` for the inherited independent trust utility.

Run from the repository root:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

`make operational` builds the host core/CLI, executes the inherited 4.1/4.3/4.4 regressions plus the 4.5 persistence suite, validates the native COLUMNED LCTL source, regenerates BRIR/BRIM deterministically, and runs the independent BRIM verifier. `make qualify` reruns the operational and size gates, confirms the rebuilt artifacts match the byte-identical qualified build, and revalidates/assembles the 76-row BR-450 evidence ledger. Run `make qualify-full` when you also want a fresh ASan/UBSan pass before that evidence validation.

The production signer private key is intentionally absent. The inherited trust fixtures are verification vectors; a deployable 4.5 BRIM must be signed by the external issuer/release authority under the normal 4.4 key ceremony.
