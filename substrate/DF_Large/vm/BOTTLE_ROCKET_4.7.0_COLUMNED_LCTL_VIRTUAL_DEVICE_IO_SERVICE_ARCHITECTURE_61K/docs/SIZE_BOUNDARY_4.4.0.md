# 4.4.0 Size Boundary

The unchanged production-source gate is the byte sum of **Makefile + every file under `src/`, `adapters/`, and `spec/`**. Secure-boot runtime code (`src/brtrust.c/.h`) is included in that sum. Host CLI, offline signing/compiler/verifier tools, tests, documentation, deploy artifacts and evidence are separate distribution artifacts and cannot substitute for production runtime behavior.

The BRIM artifact ceiling remains 51,200 bytes. The reference source BRIM is 176 bytes unsigned; the secure reference signed BRIM is 240 bytes because Ed25519 appends a 64-byte signature.
