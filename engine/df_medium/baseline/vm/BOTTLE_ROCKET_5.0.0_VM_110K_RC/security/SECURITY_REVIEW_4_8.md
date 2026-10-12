# BOTTLE ROCKET 4.8.0 Independent Security Review

## Decision summary
Repository-local review found **0 unresolved CRITICAL** and **0 unresolved HIGH** findings. The overall 4.8.0 qualification gate is nevertheless **BLOCKED** by evidence prerequisites that cannot be manufactured in this execution environment: literal 72-hour elapsed soak, AArch64 execution, Windows-adapter execution, and independent-machine/operator reproduction.

## Trust boundaries
The principal boundaries are: untrusted source/IR/image → compiler/verifier; untrusted secure bundle → trust loader; guest → ISA/ABI; guest → service/device mediation; VM → HAL/host adapter; persistent bytes → authenticated BRCR/BRGD state; and deterministic source/build inputs → release artifacts. Production raw-code loading is denied and the optional network device remains absent/offline by default.

## Cryptography review
The reference implementation uses SHA-256 for content identity, HMAC-SHA256 for authenticated state in the host-reference model, and Ed25519 for BRTM signing. BRTM signatures are domain-separated across root/issuer/release/image roles and bind provenance/authority metadata. Anti-rollback also relies on monotonic authority state. The compiled/reference trust root and qualification keys are test/reference material, not proof of production HSM or secure-element provisioning. No cryptographic algorithm change is introduced by 4.8.0.

## Parser and verifier review
The production LCTL/BRIR/BRIM/APDU paths are now complemented by `independent/brim_ref.py`, a separate pure-Python BRIM/BRPV/BRTM parser/verifier that imports no production VM/compiler code. Differential parser comparison, eight implementation-assumption mutations, nine image attacks, and deterministic fuzzing across LCTL, BRIR, BRIM, secure signatures, APDU, service/device input, persistence records, and corrupted images are included. Malformed inputs are required to fail closed.

## Memory-safety review
ASan, UBSan, bounds sanitizer, LeakSanitizer and a focused Clang MemorySanitizer run pass the 4.8 property/attack/fuzz/opcode/accelerated-soak harnesses. Clang static analysis originally reported two host-adapter warnings (possible zero-length null `memcpy` argument and a double-close path); both were corrected. Three remaining diagnostics are dead-store reports in compact `src/brvm.c`; they are code-quality findings, not observed memory-safety/control-flow defects. No unresolved critical/high memory-safety finding remains in repository-local evidence.

## Capability review
Capabilities are explicit, least-privilege-derived for images, and enforced at instruction/service/device boundaries. The attack suite exercises undeclared-device use, privilege escalation, forged capability, stale capability, and cross-instance capability reuse. Device quotas and service budgets bound host interaction. No alternate 4.8 host-I/O path bypasses Device ABI/HAL mediation.

## Persistence review
BRCR/1 and BRGD/1 remain authenticated/versioned dual-slot formats. The attack suite covers old image/control replay, mixed slots, replayed signed update, generation-wrap conditions, issuer-epoch rollback, single/both-slot corruption, control corruption, slot/control mismatch, interrupted write, and stale filesystem copy. These tests supplement the inherited 59/59 transactional-persistence suite; they do not substitute for physical NVM power-loss qualification.

## Build/reproducibility review
On the available x86-64 Linux host, GCC 14.2 and Clang 17 at O0/O2/O3 produce the same BRIM and the same conformance outcome. This demonstrates compiler/optimization independence on one host, but does not satisfy the workflow's independent-machine/operator requirement.

## Findings
- **CRITICAL:** 0 unresolved.
- **HIGH:** 0 unresolved.
- **MEDIUM:** 0 unresolved repository-local security findings identified by this pass.
- **LOW/INFO:** 3 static-analysis dead-store diagnostics in intentionally compact VM source; retained for later readability/cleanup work.
- **QUALIFICATION BLOCKERS (not software vulnerabilities):** independent machine/operator; AArch64 runtime/toolchain; Windows runtime/toolchain; literal 72-hour elapsed soak.
