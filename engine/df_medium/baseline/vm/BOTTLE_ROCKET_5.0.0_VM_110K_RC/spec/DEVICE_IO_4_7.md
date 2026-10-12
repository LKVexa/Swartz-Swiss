# Device ABI 1.0 — BOTTLE ROCKET 4.7.0

Authority: core ABI `0x00040700`; image version `9`; Device ABI `1.0` (`0x00010000`). The device layer is the only guest-visible host-I/O mediation surface. Legacy service IDs are compatibility shims that enter the same dispatcher.

| Device | ID | Required authority | Flags | Operations | Max I/O |
|---|---:|---|---|---|---:|
| Console | `0x4701` | SERVICE | nondeterministic | read, write, flush | 256 B |
| Block storage | `0x4702` | STATE + UPDATE | deterministic | read, write, sync, capacity | 4096 B |
| Monotonic | `0x4703` | STATE + UPDATE | deterministic | read, commit | 8 B |
| Entropy | `0x4704` | SERVICE | nondeterministic | get | 256 B |
| Clock | `0x4705` | SERVICE | nondeterministic | monotonic, wall | 8 B |
| Mailbox | `0x4706` | SERVICE | nondeterministic | receive, send, status | 256 B |
| Diagnostics | `0x4707` | SERVICE + DIAGNOSTIC | deterministic | summary, trap, resources, image, build | 64 B |
| Network | `0x4708` | SERVICE + UPDATE | nondeterministic, optional, offline | send, receive | 512 B |

## Required invariants

- Discovery slots 0–6 enumerate built-ins in stable order. Slot 7 can expose the network class only after explicit host registration; no network device exists by default.
- Every call validates device ID, operation, capability, input/output length, per-device limits, and per-run quota before invoking the HAL.
- Default per-run ceilings are 64 calls, 8,192 aggregate I/O bytes, 16 write-class calls, 8 entropy calls, and mailbox depth 4.
- The core contains no socket, DNS, connect/listen/accept/send/recv implementation. An optional network adapter is a protocol boundary supplied by the host and remains capability- and quota-gated.
- Replay mode provides deterministic entropy, monotonic/wall time and mailbox inputs. Console read is deterministic empty input. Network remains unavailable unless separately registered and authorized.
- Diagnostic trap serialization is fixed-field data rather than a raw host-structure copy. Diagnostic operations expose bounded status/resource/build/image facts and no private signing material.
- APDU dispatch validates exact/minimum lengths before command handling. Production raw-code loading is denied. RECOVER accepts only a correctly sized, cryptographically valid BRCT/1 recovery control before recovery is attempted.
- Standard device status differentiates success, unsupported device/operation, malformed arguments, capability denial, bounds/quota exhaustion, unavailable/offline state and host I/O failure.

`spec/BR_SPEC.json` encodes the same device table compactly. Each `device_abi.d` tuple is `[id, capabilities, flags, operation_count, max_input, max_output]`; `q` is `[calls, bytes, writes, entropy, mailbox_depth]`; `r` records deterministic replay availability; `n=0` means networking is absent by default.

## Compatibility

BRIM/1, ISA 4.1 and ABI 1.0 are unchanged. Retained 4.1.0, 4.2.0 and 4.6.0 raw images remain administratively executable, and the retained 4.6.0 BRTM secure bundle remains production-verifiable/executable. The 4.7 change is the host-device authority boundary, not a bytecode-format break.

For C-source compatibility with readable historical constant names after 4.7 source compaction, include `include/brvm_compat_names.h`; numeric ABI values are unchanged.
