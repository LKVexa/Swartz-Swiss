# Reproduce BOTTLE ROCKET 4.7.0 Qualification

From the repository root on the qualified POSIX host-reference toolchain:

```sh
make clean
make operational
make size
./tools/sanitize470.sh
make qualify
```

For the combined project target:

```sh
make qualify-full
```

Verify the release tree before running commands that regenerate evidence:

```sh
sha256sum -c RELEASE_CONTENTS.sha256
```

Important: running `make qualify` intentionally regenerates qualification JSON/audit/manifest files and therefore changes evidence-file hashes after the initial release-content verification.

The Device ABI authority is `spec/DEVICE_ABI.json`. The semantic source remains LCTLC/1.2 / COLUMNED-LCTL 4.3 / BR/1.1 / ABI/2; the application/runtime release is 4.7.0. Production private signing keys are not distributed.
