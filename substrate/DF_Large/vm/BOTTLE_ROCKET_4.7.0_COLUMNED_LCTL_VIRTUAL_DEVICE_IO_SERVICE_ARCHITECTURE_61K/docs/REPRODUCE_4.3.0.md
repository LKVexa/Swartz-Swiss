# Reproduce 4.3.0 Qualification

From the repository root on a supported POSIX reference host with a C11 compiler, Python 3 and OpenSSL development libraries:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

`make operational` builds the host-free core, executes inherited production-boundary tests and the 4.3 ISA/ABI conformance suite, compiles/verifies native COLUMNED LCTL, checks deterministic compiler outputs, runs a signed current image, and runs the explicit legacy 4.2 fixture. `make qualify` regenerates the BR-430 evidence ledger and manifests from fresh commands.
