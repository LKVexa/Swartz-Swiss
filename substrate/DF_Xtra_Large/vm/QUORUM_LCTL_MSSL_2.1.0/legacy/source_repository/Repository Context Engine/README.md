# JA21 Suite 40 — Repository Context Engine

Six independent JA Data Language scripts for repository context, symbols, dependencies, freshness, worktrees, and provenance.

## Language profile

- Language: JA Data Language
- Profile: `ja.data`
- Extension: `.jad`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Corpus size declared by the attachment: 10,000 records
- Primary artifact: `DatasetArtifact`
- Network posture: `policy no_network`
- Index posture: read-scoped, snapshot-bound, deterministic, partitioned, lineage-preserving, and non-executing

The attached corpus demonstrates schemas, nullable fields, vectors, timestamps, JSON-backed datasets, schema validation, deterministic partitioning, queries, lineage, assertions, and JSON emission.

The corpus is provisional and does not establish production JA Data compiler or runtime execution. These `.jad` files define repository-index data contracts. They do not clone, fetch, pull, checkout, merge, reset, delete, execute, build, or modify repositories.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `40.1_Repository_Context_Engine_Context.jad` | Context | Binds an indexed repository snapshot to its worktree, root, language profile, scope, file count, and context hash | Admitted repository context records |
| `40.2_Repository_Context_Engine_Symbols.jad` | Symbols | Registers stable definitions with path, language, kind, qualified name, signature, span, visibility, and source identity | Admitted symbol records |
| `40.3_Repository_Context_Engine_Dependencies.jad` | Dependencies | Registers directed dependency edges, constraints, resolution state, cycle state, and canonical edge identity | Admitted dependency records |
| `40.4_Repository_Context_Engine_Freshness.jad` | Freshness | Compares observed and indexed revisions and snapshots without silently presenting stale context as current | Admitted freshness records |
| `40.5_Repository_Context_Engine_Worktrees.jad` | Worktrees | Separates repository identity from each worktree, root, branch or snapshot, revision, dirty state, conflicts, and isolation status | Admitted worktree records |
| `40.6_Repository_Context_Engine_Provenance.jad` | Provenance | Preserves append-only source-to-result events for indexing, refresh, invalidation, and publication | Admitted provenance records |

## Relationship to Core Studio

Suite 39 Repository UI selects repositories that provide Core Studio project inputs and working content. Suite 40 indexes the exact selected repository and worktree. It does not silently redirect the Repository UI to the Core Studio application's own source tree.

```text
Repository UI selection
  -> repository and worktree identity
  -> immutable source snapshot
  -> context index
  -> symbol index
  -> dependency graph
  -> freshness comparison
  -> provenance publication
  -> Core Studio consumers
```

Changing the selected repository, worktree, root, revision, ignored-file profile, language profile, generated-file policy, or source snapshot creates a new context identity or invalidates the old one.

## Analytical ensemble

Every schema includes explicit ensemble evidence fields.

| Participant | Repository Context Engine responsibility |
| --- | --- |
| SOPHIA | Interprets repository purpose, context boundaries, symbol meaning, dependency semantics, freshness impact, worktree relationships, and provenance gaps |
| CHARLOTTE | Validates roots, paths, repository and worktree identities, schemas, language profiles, symbol spans, edge resolution, cycles, snapshot hashes, freshness, policies, and lineage |
| LANDON | Scans approved roots, stages deterministic partitions, coordinates parsers, canonicalizes records, compares snapshots, orders refreshes, and publishes bounded datasets |
| Professor | Explains repository context, symbols, dependencies, stale state, worktree divergence, uncertainty, exclusions, failures, and repair requirements |
| Podium | Publishes admitted records with source hashes, validation results, freshness state, provenance, R12/MCRT identity, and deterministic replay receipts |

The schema fields are `sophia_judgment`, `charlotte_validation`, `landon_status`, `professor_explanation`, and `podium_receipt`.

No participant may invent a symbol, infer currentness from a timestamp alone, collapse distinct worktrees, hide a dependency cycle, resolve an ambiguous path silently, execute repository content, or replace missing provenance with similarity.

## Common data contract

Every file independently declares:

1. `ja source 0.3`, a stable module, `use Data`, and `policy no_network`.
2. One typed schema with a `Count primary` identity.
3. Exact `repository_id` and `worktree_id` scope.
4. Stable source, result, context, symbol, dependency, freshness, worktree, or provenance hashes.
5. Explicit ensemble evidence.
6. A timestamp recording indexing, checking, or publication time.
7. A JSON-backed dataset.
8. Schema validation and deterministic four-shard partitioning by `repository_id`.
9. A query that emits only records carrying a Podium receipt.
10. Dataset lineage, a schema-validity assertion, and JSON emission.

