# BOTTLE ROCKET 4.8.0 Threat Model

## Scope
This review covers the host-reference BOTTLE ROCKET runtime/authority boundary inherited from 4.7.0: LCTLC/1.1 parsing and compilation, BRIR/1.1, BRIM/1 + BRPV/1 verification, BRTM/1 secure loading, ISA 4.1 / ABI 1.0 execution, Device ABI 1.0, BRCR/1 transactional control state, and BRGD/1 guest persistence. 4.8.0 is a qualification overlay; it does not intentionally change guest-visible executable formats.

## Assets
- Executable-source and image integrity.
- Root → issuer → release → image signing authority.
- Monotonic anti-rollback state and authenticated recovery state.
- Capability isolation between guest code and host/device services.
- VM memory/register/stack integrity, including 1,048,576-bit values.
- Deterministic replay evidence and reproducible BRIM output.

## Adversaries
- A caller supplying malformed LCTL, BRIR, BRIM, BRTM, APDU, service/device payloads, or persistence records.
- An attacker replaying an older signed image/control record or mixing old/new persistence slots.
- A guest attempting control-flow, stack, capability, device, quota, or privilege escalation.
- A storage attacker able to truncate, reorder, corrupt, duplicate, or replay host-reference files but unable to forge protected signing/state-auth keys.
- A compromised/non-conforming build environment attempting to create a semantically different artifact from identical deterministic inputs.

## Security invariants
1. Production execution is authorized only after the BRTM trust chain, BRPV provenance, image/ISA/ABI structure, capability, rollback, and policy checks succeed.
2. Malformed/unsupported/ambiguous inputs fail closed.
3. Device/host I/O crosses the capability-gated Device ABI/HAL boundary and remains quota-bounded.
4. Persistent authority requires authenticated BRCR/BRGD records; CRC alone is never a trust decision.
5. Deterministic inputs produce deterministic BRIR/BRIM semantics and byte-identical BRIM where specified.
6. No implicit network dependency is introduced by 4.8.0.

## Out of scope / external gates
Physical HSM/secure-element root protection, real flash/NVM power-loss atomicity, hardware monotonic counters, AArch64 execution in this environment, native Windows execution in this environment, an independent build machine/operator, hardware security certification, and deployment authorization remain external evidence requirements.
