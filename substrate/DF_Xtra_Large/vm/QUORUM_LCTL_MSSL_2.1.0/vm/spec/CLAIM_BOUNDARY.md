# Qualification claim boundary

## Demonstrated in this repository

- Columned LCTL-C sources pass the bundled canonical verifier.
- Deterministic LCTL-C → QVM-BRIR → QBRIM compilation.
- 24-opcode hosted VM execution.
- 16 isolated lazy megabit-wide registers, 4 KiB memory, bounded stack, traps and instruction budget.
- Capability-gated memory and services.
- Signed-image verification, revocation behavior and rollback-floor rejection using the candidate trust store.
- Deterministic replay.
- Authenticated dual-slot persistence with corrupt-latest fallback.
- Bounded APDU reference service.
- Deterministic local fuzz/regression/performance qualification.

## Not claimed

- Bare-metal or UEFI boot.
- A self-hosted LCTL/MSSL compiler or runtime written in LCTL/MSSL itself.
- Production HSM-backed key custody or independently audited cryptography.
- Physical power-loss guarantees.
- 72-hour soak completion.
- Independent clean-room rebuild/replay by another party.
- Windows/macOS/bare-metal execution qualification from this Linux build environment.
- Physical distributed/QPU authority.

## RC-PW 7.0 applied world extension

The candidate now contains a hosted deterministic RC-PW world subsystem under `world/` and QVM ABI 2 world services 16-31. Its fresh local qualification is reported separately in `world/evidence/qualification_summary.json`.

The local hosted world profile may be OPERATIONAL while the complete RC-PW 7.0 workflow application remains PARTIAL because full rendering/physics/AI fidelity, true multi-worker fabric, all 80 Golden World scenarios, native LCTL world semantics, long production soak, cross-platform qualification, and independent replay are not demonstrated here.