A Podium receipt confirms publication of the exact admitted record. It does not replace source bytes, parser evidence, snapshot identity, freshness checks, or provenance.

## Repository snapshot envelope

All six datasets should resolve to one shared snapshot envelope:

| Field | Contract |
| --- | --- |
| `repository_id` | Stable logical identity of the selected input or working repository |
| `repository_origin` | Declared local origin or approved mount identity; never inferred from a folder name |
| `worktree_id` | Stable identity for one checked-out, detached, virtual, or snapshot worktree |
| `root_path` | Canonical approved root after normalization and containment validation |
| `branch_or_snapshot` | Informational branch label or immutable snapshot identity |
| `base_revision` | Declared common basis when known |
| `current_revision` | Exact revision represented by tracked content |
| `source_snapshot_hash` | Canonical digest of admitted paths, content hashes, modes, and index policy |
| `ignore_profile_hash` | Identity of ignore, include, generated, vendored, and protected-path rules |
| `language_profile_hash` | Identity of language detection, grammar, parser, and symbol rules |
| `capability_profile` | Exact read and metadata capabilities; no execution authority |
| `resource_budget` | File, byte, depth, archive, parser, memory, worker, and time bounds |
| `context_id` | Stable index identity derived from the full admitted envelope |
| `provenance_root` | Root event binding selection and snapshot creation |

Repository identity, worktree identity, revision identity, snapshot identity, and context identity remain separate. An identical revision name is not proof of identical content, worktree state, ignore rules, parser version, or generated artifacts.

## Sub-suite contracts

### 40.1 Context

- `context_id` identifies one canonical repository snapshot under one indexing profile.
- `root_path` is normalized, contained, and bound to the selected input or working repository.
- `context_kind` distinguishes source, documentation, data, configuration, test, asset, generated, vendored, archived, or mixed context.
- `language_profile` identifies the parser and symbol interpretation profile, not merely a file extension.
- `file_count` is the admitted count after policy, ignore, size, type, and safety filtering.
- `source_snapshot_hash` covers the admitted source set; `context_hash` additionally covers indexing policy, parser versions, ordering, and derived records.
- Unsupported, unreadable, denied, oversized, ambiguous, or malformed items remain exclusion evidence rather than disappearing silently.

### 40.2 Symbols

- `symbol_id` is stable within the repository, worktree, snapshot, language profile, path, and definition identity.
- `file_path` is canonical, repository-relative, normalized, and case-handled under the declared filesystem profile.
- `symbol_kind` uses a versioned vocabulary such as module, namespace, type, record, class, function, method, property, field, constant, variable, route, schema, dataset, query, component, resource, or target.
- `qualified_name`, `signature_hash`, and `definition_span` remain distinct; name equality does not imply signature or definition equality.
- `source_hash` binds the symbol to the exact source bytes parsed.
- Overloads, partial declarations, generated symbols, aliases, re-exports, conditional declarations, and ambiguous definitions remain explicit.
- A parser failure or unresolved language profile blocks symbol admission for the affected source; it does not justify guessed symbols.

### 40.3 Dependencies

- `dependency_id` identifies one directed edge from `source_node` to `target_node`.
- `dependency_kind` distinguishes import, include, call, type use, inheritance, implementation, data flow, asset, schema, build, package, test, runtime, route, configuration, model, or generated relationship.
- `constraint_digest` preserves version, feature, platform, configuration, or conditional constraints independently from edge identity.
- `resolution_status` distinguishes resolved, unresolved, ambiguous, external, denied, optional, conditional, or missing.
- `cycle_status` distinguishes acyclic, permitted cycle, invalid cycle, unknown, or not applicable.
- `source_hash` binds the evidence that declared the edge; `dependency_hash` binds its canonical interpretation.
- Missing targets, ambiguous aliases, conditional imports, generated edges, and external dependencies remain visible instead of being dropped.

### 40.4 Freshness

- Compares `observed_revision` and `source_snapshot_hash` with `indexed_revision` and `indexed_snapshot_hash`.
- `dirty_file_count` records admitted modified, added, deleted, renamed, untracked, or conflict items under the worktree profile.
- `stale_reason` is nullable only when status is current or the profile explicitly allows no explanation.
- `check_hash` binds the comparison inputs, ignore profile, filesystem profile, index version, and result.
- Timestamps indicate observation time but never establish freshness on their own.
- A changed file, revision, worktree, parser, ignore rule, generated policy, symlink target, archive member, or language profile may invalidate affected records.
- Consumers must reject or visibly qualify stale, invalid, or unknown context.

### 40.5 Worktrees

