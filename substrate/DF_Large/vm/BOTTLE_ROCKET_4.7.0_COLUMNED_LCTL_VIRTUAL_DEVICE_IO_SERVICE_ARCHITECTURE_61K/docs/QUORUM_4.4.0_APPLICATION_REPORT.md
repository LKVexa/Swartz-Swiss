# QUORUM Application Report — BOTTLE ROCKET 4.4.0

## Decision

**OPERATIONAL in the declared host-reference secure-boot/signing/trust-authority scope.** All 11 BR-440 work packages and all 76 atomic requirements have fresh evidence generated from the modified repository. The operational ledger contains 76 evidence-hashed rows with zero mismatches.

## What changed

The 4.3.0 BR/1.1 + ABI/2 VM is retained, but executable authority is no longer equivalent to “a syntactically valid image” or even “a signed image.” Production requires the complete chain:

`immutable root -> signed BRTP policy -> authorized signed BRMF manifest -> exact signed BRIM -> secure authorization -> execution`.

The production loader denies unsigned execution, signed images without a trusted manifest, direct opcode injection and raw APDU executable loading. Loading any BRIM invalidates prior authorization, closing stale-authorization reuse. Policy replay now rejects an equal accepted sequence, accepted manifest generation cannot regress in memory, and recovery manifests must identify the immutable root plus the configured recovery authority.

## Trust records

- BRTP/1: 352 bytes; root-signed Ed25519; separate policy domain.
- BRMF/1: 216 bytes; release/recovery-signed Ed25519; separate manifest domain.
- Signed reference BRIM: 240 bytes, including 64-byte Ed25519 signature.
- Root ID: `5c3a7d9fafc3aafa`.
- Production root/release/recovery private keys are not shipped.
- The development private key is isolated under `tests/keys/DEV_ONLY_DO_NOT_DEPLOY/` and the standard production software root does not trust it.

## Qualification

Fresh qualification recorded:

- 23/23 secure-boot runtime tests PASS.
- Compile-time hardware-anchor callback test PASS.
- 26/26 independent trust checks PASS.
- 18/18 inherited execution-boundary tests PASS.
- 8/8 ISA/ABI runtime conformance groups PASS, retaining the 41 positive and 41 capability-negative opcode vectors plus 14 canonical traps.
- 19/19 native semantic-authority tests PASS.
- ASan/UBSan PASS.
- Two clean deterministic builds are byte-identical.
- Production-source size is 60,998 bytes under the strict `<61,000` boundary.
- Unsigned/signed BRIM sizes are 176/240 bytes, both under 51,200 bytes.

The 4.3 raw-ISA benchmark is retained as historical evidence, but it is not relabeled as a like-for-like 4.4 production benchmark because that harness depends on the direct code-injection path that 4.4 deliberately prohibits. The 4.4 evidence instead records secure-boot regression-suite latency and explicitly treats cryptographic load/start verification as the new authority-transition cost.

## Remaining external qualification

The host evidence does not claim physical SIM/UICC/eSIM issuer certification, qualification of a real TPM/secure-element root, native-Windows OS execution qualification, third-party certification, or independent external LCTL 1.6.1-RC1 verification when that verifier is not supplied. Those remain external prerequisites for later physical/independent certification levels.
