# JA21 Suite 29 — Archive Ledger

Six independent JA Data Language scripts for feature graphs, motion plans, training ledgers, manifests, provenance, and hashes.

## Language profile

- Language: JA Data Language
- Profile: `ja.data`
- Extension: `.jad`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. These files therefore use only source forms demonstrated in the corpus: schemas, JSON-backed datasets, validation, deterministic partitioning, queries, lineage, assertions, and JSON emission.

## Files

| File | Sub-suite | Ledger responsibility | Principal output |
| --- | --- | --- | --- |
| `29.1_Archive_Ledger_Feature_Graphs.jad` | Feature graphs | Registers versioned graphs and their node, edge, relation, schema, and payload identities | Sealed feature-graph records |
| `29.2_Archive_Ledger_Motion_Plans.jad` | Motion plans | Binds plans to scenes, feature graphs, timing, constraints, continuity, and payload identity | Sealed motion-plan records |
| `29.3_Archive_Ledger_Training_Ledgers.jad` | Training ledgers | Records datasets, model routes, features, parameters, metrics, sample counts, and run states | Sealed training-run records |
| `29.4_Archive_Ledger_Manifests.jad` | Manifests | Enumerates archive members, versions, canonical paths, sizes, dependencies, retention, provenance, and content hashes | Sealed manifest entries |
| `29.5_Archive_Ledger_Provenance.jad` | Provenance | Preserves append-only source-to-result derivation events and policy evidence | Admitted provenance events |
| `29.6_Archive_Ledger_Hashes.jad` | Hashes | Verifies canonical bytes and optionally links verification records into an ordered chain | Verified hash records |

## Analytical ensemble

| Participant | Archive Ledger responsibility |
| --- | --- |
| SOPHIA | Classifies artifact meaning, archive relationships, derivation intent, contradictions, and unresolved evidence |
| CHARLOTTE | Validates schemas, identities, references, canonicalization profiles, digests, retention rules, and replay invariants |
| LANDON | Imports records, assigns stable partitions, preserves append-only order, resolves dependencies, and stages deterministic archive output |
| Professor | Explains content, limitations, uncertainty, failed checks, repair requirements, and certification consequences |
| Podium | Publishes only admitted records and binds each publication to lineage, validation evidence, R12/MCRT identity, and a replay receipt |

Every schema makes the ensemble explicit through `sophia_judgment`, `charlotte_validation`, `landon_status`, `professor_explanation`, and `podium_receipt`. A Podium receipt is evidence of an accepted publication event; it never substitutes for the source bytes, provenance event, manifest entry, or content digest.

## Ledger model

The suite separates six identities that must never be silently collapsed:

1. The logical artifact identity, such as a graph, motion plan, or training run.
2. The artifact version.
3. The canonical serialized bytes.
4. The content digest calculated over those bytes.
5. The provenance chain that explains how the artifact was produced.
6. The manifest entry that places the artifact in a particular archive.

An identical filename is not proof of identical content. An identical content hash is not proof of identical provenance, policy decision, or semantic meaning. Manifest order is not creation order unless the manifest explicitly declares that ordering.

## Sub-suite contracts

### 29.1 Feature graphs

- `graph_id` and `graph_version` form the logical version identity.
- Node and edge counts are recorded after canonical graph normalization.
- `relation_digest` covers canonical relation identity and directionality; `schema_hash` covers the accepted graph schema.
- `payload_hash` identifies the full canonical graph payload without replacing the relation or schema digests.
- Missing endpoints, contradictory edges, unresolved coordinate frames, or invalid graph topology block sealing.

### 29.2 Motion plans

- Every plan references a scene and the exact admitted feature-graph hash used to construct it.
- Timeline and constraint digests are preserved independently.
- Frame count and continuity status are validated against the canonical motion-plan payload.
- A graph replacement, constraint change, timing change, or continuity repair produces a new plan version and payload hash.
- A plan with missing dependencies or unresolved continuity cannot receive a publication receipt.

### 29.3 Training ledgers

- Every training run has a stable identity and records its dataset version, model route, feature-set hash, and parameter hash.
- The metric vector has a declared component order and evaluation profile documented outside the vector.
- Sample count is the admitted count after filtering; rejected or quarantined samples remain provenance evidence.
- Resume, retry, and branch operations create new derivation events and never overwrite an earlier accepted run record.
- Dataset, feature, parameter, policy, or runtime changes prevent two runs from being represented as identical.

### 29.4 Manifests

- Each entry names one archive, artifact identity, artifact version, canonical path, media type, and exact byte count.
- Canonical paths must be relative, normalized, collision-free, and unable to escape the archive root.
- Content, provenance, and dependency hashes are independently retained.
- Retention class is explicit and may not weaken a legal hold, policy denial, or certification requirement.
- A manifest is sealed only after all declared artifacts and dependencies resolve and all content hashes verify.