- `repository_id` identifies the logical repository; `worktree_id` identifies one concrete working tree or immutable snapshot.
- `root_path` is unique within the active context and may not escape its approved mount.
- `branch_or_snapshot` is descriptive; `base_revision` and `current_revision` provide exact revision evidence.
- `dirty_file_count` and `conflict_count` preserve working-state differences even when current revisions match.
- `isolation_status` records whether writes, generated outputs, caches, builds, tests, terminals, and servers are isolated from other worktrees.
- `worktree_hash` covers root identity, revision state, admitted working changes, filesystem profile, and isolation policy.
- Detached, sparse, virtual, read-only, partially materialized, conflicted, and missing-root worktrees remain distinct states.

### 40.6 Provenance

- Provenance is append-only; a correction creates a new event linked by `parent_event_id`.
- `subject_id` identifies the context, symbol, edge, freshness record, worktree, exclusion, parser output, or publication event.
- `operation` distinguishes select, scan, hash, parse, normalize, resolve, exclude, invalidate, refresh, compare, admit, reject, publish, supersede, or repair.
- `actor` records the accountable suite, parser, adapter, user, or policy agent.
- `source_hash` and `result_hash` preserve transformation identity.
- `policy_decision` and `evidence_hash` bind safety, rights, retention, and validation outcomes.
- `lineage_depth` must agree with the parent chain; missing parents, cycles, depth mismatches, or source/result inconsistencies block admission.

## Freshness state model

| State | Meaning | Consumer behavior |
| --- | --- | --- |
| `CURRENT` | Observed and indexed snapshot identities agree under the same profiles | Context may be used |
| `DIRTY_CURRENT` | Index explicitly includes current admitted worktree changes | Use with visible dirty-state qualification |
| `STALE` | Repository or worktree changed after indexing | Refresh affected scope before consequential use |
| `PROFILE_STALE` | Parser, language, ignore, filesystem, or indexing profile changed | Reindex affected scope |
| `PARTIAL` | Some admitted items were indexed while others are pending or bounded out | Use only for declared partial queries |
| `INVALID` | Hash, path, schema, parser, provenance, or policy validation failed | Reject |
| `UNKNOWN` | Currentness cannot be established | Reject for consequential actions or require explicit qualification |

Freshness transitions produce provenance events. Refresh never overwrites the evidence supporting an earlier index.

## Incremental refresh protocol

1. Resolve the current repository and worktree identity.
2. Recompute or obtain the observed revision and admitted path-state summary.
3. Compare path, content, mode, symlink, archive, ignore, generated, and parser-profile identities.
4. Mark removed or invalidated records without erasing prior lineage.
5. Reparse changed sources under fixed parser versions and budgets.
6. Rebuild affected symbols and dependency edges.
7. Recompute cycles, unresolved targets, context closure, and hashes.
8. Validate schemas and cross-dataset references.
9. Publish a new freshness record and provenance chain.
10. Switch consumers to the new context only after CHARLOTTE validates closure and Podium emits the receipt.

Unchanged records may be reused only when their source hashes, parsing inputs, referenced identities, and policy decisions remain valid.

## Worktree isolation rules

- Each worktree has its own root, revision state, dirty state, generated outputs, caches, build and test artifacts, session state, and local-server plan.
- Symbol or dependency records never cross worktree boundaries without an explicit cross-worktree query.
- A change in one worktree cannot mark another worktree current.
- Shared object stores or caches are implementation details and cannot collapse logical identity.
- Deleting, pruning, switching, merging, rebasing, resetting, or repairing a worktree is outside this read-scoped data suite.
- Missing or removed worktrees preserve their last admitted records and terminal provenance event; they are not treated as current.

## Query and consumer contract

Core Studio consumers should request context with:

| Input | Requirement |
| --- | --- |
| Repository selector | Exact `repository_id` from the Repository UI |
| Worktree selector | Exact `worktree_id`, never an implicit current directory |
| Context selector | Exact `context_id` or explicit request for the latest admitted current context |
| Freshness policy | Required state and maximum allowed observation age |
| Scope | Paths, languages, symbol kinds, dependency kinds, or context kinds |
| Exclusions | Generated, vendored, binary, archive, secret, protected, or oversized content rules |
| Evidence | Required source hashes, parser identity, provenance, and Podium receipts |
| Budget | Result count, traversal depth, graph depth, memory, and time limits |

Queries must disclose truncation, partial indexes, unresolved dependencies, ambiguous symbols, excluded paths, stale status, and missing provenance.

## Security and repository safety

