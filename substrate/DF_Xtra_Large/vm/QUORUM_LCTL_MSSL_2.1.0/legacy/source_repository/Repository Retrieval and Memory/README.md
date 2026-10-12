# JA21 Suite 51 — Repository Retrieval and Memory

Six independent JA Data Language scripts for exact local evidence retrieval, repository retrieval, governed-memory retrieval, evidence-authority resolution, freshness and provenance, and memory promotion and retention.

The user supplied a suite-level behavior rather than an explicit bullet list, so the behavior was decomposed into six independently testable data contracts. Together they retrieve current repository evidence, retrieve only governed memory, reconcile the two without allowing memory to overwrite repository facts, and preserve complete lineage.

## Language profile

- Language: JA Data Language
- Profile: `ja.data`
- Extension: `.jad`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `DatasetArtifact`
- Runtime posture: local data only, no network, validated schemas, deterministic queries, explicit lineage, repository authority, and no hidden mutation

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Data examples spanning record and collection schemas, nullable fields, constraints, versions, local-file execution, relational and similarity queries, document and graph traversal, time-series windows, transactions, retention, rights, import/export adapters, lineage, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These files are specification-level data programs. Production use requires a conforming JA Data compiler plus approved repository, filesystem, index, memory, rights, retention, provenance, and Podium adapters.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `51.1_Repository_Retrieval_and_Memory_Exact_Local_Evidence_Retrieval.jad` | Exact local evidence retrieval | Returns precisely located, hash-bound local evidence from one selected repository snapshot | Exact-local-evidence dataset |
| `51.2_Repository_Retrieval_and_Memory_Repository_Retrieval.jad` | Repository retrieval | Records canonical repository queries, result sets, scope, freshness, and hashes | Repository-retrieval dataset |
| `51.3_Repository_Retrieval_and_Memory_Governed_Memory_Retrieval.jad` | Governed-memory retrieval | Returns only scoped, retained, consented, provenance-bound memory | Governed-memory dataset |
| `51.4_Repository_Retrieval_and_Memory_Evidence_Authority_Resolution.jad` | Evidence-authority resolution | Reconciles repository and memory evidence while preserving repository authority for repository-state claims | Authority-resolution dataset |
| `51.5_Repository_Retrieval_and_Memory_Freshness_and_Provenance.jad` | Freshness and provenance | Detects snapshot drift and preserves complete source lineage | Freshness/provenance dataset |
| `51.6_Repository_Retrieval_and_Memory_Memory_Promotion_and_Retention.jad` | Memory promotion and retention | Governs promotion, expiry, confirmation, conflict, revocation, and retention | Memory-governance dataset |

Each file is independently loadable and emits one named JSON query result.

## Analytical ensemble

| Participant | Suite 51 responsibility |
| --- | --- |
| SOPHIA | Interprets the retrieval question, evidence meaning, memory relevance, claim scope, conflict, and promotion purpose |
| CHARLOTTE | Validates repository identity, exact locators, schemas, hashes, query scope, freshness, memory rights, consent, retention, authority, lineage, and conflicts |
| LANDON | Resolves the selected work repository, performs bounded local retrieval, loads governed memory, preserves canonical ordering, and prevents memory from changing repository evidence |
| Professor | Explains evidence, retrieval scope, stale or missing results, conflicts, authority decisions, memory limitations, and promotion or retention behavior |
| Podium | Records repository, snapshot, query, evidence, memory, authority, freshness, lineage, promotion, retention, R12/MCRT identities, and receipts |

No role may invent a file, treat a memory as current repository state, silently erase a contradiction, promote an unverified claim, or claim freshness without comparing actual identities.

## Common JA Data contract

Every script independently declares:

1. `ja source 0.3`, `use Data`, and a stable module identity.
2. `policy no_network`.
3. One typed record schema with a primary ID.
4. Explicit source, repository, memory, authority, freshness, or retention identities.
5. SOPHIA, CHARLOTTE, LANDON, Professor, and Podium fields.
6. One validated local JSON dataset.
7. Deterministic partitioning into four shards.
8. One admitted query requiring a Podium receipt.
9. Explicit dataset lineage.
10. A valid-schema assertion.
11. One named JSON emission.

Expected compiler route:

```text
source -> parse -> Data AST -> schema, dataset, partition, query, and lineage validation
-> local repository and memory adapter resolution
-> exact retrieval -> freshness and authority evaluation
-> canonical result set -> R12 lowering -> MCRT and Podium evidence
-> deterministic DatasetArtifact
```

## Repository authority rule

For claims about current repository contents, structure, symbols, configuration, dependencies, worktree state, build files, or tests:

1. Current exact evidence from the selected repository and worktree is authoritative.
2. Current validated repository indexes may summarize that evidence when index and source snapshot identities match.
3. Governed memory may guide retrieval or provide historical context.
4. Memory that conflicts with current repository evidence is marked stale or contradictory and cannot override it.
5. Missing repository evidence remains missing; memory cannot manufacture a file, symbol, result, or current state.

Repository authority is scoped. A memory about an explicit user preference, prior decision, or external constraint may remain authoritative within its own governed scope, but it does not become evidence of current repository bytes unless linked to a matching current snapshot.

Security and policy denial always supersede retrieval precedence. Repository authority does not authorize secret exposure, root escape, unknown-code execution, or access outside the selected scope.

## Repository boundary

“Repository” means the explicitly selected input or work repository. It does not default to the installed application’s own source tree.

Every retrieval resolves:

- Repository ID, canonical root, worktree ID, branch or detached state, observed revision, source snapshot hash, index version, and freshness.
- Canonical relative path, file identity, encoding, byte or line range, symbol or record locator, content hash, and evidence kind.
- Query kind, canonical query, filters, result limit, ordering, result-set hash, timeout, and continuation.

Absolute paths, parent traversal, root escape, unsafe links, mount transitions, device paths, unresolved variables, globs, implicit current directories, and hidden network fallback are denied.

Large repositories use stable indexes and bounded file windows. Exact evidence retains global source coordinates and content hashes.

## Sub-suite contracts

### 51.1 Exact local evidence retrieval

- Accepts exact path, symbol, record, byte range, line range, page, cell, archive entry, or other type-appropriate locators.
- Binds each result to repository, worktree, snapshot, canonical path, locator, and content hash.
- Distinguishes exact match, no match, multiple match, stale locator, malformed source, truncated window, and unavailable resource.
- Does not execute source content to inspect it.
- Revalidates source identity after reading when concurrent mutation is possible.

### 51.2 Repository retrieval

- Supports exact lookup, indexed symbol lookup, dependency traversal, bounded text search, metadata lookup, and deterministic result enumeration.
- Records canonical query, scope, filters, limits, ordering, result count, snapshot hash, result-set hash, and freshness.
- Exact lookup is preferred when a stable identity is known.
- Search snippets or index hits are candidate locators; source reads are required for content claims.
- Result order is canonical and independent of filesystem enumeration or worker completion time.

### 51.3 Governed-memory retrieval

- Retrieves only memory within declared subject, purpose, user, project, and time scope.
- Requires stable memory ID, tier, provenance, source evidence, retention, consent or policy status, and conflict status.
- Distinguishes short-, medium-, and long-term memory without silently promoting between them.
- Excludes expired, revoked, unverified, out-of-scope, superseded, or prohibited memory.
- Memory retrieval is read-only and does not refresh retention merely because an item was read.

### 51.4 Evidence-authority resolution

- Compares repository and memory evidence for one explicit claim scope.
- Preserves both records, hashes, relation class, contradiction, confidence, and limitations.
- For repository-state claims, current exact repository evidence wins over memory.
- A mismatch marks memory stale or contradictory; it is not silently rewritten or deleted.
- Tolerance-crossing uncertainty, missing current evidence, or incompatible scopes produce `UNRESOLVED`.

Recommended relation states:

```text
MATCH | MEMORY_STALE | MEMORY_CONTRADICTS_REPOSITORY
REPOSITORY_EVIDENCE_MISSING | SCOPE_MISMATCH | UNRESOLVED
```

### 51.5 Freshness and provenance

- Compares observed repository revision and snapshot with the revision and snapshot used for retrieval or memory creation.
- Preserves source, adapter, query, transform, index, evidence, memory, and authority lineage.
- Detects dirty worktree changes, index lag, file replacement, path reuse, history rewrite, migration, and retention drift.
- Cached results are valid only when every bound identity and policy matches.
- Stale evidence remains visible with its reason and cannot be relabeled current.

