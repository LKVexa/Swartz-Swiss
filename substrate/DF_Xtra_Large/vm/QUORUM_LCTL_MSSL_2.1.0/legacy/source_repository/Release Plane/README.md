# JA21 Suite 43 — Release Plane

Thirteen independent JA Operations Language scripts for build gates, patch admission, generic packaging, signing readiness, rollback planning, release evidence, build jobs, transactional patch application, test gates, MSIX packaging, installer packaging, signing preparation, and rollback execution.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Corpus size declared by the attachment: 10,000 records
- Primary artifact: `DeploymentArtifact`
- Wrapper package: MSSLB
- Runtime posture: offline environment, disabled network, locked dependencies, referenced secrets, bounded resources, health checks, rollback, and reproducibility assertions

The attached corpus demonstrates operational workspaces, targets, compiler profiles, locked dependencies, offline environments, CPU and memory resources, explicit network posture, referenced secrets, services, health checks, rolling upgrades, rollback rules, MSSLB packaging, deployment assertions, and package emission.

The corpus is provisional and does not establish production JA Operations compiler execution. These `.jaops` files define deterministic operational wrappers around approved release workers. They do not themselves implement compilers, patch engines, MSIX builders, installer toolchains, certificate authorities, signing services, or deployment platforms.

## Sub-suite interpretation

The supplied labels contain overlapping operational stages. Suite 43 preserves each as a separate contract:

| Related labels | Distinction |
| --- | --- |
| Build gates / Build jobs | Build jobs perform an approved deterministic build; build gates decide whether its inputs and outputs are admissible |
| Patch application / Patch Application | Patch admission validates identity, scope, preconditions, and policy; patch application performs the approved transaction |
| Signing preparation / Signing preparation | Signing readiness validates policy, identities, and closure; signing preparation creates the hash-bound request presented to an external signer |
| Rollback / Rollback | Rollback planning creates and validates checkpoints and restoration procedures; rollback execution performs and verifies the approved restoration |
| Packaging / MSIX packaging / Installer packaging | Generic staging and manifest closure versus format-specific MSIX and installer construction |

## Files

| File | Sub-suite | Release responsibility | Operational wrapper |
| --- | --- | --- | --- |
| `43.1_Release_Plane_Build_Gates.jaops` | Build gates | Validates frozen inputs, toolchain, graph, outputs, diagnostics, reproducibility, and evidence | `ReleasePlaneBuildGates` |
| `43.2_Release_Plane_Patch_Admission.jaops` | Patch admission | Validates patch identity, target, paths, hunks, preconditions, scope, safety, and rollback readiness | `ReleasePlanePatchAdmission` |
| `43.3_Release_Plane_Packaging.jaops` | Packaging | Creates a deterministic staging manifest and format-neutral package input set | `ReleasePlanePackaging` |
| `43.4_Release_Plane_Signing_Readiness.jaops` | Signing readiness | Confirms artifact closure, digest profile, signer policy, timestamp policy, and evidence readiness without signing | `ReleasePlaneSigningReadiness` |
| `43.5_Release_Plane_Rollback_Planning.jaops` | Rollback planning | Validates restorable checkpoints, compatibility, data rules, triggers, and verification steps | `ReleasePlaneRollbackPlanning` |
| `43.6_Release_Plane_Release_Evidence.jaops` | Release evidence | Seals manifests, hashes, gates, tests, packages, approvals, signing responses, rollback, and provenance | `ReleasePlaneReleaseEvidence` |
| `43.7_Release_Plane_Build_Jobs.jaops` | Build jobs | Runs an approved, isolated, deterministic build against frozen inputs | `ReleasePlaneBuildJobs` |
| `43.8_Release_Plane_Patch_Application.jaops` | Patch application | Applies an admitted patch transactionally and verifies exact resulting hashes | `ReleasePlanePatchApplication` |
| `43.9_Release_Plane_Test_Gates.jaops` | Test gates | Qualifies build and package candidates through mandatory release test profiles | `ReleasePlaneTestGates` |
| `43.10_Release_Plane_MSIX_Packaging.jaops` | MSIX packaging | Builds and validates an MSIX candidate from an admitted staging manifest | `ReleasePlaneMSIXPackaging` |
| `43.11_Release_Plane_Installer_Packaging.jaops` | Installer packaging | Builds and validates install, launch, repair, upgrade, and uninstall behavior | `ReleasePlaneInstallerPackaging` |
| `43.12_Release_Plane_Signing_Preparation.jaops` | Signing preparation | Produces a canonical digest set and non-secret signing request | `ReleasePlaneSigningPreparation` |
| `43.13_Release_Plane_Rollback.jaops` | Rollback | Restores an exact approved checkpoint and verifies post-rollback state | `ReleasePlaneRollback` |

