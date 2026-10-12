# Reproduce BOTTLE ROCKET 4.0.1 qualification

From a clean checkout on a POSIX host with a C11 compiler, GNU Make, Python 3, OpenSSL/libcrypto development headers, `strip`, and `/usr/bin/time`:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

The authoritative full qualification command is:

```sh
python3 tools/qualify.py
```

The mandatory local LCTL-C gate can be run independently with:

```sh
python3 tools/qualify.py --lctl-only
```

If the independent LCTL 1.6.1-RC1 JAR is available, it can be run as a supplementary verifier:

```sh
make lctl-verify LCTL_JAR=/path/to/lctl-hyperfederated.jar
```

Expected release-gate outcome for the included evidence set is `OPERATIONAL` for BR-401-01 through BR-401-09. Physical SIM/UICC/eSIM and issuer/hardware certification remain explicitly outside this host-reference qualification scope.
