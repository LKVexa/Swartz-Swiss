# 11. Cypher — JA Security Policy Language

This package contains five independent `.jasec` policy scripts:

1. **Hashes** — governs creation of protected content-hash artifacts.
2. **Signs** — governs artifact signing and approved signing-key use.
3. **Fingerprints** — governs creation of artifact/provenance fingerprints.
4. **Verifies** — governs artifact and provenance verification.
5. **Audit provenance** — governs audit-artifact creation and provenance access.

## Suite roles

| Layer | Cypher responsibility |
|---|---|
| SOPHIA | Defines semantic identity and the content whose integrity is protected |
| CHARLOTTE | Defines canonical structure and comparison boundaries |
| LANDON | Requests the approved cryptographic provider operation |
| Professor | Audits evidence, provenance, and privileged effects |
| Podium | Applies the final admission or denial decision |

## Corpus alignment

Every script follows the attached corpus pattern: `ja source 0.3`, `use Security`, `policy no_network`, a named principal, a capability-bearing role, a restricted resource, default network denial, a scoped allow rule, human approval, privileged-effect auditing, secret redaction, explicit-deny precedence, a positive corpus-style secret-leak assertion, and MCRT decision emission.

## Execution boundary

JA Security Policy Language is a policy-decision language. The attached corpus does not define first-class commands that calculate hashes, create signatures, generate fingerprints, or verify cryptographic material. These scripts authorize and audit those operations; an approved cryptographic provider must perform them after a successful policy decision.

Each provider should return its algorithm identifier, key identifier where applicable, input hash, output hash or signature, timestamp, stable artifact ID, provenance chain, and MCRT decision reference. Unknown code, undeclared network access, unapproved keys, missing provenance, and conflicts must fail closed.
