# Reproduce 4.6.0

From a clean extraction on a POSIX host with a C11 compiler, Python 3 and OpenSSL development libraries:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

For direct wide-state checks:

```sh
.build/t460
python3 tests/test_460_toolchain.py
cc -Isrc -Iadapters -std=c11 -O2 -DBR_DEVELOPMENT=1 src/brvm.c adapters/br_memory_adapter.c tools/br_sizes.c -o .build/br_sizes
.build/br_sizes
```

`evidence/` contains the command logs, two-build hashes, memory/performance measurements, 59-row requirement ledger and hashes used by the final gate.
