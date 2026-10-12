# JA21 Suite 30 — JA Adapter

Six independent JA Service and Protocol Language scripts that ingest, parse, normalize, and emit JA records for deterministic reconstruction, rendering, and storage workflows.

## Language profile

- Language: JA Service and Protocol Language
- Profile: `ja.service`
- Extension: `.jasp`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: explicit-only
- Execution posture: capability-gated, bounded, idempotent, and deterministic

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. The scripts therefore use only the demonstrated source surface: service declarations, typed messages, streaming endpoints, capability authorization, finite deadlines, bounded retries, idempotency keys, finite protocol states, transition assertions, and JSON compatibility reports.

## Files

| File | Sub-suite | Endpoint | Capability | Purpose |
| --- | --- | --- | --- | --- |
| `30.1_JA_Adapter_Record_Intake.jasp` | Record intake | `ingest` | `ja_adapter.intake` | Admit a JA record envelope and bind its source identity |
| `30.2_JA_Adapter_Record_Parser.jasp` | Record parser | `parse` | `ja_adapter.parse` | Parse admitted payload text into a deterministic AST record |
| `30.3_JA_Adapter_Record_Normalizer.jasp` | Record normalizer | `normalize` | `ja_adapter.normalize` | Produce canonical JA record bytes and their digest |
| `30.4_JA_Adapter_Reconstruction_Emitter.jasp` | Reconstruction emitter | `emit_reconstruction` | `ja_adapter.emit.reconstruction` | Emit feature-graph and scene reconstruction records |
| `30.5_JA_Adapter_Rendering_Emitter.jasp` | Rendering emitter | `emit_rendering` | `ja_adapter.emit.rendering` | Emit scene and frame-state records for a rendering target |
| `30.6_JA_Adapter_Storage_Emitter.jasp` | Storage emitter | `emit_storage` | `ja_adapter.emit.storage` | Emit archive, manifest, provenance, and storage-ledger records |

## Analytical ensemble

| Participant | JA Adapter responsibility |
| --- | --- |
| SOPHIA | Interprets record intent, semantic meaning, target workflow, dependency relationships, and unresolved evidence |
| CHARLOTTE | Validates envelopes, schemas, grammar, AST structure, canonicalization, capabilities, hashes, transitions, policy, and replay invariants |
| LANDON | Performs intake, parsing, normalization, target mapping, deterministic serialization, and capability-approved emission |
| Professor | Explains mappings, assumptions, unsupported constructs, uncertainty, rejected fields, compatibility limits, and repair requirements |
| Podium | Publishes compatibility reports and binds accepted output to validation evidence, provenance, hashes, R12/MCRT identity, and replay receipts |

Every response contains the ensemble’s judgment, validation, adapter state, explanation, and receipt. No participant may override a policy denial, invent a missing field, or silently reinterpret a version, hash, coordinate frame, unit, or interaction order.

## Canonical JA record envelope

The six services share a logical envelope even though each endpoint requests only the fields required for its stage:

| Field | Contract |
| --- | --- |
| `request_id` | Stable idempotency identity for one adapter operation |
| `record_format` | Declared JA serialization or exchange format |
| `schema_version` | Exact schema/profile version used to parse the payload |
| `record_kind` | Declared semantic class of the record |
| `payload` | Untrusted input treated strictly as data |
| `source_hash` | Digest of the admitted source bytes under the declared input profile |
| `canonicalization_profile` | Rules for field ordering, whitespace, numeric representation, strings, nulls, and excluded metadata |
| `canonical_record` | Deterministically serialized record after validation and normalization |
| `canonical_hash` | Digest of the exact canonical bytes |
| `target_profile` | Reconstruction, rendering, or storage contract selected for emission |
| `provenance_id` | Stable reference to the source and transformation history |
| `podium_receipt` | Publication evidence bound to the exact validation result and output identity |

An identical filename, display label, or request timestamp never establishes record identity. Hash interpretation requires the algorithm and canonicalization profile retained by the associated archive or protocol evidence.

## Adapter pipeline

### 30.1 Record intake

- Treats the payload and metadata as untrusted data.
- Verifies required envelope fields, declared record kind, schema version, source hash, size limits, and provenance identity.
- Rejects unsupported formats, unknown versions, hash mismatches, hidden network requirements, and undeclared effects.
- Assigns one canonical request identity without rewriting the source payload.

### 30.2 Record parser

- Parses only against the declared grammar and schema version.
- Produces a deterministic AST record with stable node order, source spans, diagnostics, and origin identity.
- Never executes embedded code, resolves network references, loads undeclared files, or guesses missing tokens.
- Preserves unknown, contradictory, or tolerance-band constructs as explicit diagnostics.

### 30.3 Record normalizer

- Validates the AST before serialization.
- Applies the declared canonicalization profile to field order, numeric forms, strings, whitespace, optional fields, and stable identifiers.
- Computes `canonical_hash` over the exact normalized bytes.
- Requires semantically equivalent accepted inputs to normalize identically, while semantically different inputs remain distinguishable.

