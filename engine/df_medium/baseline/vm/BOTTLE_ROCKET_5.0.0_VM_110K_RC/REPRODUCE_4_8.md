# BOTTLE ROCKET 4.8.0 Reproduction Commands

From the qualified repository root:

```sh
make clean operational
make br480-independent
make br480-differential
make br480-opcode
make br480-property
make br480-fuzz
make br480-attacks
make br480-image-attacks
bash qualification/memory_safety.sh
make br480-cross
make br480-soak-fast
make br480-security
python3 qualification/acceptance_gate.py
python3 evidence/verify_evidence.py
```

`make br480-local-qualification` combines the locally executable qualification paths. It deliberately does **not** convert the missing independent-machine/operator, AArch64, Windows, or 72-hour evidence into PASS.

To complete the strict 4.8 release gate, the same final source/archive must additionally be replayed by an independent operator on an independent build machine, executed on the requested AArch64 and Windows-adapter targets where supported, and subjected to a literal uninterrupted/observed soak of at least 72 elapsed hours using the workflow's monitoring requirements. The resulting evidence should replace the corresponding BLOCKED Q7 records rather than editing their labels without fresh proof.
