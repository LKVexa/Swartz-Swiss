# JA21 Suite 65 — Sandbox Engine

Thirty-six independent JA21 and DeepML scripts implementing the deterministic execution kernel described by the supplied Suite 65 specification.

## Purpose

The Sandbox Engine accepts an immutable bounded run contract, captures the repository and input state, constructs a confined disposable execution cell, authorizes only declared capabilities, routes approved job families, captures deterministic evidence, validates outputs, and either publishes reviewed artifacts or performs a governed rollback.

Suite 65 binds but does not replace:

- Suite 56, which owns queues, workers, and sandbox resources.
- Suite 60, which owns individual approved worker execution.
- Suite 62, which exposes LANDON Run and Run All.
- Suite 63, which supplies the sandbox and offline runtime environment.
- Suite 64, which supplies training, desktop, Android, and knowledge workers.

The engine remains:

- no-autorun;
- default-deny;
- repository-confined;
- offline by default;
- capability-gated;
- resource-bounded;
- idempotent at run and job levels;
- deterministic for identical pinned inputs and policy;
- fully observable;
- review-before-publish;
- rollback-capable;
- accepted-feedback-only for learning promotion.

## Files and language assignments

| ID | File | Native profile | Responsibility |
| --- | --- | --- | --- |
| SE-01 | `65.01_Run_Contract_Intake.jad` | JA Data | Normalize, validate, hash, and freeze the run request |
| SE-02 | `65.02_Asset_Intake_and_Inspection.deepml` | DeepML Core | Inspect uploads and asset manifests before staging |
| SE-03 | `65.03_Repository_Context_Snapshot.jad` | JA Data | Capture repository, worktree, symbol, dependency, freshness, and provenance state |
| SE-04 | `65.04_Workspace_Staging.ja` | JA Core Application | Model the confined input, staging, output, temporary, and evidence roots |
| SE-05 | `65.05_Suite_Registry_and_Dependency_Graph.jad` | JA Data | Resolve suite identities, dependencies, load order, cycles, and graph hashes |
| SE-06 | `65.06_Capability_Manifest.jasec` | JA Security Policy | Compile a minimal explicit capability allow-list |
| SE-07 | `65.07_Authorization_and_Approval_Gate.jasec` | JA Security Policy | Enforce no-autorun, approvals, action scope, and trust boundaries |
| SE-08 | `65.08_Static_Safety_and_Content_Defense.jasec` | JA Security Policy | Gate untrusted AST, paths, archives, commands, repository content, and outputs |
| SE-09 | `65.09_Network_and_Air_Gap_Policy.jasec` | JA Security Policy | Deny network by default and require explicit approval for any connection |
| SE-10 | `65.10_Resource_Budget_and_Quota.jaops` | JA Operations | Reserve and supervise bounded CPU, memory, storage, process, time, and output resources |
| SE-11 | `65.11_Job_Queue_and_Scheduler.jaops` | JA Operations | Queue idempotent jobs in deterministic dependency order |
| SE-12 | `65.12_Worker_Provisioning_and_Health.jaops` | JA Operations | Select approved workers, pin identity, and verify readiness |
| SE-13 | `65.13_HERMIT_Execution_Cell.jaops` | JA Operations | Provide the isolated disposable HERMIT execution cell |
| SE-14 | `65.14_Job_Family_Router.jasp` | JA Service and Protocol | Resolve typed job-family routes and deterministic job graphs |
| SE-15 | `65.15_JA_Record_and_Artifact_Adapter.jasp` | JA Service and Protocol | Validate and normalize JA records and artifact envelopes |
| SE-16 | `65.16_Translation_and_Build_Pipeline.ebnf` | JA Certifier Grammar | Certify detection, parsing, grammar, build, test, and provenance records |
| SE-17 | `65.17_Test_Evaluation_and_Certification_Pipeline.jate` | JA Training and Evaluation | Run positive, negative, boundary, security, regression, and release qualification |
| SE-18 | `65.18_Reconstruction_Pipeline.ja` | JA Portal Scene | Emit deterministic reconstructed scene packages |
| SE-19 | `65.19_Motion_and_Animation_Pipeline.deepml` | DeepML Motion | Produce deterministic motion, camera, and continuity evidence |
| SE-20 | `65.20_Rendering_and_VFX_Pipeline.deepml` | DeepML Animation VFX | Render approved scenes and frame states through a bounded graph |
| SE-21 | `65.21_Media_Export_Pipeline.jaops` | JA Operations | Encode and validate bounded delivery media |
| SE-22 | `65.22_UI_Preview_and_Popup_Pipeline.jaui` | JA Interface | Present approved job selection, authorization evidence, controls, and previews |
| SE-23 | `65.23_Model_Provider_and_DeepML_Pipeline.deepml` | DeepML Core | Run deterministic approved local-model inference |
| SE-24 | `65.24_Visual_Feedback_and_Bounded_Correction.jate` | JA Training and Evaluation | Compare visual targets and stop corrections at declared bounds |
| SE-25 | `65.25_Runtime_Events_Logs_and_Diagnostics.jaa` | JA Agent | Capture runtime events, streams, exit status, errors, resources, and diagnostics |
| SE-26 | `65.26_Checkpoint_Retry_and_Recovery.jaops` | JA Operations | Checkpoint, classify failures, retry finitely, replace cells, and restore safely |
| SE-27 | `65.27_Archive_Provenance_and_Filing.jad` | JA Data | File canonical artifacts, hashes, validation, review, release, and rollback evidence |
| SE-28 | `65.28_Diff_Patch_and_Review.ja` | JA Core Application | Model bounded diffs, impact, risk, approval, and rollback before integration |
| SE-29 | `65.29_Release_Installer_and_Air_Gap_Certification.jaops` | JA Operations | Gate release packaging, installer preparation, and offline certification |
| SE-30 | `65.30_LANDON_Run_and_Run_All_Control.jaa` | JA Agent | Govern Run, bounded Run All, pause, cancel, review, and integration |
| SE-31 | `65.31_Professor_Proposal_and_Action_Cards.jaa` | JA Agent | Produce complete non-executing proposals and action cards |
| SE-32 | `65.32_Podium_Authorization_and_Dispatch.jaa` | JA Agent | Authorize exact scope, route, schedule, and record dispatch |
| SE-33 | `65.33_SOPHIA_Evaluation_and_Accepted_Learning.jate` | JA Training and Evaluation | Evaluate evidence and admit only verified accepted Professor feedback |
| SE-34 | `65.34_CHARLOTTE_Construction_and_Inspection.jaui` | JA Interface | Construct and inspect approved outputs with explicit review labels |
| SE-35 | `65.35_Localization_Accessibility_and_Large_File_Windows.jaui` | JA Interface | Present localized, accessible, bounded large-file windows |
| SE-36 | `65.36_Final_Validation_and_Compatibility_Report.jad` | JA Data | Synthesize hashes, gates, evidence, risks, rollback, and publication eligibility |

