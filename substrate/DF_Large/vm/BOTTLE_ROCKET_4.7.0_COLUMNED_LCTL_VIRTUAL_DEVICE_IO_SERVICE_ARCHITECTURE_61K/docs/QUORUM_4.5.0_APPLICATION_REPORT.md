# QUORUM 4.5.0 Application Report

## Result

The `06_4_5_0_transactional_persistence_crash_recovery` prompt/workflow series has been applied to the BOTTLE ROCKET 4.4.0 Secure Boot, Signing & Trust Authority baseline.

Host-reference qualification status: **OPERATIONAL**.

- BR-450 work packages: **11/11 OPERATIONAL**
- BR-450 atomic requirements: **76/76 OPERATIONAL**
- BR-450 transactional/crash tests: **31/31 PASS**
- BR-440 secure-boot regression: **23/23 PASS**
- BR-410 execution-boundary regression: **18/18 PASS**
- BR-430 opcode positive vectors: **41/41 PASS**
- BR-430 capability-negative vectors: **41/41 PASS**
- Canonical trap vectors: **14/14 PASS**
- Semantic-authority checks: **19/19 PASS**
- Hardware-anchor build-path regression: **PASS**
- ASan/UBSan component qualification: **PASS**
- Two clean build artifact sets: **byte-identical**
- Operational-ledger evidence hash mismatches: **0**

## Persistence architecture

4.5.0 adds a transactional A/B persistence boundary around the existing 4.4 secure-boot authority. Two image slots are paired with two versioned `BRC2/2` control slots. A committed control embeds the signed `BRMF/1` release manifest and binds generation, issuer epoch, transaction sequence, declared capabilities, and the image digest. CRC remains accidental-corruption detection only; adversarial trust decisions remain cryptographic.

The installation sequence preflights the signed image/manifest, locks storage, writes the inactive image slot, durably commits it, rereads and rehashes it, writes a pending control record, durably commits an authenticated control record, authorizes the image through the normal trust verifier, commits monotonic state, and unlocks. Recovery validates both control/image pairs and chooses the highest authenticated committed generation.

The power-loss suite covers seven mutation boundaries plus interruption before update, after activation, and after first successful boot. No tested partial candidate becomes the active recovered image.

## Persistent guest objects

Guest persistent data is separated from executable images, secure controls, and legacy checkpoint state. Four guest objects use the `BRO1/1` envelope with object identity, namespace, version, 464-byte payload quota, and SHA-256 integrity. Legacy raw objects are migrated only through namespace 0. Reserved state slots keep legacy VM checkpoint persistence from overwriting secure controls.

## Host filesystem hardening

The POSIX durable adapter uses bounded generated paths, traversal rejection, `O_NOFOLLOW`, 0600 file creation, write flush/fsync, atomic rename, parent-directory fsync, truncation rejection, and an `O_EXCL` lock file tested across host processes.

## Size accounting

The 4.4 source envelope had no practical room for this persistence implementation. 4.5.0 therefore explicitly separates executable production source from build/specification support rather than silently moving runtime behavior outside the measurement.

- Executable production source boundary: **60,995 bytes / <61,000 — PASS**
- Headroom: **5 bytes**
- Repository/build/spec aggregate: **65,763 bytes — informational, not claimed under 61K**
- Current deterministic reference BRIM: **112 bytes / <=51,200 — PASS**

The 61K executable boundary includes all runtime C and header source, every adapter, and authoritative `src/BOOT.lctlc`. Persistence, recovery, trust enforcement, and adapter behavior are inside that boundary.

## Signing status

The current 4.5 reference BRIM is intentionally unsigned. Production private signing keys are not distributed in the repository. A deployable 4.5 image must be signed offline under the retained BRTP/BRMF issuer/release authority. The 4.4 signed vectors remain retained as trust-regression fixtures and baseline provenance.

## External qualification not claimed

This host-reference qualification does not claim completion of physical power-cut testing on target SIM/UICC/eSIM flash, issuer certification/key ceremony, TPM or secure-element hardware qualification, native-Windows OS execution certification, or independent third-party security certification.
