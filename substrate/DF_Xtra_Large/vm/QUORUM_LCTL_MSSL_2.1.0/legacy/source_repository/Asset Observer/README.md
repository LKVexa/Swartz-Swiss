# JA21 Suite 17 — Asset Observer

Independent DeepML Core Language scripts for inspecting images, video, archives, UI assets, code, and metadata before reconstruction begins.

## Language profile

- Language: DeepML Core Language
- Profile: `deepml.core`
- Extension: `.deepml`
- Header: `deepml core 0.3`
- MCRT profile: `DEEPML_CORE_R12`
- Corpus version: `1.0.0`
- Corpus examples: 10,000 across 40 shards
- Runtime posture: deterministic, no network, no unknown-code execution

The corpus was successfully gzip-validated and includes formal EBNF, compiler and runtime contracts, semantic operators, conformance cases, and native sample scripts. These Asset Observer files are specification-level extensions built from that vocabulary; production compiler execution is not claimed.

## Files

| File | Sub-suite | Approved DeepML input | Purpose |
| --- | --- | --- | --- |
| `17.1_Asset_Observer_Images.deepml` | Images | Decoded `u8[batch,height,width,channels]` tensor | Inspect shape, dtype, normalized content, scene state, and evidence |
| `17.2_Asset_Observer_Video.deepml` | Video | Deterministically sampled `u8[batch,frames,height,width,channels]` tensor | Inspect frame geometry, sequence content, and timeline evidence |
| `17.3_Asset_Observer_Archives.deepml` | Archives | Bounded `u8[batch,entries,fields]` archive-manifest tensor | Inspect entry inventory without executing or reconstructing archive contents |
| `17.4_Asset_Observer_UI_Assets.deepml` | UI assets | Normalized `f32[batch,elements,features]` tensor | Inspect icons, fonts, styles, layout elements, states, and relationships |
| `17.5_Asset_Observer_Code.deepml` | Code | Safely parsed `i32[batch,tokens,features]` AST/token tensor | Inspect structure and metadata while forbidding code execution |
| `17.6_Asset_Observer_Metadata.deepml` | Metadata | Normalized `f32[batch,records,fields]` tensor | Inspect identity, provenance, dimensions, timestamps, hashes, and relationships |

## Adapter boundary

DeepML Core models typed tensor computation; its corpus does not define native image decoders, video codecs, archive extractors, filesystem walkers, or source-code parsers. Approved local adapters must therefore convert assets into the typed inputs shown above before these graphs run.

Adapters must be deterministic, bounded, provenance-preserving, and non-executing. They may decode or parse data but may not:

- Run embedded code, macros, installers, scripts, models, or archive payloads.
- Open network connections.
- Follow archive paths outside the staging root.
- Expand symbolic links or traversal paths without explicit authorization.
- Decompress beyond declared entry, byte, nesting, or ratio limits.
- Strip source hashes, original paths, codec/container identities, or parser diagnostics.

## Analytical ensemble

| Participant | Asset Observer responsibility |
| --- | --- |
| SOPHIA | Interprets tensor features, asset relationships, likely semantic roles, and reconstruction relevance |
| CHARLOTTE | Validates shapes, dtypes, provenance, policy, safety, deterministic behavior, and reconstruction admission |
| LANDON | Performs the approved tensor inspection and stages normalized evidence without modifying the source asset |
| Professor | Produces explanations, limitations, anomalies, and recommended repair actions without changing validation outcomes |
| Podium | Records source and semantic hashes, scene/timeline bindings, R12/MCRT evidence, decisions, and inspection receipts |

No participant may reconstruct, modify, execute, or silently repair an asset during observation.

## Shared DeepML pipeline

Every script independently declares:

1. `deepml core 0.3` and a stable module identity.
2. Deterministic, no-network, no-unknown-code, stable-ID, and provenance policies.
3. A typed asset or manifest tensor.
4. A LANDON inspection stage.
5. A SOPHIA interpretation stage.
6. A CHARLOTTE validation stage.
7. A Professor explanation stage.
8. A Podium evidence stage.
9. JA Portal scene and MCRT Portal timeline bindings.
10. A deterministic checkpoint and inference result.

The expected compiler route is:

```text
lex -> parse -> AST -> name resolution -> type check
-> semantic validation -> safety gate -> normalization
-> optimization -> R12 lowering -> MCRT emission
```

## Reconstruction admission gate

Reconstruction must not begin until all relevant observers produce an admitted inspection record containing:

