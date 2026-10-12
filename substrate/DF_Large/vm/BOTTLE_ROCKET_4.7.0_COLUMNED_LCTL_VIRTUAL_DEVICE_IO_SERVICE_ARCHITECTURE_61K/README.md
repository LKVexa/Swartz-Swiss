# BOTTLE ROCKET 4.7.0 — COLUMNED LCTL Virtual Device, I/O & Service Architecture

BOTTLE ROCKET 4.7.0 advances the 4.6.0 wide-state VM with a versioned, capability-gated virtual-device architecture while preserving the BR/1.1 + ABI/2 + LCTLC/1.2 execution contract, secure boot, authenticated transactional persistence, and the 1,048,576-bit maximum word width.

## Device ABI v1

The authoritative machine-readable contract is `spec/DEVICE_ABI.json`.

Built-in devices are exposed through the already-qualified service ABI:

1. Console — bounded input/output with flush semantics
2. Persistent block — four authenticated guest objects, read/write/sync/capacity/bounds
3. Monotonic state — generation read/commit and anti-rollback integration
4. Entropy — production nondeterminism plus deterministic replay substitute
5. Clock — monotonic time plus deterministic replay clock
6. Mailbox — one bounded copied packet, explicit host/guest ownership
7. Diagnostics — VM/trap/resource/image/build identity without guest-memory or signing-secret disclosure

Optional configured extensions use `BR_SVC_DEVICE_CALL` with copied 64-byte maximum buffers and explicit capabilities:

- Device 8: optional network-extension contract; absent by default. No socket path exists in the VM core.
- Device 9: optional wall-clock extension. POSIX/file adapter supplies wall time only when configured; memory/deterministic adapters supply a deterministic substitute.

Discovery is deterministic: built-ins first, then configured extensions in strictly increasing configured-ID order. Legacy 4.6 extension IDs remain accepted so the release does not silently break the prior device-table ABI.

## I/O resource controls

Per execution the runtime enforces configured service-call and host-call budgets plus bounded transfer accounting: 1,024 transferred bytes, four storage writes, eight entropy requests, a one-packet mailbox, 64-byte device transfer buffers, and the inherited instruction/memory/stack/scratch/image ceilings.

## APDU hardening

Production raw executable loading remains disabled. APDU parsing enforces exact framing/lengths, strict command classes, transaction replay protection, secure update authorization, bounded fragmentation, and production/development command separation. `tests/fuzz/apdu/` contains the retained malformed-input corpus and `test_470_apdu_fuzz.c` executes 512 deterministic fuzz cases under normal and sanitizer qualification.

## Reproduction

```sh
make clean
make operational
make size
make sanitize
make qualify
```

`make qualify-full` runs sanitizer qualification followed by the operational/size/evidence qualification sequence.

Current sealed host-reference result: 13/13 BR-470 packages, 66/66 BR-470 requirements, 60,945-byte executable production-source boundary, 112-byte reference BRIM, zero evidence-ledger hash mismatches.

Physical SIM/UICC/eSIM device qualification, actual external network transport/security qualification, issuer ceremony/certification, TPM/secure-element qualification, native-Windows OS execution certification, and independent third-party certification remain external and are not represented as completed by this host-reference package.

## Executing images with the shipped CLI (audit remediation note)

The production `.build/brctl` intentionally refuses raw or merely Ed25519-signed images: `run`, `run-signed` and `verify-image` exit 1 unless the BRTM/1 trust chain has been provisioned into the instance, and this package exposes no CLI provisioning path. For evaluation and reference execution build the development CLI, which enables raw code loading exactly as the test binaries do:

```sh
make brctl-dev            # .build/brctl-dev run deploy/BOTTLE_ROCKET_SIM_CORE_4.7.0.brimg
make bench                # in-process performance reference (tools/br_bench.c, development build)
make regenerate-evidence  # rebuild every RUN_*.log / BUILD hash and re-assemble the ledger on this toolchain
```

`tools/br_bench.c` prints zeros and exits 3 when compiled without `-DBR_DEVELOPMENT=1`; the `bench` target and `tools/qualify.py` now build it correctly. The evidence ledger is bound to the compiler that produced `BUILD_A/B.sha256`; `make regenerate-evidence` followed by `make qualify` re-derives it on the current toolchain.