## Release route

```text
Frozen source snapshot
  -> patch admission
  -> rollback checkpoint
  -> transactional patch application
  -> build job
  -> build gate
  -> test gate
  -> generic package staging
  -> MSIX or installer package
  -> signing readiness
  -> signing preparation
  -> external signing response
  -> signed-artifact verification
  -> release evidence seal
  -> release or exact rollback
```

No stage may skip ahead because a file exists. Every transition requires exact identities, successful mandatory gates, current approvals, and complete evidence.

## Analytical ensemble

Each script deploys one health-checked service for every participant.

| Participant | Release Plane responsibility |
| --- | --- |
| SOPHIA | Interprets release intent, patch meaning, build target, packaging profile, signing policy, rollback trigger, evidence gaps, and candidate risk |
| CHARLOTTE | Validates source and output hashes, paths, patches, toolchains, tests, manifests, packages, capabilities, secrets policy, signing requests, rollback, provenance, and every mandatory gate |
| LANDON | Resolves exact identities, stages clean workspaces, coordinates approved workers, applies transactional changes, builds, packages, checkpoints, verifies outputs, and executes approved rollback |
| Professor | Explains changes, build graph, test outcomes, package behavior, signing boundaries, release risk, diagnostics, limitations, and repair or rollback instructions |
| Podium | Publishes source, patch, build, test, package, signing, rollback, R12/MCRT, approval, provenance, and final release receipts |

Each participant has one replica to preserve accountable ownership and deterministic evidence ordering.

No participant may modify a frozen source silently, apply a partial patch as success, suppress a failed test, package an untracked file, expose signing material, claim a prepared artifact is signed, weaken rollback, or release a product that fails its post-install UI launch test.

## Common operations contract

Every `.jaops` file independently declares:

1. `ja source 0.3`, a stable module, `use Operations`, and `policy explicit_network`.
2. A `windows-x64` target and release compiler profile.
3. Locked dependencies.
4. An offline environment and disabled network.
5. Explicit CPU and memory requirements.
6. A signing-key reference rather than embedded secret material.
7. SOPHIA, CHARLOTTE, LANDON, Professor, and Podium services with health checks.
8. One stage-specific worker with a five-second health check.
9. Rolling upgrade and rollback on health failure.
10. MSSLB packaging of the operational wrapper.
11. A reproducible-deployment assertion.
12. A uniquely named emitted package.

`policy explicit_network` means networking must be declared if ever permitted. Every Suite 43 script still specifies `environment offline` and `network disabled`; no network operation is admitted by these wrappers.

## Release transaction envelope

Every release candidate should bind:

| Field | Contract |
| --- | --- |
| `release_id` | Stable logical release identity |
| `candidate_id` | Exact immutable candidate attempt |
| `product_id` | Stable product or application identity |
| `source_snapshot_id` | Frozen repository and worktree context |
| `source_hash` | Canonical source-set digest |
| `patch_set_id` | Exact admitted patches and application order |
| `toolchain_id` | Compiler, linker, packager, validator, and worker identities |
| `dependency_lock_hash` | Exact dependency closure |
| `build_profile` | Target, configuration, features, environment, and deterministic settings |
| `test_profile` | Mandatory tests, fixtures, seeds, thresholds, timeouts, and expected failures |
| `staging_manifest_hash` | Canonical package input manifest |
| `package_profile` | Generic, MSIX, installer, architecture, language, upgrade, and capability rules |
| `unsigned_artifact_hashes` | Exact package bytes before signing |
| `signing_request_id` | Hash-bound, non-secret request identity |
| `signed_artifact_hashes` | Exact returned signed bytes |
| `signature_evidence` | Signer, certificate identity, algorithm, timestamp result, verification, and policy outcome |
| `checkpoint_id` | Exact pre-change restorable state |
| `rollback_profile` | Trigger, scope, compatibility, restoration, verification, and evidence |
| `approval_receipts` | Accountable approvals bound to exact identities |
| `r12_mcrt_refs` | Compiler and runtime evidence |
| `podium_receipt` | Final release, rejection, quarantine, or rollback receipt |

Changing any source, patch, dependency, toolchain, test, manifest, package, signing, or rollback input creates a new candidate.

## Sub-suite contracts

### 43.1 Build gates

- Validate source snapshot, patch set, toolchain, dependency lock, target, environment, capabilities, resource budget, build graph, expected outputs, and evidence requirements before execution.
- Validate exit status, diagnostics, required artifacts, hashes, reproducibility, policy receipts, and cleanup after execution.
- Keep warning, error, expected warning, suppressed-with-rationale, timeout, crash, cancelled, and indeterminate outcomes distinct.
- A produced binary does not imply a successful build.
- The gate cannot be waived by the build worker that it evaluates.

### 43.2 Patch admission

- Parses a patch as data and never executes metadata, file headers, scripts, or embedded commands.
- Binds patch hash, author or source, target snapshot, affected paths, expected preimage hashes, proposed postimage hashes, file modes, encodings, and line endings.
- Normalizes paths and rejects absolute paths, parent traversal, device paths, alternate data streams, symlink escape, archive escape, protected paths, and scope expansion.
- Detects overlapping, duplicate, contradictory, reordered, binary, generated, vendored, or unsupported changes.
- Requires a validated rollback checkpoint before consequential application.
- Admission does not mutate the target.

### 43.3 Packaging

- Builds a canonical staging manifest from admitted build outputs only.
- Records logical artifact identity, relative path, media type, architecture, size, content hash, provenance, license, dependency, retention, and package role.
- Rejects absolute or ambiguous paths, collisions, untracked files, missing dependencies, secret material, debug leakage, unexpected symbols, and nondeterministic enumeration.
- Staging order is canonical and independent of filesystem discovery.
- Generic packaging produces the format-neutral input set used by MSIX or installer packaging.

### 43.4 Signing readiness

- Confirms every unsigned artifact and manifest hash is final and immutable.
- Resolves product, publisher, package, version, architecture, certificate policy, algorithm policy, timestamp policy, and signing service profile.
- Confirms that signing is permitted for the exact release channel and artifact kind.
- Verifies that the request can be formed without exporting or logging private key material.
- Produces ready, blocked, rejected, or indeterminate status; it does not sign.

### 43.5 Rollback planning

- Identifies the exact state to restore, affected components, configuration, packages, registry or application state, user data policy, schema compatibility, and recovery objective.
- Creates or verifies checkpoints before patching, installing, upgrading, signing-state publication, or release activation.
- Declares automatic and manual triggers, stop conditions, timeouts, repair paths, verification, and evidence.
- Distinguishes application rollback from user-data downgrade; destructive data reversal requires a separate explicit policy and backup evidence.
- A rollback plan that cannot restore and verify the previous state blocks release.

### 43.6 Release evidence