- Stable asset identity and source hash.
- Detected media/container/parser type.
- Shape, dtype, dimensions, duration or entry counts as applicable.
- Provenance and original relative path.
- Validation status and diagnostics.
- Explicit network and unknown-code status.
- Uncertainty, contradictions, unsupported features, and corruption status.
- Scene and timeline bindings where applicable.
- R12 identity, semantic hash, MCRT record, and deterministic replay identifier.

Any missing provenance, unsafe payload, type/shape mismatch, unsupported device, nondeterministic kernel, path traversal, archive bomb risk, or unresolved corruption blocks reconstruction.

## Per-sub-suite requirements

### Images

Record format, dimensions, channel count, alpha semantics, orientation, color profile, animation flag, source hash, and decode warnings. Preserve the difference between stored pixels and rendered appearance.

### Video

Record container, codec, duration, frame rate, time base, frame geometry, color space, audio-track presence, sample strategy, timestamps, and decode gaps. Frame sampling must be seeded or canonically indexed.

### Archives

Inspect only a bounded manifest before extraction. Record container type, entry count, compressed and expanded sizes, nesting depth, encryption state, duplicate paths, symlinks, traversal paths, executable flags, and per-entry hashes when available.

### UI assets

Record icons, images, fonts, styles, component states, density variants, vector/raster status, nine-slice or scaling behavior, layout relationships, accessibility metadata, and scene references. Observation does not authorize redesign.

### Code

Parse code into a non-executing token or AST tensor. Record language, encoding, module graph, entrypoint declarations, imports, resources, UI bindings, build metadata, diagnostics, and source hash. External operators and unknown code remain forbidden.

### Metadata

Record canonical identity, source path, MIME/container type, byte size, timestamps, permissions, hashes, dimensions, dependency links, provenance, confidence, uncertainty, and conflicts. Metadata assertions must remain distinguishable from content-derived facts.

## Required validation matrix

| Class | Asset Observer test | Expected result |
| --- | --- | --- |
| Positive | Valid tensor, shape, dtype, policy, provenance, and scene/timeline binding | Pass |
| Negative | Shape mismatch, dtype loss, unsafe custom operator, or unsupported device | Expected fail |
| Boundary | Maximum dimensions, frames, archive entries, tokens, and metadata records | Pass or explicit boundary diagnostic |
| Integration | All observers preserve the same asset and source identities | Pass |
| Security | Embedded code, traversal, archive bomb, hidden network, or secret leakage | Deny |
| Performance | Bounded batches, deterministic sampling, sparse comparison, controlled memory planning | Pass within profile |
| Determinism | Same inputs produce identical semantic hashes and MCRT results | Pass |
| Interoperability | Compatible decoded schemas preserve identity across adapters | Pass |
| Recovery | Interrupted inspection resumes without changing or duplicating source assets | Pass or explicit repair requirement |
| Certification | R12/MCRT evidence and reconstruction admission decision are replayable | Pass |

## Optimization restrictions

Optimizations may perform constant folding, shape/dtype propagation, pure common-subexpression elimination, operator fusion, layout conversion, and memory planning only when semantic equivalence is preserved.

Optimization must not:

- Change asset identities, input/output signatures, source hashes, named observable nodes, or random-stream assignment.
- Reorder non-associative reductions without declared tolerance.
- Apply approximate kernels under an exact profile.
- Execute external operators.
- Remove anomaly, provenance, contradiction, uncertainty, or reconstruction-gate evidence.

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, Asset Observer must preserve latent geometry, product-state separation, visible projection, semantic distance, uncertainty, provenance, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium outputs retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, tolerances, projection version, relation class, uncertainty, interaction order, provenance, asset identity, decode/parser profile, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. A visual overlap or similar rendering does not prove that two assets have the same latent structure or semantic role.

## Acceptance gate

Suite 17 is certifiable only when:

- Every relevant asset category has an admitted inspection record.
- Source assets remain unchanged.
- Adapters are deterministic, bounded, local, and non-executing.
- Tensor shapes and dtypes are valid or explicitly unresolved.
- Code and embedded payloads never execute during observation.
- Archive traversal and expansion risks are rejected.
- Scene/timeline bindings and source/semantic hashes are preserved.
- Reconstruction remains blocked on missing provenance, unsafe content, corruption, or unresolved contradictions.
- R12 and MCRT replay preserve identity, policy, result, relation class, and tuple hash.
