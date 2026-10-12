# BOTTLE ROCKET 4.9.0 — Release Candidate & Operational Qualification

## Added
- Formal feature freeze for ISA 4.1, ABI 1.0, BRIM/1+BRPV/1, LCTLC/1.1, Device ABI 1.0, BRTM/1, BRCR/1 and BRGD/1.
- Six release profiles: development, testing, production, constrained, diagnostic and recovery.
- Core-61 build/measurement gate.
- BRIM-51 compiler/loader enforcement and explicit oversized-image rejection test.
- Runtime-memory and eight-category performance qualification.
- Release hash manifest covering source, binary, BRIM, compiler, verifier, tests, specifications and evidence.
- Twelve-document release/porting/operations documentation set.
- Independent replay handoff package and evidence verifier.
- BR-490 Q7 ledger for all 78 atomic requirements.

## Measured results
- Core-61 stripped core: **49,072 / 61,000 bytes — PASS**
- BRIM: **272 / 51,200 bytes — PASS**
- Full production runtime/authority source boundary: **107,675 / 110,000 bytes — PASS**
- Repository-local qualification: **76/76 applicable requirements PASS**
- Strict workflow acceptance: **BLOCKED 76/78**, because the literal 72-hour soak and independent second-machine/operator replay are not complete.

No executable format, ISA, ABI, trust, persistence or device ABI version was changed by this release-engineering overlay.