## Native profile map

| Language | Header or declaration | Extension | Files |
| --- | --- | --- | ---: |
| JA Agent Language | `ja source 0.3`, `use Agent` | `.jaa` | 4 |
| JA Core Application Language | `ja source 0.3`, `use Core` | `.ja` | 2 |
| JA Data Language | `ja source 0.3`, `use Data` | `.jad` | 5 |
| JA Interface Language | `ja source 0.3`, `use Interface` | `.jaui` | 3 |
| JA Operations Language | `ja source 0.3`, `use Operations` | `.jaops` | 7 |
| JA Security Policy Language | `ja source 0.3`, `use Security` | `.jasec` | 4 |
| JA Service and Protocol Language | `ja source 0.3`, `use Service` | `.jasp` | 2 |
| JA Training and Evaluation Language | `ja source 0.3`, `use Training` | `.jate` | 3 |
| JA Certifier Grammar | `ja certifier 0.3` | `.ebnf` | 1 |
| JA Portal Scene Language | `ja portal.scene 0.3` | `.ja` | 1 |
| DeepML Core Language | `deepml core 0.3` | `.deepml` | 2 |
| DeepML Motion Animation Language | `deepml motion 0.3` | `.deepml` | 1 |
| DeepML Animation VFX Language | `deepml vfx 0.3` | `.deepml` | 1 |

