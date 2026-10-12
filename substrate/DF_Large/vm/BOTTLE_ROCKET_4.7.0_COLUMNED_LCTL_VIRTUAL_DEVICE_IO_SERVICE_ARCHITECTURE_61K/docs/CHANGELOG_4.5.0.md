# 4.5.0 Change Log

- Added `BRC2/2` authenticated transactional control records with pending/committed states.
- Added secure `br_trust_install()` and `br_trust_recover()` update/recovery APIs.
- Embedded signed BRMF authority in each committed control; retained CRC only for accidental corruption detection.
- Added candidate reread/reverification before activation.
- Added deterministic dual-slot highest-valid-generation recovery.
- Fixed a 4.4 restart bug in trust-policy monotonic comparison: current-epoch policy reapplication no longer conflicts with a later image generation.
- Propagated monotonic commit failure from secure manifest authorization.
- Isolated legacy VM checkpoint controls into reserved state ids 8–9.
- Added `BRO1/1` guest persistent object format: namespace, version, quota, integrity and namespace-0 legacy migration.
- Added POSIX `O_NOFOLLOW`, 0600 temp creation, lock-file exclusion, atomic rename and parent-directory fsync durability.
- Added 4.5 crash, corruption, concurrency, filesystem and persistent-object regression suite.
- Re-articulated the 61K gate as the production executable-source boundary and separately reports repository build/spec source size.
