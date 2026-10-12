# BOTTLE ROCKET 5.0.0 qualification candidate

- Applied all 15 BR-500 workflow packages as a release/qualification layer over the frozen 4.7 execution contract.
- Added a 96-requirement machine-readable acceptance ledger and evidence verifier.
- Added explicit 5.0 release freeze and operational-gate specification.
- Added packaged production artifacts: freestanding Core-61 object, production compiler/runtime CLI, independent verifier, BRIM/BRIR/BRTM artifacts, source/spec/tests, and evidence.
- Added immutable release-manifest signing and verification for the qualification candidate. The release-manifest signing key is a qualification/release-engineering key, not a production HSM root.
- Preserved Core-61, BRIM-51, 110 KB runtime/authority boundary, secure boot, transactional persistence, wide-state memory, Device ABI, offline-by-default behavior, and compatibility contracts.
- Strict 5.0.0 promotion remains BLOCKED on external evidence that cannot be produced in this execution environment.
