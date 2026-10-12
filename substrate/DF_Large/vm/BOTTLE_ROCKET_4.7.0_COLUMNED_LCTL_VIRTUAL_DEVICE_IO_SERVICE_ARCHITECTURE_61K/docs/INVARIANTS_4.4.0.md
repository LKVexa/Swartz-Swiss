# 4.4.0 Security Invariants

1. Production execution requires a root-authorized policy, an authorized BRMF/1 manifest, and the exact signed BRIM named by that manifest.
2. Unsigned images, signed-but-unmanifested images, direct opcode injection and raw APDU executable loading cannot become production executable authority.
3. Loading any BRIM clears prior secure authorization. Authorization is re-established only after full manifest verification.
4. BRTP/1 is exactly 352 bytes and BRMF/1 is exactly 216 bytes; unsupported magic/version/length fails closed.
5. Ed25519 domains are distinct: `BR-TRUST-POLICY-1\0` and `BR-IMAGE-MANIFEST-1\0`.
6. Root private material and production release private material are not shipped. Test private material is isolated and unmistakably development-only.
7. Policy epoch/sequence, image version/generation, transaction sequence, and HAL monotonic state enforce rollback/replay resistance. Same in-memory policy sequence is a replay.
8. Manifest generation cannot regress below the accepted generation even without a HAL monotonic callback.
9. Recovery is separately keyed; a recovery manifest binds the immutable root ID and configured recovery-key ID.
10. Manifest capabilities may not exceed policy ceiling, and BRIM-requested capabilities may not exceed manifest declaration.
11. Expiry `0` means no time expiry. A nonzero expiry requires a clock and rejects a candidate after expiry.
12. Security-event storage is bounded to 16 records. No network is introduced.
13. Deterministic source/BRIR hashes in the reference signed bundle must match the authoritative `src/BOOT.lctlc` and canonical generated BRIR.
14. The 61K source gate measures `Makefile + src/** + adapters/** + spec/**`; required secure-boot runtime behavior remains inside that boundary.
15. OPERATIONAL means all 76 BR-440 requirements have fresh evidence, all inherited/relevant new tests pass, deterministic builds match, sanitizer and size gates pass, and no critical/high unresolved defect exists within the declared host-reference scope.