- Seals source, patch, build, test, staging, package, unsigned, signing, signed, rollback, approval, and provenance identities.
- Preserves failures, warnings, retries, repairs, waivers, limitations, and residual risk.
- Generates a canonical manifest and optional software-bill-of-materials reference without substituting either for the actual artifacts.
- Links every output to the exact worker, toolchain, policy, and input hashes.
- Issues a Podium release receipt only after closure and independent verification.

### 43.7 Build jobs

- Runs only after the build gate admits the exact job.
- Uses a clean, isolated workspace with frozen inputs, locked dependencies, pinned tools, fixed environment, and bounded resources.
- Denies undeclared network, package acquisition, plugin loading, hook execution, environment inheritance, and writes outside approved output roots.
- Produces structured logs, diagnostics, exit status, output manifest, hashes, resource metrics, and cleanup receipt.
- Cache reuse requires identical source, patch, toolchain, dependency, target, policy, and configuration hashes.

### 43.8 Patch application

- Revalidates the admitted patch and current target preimage immediately before application.
- Applies all changes transactionally in declared order.
- Preserves file modes, encodings, line endings, binary identities, and rename semantics.
- Stops on the first invalid precondition and leaves the target unchanged or restores the checkpoint.
- Verifies every postimage hash and the complete resulting source snapshot.
- Any partial, offset, fuzzy, rejected, or manually repaired hunk produces an explicit non-success state and new patch identity.

### 43.9 Test gates

- Runs unit, integration, interface, accessibility, rendering, installer, launch, repair, upgrade, uninstall, security, performance, determinism, and rollback tests required by the release profile.
- Freezes fixtures, seeds, environments, ordering, thresholds, timeouts, retries, and expected failures.
- Preserves first-failure and flaky evidence.
- Fails when mandatory tests are skipped, missing, stale, indeterminate, or executed against a different artifact hash.
- Test gates are independent from build gates and package workers.

### 43.10 MSIX packaging

- Consumes only the admitted staging manifest and exact build outputs.
- Preserves package identity, publisher identity, version, architecture, executable entry points, capabilities, dependencies, assets, resource languages, file associations, protocols, and update relationships.
- Validates manifest-to-payload closure, relative paths, package layout, architecture, assets, capabilities, forbidden content, and output hash.
- Produces an unsigned MSIX candidate unless an external approved signer returns a separately verified signed candidate.
- Installation and launch behavior are verified in an isolated test environment before release.

### 43.11 Installer packaging

- Defines install, launch, repair, upgrade, downgrade policy, uninstall, rollback, reboot, cancellation, logging, language selection, and failure behavior.
- Preserves one clear product entry point and creates only declared shortcuts, file associations, protocols, services, and scheduled tasks.
- The installed application must open the intended Core Studio UI, not a source directory, application installation folder, or nested collection of folders.
- Repository UI must select the repositories supplying project inputs rather than defaulting to the application's own source repository.
- The language selector and dropdown must display complete language names without clipping.
- Install completion cannot be reported until a post-install launch smoke test confirms the actual UI shell opens and becomes responsive.
- Repair, upgrade, uninstall, and rollback tests must preserve or remove user data according to explicit policy.
- A command-window flash or background process is not evidence that the application launched successfully.

### 43.12 Signing preparation

- Recomputes canonical hashes immediately before request formation.
- Creates a request containing artifact hashes, product, publisher, version, architecture, channel, algorithm policy, certificate policy, timestamp policy, and approval receipts.
- References the signing key or signing service without reading, exporting, embedding, or logging private material.
- Sends no request under these offline wrappers; an external approved signing adapter performs signing under a separate policy.
- Treats returned signed bytes as new artifacts and verifies their identity, signatures, certificate chain, timestamp result, payload integrity, and policy before admission.
- Prepared, submitted, signed, verified, rejected, expired, revoked, and indeterminate remain distinct states.

### 43.13 Rollback