## Corpus provenance

The scripts use the attached corpora locally rather than reading them through Library.

Three current uploads ended early during gzip validation:

- `02-DeepML_Animation_VFX_Language_Coupling_Mechanics_Corpus.jsonl.gz`
- `04-DeepML_Language_Coupling_Mechanics_Corpus.jsonl.gz`
- `10-JA_Certifier_Grammar_Coupling_Mechanics_Corpus.jsonl.gz`

Each truncated file was byte-compared against a complete same-named corpus already present from earlier Suite work. Each was an exact prefix of the complete gzip, so the complete equivalent was used. The other ten assigned current corpora passed `gzip -t` directly.

| Effective corpus | SHA-256 |
| --- | --- |
| DeepML Animation VFX | `77a85f606f073a62a09f117a0432af308ca20e1ba442f5d82f465ce47b056360` |
| DeepML Core | `3717f6d4aec108349196fbb59e3ad3a5d93f98733507ee650688b88391983c71` |
| DeepML Motion | `66a3f68e10ce0477b14cfe6fd5f34d3403abcc8a11f91741c1b636ebc619bfe2` |
| JA Agent | `7ab6d295c4681d6eb82dd97439b217997e95c95a287b95bd5e2b6c66734c4518` |
| JA Certifier Grammar | `5708e14835751747576c0ec11e0a2df2b3b1f6b028aff772104270731a6efa56` |
| JA Core Application | `f5efae94b6e1f476ec472676535ce6a4b5553143334c7321542bdbc295fe7922` |
| JA Data | `587861f8ebb4d38470488e5c93b75c748ca2302c3f9038bfd26370b67868fb98` |
| JA Interface | `d09e6a78d1876638fdd118432d07c53dbd23f6cb732f448fb390cf0fe380a433` |
| JA Operations | `1d6adfba1fd13f165068a1860ba9ff103cb9ec27ed9bff275b56b30708431c3f` |
| JA Portal Scene | `0f23c7b5a3da9c0fdc7eb8f6a5e7e50a943474fe77bb77d7c6c384cbda21400d` |
| JA Security Policy | `fd10031bb6d8cf7ad0a758cfad2225cadd8e0926d8905f59fd353eaa341bdf11` |
| JA Service and Protocol | `7c2a60c9fe02f12518a147734db3ff5e1f7e555b13692055cd4e134cd8d25480` |
| JA Training and Evaluation | `bf3666fba75cdb5b7f89be76eef90a12c8b06fd50bd85244f3745fc3c1695b3a` |

The JA Agent, Core, Data, Interface, Operations, Security, Service, and Training manifests identify 10,000-record, `0.1.0-provisional`, `ja-kernel-0.3` corpora with status `provisional-generated-not-production-compiler-validated`. The DeepML, Portal Scene, and Certifier corpora identify 10,000-example profile corpora at language level `0.3`. These scripts are therefore specification-level artifacts, not proof of production compiler or runtime acceptance.

## Separation of duties

| Component | Binding responsibility | May do | Must not do |
| --- | --- | --- | --- |
| SOPHIA | Observe, understand, reason, evaluate, and learn | Evaluate feasibility, policies, outputs, evidence, and accepted feedback | Execute jobs, grant authority, publish, or promote rejected feedback |
| CHARLOTTE | Construct, render, inspect, and improve | Build staged artifacts, previews, scenes, render plans, and review findings | Bypass Podium authorization, widen scope, or publish unreviewed changes |
| LANDON | Author, control, review, and integrate | Display state, govern runs, review proposals, pause, cancel, and integrate approved outputs | Conceal evidence, silently widen scope, or bypass approval |
| Professor | Explain and propose | Explain architecture, produce plans, reviews, and complete action cards | Silently execute commands, authorize, or modify repository files |
| Podium | Authorize, route, schedule, and recover | Validate action cards, authorize bounded work, schedule jobs, and invoke recovery | Invent capability or approve an incomplete contract |
| HERMIT | Execute inside isolation | Run the exact authorized job with the exact capability and resource set | Expand scope, alter policy, authorize itself, or publish directly |

Binding sequence:

```text
Professor proposes
  -> Podium authorizes and schedules
  -> HERMIT executes
  -> LANDON displays and governs
  -> SOPHIA evaluates
  -> CHARLOTTE constructs and inspects
  -> LANDON reviews
  -> Podium records the terminal decision
```

## Canonical state machine

```text
DRAFT
  -> PROPOSED
  -> AUTHORIZED
  -> QUEUED
  -> STAGING
  -> READY
  -> RUNNING
  -> VALIDATING
  -> REVIEW_REQUIRED
  -> APPROVED
  -> PUBLISHED

Any applicable active state may transition to:
  -> PAUSED
  -> CANCELLED
  -> FAILED
  -> RECOVERING
  -> ROLLED_BACK
  -> QUARANTINED
```

State rules:

1. `DRAFT -> PROPOSED` requires a complete Professor action card.
2. `PROPOSED -> AUTHORIZED` requires Podium policy approval and human approval when declared.
3. `AUTHORIZED -> QUEUED` requires a resolved route, capability manifest, budget, hashes, and idempotency key.
4. `STAGING -> READY` requires immutable input capture, repository confinement, and a clean cell attestation.
5. `RUNNING -> VALIDATING` requires a terminal worker result with streams, exit code, times, resource use, and output inventory.
6. `VALIDATING -> REVIEW_REQUIRED` requires all mandatory validation suites to terminate.
7. `REVIEW_REQUIRED -> APPROVED` requires the configured review.
8. Only `APPROVED` may become `PUBLISHED`.
9. Failed safety, security, provenance, hash, or output gates become `QUARANTINED`.
10. Recovery creates a clean cell and never reuses a mutable failed cell.

## Canonical run contract

Every execution begins with one immutable `SandboxRunContract`.

| Field | Required invariant |
| --- | --- |
| `run_id` | Unique and immutable |
| `idempotency_key` | Same key plus same contract resolves to the same logical run |
| `requested_by` | Authorized local principal |
| `intent` | Human-readable bounded objective |
| `job_family` | One approved family unless bounded Run All is authorized |
| `entry_suite` | Exact suite identity resolved from the registry |
| `inputs` | Immutable content-addressed references |
| `repository_root` | Confined path with no escape |
| `output_contract` | Exact formats, locations, schemas, limits, and validators |
| `capabilities` | Explicit allow-list; empty is valid |
| `network_policy` | Deny by default; any exception is endpoint-, purpose-, and time-bound |
| `resource_budget` | CPU, memory, storage, process, wall-time, log, and output bounds |
| `retry_policy` | Finite attempt count and bounded backoff |
| `approval_policy` | Human and automated gates |
| `release_policy` | Evidence-only, reviewed artifacts, or release candidate |
| `expected_hashes` | Required when inputs, tools, models, or workers are pinned |
| `locale` | Default presentation and diagnostic locale |
| `accessibility_profile` | Required for user-facing results |
| `contract_hash` | Canonical hash of the complete normalized contract |

There is no undeclared input, undeclared output path, ambient network, unrestricted shell, mutable source input, infinite retry, unbounded recursion, unbounded fan-out, or publication without evidence and review.

## Job-family routes

| Job family | Primary sub-suite | Mandatory companions |
| --- | --- | --- |
| `translation` | SE-16 | SE-08, SE-15, SE-17, SE-25, SE-27 |
| `build` | SE-16 | SE-06, SE-08, SE-10, SE-17, SE-25, SE-27 |
| `test` | SE-17 | SE-10, SE-12, SE-13, SE-25, SE-27 |
| `evaluation` | SE-17 + SE-33 | SE-08, SE-25, SE-27, SE-36 |
| `reconstruction` | SE-18 | SE-02, SE-15, SE-23, SE-24, SE-27 |
| `motion` | SE-19 | SE-18, SE-23, SE-24, SE-27 |
| `rendering` | SE-20 | SE-18, SE-19, SE-23, SE-24, SE-25 |
| `media_export` | SE-21 | SE-08, SE-17, SE-27, SE-36 |
| `ui_preview` | SE-22 | SE-34, SE-35, SE-36 |
| `model_inference` | SE-23 | SE-06, SE-09, SE-10, SE-17, SE-25 |
| `visual_correction` | SE-24 | SE-17, SE-20, SE-33, SE-34 |
| `patch_review` | SE-28 | SE-07, SE-08, SE-31, SE-33, SE-34 |
| `packaging` | SE-29 | SE-08, SE-17, SE-27, SE-36 |
| `run_all` | SE-30 + SE-32 | Every selected route plus global SE-01 through SE-13 and SE-25 through SE-27 |

