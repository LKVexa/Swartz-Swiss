# 4.4.0 Key Ceremony and Offline Signing

## Production roles

- **Root key:** long-lived offline Ed25519 authority. Only the public key is compiled into production. Use the root private key only to sign BRTP/1 policy/rotation/revocation records.
- **Issuer key:** identity carried in the root-signed policy. It names the release authority; the current compact profile has the root policy directly authorize the issuer and release public keys.
- **Release key:** signs BRMF/1 manifests and signed BRIMs for ordinary releases.
- **Recovery key:** separately authorized by the root policy and used only for emergency recovery manifests/images.
- **Device-specific key:** not required by the current host-reference profile. A later hardware profile may add it for attestation or device binding.

Production private keys must be generated and held outside this repository. The repository intentionally contains no root, issuer, release or recovery production private key. The only private key included is `tests/keys/DEV_ONLY_DO_NOT_DEPLOY/dev.key`, used to prove canonical signing and the compile-time hardware-anchor test path. It is not trusted by the normal software root.

## Offline procedure

1. Verify the clean source and `make operational`/`make sanitize`/`make size` gates.
2. Produce deterministic BRIR/BRIM from the authoritative COLUMNED LCTL source.
3. Sign the BRIM with the current release private key using `tools/lctl430.py ... --sign-private ... --brctl .build/brctl`.
4. Create a BRMF/1 manifest with `tools/trust440.py sign-manifest`, binding source, canonical BRIR and complete signed BRIM hashes plus issuer/release IDs, image version, generation, epoch, transaction sequence, capabilities and optional expiry.
5. Sign or rotate BRTP/1 only in the root-key environment with `tools/trust440.py sign-policy`.
6. Independently verify returned public artifacts with `tools/trust_verify.py` before deployment.
7. Record public-key IDs, policy sequence, image transaction sequence and artifact SHA-256 values in the release evidence package.

The signer consumes raw 32-byte Ed25519 keys. It does not generate or persist production private keys. Key ID is the first 8 bytes of SHA-256 of the raw public key.