### 29.5 Provenance

- Provenance is append-only: corrections reference the prior event and produce a new event identity.
- Each event records source and result hashes, operation, actor, policy decision, evidence hash, and lineage depth.
- `parent_id` may be absent only for a declared root event.
- Missing evidence, a broken parent reference, a depth mismatch, or a source/result hash mismatch blocks admission.
- Similarity, timestamps, or filenames cannot be used to invent a missing derivation.

### 29.6 Hashes

- `algorithm` and `canonicalization_profile` are mandatory parts of digest interpretation.
- Digest comparison occurs only after canonicalization and exact byte-count validation.
- `expected_digest` is retained separately from the calculated `digest`; mismatches remain visible evidence.
- `previous_hash` is optional and, when used, forms an ordered verification chain whose missing or conflicting predecessor blocks sealing.
- Hashes establish byte identity, not authorship, intent, semantic equivalence, or policy approval.

## Deterministic archive transaction

The logical admission order is:

1. Canonicalize and validate the feature graph, motion plan, or training-run artifact.
2. Create an append-only provenance event for the transformation.
3. Calculate and verify the content digest under the declared canonicalization profile.
4. Add the artifact, provenance identity, dependencies, retention class, and digest to the archive manifest.
5. Recalculate the sealed manifest digest and verify every member.
6. Issue the Podium receipt only after CHARLOTTE passes the complete closure check and LANDON confirms deterministic replay.

Discovery time, filesystem enumeration order, thread completion order, and wall-clock timing may not affect identities, manifest ordering, digests, or emitted records.

## Archive admission gate

An archive is admissible only when:

1. Every record passes its declared schema.
2. Stable artifact and version identities are present and unique within scope.
3. Every graph, plan, run, manifest, provenance, and hash reference resolves.
4. Canonicalization profile, digest algorithm, byte count, calculated digest, and expected digest agree.
5. The provenance graph is acyclic, parent-complete, and depth-consistent.
6. No manifest path is absolute, ambiguous, duplicated, or capable of root escape.
7. Dependencies close transitively without an unresolved or policy-denied member.
8. No hidden network effect or unknown code execution is required.
9. R12 and MCRT identity, contradiction, uncertainty, policy status, and replay evidence are preserved.
10. The Podium receipt binds the exact sealed manifest and validation result.

Any failed closure check blocks publication. The system must preserve the failure record rather than repairing or omitting evidence silently.

## Validation matrix

| Class | Archive Ledger test | Expected result |
| --- | --- | --- |
| Positive | Complete archive with canonical bytes, closed dependencies, valid provenance, and matching hashes | Pass |
| Negative | Missing identity, digest mismatch, unresolved reference, invalid schema, or false schema assertion | Expected fail |
| Boundary | Empty admitted archive, maximum vector values, zero-byte artifact, deepest allowed lineage, and largest declared byte count | Pass or explicit boundary diagnostic |
| Integration | Feature graph, motion plan, training run, provenance, hash, and manifest identities resolve across all six ledgers | Pass |
| Security | Path escape, manifest collision, hidden network use, untrusted metadata execution, or retention-policy weakening | Deny |
| Performance | Partitioned validation and hash verification remain within declared memory, compute, and I/O budgets | Pass within budget |
| Determinism | Shuffled imports and different worker completion orders yield identical canonical records and sealed manifest hash | Pass |
| Interoperability | Compatible JA Data versions preserve fields, component ordering, identities, lineage, and digest interpretation | Pass |
| Recovery | Interrupted ingestion resumes without overwriting accepted history, duplicating events, or changing prior hashes | Pass or explicit repair requirement |
| Certification | R12/MCRT replay produces identical tuple hashes, policy state, interaction order, and Podium receipt target | Pass |

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, archive records must retain the fifth-coordinate meaning, latent and projected geometry, semantics, uncertainty, provenance, projection version, tolerance profile, and interaction order as separate evidence.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

The archive must preserve `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, support and phase state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether a pairwise or triadic interaction changed the result. If `g5 > tol5` while `g3 <= tol3`, the archived relation remains `PROJECTION_ONLY`; projected overlap cannot be rewritten as latent coupling.

R12 replay requires identical relation class, tuple hash, and interaction order, with independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, and wrapped phase difference at most `1e-6` radians. A fold, migration, retention operation, or archive compaction must preserve contradiction, uncertainty, provenance, projection version, and interaction order.

Smithson 8S is treated as a proposed analytical framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 29 is certifiable only when all six independent scripts preserve schema validity, stable version identity, deterministic partitioning, explicit lineage, append-only provenance, canonical paths, closed dependencies, declared canonicalization, matching digests, no-network policy, failure evidence, R12/MCRT replay state, and exact Podium receipt binding.
