# Reproduce BOTTLE ROCKET 5.0.0 qualification candidate

From a clean extracted repository on Linux x86-64 with a C compiler, Python 3 and OpenSSL:

```sh
make clean operational
make sanitize
make br500-local
python3 qualification/br500_acceptance.py
python3 evidence/verify_br500.py
python3 qualification/br500_release_bundle.py --verify
```

The local qualification is expected to pass. The strict 5.0.0 gate remains BLOCKED until the external cross-platform, literal 72-hour soak, and independent machine/operator evidence is supplied.