## Run All semantics

Run All is bounded orchestration, not unrestricted fan-out.

1. The action card lists the exact selected suites.
2. Podium authorization covers that exact set and its derived dependencies.
3. SE-05 resolves the dependency graph and rejects cycles unless a declared cycle policy resolves them.
4. Execution proceeds in topological waves with bounded parallelism.
5. SE-10 reserves and rechecks the budget before every wave.
6. SE-11 orders each wave deterministically.
7. Every wave validates before its dependents are released.
8. A failed required job stops dependent work and invokes SE-26.
9. SE-36 synthesizes the terminal Run All report.

Deterministic fan-in uses dependency order, suite number, sub-suite ID, job ID, artifact logical name, then content hash as the final tie-breaker.

## Capability model

All capability families default to denied.

| Capability | Scope requirement |
| --- | --- |
| `repository.read` | Exact confined paths |
| `repository.write_staging` | Staging worktree only |
| `repository.apply_patch` | Approved unified diff only |
| `process.execute` | Approved executable and argument template |
| `shell.approved_command` | Command-policy allow-list |
| `network.connect` | Endpoint, protocol, purpose, approval, and expiry |
| `archive.read` | Bounded depth, size, count, and normalized paths |
| `artifact.write` | Declared output roots and media types |
| `model.invoke` | Approved local provider, model hash, and budget |
| `renderer.invoke` | Approved renderer and output contract |
| `package.create` | Approved format and release policy |
| `signing.prepare` | Preparation only unless separate signing authority is granted |
| `learning.record` | Evidence record only |
| `learning.promote` | Verified accepted Professor feedback only |

Capability expansion after authorization is forbidden. A wider requirement creates a new proposal, contract revision, hash, and authorization decision.

## Isolation and path policy

The execution cell exposes only:

```text
/run/contract/      read-only normalized contract
/run/input/         read-only content-addressed inputs
/run/repository/    confined staged worktree
/run/output/        declared artifact roots
/run/temp/          quota-bound disposable scratch
/run/evidence/      append-only event and provenance records
```

Rejected paths include host paths not mapped by the contract, parent traversal, unresolved symlink or junction escapes, device files, undeclared alternate data streams, archive entries outside the extraction root, input writes, and output outside the declared roots.

## Failure, retry, and rollback

| Failure class | Default result | Retry rule |
| --- | --- | --- |
| Invalid contract | Reject before authorization | No |
| Missing approval | Pause in `PROPOSED` | No automatic retry |
| Capability denied | Quarantine | New action card |
| Static safety failure | Quarantine | Corrected inputs only |
| Worker unavailable | Rebind an approved healthy worker | Bounded |
| Resource limit exceeded | Terminate the cell and preserve evidence | New authorization for a wider budget |
| Deadline exceeded | Terminate and preserve checkpoint | Only if the contract allows |
| Tool crash | Replace the cell and resume from a verified checkpoint | Bounded |
| Output schema failure | Quarantine output evidence | Corrective pass only if authorized |
| Hash mismatch | Quarantine and invalidate descendants | No automatic retry |
| Security or injection finding | Stop the branch and quarantine | New reviewed contract |
| Review rejected | Roll back or retain evidence only | New proposal |
| Packaging failure | Preserve reviewed artifacts; do not release | Bounded |

Every attempt receives a new cell ID and attempt number. Prior streams, exit status, resources, artifacts, and decisions remain immutable. Retry never widens capabilities or budgets.

## Required terminal evidence

Every terminal run emits:

