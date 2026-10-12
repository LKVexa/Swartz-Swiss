# Reproduce BOTTLE ROCKET 4.9.0

Reference Linux prerequisites: C11 compiler, make, Python 3, OpenSSL/libcrypto development files, binutils and standard POSIX shell utilities.

Run:

```sh
make clean operational
make br490-freeze br490-profiles br490-hardening
make br490-core61 br490-brim51 br490-memory br490-performance br490-docs
make br490-local-conformance
python3 qualification/br490_release_manifest.py
python3 replay/run.py --check-only
python3 evidence/verify_br490.py
python3 qualification/br490_acceptance.py
```

For an independent replay, copy the package to a genuinely separate machine/operator and run:

```sh
python3 replay/run.py --execute
```

That local script deliberately reports that independence is not proven by self-execution. BR-490-11-R09 should only be changed to OPERATIONAL after the resulting hashes/logs are returned from an independent machine/operator.

The accelerated 20,000-cycle soak is not a substitute for BR-490-11-R08. That requirement needs a literal 72-hour campaign with retained logs and resource/error evidence.
