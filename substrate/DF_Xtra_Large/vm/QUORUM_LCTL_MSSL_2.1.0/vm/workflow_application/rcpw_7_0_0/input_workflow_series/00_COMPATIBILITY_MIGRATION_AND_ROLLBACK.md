# QUORUM RC-PW 7.0.0 — Compatibility, Migration, and Rollback

Version independently:
- world package;
- canonical schema;
- runtime ABI;
- scheduler;
- fold policy;
- 8S adapter;
- save format;
- ledger format;
- generator versions.

Provide a compatibility matrix with supported upgrade/downgrade paths.

Migration is transactional and replay-tested. Failed migration preserves the last known-good state. Rollback is a tested operation, not a documentation claim.

Historical provenance must remain interpretable after migration.
