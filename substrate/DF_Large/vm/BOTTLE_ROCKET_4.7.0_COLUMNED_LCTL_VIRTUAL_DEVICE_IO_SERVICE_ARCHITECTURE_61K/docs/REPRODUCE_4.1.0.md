# Reproduce BOTTLE ROCKET 4.1.0 Qualification

From a clean extracted repository on a POSIX build host with a C11 compiler, GNU Make-compatible make, OpenSSL development libraries, Python 3, `nm`, and AddressSanitizer/UBSan support:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

Expected acceptance conditions:

1. `make operational` exits 0, including deterministic BRIM generation, execution, Ed25519 signing/verification, signed execution, update/recovery, APDU status, and rollback rejection.
2. `make sanitize` exits 0 with all 18 BR-410 tests passing under ASan/UBSan.
3. `make size` reports production source below 61,000 bytes.
4. `deploy/BOTTLE_ROCKET_SIM_CORE_4.1.0.brimg` is at most 51,200 bytes.
5. `make qualify` reports `decision=OPERATIONAL`, `requirements=85`, `failures=0`, and produces `evidence/MANIFEST.sha256`.
6. Two clean builds hash-identically for `libbrvm_core.a`, `brctl`, `br_tests`, and the BRIM image.

Optional independent LCTL verification remains available when the external verifier JAR is supplied:

```sh
make lctl-verify LCTL_JAR=/path/to/lctl-hyperfederated.jar
```

That external verifier is intentionally not converted into a PASS claim when it is absent.
