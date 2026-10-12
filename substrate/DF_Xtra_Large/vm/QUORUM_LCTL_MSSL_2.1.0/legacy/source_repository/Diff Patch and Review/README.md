# JA21 Suite 50 — Diff Patch and Review

Six independent JA Core Application Language scripts for bounded diff production, bounded patch construction, diff review, patch review, human approval, and repository confinement.

The user supplied a suite-level behavior rather than an explicit bullet list, so the behavior was decomposed into these six independently testable sub-suites. Each file remains pure and produces a canonical JSON plan; actual repository reads, diff generation, isolated staging, patch application, testing, or rollback require separately approved adapters.

## Language profile

- Language: JA Core Application Language
- Profile: `ja.core`
- Extension: `.ja`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `CoreValue`
- Runtime posture: pure plan preparation, no network, immutable input records, typed results, deterministic JSON emission, and no hidden repository mutation

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Core Application examples spanning records, functions, results, effects, capabilities, constraints, ownership, immutable bindings, structured errors, serialization, host integration, packages, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These scripts are specification-level Core programs. Production use requires a conforming JA Core compiler plus approved repository, diff, patch, review, approval, test, executor, rollback, and Podium adapters.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `50.1_Diff_Patch_and_Review_Bounded_Diff_Production.ja` | Bounded diff production | Defines a read-only diff plan bound to repository, baseline, target, paths, and limits | `BoundedDiffPlan` JSON |
| `50.2_Diff_Patch_and_Review_Bounded_Patch_Construction.ja` | Bounded patch construction | Defines an inert patch artifact bound to its source diff and confinement profile | `BoundedPatchPlan` JSON |
| `50.3_Diff_Patch_and_Review_Diff_Review.ja` | Diff review | Defines a read-only review of the diff and affected context | `DiffReviewPlan` JSON |
| `50.4_Diff_Patch_and_Review_Patch_Review.ja` | Patch review | Defines isolated validation of a patch against an exact baseline | `PatchReviewPlan` JSON |
| `50.5_Diff_Patch_and_Review_Human_Approval.ja` | Human approval | Defines hash-bound, scoped, expiring, replay-resistant approval | `HumanApprovalPlan` JSON |
| `50.6_Diff_Patch_and_Review_Repository_Confinement.ja` | Repository confinement | Defines canonical-root confinement and effect-time path revalidation | `RepositoryConfinementPlan` JSON |

Each file is independently loadable and emits one typed JSON result.

## Analytical ensemble

| Participant | Suite 50 responsibility |
| --- | --- |
| SOPHIA | Interprets change intent, requested behavior, affected scope, expected effects, approval meaning, and repository selection |
| CHARLOTTE | Validates repository identity, baselines, targets, paths, limits, diff and patch structure, findings, tests, approval authority, freshness, replay resistance, and rollback evidence |
| LANDON | Resolves canonical repository state, produces read-only diffs, constructs inert patches, stages approved patches only in isolation, confines targets, and preserves unrelated work |
| Professor | Explains changed behavior, findings, risk, impact, consent, confinement denials, rollback, and repair paths |
| Podium | Records repository, snapshot, source, diff, patch, plan, approval, review, test, rollback, R12/MCRT evidence, and receipts |

No role may silently apply a diff, expand repository scope, fabricate a baseline, reinterpret an approval, erase review findings, or claim tests or rollback that did not occur.

## Common Core contract

Every script independently declares:

1. `ja source 0.3`, `use Core`, and a stable module identity.
2. `policy no_network`.
3. One typed immutable plan record.
4. Stable fields for the five analytical participants.
5. One pure preparation function returning `Result<Plan, Text>`.
6. No filesystem, process, network, repository, or patch-application effect.
7. One modeled sample with explicit scope, hash, limit, approval, or confinement inputs.
8. A successful typed-result assertion.
9. Deterministic JSON emission.

Expected compiler route:

