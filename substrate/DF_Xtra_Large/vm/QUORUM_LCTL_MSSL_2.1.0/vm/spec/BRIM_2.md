# QBRIM 2 image format

A signed image is canonical JSON with two top-level fields: `payload` and `signature`. The payload includes magic `QBRIM`, format version 2, VM/ISA/ABI versions, resource envelope, program version, entry point, instruction sequence, source SHA-256, and capabilities. The signature record contains `algorithm=Ed25519`, `key_id`, public key, and signature.

The signature covers the UTF-8 bytes of canonical JSON for the payload (`sort_keys=true`, compact separators). A production loader rejects missing signatures, unknown keys, revoked keys, mismatched public keys, invalid signatures, incompatible format/ISA/ABI versions, over-sized programs, and program versions below the configured rollback floor.
