# BOTTLE ROCKET 4.1.0 Change Log

## Production Execution Boundary

- Extracted host-independent `brvm-core` from the prior POSIX-coupled VM implementation.
- Added explicit VM lifecycle: create, initialize, configure, reset, load, verify, start, step, run, suspend, resume, stop, fault, recover, destroy.
- Added a 16-call HAL for all host-facing storage, monotonic state, signature, random, clock, console, device, panic, scheduling, and lock services.
- Removed direct stdio, filesystem, environment, terminal, POSIX, and OpenSSL dependencies from core semantics.
- Replaced core OpenSSL SHA-256 use with an internal portable SHA-256 implementation; retained signature-provider selection in adapters.
- Added per-instance host context, device table, capabilities, instruction/service/host-call counters, and quotas; eliminated hidden global VM state.
- Added explicit core, trap, loader, storage, signature, capability, resource, malformed-image, unsupported-ISA, and unsupported-ABI errors.
- Added POSIX, Windows-compatible, bare-metal test, deterministic, in-memory, and simulated smart-card adapters.
- Preserved POSIX crash-durability semantics by syncing committed parent directories after atomic renames, and removed double-close error paths in POSIX/Windows-compatible storage adapters.
- Added capability-gated fixed host-call mediation, pointer/length/buffer validation, quotas, and execution budgets.
- Versioned LCTL-C units to 4.1.0 and BRIM image generation to version 6; alternate update qualification uses image version 7.
- Strengthened the shipped assembler to reject unsupported LCTL-C and unit versions in addition to malformed/ambiguous metadata.
- Added 18 BR-410 executable tests covering lifecycle, adapter contracts, cross-adapter BRIM behavior, isolation, persistence/replay, error models, sandboxing, wide-stack operation, budgets, APDU rejection, and pointer validation.
- Retained the complete 4.0.1 generated evidence under `evidence/4.0.1-baseline/` and added a fresh baseline reproduction log.

## Measured tradeoff

The new per-step lifecycle, capability, and execution-budget checks impose measurable instruction/branch microbenchmark overhead versus the 4.0.1 host-reference baseline. This is recorded in `evidence/DELTA.json`; it is not hidden or reclassified as an improvement. 4.1.0 prioritizes explicit isolation and mediation, with performance optimization left as a subsequent measured work item.
