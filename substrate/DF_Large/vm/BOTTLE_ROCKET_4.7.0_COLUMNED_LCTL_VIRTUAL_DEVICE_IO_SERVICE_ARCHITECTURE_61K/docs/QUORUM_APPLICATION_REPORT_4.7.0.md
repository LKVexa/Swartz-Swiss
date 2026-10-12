# QUORUM Application Report — BOTTLE ROCKET 4.7.0

## Applied workflow

`docs/WORKFLOW_APPLIED_4.7.0/` contains the complete `08_4_7_0_virtual_device_i_o_service_architecture` prompt/workflow corpus applied to the 4.6.0 release.

## Gate decision

**OPERATIONAL — host-reference scope**

- BR-470 work packages: 13/13
- Atomic requirements: 66/66
- BR-470 focused tests: 10/10
- Production APDU/diagnostic test: 1/1
- POSIX optional-wall-clock test: 1/1
- Deterministic APDU fuzz cases: 512/512
- Static architecture checks: 14/14
- BR-460 regression: 13/13
- BR-450 regression: 31/31
- BR-440 regression: 23/23
- BR-410 regression: 18/18
- ISA positive/capability-negative vectors: 41/41 + 41/41
- Canonical traps: 14/14
- Semantic authority tests: 19/19
- Toolchain tests: 2/2
- ASan/UBSan: PASS
- Deterministic core/image rebuild: PASS
- Evidence-ledger mismatches: 0

## Architecture change

4.7.0 does not introduce a second host-interface subsystem. It promotes the existing qualified service/HAL boundary into **Device ABI v1**, adds deterministic discovery and device metadata, copy-only extension buffers, explicit per-run I/O quotas, bidirectional mailbox ownership, production/development APDU class separation, optional wall-time/network extension contracts, and expanded diagnostics.

The VM core remains host-free. Networking is absent by default and no socket/connect/send/recv path is linked into the VM core. A configured network extension uses the generic device-call/HAL protocol and must be separately bound to a transport by a deployment adapter.

## Size accounting

- Executable production source: 60,945 bytes
- Gate: `< 61,000`
- Headroom: 55 bytes
- Reference BRIM: 112 bytes (`<= 51,200`)
- Repository/build/spec aggregate is informational and reported separately by `make size`.

The 61K boundary continues to include runtime C/H, every shipped adapter, and authoritative `BOOT.lctlc`; required device behavior was not moved into unmeasured test/evidence code.

## Performance accounting

The evidence package records a same-host median-of-seven development-profile comparison with 4.6.0. In the qualified run the measured deltas were approximately +8.55% instruction throughput, +29.74% arithmetic throughput, +1.99% load/store throughput, and +5.24% branch throughput. These are host microbenchmarks, not target SIM/UICC timing claims.

## External qualifications not claimed

Actual external network transport/security qualification, physical SIM/UICC/eSIM I/O/timing qualification, issuer key ceremony/certification, TPM/secure-element hardware qualification, native-Windows OS execution certification, and independent third-party certification remain external.