- Executes only an admitted rollback plan against the exact affected candidate and current state.
- Revalidates checkpoint integrity, restoration compatibility, authority, scope, data policy, and stop conditions.
- Stops related processes safely before replacement and restores artifacts atomically where supported.
- Verifies product version, hashes, configuration, entry points, services, UI launch, user-data policy, and health after restoration.
- Publishes restored, partially restored, failed, cancelled, quarantined, or manual-repair-required status.
- Never deletes evidence from the failed release attempt.

## Release state machine

| State | Meaning | Permitted next state |
| --- | --- | --- |
| `DRAFT` | Candidate definition incomplete | `ADMITTING`, `REJECTED` |
| `ADMITTING` | Patch, source, build, test, package, signing, and rollback inputs under review | `READY`, `BLOCKED`, `REJECTED` |
| `READY` | Exact candidate admitted for execution | `BUILDING`, `CANCELLED` |
| `BUILDING` | Approved build job active | `BUILT`, `FAILED`, `CANCELLED` |
| `BUILT` | Build outputs complete but not test-qualified | `TESTING`, `REJECTED` |
| `TESTING` | Mandatory release tests active | `QUALIFIED`, `FAILED`, `QUARANTINED` |
| `QUALIFIED` | Build and tests passed | `PACKAGING`, `REJECTED` |
| `PACKAGING` | Generic and format-specific package construction active | `PACKAGED`, `FAILED` |
| `PACKAGED` | Unsigned candidate validated | `SIGNING_READY`, `REJECTED` |
| `SIGNING_READY` | Signing policy and request closure pass | `SIGNING_PREPARED`, `BLOCKED` |
| `SIGNING_PREPARED` | Non-secret request ready for external signer | `SIGNED_RETURNED`, `REJECTED`, `EXPIRED` |
| `SIGNED_RETURNED` | Signed bytes received but not verified | `VERIFIED`, `REJECTED`, `QUARANTINED` |
| `VERIFIED` | Signed artifact and evidence pass | `RELEASED`, `CANCELLED` |
| `RELEASED` | Exact candidate admitted to the release channel | `ROLLED_BACK`, `SUPERSEDED` |
| `ROLLED_BACK` | Previous approved state restored and verified | Terminal for this release attempt |
| `FAILED` | Mandatory execution failed | `ROLLING_BACK`, `REJECTED` |
| `ROLLING_BACK` | Approved restoration active | `ROLLED_BACK`, `MANUAL_REPAIR` |
| `BLOCKED` | Missing authority, evidence, dependency, capability, or rollback | New candidate or repaired evidence required |
| `QUARANTINED` | Ambiguous security, signing, test, or integrity result | Investigation required |
| `REJECTED` | Candidate failed admission or release policy | Terminal |
| `CANCELLED` | Candidate stopped without release | Terminal |
| `SUPERSEDED` | Later release replaces this release | Terminal for new use |

No state is inferred from a filename or folder. Every transition receives an exact receipt.

## Build and test gate matrix

| Gate | Minimum evidence |
| --- | --- |
| Source | Repository, worktree, snapshot, patch set, dirty-state policy, and source hash |
| Toolchain | Compiler, linker, packager, validator, versions, hashes, configurations, and licenses |
| Dependency | Locked transitive closure, hashes, provenance, vulnerability or policy status, and offline availability |
| Build | Job identity, graph, environment, resources, exit status, diagnostics, outputs, hashes, and reproducibility |
| Unit and integration | Fixtures, seeds, expected outcomes, failures, coverage profile, and artifact identity |
| Interface | Actual UI shell launch, navigation, repository selection, editor, terminal, designer, dashboard, server controls, and recovery |
| Accessibility | Keyboard path, focus, names, contrast, scaling, localization, reduced motion, errors, and status announcements |
| Installer | Install, post-install launch, repair, upgrade, cancellation, uninstall, rollback, logs, and cleanup |
| Security | Path, archive, secret, process, plugin, network, privilege, substitution, signature, and policy checks |
| Determinism | Repeated build and package produce identical logical manifests and declared-equivalent output hashes |
| Rollback | Checkpoint integrity, trigger, restoration, UI launch, data policy, health, evidence, and manual repair |
| Evidence | R12, MCRT, manifests, hashes, approvals, failures, limitations, provenance, and Podium receipts |

