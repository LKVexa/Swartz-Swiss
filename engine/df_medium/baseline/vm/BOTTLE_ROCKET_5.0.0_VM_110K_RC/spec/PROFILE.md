# BOTTLE ROCKET 4.7.0 — Virtual Device I/O & Service Profile

4.7.0 preserves **LCTLC/1.1, BRIR/1.1, BRIM/1, BRPV/1, ISA 4.1, ABI 1.0, BRTM/1, BRCR/1 and BRGD/1**. Core/compiler authority is **0x00040700**; native image version is **9**.

The 4.7 architectural change is Device ABI 1.0: eight stable device classes, deterministic discovery, capability and buffer validation, per-run call/byte/write/entropy quotas, deterministic replay substitution, hardened APDU parsing and signed recovery authorization, and network-off-by-default policy. Legacy service IDs route through this boundary rather than creating parallel host access.

The inherited 4.6 wide-state representation remains descriptor-backed and copy-on-write. Secure loading, rollback protection, transactional update/recovery, and guest persistence remain enforced. Raw BRIM execution is still prohibited by the production build.
