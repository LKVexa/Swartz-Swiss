# BOTTLE ROCKET 4.7.0 Change Log

- Added Device ABI v1 and stable standard device IDs.
- Added deterministic device discovery with version, capability, transfer, determinism, and capacity/limit metadata.
- Added bounded copy-in/copy-out extension calls through the existing HAL.
- Added bidirectional host/guest mailbox APIs with explicit ownership and depth one.
- Added per-run transfer-byte, storage-write, and entropy-request quotas without expanding VM state.
- Added optional wall-clock extension with POSIX/file and deterministic-adapter implementations.
- Kept network absent by default; optional network extension is explicit and capability-gated.
- Hardened APDU production/development command classes and retained secure-update authentication.
- Added APDU malformed-input corpus and deterministic 512-case fuzz qualification.
- Expanded diagnostic APDU state with image-hash prefix and heap/stack resource usage.
- Preserved BR/1.1, ABI/2, LCTLC/1.2, BRIM compatibility, 4.6 persistence/trust behavior, and wide-state semantics.
- Preserved the `<61,000` executable-source gate; final qualified measurement: 60,945 bytes.
