# Security model

QVM is offline by default. No network virtual device exists. Guest code cannot directly access host files, processes, environment variables, sockets, clocks, entropy, or native pointers. All effects cross explicit service or persistence boundaries.

The loader is fail-closed and verifies QBRIM format, version compatibility, Ed25519 trust, revocation state, program-size ceiling, and rollback floor before instantiating VM state. Memory and services are capability gated. Resource ceilings bound instruction count, stack, memory, output, shifts, source rows, and APDU payloads.

The bundled Ed25519 implementation is a compact functional RFC-8032-style reference used to keep the candidate self-contained and reproducible. It is **not constant-time and is not an independently audited production cryptographic implementation**. The included private key is explicitly development-only and must be replaced by an external protected signing key for production.
