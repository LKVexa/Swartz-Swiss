# Reproducing BOTTLE ROCKET 4.4.0

From the repository root on the qualified host-reference toolchain:

```sh
make clean
make operational
make sanitize
make size
python3 tools/trust_verify.py
make qualify
```

`make operational` runs the inherited 4.1 execution-boundary suite, the 4.3 ISA/ABI suite, the 4.4 secure-boot suite, the compile-time hardware-anchor test, deterministic LCTL compilation, independent BRIM verification and the 19-test semantic-authority suite.

The 4.4 qualifier performs two clean deterministic builds, reruns operational/sanitizer/size/core-scan gates, runs independent trust verification, proves the offline signer reproduces the canonical test hardware policy, measures memory/performance and emits the 76-row BR-440 evidence ledger.
