# 12. Filing Cabinet — JA Data Language

This package contains six independent `.jad` storage modules:

1. **Canonical artifacts** — artifact identity, version, semantic identity, canonical shape, storage binding, provenance hash, and admission status.
2. **Manifests** — versioned manifest scope, entry map, storage root, manifest hash, and admission status.
3. **Ledgers** — sequence-indexed events, relations, state, entry hashes, metrics, and certification.
4. **Models** — versioned model semantics, architecture vectors, runtime bindings, model hashes, and admission status.
5. **Rollback records** — source and target versions, rollback reason, dependency state, restore pointer, evidence hash, and approval.
6. **Retrieval pointers** — artifact references, query context, index vectors, storage locations, content hashes, and availability.

## Suite roles

| Layer | Filing Cabinet responsibility |
|---|---|
| SOPHIA | Semantic identity, scope, events, reasons, and retrieval context |
| CHARLOTTE | Canonical shape, entry maps, relations, architecture, dependencies, and indexes |
| LANDON | Storage bindings, runtime state, restore targets, and retrieval locations |
| Professor | Provenance, manifest, ledger, model, rollback, and content hashes |
| Podium | Admission, certification, approval, and availability decisions |

## Corpus alignment

Every script follows the attached corpus pattern: `ja source 0.3`, `use Data`, `policy no_network`, typed schemas, local JSON datasets, schema validation, primary-key single-shard partitioning, filtered retrieval projections, lineage, positive schema assertions, and deterministic JSON emission.

## Storage contract

The attached corpus models persistent collections as validated datasets loaded from declared local JSON resources. It does not define imperative file-write or append commands. These scripts therefore define the canonical storage schemas and deterministic retrieval views; the JA Data Engine or repository adapter owns atomic persistence, versioning, and physical file placement.

Place each JSON resource beside its corresponding script using the exact filename in the `dataset` block. Duplicate primary identifiers, invalid types, missing required fields, or unavailable Podium status values must not enter the emitted working view.
