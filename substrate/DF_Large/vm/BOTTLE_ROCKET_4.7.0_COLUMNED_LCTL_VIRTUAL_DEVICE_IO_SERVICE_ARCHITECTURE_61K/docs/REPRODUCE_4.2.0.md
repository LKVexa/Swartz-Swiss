# Reproduce BOTTLE ROCKET 4.2.0 qualification

From the repository root on a POSIX build host with a C11 compiler, Python 3 and OpenSSL development libraries:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

Focused semantic-authority commands:

```sh
python3 tools/lctl420.py check src/BOOT.lctlc --executable
python3 tools/lctl420.py brir src/BOOT.lctlc /tmp/boot.brir.json
python3 tools/lctl420.py compile src/BOOT.lctlc /tmp/boot.brimg --factory --manifest /tmp/boot.provenance.json --brir-out /tmp/boot.brir.json
python3 tools/brim_verify.py /tmp/boot.brimg --manifest /tmp/boot.provenance.json
python3 tools/lctl420.py provenance src/BOOT.lctlc /tmp/boot.brimg /tmp/boot.provenance.json
python3 tools/lctl420.py roundtrip src/BOOT.lctlc /tmp/roundtrip.brimg --factory
python3 tests/test_420.py
```

`make qualify` regenerates the BR-420 requirement ledgers and evidence from actual commands. An external LCTL 1.6.1-RC1 JAR, when separately supplied, may be run with `make lctl-verify LCTL_JAR=/path/to/jar`; it is supplementary and was not invented or bundled by this release.
