# 4.5.0 Persistence / Recovery Invariants

1. A partial image is never selected without an authenticated committed control record.
2. CRC never establishes trust; BRMF Ed25519 authority and image digest binding do.
3. Candidate image data is reread and reverified before control activation.
4. Pending controls are never bootable.
5. Among valid committed records, the highest generation wins deterministically.
6. Failed updates before commitment preserve the prior committed generation.
7. Monotonic-commit failure is returned as a storage failure; it is not silently converted to success.
8. Update mutation is serialized by the HAL lock; the POSIX implementation uses an exclusive lock file.
9. Secure boot control, image storage, guest persistent data, and VM checkpoint state use disjoint storage ids.
10. Guest persistent objects are namespace-bound, versioned, quota-bounded, and SHA-256 protected.
11. File-backed temporary objects are non-symlink-following and mode 0600; durable commits fsync the parent directory.
12. Physical-media power-loss behavior is not inferred from host filesystem tests; it requires target-media qualification.
