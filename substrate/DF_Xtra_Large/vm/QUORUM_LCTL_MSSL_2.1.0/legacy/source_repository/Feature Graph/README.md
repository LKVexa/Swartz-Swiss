# JA21 Suite 18 — Feature Graph

Six independent JA Data Language scripts for regions, contours, landmarks, layers, materials, and relations.

## Language profile

- Language: JA Data Language
- Profile: `ja.data`
- Extension: `.jad`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`

The attached corpus contains generated specification-model examples rather than evidence of production compiler execution. These files therefore use only the source forms demonstrated in the corpus: schemas, JSON-backed datasets, validation, deterministic partitioning, queries, lineage, assertions, and JSON emission.

## Files

| File | Sub-suite | Graph role | Principal output |
| --- | --- | --- | --- |
| `18.1_Feature_Graph_Regions.jad` | Regions | Spatial or semantic nodes with bounds | Receipt-bearing region records |
| `18.2_Feature_Graph_Contours.jad` | Contours | Ordered boundary geometry attached to regions | Validated contour records |
| `18.3_Feature_Graph_Landmarks.jad` | Landmarks | Anchors in a declared reference frame | Anchored landmark records |
| `18.4_Feature_Graph_Layers.jad` | Layers | Ordered parent-child composition nodes | Deterministically ordered layer records |
| `18.5_Feature_Graph_Materials.jad` | Materials | Reconstructable appearance and source descriptors | Resolved material records |
| `18.6_Feature_Graph_Relations.jad` | Relations | Typed, directed or undirected graph edges | Evidence-bearing admitted edges |

## Graph representation

The corpus demonstrates `graph_node`, `graph_edge`, and traversal semantics in its compiler and runtime representations, but its source examples use schema/dataset/query constructs rather than a separate graph declaration. Suite 18 therefore uses a normalized representation:

- Regions, contours, landmarks, layers, and materials are node datasets.
- Relations is the edge dataset, keyed by `source_id` and `target_id`.
- `region_id`, `asset_id`, `parent_layer_id`, and `source_asset` preserve attachment and provenance.
- Stable primary keys and canonical partition keys make replay independent of import or completion timing.
- Cross-dataset referential integrity is a validation obligation; a missing endpoint is never inferred.

## Analytical ensemble

| Participant | Feature Graph responsibility |
| --- | --- |
| SOPHIA | Classifies feature meaning, proposes labels and relations, and records semantic judgments without rewriting source evidence |
| CHARLOTTE | Validates schemas, geometry invariants, endpoint integrity, reference frames, provenance, and contradiction handling |
| LANDON | Imports records, preserves stable identifiers, partitions deterministically, and stages graph data for traversal and reconstruction |
| Professor | Explains feature meaning, limitations, uncertainty, and repair paths in human-readable form |
| Podium | Publishes accepted records with lineage, validation evidence, R12/MCRT references, and replay receipts |

Each schema makes these contributions explicit through `sophia_judgment`, `charlotte_validation`, `landon_status`, `professor_explanation`, and `podium_receipt`. A Podium receipt records publication evidence; it does not replace source provenance or validation.

## Sub-suite contracts

### 18.1 Regions

- Every region has a stable primary key and asset identity.
- Bounds use one declared coordinate convention and canonical component order.
- Empty, inverted, non-finite, or out-of-frame bounds are rejected or preserved as unresolved evidence.
- Labels may be absent; geometry and identity may not be silently fabricated.

### 18.2 Contours

- Each contour references an existing region.
- Point order, orientation, closure state, and coordinate frame are explicit and deterministic.
- Degenerate or self-conflicting geometry is classified, not silently repaired.
- Simplification must retain the source contour, tolerance, method, and resulting error.

### 18.3 Landmarks

- Each landmark references an existing region and a declared reference frame.
- Coordinates retain their original dimensional meaning and normalization convention.
- Duplicate labels do not imply identical landmarks; identity is key-based.
- A landmark outside its validated region is rejected or marked unresolved.

### 18.4 Layers

- Parent identifiers must resolve within the same asset graph when present.
- Parent-child cycles are invalid and block reconstruction.
- `order_key` is stable; ties use canonical primary-key order during traversal.
- Visibility and transforms remain explicit and are never inferred from file order.

### 18.5 Materials

- Material parameters retain source asset, ordering, units, color profile, and uncertainty.
- Region assignment may be absent, but an existing assignment must resolve.
- Missing textures or unsupported parameters remain visible limitations.
- Similar embeddings are search evidence, not proof of material identity.

### 18.6 Relations

- Both endpoints must exist before an edge is admitted.
- Relation kind and directionality are explicit.
- Duplicate edges are normalized by canonical endpoint and kind identity; contradictory evidence is retained.
- A relation vector supports comparison but cannot override policy, provenance, or endpoint validation.

## Deterministic reconstruction gate

Reconstruction may begin only after all six datasets pass schema validation and the following conditions hold:

1. Stable identities and source provenance are present.
2. Every declared reference resolves or is explicitly classified `UNRESOLVED`.
3. Region bounds, contour order, landmark frames, layer topology, and material parameters pass their invariants.
4. Relation endpoints and directionality are valid.
5. Partitioning and traversal use canonical keys rather than discovery time.
6. Security or policy denials are preserved and block dependent work.
7. Podium receipts reference the accepted lineage and validation result.

Any unresolved dependency required for reconstruction blocks admission. The system must not guess a missing node, edge, transform, material, or coordinate frame.

## Validation matrix

| Class | Feature Graph test | Expected result |
| --- | --- | --- |
| Positive | Complete, well-typed, receipt-bearing datasets | Pass |
| Negative | Invalid schema, missing required identity, or false schema assertion | Expected fail |
| Boundary | Empty graphs, maximum vectors, degenerate contours, and deepest valid layer nesting | Pass or explicit boundary diagnostic |
| Integration | All foreign keys and relation endpoints resolve across the six datasets | Pass |
| Security | Hidden network use, path escape, untrusted metadata, or source substitution | Deny |
| Performance | Partitioned imports and sparse traversal remain within declared resource bounds | Pass within budget |
| Determinism | Shuffled input records yield the same canonical graph and emitted order | Pass |
| Interoperability | Compatible JA Data versions preserve keys, vectors, and lineage | Pass |
| Recovery | Interrupted imports resume without duplicate identities or edges | Pass or explicit repair requirement |
| Certification | R12 and MCRT evidence preserve graph identity, validation, and replay state | Pass |

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, the graph must keep latent geometry, projected geometry, semantics, uncertainty, provenance, and interaction order separate.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain fifth-coordinate meaning, `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, phase/support, tolerances, projection version, uncertainty, provenance, `Delta_8S`, relation class, and limitations. If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; a visible match is not proof of latent coupling.

Smithson 8S is treated as a proposed analytical framework, not an established physical law or topological proof.

## Acceptance gate

Suite 18 is certifiable only when all six independent scripts preserve schema validity, stable identity, deterministic partitioning, explicit lineage, no-network policy, endpoint integrity, geometry and topology invariants, contradiction evidence, and replayable Podium receipts.