## Patch transaction protocol

1. Freeze the target source snapshot and dirty-state policy.
2. Hash and parse the patch as data.
3. Validate paths, preimages, modes, encodings, line endings, binary changes, scope, and policy.
4. Detect overlaps, conflicts, dependencies, generated files, and protected targets.
5. Create and verify a rollback checkpoint.
6. Bind approval to patch hash, target hash, path set, worker, capabilities, and timeout.
7. Revalidate the current target immediately before commit.
8. Apply in a temporary or transactional staging area.
9. Verify every postimage and the complete resulting snapshot.
10. Commit atomically or restore the checkpoint.
11. Run build and test gates on the exact resulting snapshot.
12. Publish patch, result, rollback, and evidence receipts.

Fuzzy application, manual repair, or target drift requires a new patch identity and review.

## Packaging manifest

Every staged member records:

| Field | Required contents |
| --- | --- |
| Identity | Product, release, candidate, package, artifact, and version |
| Path | Canonical relative path and destination role |
| Type | Media type, executable or data classification, architecture, and format |
| Bytes | Exact byte count and content hash |
| Source | Build output identity and provenance |
| Dependency | Required runtime, framework, library, asset, configuration, or language resource |
| Policy | License, retention, privacy, execution, capability, and distribution status |
| Validation | Format, architecture, entry point, malware or security profile, and acceptance outcome |
| Evidence | Worker, toolchain, R12/MCRT, manifest, hash, and Podium receipt |

Manifest closure requires every payload member to appear exactly once and every manifest member to resolve to exact payload bytes.

## Signing boundary

Suite 43 separates four identities:

1. Unsigned artifact bytes.
2. Signing request and canonical digest set.
3. External signing operation and signer evidence.
4. Returned signed artifact bytes and independent verification.

The signing-key reference in each `.jaops` script is a symbolic secret reference matching the corpus form. It is not a key, certificate, token, or permission. Private signing material must never enter the source tree, package, log, diagnostic, Podium receipt, or chat output.

Signing preparation cannot claim a signature. A signature cannot claim trusted policy status until independent verification passes.

## Security and isolation

1. Run approved workers in clean, bounded, offline environments.
2. Pin tools and dependencies by version and hash.
3. Deny unknown executables, build hooks, package scripts, plugins, shell profiles, network access, credential discovery, and environment leakage.
4. Normalize and contain all source, staging, output, temporary, checkpoint, and rollback paths.
5. Treat source, patches, manifests, metadata, archives, installers, and signatures as untrusted inputs.
6. Apply file, byte, archive, compression, process, CPU, memory, storage, time, output, diagnostic, and log limits.
7. Reference secrets through approved providers and redact secret-adjacent values.
8. Keep signer operations outside the offline wrapper and behind explicit policy.
9. Require two-phase or transactional behavior for patch, package publication, upgrade, and rollback.
10. Preserve failures and denials; do not retry through weaker configurations.

## Determinism contract

For fixed source, patches, toolchains, dependency locks, targets, environments, build and test profiles, staging manifests, package profiles, signing policies, and rollback profiles:

1. Patch admission produces the same accepted path and hunk set.
2. Patch application produces the same source snapshot hash.
3. Build graphs, diagnostic order, output manifests, and logical artifacts are identical.
4. Test discovery, fixtures, seeds, outcomes, and aggregation are identical.
5. Package staging order, manifests, payload layout, and unsigned hashes are identical.
6. Signing preparation produces the same canonical digest set and request identity.
7. Release evidence has the same logical ordering and closure.
8. Rollback restores the same approved target state.
9. R12/MCRT replay preserves identity, policy result, relation class, tuple hash, interaction order, and Podium receipt target.

