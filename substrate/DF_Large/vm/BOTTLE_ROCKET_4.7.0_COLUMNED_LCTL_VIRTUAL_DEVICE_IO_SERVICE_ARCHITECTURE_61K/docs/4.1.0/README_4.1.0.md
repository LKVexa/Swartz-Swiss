# BOTTLE ROCKET 4.1.0 — COLUMNED LCTL Production Execution Boundary

This release applies QUORUM **BR-410-01 through BR-410-09** to the truth-measured 4.0.1 host-reference baseline. Its purpose is architectural: separate VM semantics from the POSIX host program and establish an independently buildable `brvm-core` with an explicit Host Abstraction Layer (HAL), lifecycle, error model, execution context, host adapters, and sandbox boundary.

## Production boundary

`make size` measures the production execution boundary as **`Makefile + src/** + adapters/** + spec/**`**. The host CLI, tests, qualification tools, generated evidence, documentation, deploy artifacts, and build outputs are excluded because they are development/qualification surfaces rather than VM production semantics. All six required adapter implementations are inside the measured boundary. The production source ceiling remains `<61,000` bytes; the BRIM artifact is separately capped at `51,200` bytes.

## Architecture

- `src/brvm.c` / `src/brvm.h` — host-independent VM core: ISA execution, 16 × 1,048,576-bit registers, wide arithmetic, 256-word wide stack, 4,096-byte memory, traps, scheduler/budgeting, capability checks, image loading, persistence semantics, APDU semantics, and lifecycle state machine.
- `br_hal` — exactly 16 mediation calls: storage read/write/commit/erase, monotonic read/commit, signature verification, randomness, clock, console read/write, device call, panic, yield, lock, unlock.
- `adapters/` — POSIX, Windows-compatible, bare-metal test, deterministic, in-memory, and simulated smart-card adapters.
- `host/brctl.c` — host tooling and CLI. It is intentionally outside core semantics and outside the 61K production-source boundary.

The core compiles independently into `.build/libbrvm_core.a` without POSIX headers, stdio/filesystem APIs, environment variables, terminal APIs, networking, or direct OpenSSL references. SHA-256 is implemented portably inside the core; signature verification is delegated through the HAL.

## Qualification

Run:

```sh
make clean
make operational
make sanitize
make size
make qualify
```

`make qualify` generates the BR-410 evidence package, including the 85-row operational ledger, architecture scans, fail-closed LCTL-C tests, deterministic rebuild evidence, size and memory reports, performance deltas, package audits, requirement records, and SHA-256 manifests.

The qualification decision is scoped to the **host-reference production execution boundary and portable adapter source contracts**. Native Windows OS execution, physical SIM/UICC/eSIM issuer/hardware qualification, and an independent third-party LCTL 1.6.1-RC1 verifier are not asserted unless separately supplied and run.
