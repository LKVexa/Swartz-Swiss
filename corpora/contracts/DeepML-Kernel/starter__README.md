# Starter Project

`hello_kernel.dmk` is copied from corpus record `DMK-00007`. Its expected status is `pass`. No compiler is bundled, so the first exercise is structural inspection:

```bash
python ../tools/inspect_corpus.py --record DMK-00007
python ../tools/validate_suite.py
```

When a native compiler becomes available, record compiler/runtime versions and preserve the generated R12/MCRT evidence beside the source.
