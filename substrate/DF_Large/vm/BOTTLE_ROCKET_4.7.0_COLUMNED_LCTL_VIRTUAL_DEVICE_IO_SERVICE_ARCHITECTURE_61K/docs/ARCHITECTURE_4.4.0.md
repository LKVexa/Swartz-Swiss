# BOTTLE ROCKET 4.4.0 — Secure Boot, Signing & Trust Authority

## Authority chain

Production execution is authorized by two signed records plus the signed BRIM:

1. **Immutable software root** — a 32-byte Ed25519 public key is compiled into `src/brtrust.c`; its ID is `SHA-256(root_pub)[0:8]`. The root private key is not present in the repository.
2. **BRTP/1 trust policy** — 352 bytes. The first 288 bytes are signed by the root using domain `BR-TRUST-POLICY-1\0`. It authorizes current issuer, release and recovery public keys, optional overlap keys, epoch, rollback floors, revocation entries, capability ceiling and offline policy sequence.
3. **BRMF/1 image manifest** — 216 bytes. The first 152 bytes are signed by the authorized release or recovery key using domain `BR-IMAGE-MANIFEST-1\0`. It binds source SHA-256, canonical BRIR SHA-256, full signed-BRIM SHA-256, issuer/release IDs, image version, generation, issuer epoch, transaction sequence, capability declaration and optional expiry.
4. **Signed BRIM/1** — the image itself carries the existing Ed25519 signature over the BRIM header and payload. The manifest must bind the hash of the complete signed image.

The production decision is therefore `root -> policy -> release/recovery manifest -> signed BRIM -> VM authorization`. A valid BRIM signature without a valid trusted manifest is not executable.

## Production loader boundary

`br_vm_start` is fail-closed outside `BR_DEVELOPMENT`: the VM must have secure authorization from `br_trust_verify_manifest`. `br_vm_load_code` rejects direct opcode injection in production. Raw APDU `LOAD` is denied in production. `br_image_load` always clears secure authorization after loading an image, preventing authorization from remaining valid across a later direct load; only the manifest verifier can re-authorize that exact loaded image.

Development behavior is a separately compiled profile (`BR_DEVELOPMENT=1`) used only for inherited conformance tests. The repository's development private key lives only under `tests/keys/DEV_ONLY_DO_NOT_DEPLOY/` and is not accepted by the standard software root. The optional hardware-root callback exists only in builds compiled with `BR_TRUST_HARDWARE_ANCHOR`.

## Rotation, revocation, rollback

A root-signed BRTP policy is also the signed rotation control record. It carries the new issuer/release keys, optional prior issuer/release key and bounded overlap generation. Policy epoch and policy sequence must move monotonically during an in-memory trust session. Accepted manifests are checked against minimum image version, generation, epoch, transaction floor and the adapter's monotonic `(epoch,generation)` value. Accepted transaction sequences cannot replay, and accepted generation cannot decrease within the trust session even when a HAL monotonic service is absent.

Revocation supports four key IDs and four image versions in the bounded policy record. A revoked issuer/release is rejected before image execution. The separately authorized recovery key remains available for an emergency recovery manifest. Recovery manifests must bind the immutable root ID as issuer and the configured recovery-key ID as release authority.

## Secure startup state machine

The host/profile supplies one candidate signed bundle at a time. Startup is deterministic:

`initialize VM/HAL -> initialize immutable trust -> recover adapter monotonic state -> verify root-signed policy -> validate policy state -> verify candidate manifest -> enforce revocation/rollback/capability/expiry -> verify signed BRIM -> derive effective capability ceiling -> authorize exact loaded image -> run`.

A failure at any verification stage returns an error and never reaches an executable lifecycle state. Selection among multiple external storage candidates is intentionally outside the 61K VM core; the production VM accepts only the candidate that survives the complete verification chain. No network dependency is introduced.

## Security logging

The trust layer maintains a bounded 16-record in-memory security ring. It records signature accept/reject, rollback rejection, revoked issuer, malformed image, unauthorized capability and recovery events. This is an operational diagnostic record, not an unbounded audit log or remote telemetry channel.

## Hardware/device scope

The software-root path is host-qualified. A compile-time hardware-anchor integration path is exercised using a deterministic test callback, but no claim is made that a particular TPM, secure element, SIM/UICC/eSIM issuer, or physical key ceremony has been independently certified. Device-specific signing keys are **not required by this profile**; they may be introduced by a later hardware/attestation profile without changing the current root/release authority semantics.