1. Normalized run contract and contract hash.
2. Idempotency record.
3. Professor action card.
4. Podium authorization decision.
5. Repository and input snapshot manifest.
6. Suite registry and dependency graph.
7. Capability manifest.
8. Network policy.
9. Resource reservation and actual use.
10. Worker, model, renderer, and toolchain identities.
11. Immutable state-transition ledger.
12. Stdout, stderr, exit codes, events, warnings, and errors.
13. Checkpoint and retry ledger.
14. Artifact inventory and hashes.
15. Test and evaluation results.
16. SOPHIA evaluation.
17. CHARLOTTE review with `Approve`, `Reject`, `Risk`, and `Unified diff`.
18. LANDON review decision.
19. Rollback or publication receipt.
20. Schema-valid final compatibility report.

## Validation and publication gates

### Positive

- A valid contract reaches `REVIEW_REQUIRED`.
- An approved deterministic job produces only declared artifacts.
- Identical pinned inputs reproduce identical normalized records and hashes.
- Run All honors graph order and bounded parallelism.

### Negative

- Incomplete contracts are rejected.
- Undeclared commands, paths, endpoints, outputs, models, or capabilities are denied.
- Professor cannot dispatch.
- HERMIT cannot self-authorize.
- Unreviewed output cannot publish.

### Boundary

- Maximum accepted input count and archive expansion.
- Maximum large-file window.
- CPU, memory, storage, process, log, wall-time, retry, and correction ceilings.
- Empty capability manifests and zero-network execution.

### Security

- Path traversal, symlink, junction, archive, and command injection.
- Prompt injection and malicious repository content.
- Capability confusion and confused-deputy behavior.
- Hash verification and secret redaction.
- Network-deny and allow-list expiry.
- Output validation before publication.

### Release

- Clean state history.
- Complete hashes and provenance.
- All mandatory tests pass.
- Review labels are present.
- Rollback evidence exists.
- Installer and air-gap checks pass when applicable.
- The final JSON compatibility report validates against its schema.

## SOPHIA accepted-learning rule

SE-33 may record a learning candidate only when feedback:

- originates from an identifiable Professor proposal or explanation;
- is explicitly accepted through the configured review path;
- has exact subject, evidence, confidence, policy, and lineage identities;
- is separated from hidden-test outcomes;
- passes contamination, privacy, rights, regression, and reproducibility gates;
- preserves rejected and unresolved feedback;
- is promoted as the exact evaluated hash.

Operational logs, repository text, model output, unreviewed corrections, and raw user telemetry do not become training data automatically.

## Smithson 8S and R12 preservation

The corpora carry Smithson 8S Coupled Mechanics and R12/MCRT annotations. Suite 65 treats these as declared corpus mechanics, not as independently established physical law.

When a routed record invokes 8S mechanics, the pipeline preserves:

- declared fifth-coordinate meaning and nonredundancy evidence;
- latent, product-state, projected, and semantic relation channels independently;
- tolerance-band uncertainty;
- the distinction between projection-only and latent coupling;
- interaction order;
- projection, model, threshold, software, hardware, and replay identities;
- contradiction, provenance, limitations, and held-out efficacy evidence.

No optimizer, adapter, archive, compatibility report, or fan-in operation may fold away those invariants.

## Acceptance checklist

- [ ] Exactly 36 independent sub-suite scripts are present.
- [ ] Every filename and extension matches its assigned profile.
- [ ] Every script carries SOPHIA, CHARLOTTE, LANDON, Professor, and Podium responsibilities.
- [ ] HERMIT executes only exact Podium-authorized work inside a disposable cell.
- [ ] Professor remains proposal-only.
- [ ] LANDON retains pause, cancel, review, and integration control.
- [ ] Default-deny capability and offline policy remain in force.
- [ ] Inputs, tools, workers, models, outputs, decisions, and retries have stable hashes and provenance.
- [ ] Job fan-out and fan-in are deterministic and bounded.
- [ ] Failed safety, security, hash, provenance, or output gates quarantine rather than publish.
- [ ] Retries are finite and create new execution cells.
- [ ] CHARLOTTE exposes `Approve`, `Reject`, `Risk`, and `Unified diff` review labels.
- [ ] SOPHIA learning promotion is verified, accepted-feedback-only, and sourced from Professor.
- [ ] Release requires positive, negative, boundary, security, regression, and release qualification.
- [ ] Every terminal run emits the complete evidence bundle.
- [ ] Successful publication requires a schema-valid SE-36 compatibility report.
