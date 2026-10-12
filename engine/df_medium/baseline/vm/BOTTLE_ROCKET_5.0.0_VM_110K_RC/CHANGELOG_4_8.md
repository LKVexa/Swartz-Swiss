# BOTTLE ROCKET 4.8.0 Change Log

- Added a separate pure-Python BRIM/BRPV/BRTM parser and verifier with no production VM/compiler imports.
- Added differential 1,048,576-bit arithmetic checks against Python arbitrary-precision reference behavior.
- Added opcode/register/trap/memory-boundary conformance beyond the inherited ISA suite.
- Added algebraic/state property tests.
- Added deterministic fuzzing across LCTLC, BRIR, BRIM, secure signatures, APDU, Device ABI/services, persistence records, and corrupted images; 44,700 deterministic cases are covered by the final maturity policy.
- Added explicit control-flow, capability, image, rollback, and persistence attack matrices.
- Expanded memory-safety qualification to ASan, UBSan, bounds sanitizer, LeakSanitizer, focused MemorySanitizer, and Clang static analysis.
- Corrected two static-analysis findings in the production host adapter: a possible zero-length/null memcpy contract warning and a double-close error path.
- Added GCC/Clang O0/O2/O3 same-host reproducibility testing.
- Added an accelerated 20,000-cycle execution/load/reset soak with persistence and rollback repetition; explicitly not represented as a 72-hour soak.
- Added threat model, attack-surface inventory, trust-boundary/cryptography/parser/memory/capability/persistence review, qualification limitations, and machine-readable acceptance policy.
- Preserved the 4.7 runtime formats/semantics: LCTLC/1.1, BRIR/1.1, BRIM/1+BRPV/1, BRTM/1, ISA 4.1, ABI 1.0, Device ABI 1.0, BRCR/1, and BRGD/1.
- Production runtime/authority source boundary is 107,675 bytes of the inherited 110,000-byte ceiling.
- Strict final gate: **BLOCKED — 105/113 atomic requirements OPERATIONAL, 8 BLOCKED**.
