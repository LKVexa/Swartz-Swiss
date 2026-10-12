# 5.0.0 release engineering

The qualification candidate includes source, specification, tests, evidence, Core-61 object, production `brctl` compiler/runtime, independent `brverify`, BRIR, BRIM, and signed BRTM image. `release/IMMUTABLE_RELEASE_MANIFEST.json` binds the release artifacts and source/spec/test trees and is verified by `release/IMMUTABLE_RELEASE_MANIFEST.sig` plus `release/RELEASE_SIGNING_PUBLIC.pem`.

The release-manifest key is a qualification/release-engineering key created for this candidate. Its private half is deliberately excluded from distributions. Production deployment still requires the deployment authority's real key-management/HSM process.

No executable-format change was introduced merely to label 5.0.0. The 5.0.0 version is the release/qualification package layer; the frozen guest contract remains the version set in `spec/RELEASE_FREEZE_5_0.json`.