Wall-clock time, filesystem enumeration, worker scheduling, process IDs, temporary paths, log arrival order, and signing-service response timing may not influence canonical release identity.

## Validation matrix

| Class | Release Plane test | Expected result |
| --- | --- | --- |
| Positive | Clean snapshot, admitted patch, deterministic build, mandatory tests, valid package, signing evidence, rollback, and receipts | Pass |
| Negative | Stale preimage, partial patch, failed build, missing test, manifest mismatch, invalid package, signature failure, or broken rollback | Expected fail |
| Boundary | Empty patch, maximum files, largest artifact, exact version limit, timeout, storage limit, and rollback threshold | Pass or explicit boundary diagnostic |
| Build | Frozen inputs, toolchain, graph, resources, outputs, diagnostics, hashes, and reproducibility | Pass |
| Patch | Path, preimage, postimage, mode, encoding, transaction, snapshot, and rollback | Pass |
| Test | Unit, integration, UI, accessibility, installer, security, performance, determinism, and recovery | Pass |
| MSIX | Manifest, payload, identity, publisher, version, architecture, entry point, capabilities, assets, and install launch | Pass |
| Installer | Install, actual UI launch, language selection, repair, upgrade, uninstall, rollback, logs, and cleanup | Pass |
| Signing | Unsigned hash, request, signer evidence, returned bytes, signature verification, timestamp policy, and secrecy | Pass |
| Rollback | Checkpoint, compatibility, restoration, UI launch, data policy, health, and evidence | Pass |
| Security | Network, secret, path, archive, process, hook, plugin, substitution, privilege, or signature attack | Deny |
| Determinism | Repeated execution preserves logical manifests, hashes, states, and receipts | Pass |
| Recovery | Interruption at every phase restores or preserves an explicit repair state | Pass or manual-repair status |
| Certification | R12, MCRT, source, patch, build, test, package, signing, rollback, provenance, and Podium closure | Pass |

## Smithson 8S and R12 preservation

When a release carries Smithson 8S Coupled Mechanics artifacts, Suite 43 preserves fifth-coordinate meaning, latent geometry, projected geometry, semantic distance, uncertainty, projection version, tolerance profile, phase, support, interaction order, provenance, and limitations independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

Patch, build, test, package, signing, rollback, R12/MCRT, and Podium evidence retain `eta_ind`, `Delta_8S`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, tolerances, relation class, interaction order, source and output hashes, and claim limitations.

If `g5 > tol5` while `g3 <= tol3`, the relation remains `PROJECTION_ONLY`. A successful build, matching package, valid signature, or visually identical release cannot convert projected overlap into latent coupling. Smithson 8S remains a proposed computational framework, not an established physical law, proof of physical quantum entanglement, or proof that the total space is the standard sphere `S^8`.

## Acceptance gate

Suite 43 is certifiable only when:

- all thirteen scripts match the demonstrated JA Operations workspace profile;
- the environment remains offline with network disabled and dependencies locked;
- each script includes bounded resources, referenced secrets, five ensemble services, health checks, rollback, reproducibility, and a unique MSSLB package;
- patch admission and patch application remain separate, transactional, hash-bound stages;
- build jobs and build gates remain independently accountable;
- mandatory test gates run against the exact candidate;
- generic, MSIX, and installer packaging preserve manifest-to-payload closure;
- installer testing confirms the intended UI launches rather than a folder;
- signing readiness and preparation never claim or expose a signature;
- returned signed artifacts are independently verified;
- rollback planning and rollback execution restore and verify an exact approved state;
- release evidence preserves failures, waivers, limitations, hashes, approvals, and provenance;
- R12/MCRT replay succeeds; and
- Podium binds the release decision to the exact source, patch, build, tests, packages, signing evidence, and rollback state.

Any unmet mandatory condition blocks release, triggers rollback, or leaves the candidate explicitly rejected, quarantined, cancelled, or manual-repair-required.