```text
source -> parse -> Core AST -> record, type, function, effect, and result validation
-> canonical plan construction -> R12 lowering -> deterministic CoreValue
-> JSON plan emission -> approved adapter boundary -> Podium evidence
```

The modeled sample strings such as `required_sha256_baseline` are explicit requirements, not fabricated hashes or evidence.

## Repository identity and confinement

“Repository” means the explicitly selected input or work repository. It does not default to the installed application’s source tree.

Every operation resolves:

- Repository ID, canonical root, worktree ID, branch or detached state, snapshot, baseline, target, index freshness, and repository policy.
- Relative path, canonical path, path type, case behavior, link state, mount or device boundary, file identity, and content hash.
- Allowed file count, hunk count, line count, byte count, binary policy, rename policy, mode policy, generated-file policy, timeout, and output size.

Absolute paths, parent traversal, root escape, unsafe symlinks, hardlinks, mount transitions, device paths, ambiguous case collisions, unresolved variables, globs, and implicit current directories are denied unless a narrower explicit policy safely resolves them.

The approved root and every affected target are revalidated immediately before staging or application to resist time-of-check/time-of-use changes.

## Sub-suite contracts

### 50.1 Bounded diff production

- Requires exact repository, worktree, baseline, target, path scope, encoding, normalization, and limit identities.
- Produces a read-only unified diff with stable file headers, hunks, context, additions, deletions, renames, mode changes, binary markers, and truncation state.
- Diff order is canonical by repository-relative path and hunk position, not filesystem enumeration or completion time.
- Exceeding a declared limit yields a bounded diagnostic or explicit continuation request; content is never silently omitted.
- Producing a diff does not authorize patch construction or application.

### 50.2 Bounded patch construction

- Requires a validated diff hash and reproduces its exact bounded content in an inert patch representation.
- Binds repository, baseline, target, paths, modes, encodings, line endings, binary policy, and patch schema.
- A patch cannot add hidden paths, hunks, binaries, mode changes, or metadata absent from its source diff.
- Canonical patch hashing occurs after normalization rules are fixed.
- Constructing a patch does not apply it.

### 50.3 Diff review

- Reviews the selected diff plus the minimum affected context necessary to understand behavior.
- Prioritizes correctness, security, data loss, regressions, interface contracts, concurrency, performance, accessibility, tests, migrations, and maintainability.
- Each finding includes severity, location, evidence, consequence, and bounded remediation.
- Review is read-only; approval and application are separate.
- Absence of a finding is not proof that the diff is defect free.

### 50.4 Patch review

- Verifies patch structure, path confinement, baseline agreement, applicability, expected effects, impacted dependencies, tests, and rollback.
- Applies only in a disposable or isolated review target when application testing is separately approved.
- Stale baselines, rejected hunks, fuzzy application, unexpected offsets, out-of-scope paths, binary surprises, or hash mismatch block readiness.
- A successful isolated application is evidence, not permission to modify the selected worktree.
- Review history preserves all findings and decisions.

### 50.5 Human approval

- Binds verified approver identity and authority to exact action, repository, worktree, baseline, target, parameter, diff, patch, impact, rollback, and policy hashes.
- Includes scope, purpose, timestamp, expiry, nonce, separation of duties, and revocation state.
- Approval applies only to the displayed plan and cannot be reused after any bound input changes.
- Approval satisfies a declared requirement but cannot override an explicit policy denial or expand repository confinement.
- Self-approval, stale approval, replay, approval laundering, and ambiguous approval are denied.

### 50.6 Repository confinement

- Confines reading, staging, testing, and application to one explicit canonical work repository and approved relative paths.
- Revalidates root, worktree, baseline, targets, links, mounts, locks, and hashes immediately before effect.
- Preserves unrelated user-authored and uncommitted changes.
- Requires atomic writes or a separately validated transaction strategy.
- Rollback and cleanup may affect only artifacts owned by the current approved action.

## Canonical lifecycle