### 51.6 Memory promotion and retention

- Promotion requires stable source evidence, purpose, tier transition, reason, confirmation status, retention profile, expiry, revocation, and conflict checks.
- Derived summaries retain links to their source evidence and cannot gain authority through repetition.
- Memory tied to repository state records the source repository snapshot and becomes stale when the current snapshot conflicts.
- Promotion is denied for unresolved, contradicted, secret, prohibited, unverified, or out-of-scope content.
- Expiry and revocation are deterministic; deletion or archival follows the declared rights and retention policy.

## Canonical retrieval pipeline

```text
resolve selected work repository -> establish current snapshot
-> run exact or bounded repository retrieval -> validate evidence hashes
-> retrieve governed memory within scope -> compare freshness and provenance
-> resolve authority without deleting conflicts -> emit canonical evidence
-> optionally evaluate memory promotion and retention -> record Podium receipt
```

Memory may suggest where to look. Repository evidence determines what is currently there.

## Retrieval states

Recommended retrieval states:

```text
requested -> scoped -> resolved -> retrieved -> validated
-> authority-resolved -> admitted -> emitted
```

Failure or non-admission states remain distinct:

```text
not-found | ambiguous | stale | conflicted | out-of-scope
| expired | revoked | prohibited | malformed | unresolved
```

No-match is a result, not an exception to invent a replacement.

## Admission gate

A DatasetArtifact is admitted only when:

- Module, schema, dataset, query, repository, worktree, snapshot, path, locator, evidence, memory, authority, freshness, provenance, promotion, retention, R12, MCRT, and Podium identities are stable.
- The dataset validates against its schema.
- Retrieval remains inside the selected repository and memory scopes.
- Exact local evidence is hash bound and current.
- Search and index results are verified against source before content claims.
- Governed memory satisfies rights, consent, purpose, retention, and conflict policy.
- Repository evidence remains authoritative for current repository-state claims.
- Contradictions, missing evidence, uncertainty, stale data, and limitations remain visible.
- No network, unknown-code execution, secret disclosure, root escape, hidden mutation, or unapproved memory promotion occurs.

The suite must not invent a file, symbol, dependency, repository result, memory, freshness status, authority result, lineage, promotion, retention decision, or evidence receipt.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Exact current repository evidence, scoped memory, matching hashes, resolved authority, and complete lineage | Pass |
| Negative | Root escape, stale index, revoked memory, scope mismatch, memory override attempt, or fabricated evidence | Expected fail |
| Boundary | Maximum path, range, result, repository, memory, retention, expiry, shard, or lineage limit | Pass or explicit diagnostic |
| Integration | Retrieval, evidence, memory, authority, freshness, promotion, and Podium identities agree | Pass |
| Security | Prompt injection, secret extraction, unsafe link, hidden network, capability escalation, or memory poisoning | Deny |
| Performance | Exact lookup, bounded search, index traversal, authority comparison, and lineage query meet budgets | Pass within profile |
| Determinism | Repeated accepted inputs preserve result order, authority decision, lineage, and canonical tuple | Pass |
| Interoperability | Filesystem, repository, index, memory, rights, retention, and provenance adapters preserve semantics | Pass |
| Recovery | Interrupted retrieval resumes without duplicated evidence, skipped results, stale cache acceptance, or lost conflicts | Pass or explicit restart requirement |
| Certification | R12, MCRT, repository, memory, authority, freshness, lineage, and Podium evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes canonical path indexing, exact-hash lookup, bounded retrieval caching, deterministic query planning, sparse graph traversal, partition pruning, and lineage indexing when all bound identities match.

Optimization must not widen repository or memory scope, skip source verification, infer current state from memory, hide no-match or conflict, refresh retention on read, promote without confirmation, remove provenance, accept stale indexes, reorder authority precedence, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, retrieval evidence preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, repository, query, evidence, memory, authority, freshness, promotion, retention, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; textual similarity between memory and repository evidence is not proof of latent coupling, current identity, or authority. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 51 is certifiable only when all six scripts preserve no-network policy, validated schemas, bounded local retrieval, exact repository identities, governed memory scope, repository authority for current state, explicit freshness and lineage, controlled promotion and retention, complete five-role evidence, deterministic query results, R12/MCRT provenance, and named JSON emissions.