### 30.4 Reconstruction emitter

- Maps an admitted canonical record to the declared reconstruction target profile.
- Retains feature-graph identity, scene identity, coordinate frames, transforms, geometry, layers, materials, relations, uncertainty, and provenance.
- Rejects missing endpoints, invalid topology, unresolved required transforms, and graph/hash mismatches.
- Emits a new output hash without replacing the canonical input hash.

### 30.5 Rendering emitter

- Maps an admitted canonical record to the declared rendering contract.
- Retains scene identity, frame-state identity, camera state, layer order, material state, transforms, timing, continuity, color profile, and provenance.
- Rejects unsupported render operators, non-finite values, missing dependencies, invalid frame continuity, and target-version mismatches.
- Keeps render-target optimization separate from semantic record identity.

### 30.6 Storage emitter

- Maps the canonical record into archive, manifest, provenance, and ledger contracts.
- Retains archive identity, manifest identity, canonical path, byte count, content hash, dependency hash, retention class, and provenance.
- Uses `retry max 0` because a storage emission may create durable effects; recovery must reconcile the idempotency key before any deliberate retry.
- Rejects path escape, collisions, digest mismatch, missing dependencies, retention weakening, and incomplete provenance.

## Determinism contract

For a fixed source payload, source hash, schema version, canonicalization profile, target profile, policy state, and dependency set:

1. Intake yields the same canonical request identity.
2. Parsing yields the same AST structure, node ordering, diagnostics, and source mapping.
3. Normalization yields byte-identical canonical output and the same canonical hash.
4. Target emission yields the same accepted field mapping, output order, output hash, and compatibility report.
5. R12/MCRT replay yields the same statement identity, policy decision, result class, tuple hash, interaction order, and receipt target.

Discovery order, filesystem enumeration, worker completion order, locale, wall-clock timing, and transport selection may not affect the deterministic result.

## Failure and recovery rules

- Parsing, validation, normalization, or emission failure closes the session with an explicit diagnostic; no partial success may be represented as complete.
- Retries are bounded and reuse `request.request_id` as the idempotency key.
- A repeated request with identical canonical inputs returns or reconciles the same logical result.
- Reusing a request ID with different canonical inputs is a conflict and must not overwrite the prior result.
- A retry after unknown storage completion first queries or reconciles the existing receipt; it never blindly repeats the write.
- Original payload, diagnostics, rejected fields, policy denials, and provenance remain available for repair and audit.

## Security contract

- Input payloads are data, never executable instructions.
- Every endpoint requires its exact named capability.
- Network use is explicit-only; hidden network access is denied.
- Paths, archives, external references, codecs, schemas, and target profiles are validated before use.
- Secrets are redacted from explanations, diagnostics, compatibility reports, and Podium receipts.
- Unknown code execution, ambient authority, undeclared effects, path escape, schema substitution, and digest substitution are denied.

## Validation matrix

| Class | JA Adapter test | Expected result |
| --- | --- | --- |
| Positive | Supported envelope, schema, canonicalization profile, target, capability, and matching hashes | Pass |
| Negative | Malformed record, unknown version, invalid AST, hash mismatch, missing capability, or invalid transition | Expected fail |
| Boundary | Empty optional fields, maximum payload, numeric extrema, deadline boundary, stream limit, and deepest supported record nesting | Pass or explicit boundary diagnostic |
| Integration | One canonical identity survives intake, parse, normalize, target emission, archive, and Podium publication | Pass |
| Security | Embedded code, hidden network, path escape, schema substitution, secret leakage, or undeclared effect | Deny |
| Performance | Bounded parsing, streaming backpressure, quotas, rate limits, and sparse dependency handling | Pass within budget |
| Determinism | Reordered source metadata and different worker completion orders yield the same canonical and output hashes | Pass |
| Interoperability | Compatible JA schema and target versions preserve required fields, identities, units, and semantics | Pass |
| Recovery | Interrupted work resumes or reconciles without duplicate effects or identity drift | Pass or explicit repair requirement |
| Certification | R12/MCRT evidence and Podium receipts reproduce exact identity, policy, result, relation class, and interaction order | Pass |

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is present in a JA record, the adapter must preserve the fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, provenance, projection version, tolerance profile, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

The canonical record and every target emission retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, phase/support state, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, limitations, and whether pairwise or triadic mechanics changed the result. If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`; a visible overlap cannot be normalized or emitted as latent coupling.

R12 replay requires an independence-score difference at most `1e-8`, center/radius differences at most `1e-7 L`, wrapped phase difference at most `1e-6` radians, and identical relation class, tuple hash, and interaction order.

Smithson 8S is treated as a proposed analytical framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 30 is certifiable only when all six compatibility reports pass; capabilities, versions, formats, effects, schemas, hashes, targets, and protocol transitions are explicit; payloads remain non-executable; retries are bounded and idempotent; reconstruction, rendering, and storage emissions preserve semantic identity and provenance; hidden network and unknown-code execution are absent; and R12/MCRT replay preserves the exact policy, result, relation class, interaction order, and Podium receipt target.
