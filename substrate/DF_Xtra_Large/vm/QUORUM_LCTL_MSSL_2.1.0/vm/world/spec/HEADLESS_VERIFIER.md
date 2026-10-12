# RC-PW Headless Deterministic Verifier

Run:

```text
python vm/world/qualification/headless_verify.py --save <save.json> --out <receipt.json>
```

The verifier creates no renderer. It validates save integrity, ledger integrity, world invariants, and emits canonical state and semantic-ledger digests. Invalid/corrupted state returns a non-zero exit code.
