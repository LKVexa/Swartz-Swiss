# BOTTLE ROCKET 4.6.0 — Wide-State Memory & Performance Architecture (61K execution boundary)

This release applies the QUORUM `07_4_6_0_wide_state_memory_performance_architecture` sequence to the validated 4.5.0 transactional-persistence baseline.

4.6.0 preserves the BR/1.1 + ABI/2 + LCTLC/1.2 + secure-boot/persistence contracts while replacing eager 1,048,576-bit register/stack/scratch allocation with canonical descriptor-backed wide words. Zero and small values are inline; a single high limb can remain sparse; dense values allocate only active limbs; dense copies share reference-counted backing until mutation. The 16-register bank and 256-word stack therefore contain descriptors rather than 128-KiB buffers per slot.

A reusable scratch arena is allocated lazily and bounded independently. Per-VM heap, stack-logical-byte, scratch, device-buffer, instruction and existing service/storage limits fail closed through explicit resource traps. Arithmetic operates on active limbs and normalizes results; small-value fast paths and compile-time immediate constant folding remove unnecessary wide work without changing observable ISA semantics.

Primary gates:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

## Measured production boundary

The inherited 4.5 definition is retained: all runtime C/H source, all adapters, and authoritative `src/BOOT.lctlc`. Tests, tools, specifications, documentation and evidence are supplementary and are not executable production behavior.

`make size` is the authority for the exact release value and requires `<61,000` bytes. The BRIM image must remain `<=51,200` bytes.

Host-reference qualification does not claim physical SIM/UICC/eSIM memory timing, issuer certification, TPM/secure-element certification, native-Windows execution certification, or independent third-party qualification.