```text
select work repository -> resolve root and snapshot -> define bounded scope
-> produce read-only diff -> validate and review diff
-> construct inert patch -> review patch in isolation
-> validate effects, impact, tests, and rollback
-> obtain exact hash-bound human approval
-> revalidate repository confinement
-> hand to separate approved patch executor
```

This suite stops before patch execution. An executor must perform a fresh preflight and produce its own effect and rollback receipts.

## Diff and patch limits

Every operational profile should declare maximum:

- Repositories, worktrees, files, directories, renames, mode changes, binaries, hunks, context lines, changed lines, and total bytes.
- Per-file bytes, path length, line length, archive depth, decompression expansion, execution time, memory, output, and diagnostic count.
- Review evidence, findings, tests, approvals, retries, and rollback records.

Limits are part of the action identity. Raising a limit requires a new plan and, when effects are possible, new human approval.

## Approval and execution boundary

The Core scripts are pure. They cannot:

- Apply a patch.
- Write files.
- Launch a process or test.
- Create a commit.
- Push a branch.
- Open network access.
- Sign, package, deploy, release, or message externally.

Those effects require a separate typed adapter or executor with explicit capability, approval, repository, target, limit, test, rollback, and audit contracts.

## Admission gate

A plan is admitted only when:

- Module, record, function, repository, root, worktree, snapshot, baseline, target, path, diff, patch, review, approval, rollback, R12, MCRT, and Podium identities are stable.
- Types resolve and the function remains pure.
- Repository and path scopes are explicit, canonical, bounded, and current.
- Diff and patch hashes correspond to the same accepted content and normalization rules.
- Findings, failures, uncertainty, and limitations remain visible.
- Human approval is current, authoritative, exact, replay resistant, and unable to widen policy.
- No network, unknown-code execution, hidden filesystem mutation, root escape, secret disclosure, unapproved execution, or destructive effect occurs.

The suite must not invent a repository, baseline, target, hash, diff, patch, review finding, test result, approval, application result, rollback, or evidence receipt.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Current repository, exact hashes, bounded diff and patch, complete reviews, approval, confinement, and evidence | Pass |
| Negative | Root escape, stale baseline, malformed hunk, hidden binary, missing approval, replay, or false rollback | Expected fail |
| Boundary | Maximum files, hunks, lines, bytes, paths, findings, tests, expiry, or output limit | Pass or explicit diagnostic |
| Integration | Diff, patch, review, approval, confinement, executor, and Podium identities agree | Pass |
| Security | Path traversal, symlink race, device path, secret exposure, capability escalation, injection, or review bypass | Deny |
| Performance | Canonical comparison, diff generation, patch parsing, review lookup, and validation meet declared budgets | Pass within profile |
| Determinism | Repeated accepted inputs preserve diff order, patch bytes, review order, plan JSON, and tuple hash | Pass |
| Interoperability | Repository, diff, patch, test, approval, and rollback adapters preserve semantics | Pass |
| Recovery | Interrupted review or isolated staging resumes without duplicate effects, lost findings, or user-change loss | Pass or explicit restart requirement |
| Certification | R12, MCRT, repository, diff, patch, approval, confinement, and Podium evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes canonical file indexing, content-hash reuse, bounded parallel read-only comparison, deterministic diff algorithms, pure plan caching, and review-context reuse when all bound identities match.

Optimization must not widen path scope, follow unsafe links, skip hashes, omit hunks, accept fuzzy application, hide binaries, reorder conflict-sensitive review findings, reuse stale approval, bypass isolated review, erase provenance, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, diff and patch evidence preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, repository, diff, patch, review, approval, confinement, execution state, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; textual or visual similarity between revisions is not proof of latent coupling, semantic equivalence, patch safety, or approval. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 50 is certifiable only when all six scripts preserve no-network policy, pure typed planning, bounded diff and patch identities, read-only review, exact human approval, repository-root confinement, user-change preservation, deterministic JSON emission, complete R12/MCRT provenance, and separate execution authority.
