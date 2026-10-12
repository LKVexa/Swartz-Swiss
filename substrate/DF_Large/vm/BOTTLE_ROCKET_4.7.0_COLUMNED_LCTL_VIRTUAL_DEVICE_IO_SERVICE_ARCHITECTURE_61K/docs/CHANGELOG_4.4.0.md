# 4.4.0 Change Log

- Added immutable Ed25519 root trust and derived root-key ID.
- Added BRTP/1 root-signed trust policy with issuer/release/recovery hierarchy, epoch, overlap, revocation, rollback floors, capability ceiling and policy sequence.
- Added BRMF/1 release/recovery-signed manifest binding source, canonical BRIR, complete signed BRIM, IDs, version, generation, epoch, transaction sequence, capabilities and expiry.
- Added signed-only secure load/start path and bounded security-event ring.
- Production now rejects direct opcode injection and raw APDU executable loading; development bypasses require a separate `BR_DEVELOPMENT` build.
- Direct BRIM loads clear prior secure authorization, preventing stale authorization reuse.
- Tightened in-memory policy replay (`sequence <= accepted`) and accepted-generation rollback checks.
- Recovery manifests now enforce immutable root issuer ID plus recovery-key ID.
- Added compile-time hardware-root integration path and test-only development key isolation.
- Added independent trust verifier, offline policy/manifest signing utility and reference signed secure bundle.
- Consolidated file adapters and compacted source/spec representation to preserve the strict 61K production-source gate without removing secure-boot checks.