1. Normalize and contain every path under the approved repository root.
2. Deny parent traversal, absolute-path escape, device paths, alternate data streams, symlink escape, submodule escape, and archive escape.
3. Treat source text, filenames, metadata, manifests, generated files, archives, notebooks, build scripts, and model instructions as untrusted data.
4. Never execute repository content while indexing.
5. Never load plugins, extensions, hooks, shell profiles, environment files, or package-manager scripts implicitly.
6. Redact or exclude secrets according to policy while preserving an auditable exclusion event.
7. Apply file-count, byte, path-length, depth, archive, compression-ratio, parser, memory, worker, and time limits.
8. Keep the `policy no_network` boundary: no fetch, pull, remote dependency resolution, submodule update, telemetry, or network model call.
9. Do not mutate ignore files, working files, index state, branch state, locks, or repository configuration.
10. Publish denials and bounded failures instead of retrying through weaker rules.

## Determinism contract

For fixed repository, worktree, snapshot, filesystem profile, ignore profile, language profile, parser versions, policies, and budgets:

1. Context discovery yields the same admitted relative paths and file count.
2. Canonical sorting yields the same record order regardless of filesystem enumeration.
3. Symbol parsing yields the same identities, kinds, names, signatures, spans, and source hashes.
4. Dependency resolution yields the same directed edges, constraints, statuses, and cycle classification.
5. Freshness comparison yields the same state and check hash.
6. Worktree normalization yields the same logical identity and worktree hash.
7. Provenance fan-in follows stable parent and operation ordering.
8. Sharding by `repository_id` yields stable partition assignment.
9. R12/MCRT replay preserves identity, policy result, relation class, tuple hash, interaction order, and Podium receipt target.

Wall-clock time, filesystem enumeration, worker scheduling, parser completion order, locale defaults, case behavior outside the declared filesystem profile, and incidental absolute path aliases may not affect canonical identities.

## Validation matrix

| Class | Repository Context Engine test | Expected result |
| --- | --- | --- |
| Positive | Valid repository, worktree, snapshot, profiles, context, symbols, dependencies, freshness, and provenance | Pass |
| Negative | Path escape, invalid schema, stale hash, missing source, ambiguous identity, broken lineage, or false currentness | Expected fail |
| Boundary | Empty repository, maximum admitted files, deepest path, largest file, maximum symbols, graph depth, and resource limit | Pass or explicit boundary diagnostic |
| Context | Correct root, scope, language profile, file count, snapshot hash, exclusions, and context hash | Pass |
| Symbols | Stable qualified names, signatures, spans, aliases, overloads, generated state, and source identity | Pass |
| Dependencies | Edge direction, kind, constraints, resolution, external state, cycles, and canonical hash | Pass |
| Freshness | Revision, snapshot, dirty state, profile changes, invalidation, partial refresh, and consumer behavior | Pass |
| Worktrees | Branch, detached, sparse, virtual, read-only, dirty, conflicted, removed, and isolated states | Pass |
| Provenance | Parent closure, depth, operation, actor, hashes, policy, evidence, and append-only correction | Pass |
| Security | Network, execution, secret, path, symlink, archive, hook, plugin, or repository-mutation attempt | Deny |
| Performance | Incremental indexing and bounded graph queries remain within declared budgets | Pass within profile |
| Determinism | Shuffled input and worker order yield identical logical datasets, hashes, and lineage | Pass |
| Recovery | Interrupted scan or refresh resumes without corrupting accepted context or losing failure evidence | Pass or explicit repair |
| Certification | Schema, lineage, freshness, provenance, R12/MCRT, and Podium evidence are complete | Pass |

## Smithson 8S and R12 preservation

When repository content carries Smithson 8S Coupled Mechanics metadata, Suite 40 preserves fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, projection version, tolerance profile, phase, support, interaction order, and provenance independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Context, symbol, dependency, freshness, worktree, and provenance records retain `eta_ind`, `Delta_8S`, `W`, optional `H`, latent and projected distances, tolerances, projection version, uncertainty, relation class, interaction order, source identity, and limitations when relevant.

If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`. A symbol name, dependency edge, or projected visual overlap cannot prove latent coupling. Smithson 8S remains a proposed computational framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 40 is certifiable only when:

- all six scripts match the demonstrated JA Data source profile;
- schemas, JSON datasets, validation, partitioning, queries, lineage, assertions, and emissions are complete;
- repository and worktree identities remain explicit and separate;
- Repository UI selection targets the intended input or working repository;
- context records bind exact roots, profiles, snapshots, and exclusions;
- symbol and dependency records bind exact sources and canonical interpretations;
- freshness is proven by revision and snapshot comparison rather than timestamps alone;
- worktree dirty, conflict, detached, sparse, virtual, and removed states remain visible;
- provenance is append-only, parent-complete, depth-consistent, and hash-bound;
- no repository content is executed and no repository state is mutated;
- `policy no_network` is preserved;
- deterministic replay and R12/MCRT evidence succeed; and
- Podium receipts bind every publication to exact validation and provenance.

Any unmet mandatory condition blocks admission or requires explicit partial or stale qualification.
