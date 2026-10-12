# JA21 Suite 46 — Air Gap Certification and Installer Plane

Eleven independent JA Operations Language scripts for offline runtime policy, certification records, one-click setup transactions, licensing, installer integration, the Air-Gap Runtime, Certification Fabric, One-Click Setup, Multilingual Setup, the Installer, and the License System.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Corpus records: 10,000
- Primary artifact: `DeploymentArtifact`
- Package format: `msslb`
- Runtime posture: offline, network disabled, dependencies locked, reproducible release profile, health-checked services, and rollback on health failure

The attached seven-record gzip bundle was integrity-checked. Its embedded manifest identifies 10,000 JA Operations examples spanning air-gapped deployment, offline deployment, desktop installers, clean-room builds, dependency locking, target platforms, compiler profiles, services, workers, health checks, storage, secret references, MSSLB packaging, reproducibility policy, upgrade strategies, rollback rules, R12 compiler evidence, and MCRT runtime evidence.

The corpus status is `provisional-generated-not-production-compiler-validated`. These scripts define specification-level operational workspaces. Production installation and certification require a conforming JA Operations compiler, native installer host, package and signature validators, offline secret provider, platform adapters, and Podium evidence ledger.

## Files

| File | Sub-suite | Responsibility | Principal output |
| --- | --- | --- | --- |
| `46.1_Air_Gap_Certification_and_Installer_Plane_Offline_Runtime_Policy.jaops` | Offline runtime policy | Defines one enforceable offline-runtime control profile | `offline_runtime_policy.msslb` |
| `46.2_Air_Gap_Certification_and_Installer_Plane_Certification_Records.jaops` | Certification records | Produces one canonical, evidence-backed certification record | `certification_records.msslb` |
| `46.3_Air_Gap_Certification_and_Installer_Plane_One_Click_Setup_Transaction.jaops` | One-click setup transaction | Executes one bounded, atomic setup transaction | `one_click_setup_transaction.msslb` |
| `46.4_Air_Gap_Certification_and_Installer_Plane_Licensing.jaops` | Licensing | Evaluates one license text, acceptance, entitlement, or activation decision | `licensing.msslb` |
| `46.5_Air_Gap_Certification_and_Installer_Plane_Installer_Integration.jaops` | Installer integration | Binds the application, runtime, shortcuts, data roots, license, and uninstall contract | `installer_integration.msslb` |
| `46.6_Air_Gap_Certification_and_Installer_Plane_Air_Gap_Runtime.jaops` | Air-Gap Runtime | Operates and proves the complete disconnected runtime environment | `air_gap_runtime.msslb` |
| `46.7_Air_Gap_Certification_and_Installer_Plane_Certification_Fabric.jaops` | Certification Fabric | Coordinates, links, verifies, and revokes certification records | `certification_fabric.msslb` |
| `46.8_Air_Gap_Certification_and_Installer_Plane_One_Click_Setup.jaops` | One-Click Setup | Coordinates the complete user-facing setup lifecycle | `one_click_setup.msslb` |
| `46.9_Air_Gap_Certification_and_Installer_Plane_Multilingual_Setup.jaops` | Multilingual Setup | Delivers validated language selection, localized license text, progress, and diagnostics | `multilingual_setup.msslb` |
| `46.10_Air_Gap_Certification_and_Installer_Plane_Installer.jaops` | Installer | Builds and operates the native install, repair, upgrade, and uninstall host | `installer.msslb` |
| `46.11_Air_Gap_Certification_and_Installer_Plane_License_System.jaops` | License System | Coordinates offline license catalogs, acceptance, entitlement, activation, and evidence | `license_system.msslb` |

Each file is independently loadable and emits one named MSSLB package.

## Analytical ensemble

| Participant | Suite 46 responsibility |
| --- | --- |
| SOPHIA | Interprets runtime, installation, platform, locale, license, user intent, product identity, and requested lifecycle operation |
| CHARLOTTE | Validates offline closure, package identity, hashes, dependencies, signatures, resources, platform requirements, license semantics, locale coverage, setup plans, rollback, and certification evidence |
| LANDON | Enforces the air gap, applies the accepted install transaction, binds the native entrypoint, coordinates recovery, and preserves rollback and uninstall state |
| Professor | Explains prerequisites, selected options, license terms, progress, failures, limitations, recovery, and repair paths in the active locale |
| Podium | Records package and source hashes, dependency lock, policy, platform, locale, license acceptance, install plan, effects, health results, rollback, R12/MCRT evidence, and certification status |

Every script declares one service for all five participants plus one bounded worker, health-checks every service, locks dependencies, disables network access, packages to MSSLB, asserts reproducibility, and rolls back on health failure.

## Why similarly named sub-suites remain separate

- **Offline runtime policy** declares the rules for one runtime decision. The **Air-Gap Runtime** operates the complete disconnected execution environment and continuously proves those rules remain enforced.
- **Certification records** create and validate one immutable record. The **Certification Fabric** links records into a versioned evidence graph and manages verification, supersession, expiration, and revocation.
- **One-click setup transaction** is one atomic preflight/apply/verify/commit operation. **One-Click Setup** coordinates the complete user experience, including language, license, destination, repair, upgrade, launch, and receipt.
- **Licensing** evaluates one license or entitlement decision. The **License System** manages license catalogs, localized agreements, acceptance versions, offline activation, entitlements, revocation, and audit over time.
- **Installer integration** binds an already-built application and its contracts into setup. The **Installer** is the native host that performs install, repair, upgrade, uninstall, launch, and rollback.

## Common operational contract

Every file independently declares:

1. `ja source 0.3`, `use Operations`, and a stable module identity.
2. `policy explicit_network` with `environment offline` and `network disabled`.
3. A `windows-x64` target and `release` compiler profile.
4. Locked dependencies and explicit CPU/memory resources.
5. One offline secret reference.
6. SOPHIA, CHARLOTTE, LANDON, Professor, and Podium services.
7. One bounded operational worker.
8. Health checks for every service.
9. Rolling upgrade and rollback on health failure.
10. MSSLB packaging.
11. A reproducible-deployment assertion.
12. One named emitted package.

Expected compiler route:

```text
source -> parse -> operations AST -> workspace, target, dependency, secret,
service, health, upgrade, rollback, and package validation
-> offline-closure proof -> canonical R12 lowering
-> bounded native operation -> MCRT and Podium evidence
-> deterministic MSSLB DeploymentArtifact
```

## Air-gap contract

Air-gapped means more than “the network was not used during a successful test.” Certification requires:

- Network adapters, listeners, proxies, update clients, telemetry, crash uploaders, webviews, remote fonts, external license checks, and hidden package fetches are disabled or absent.
- Every binary, runtime, model, language pack, license document, dependency, schema, asset, help file, and repair payload needed for installation and execution is present locally.
- The dependency lock resolves exclusively to verified package identities and hashes.
- Time, randomness, machine identity, environment, filesystem roots, and platform probes used in reproducible decisions are explicit.
- Offline secrets are referenced through an approved local provider and never embedded in packages or logs.
- No missing resource silently triggers a network fallback.
- Test probes verify both expected local behavior and denied outbound/inbound behavior.

The offline policy is fail closed. A package cannot be certified because the machine happened to be disconnected; the runtime and installer must remain safe if a network interface later appears.

## Sub-suite contracts

### 46.1 Offline runtime policy

- Declares allowed local resources, processes, devices, IPC, storage roots, environment variables, models, plugins, and package identities.
- Denies undeclared network, remote update, telemetry, remote licensing, hidden content resolution, and unknown code execution.
- Binds every permission to a stable principal, runtime, capability, resource, effect, version, and policy hash.
- Defines startup, steady-state, shutdown, crash, repair, upgrade, and rollback checks.
- Produces a deterministic decision and redacted enforcement receipt.

### 46.2 Certification records

- Records product, version, build, installer, runtime, target, policy, dependency lock, artifact hashes, signatures, tests, environment, evidence, and decision.
- Uses canonical ordering, timestamps with declared authority, stable identities, and hash-linked provenance.
- Distinguishes modeled, statically validated, runtime tested, signed, certified, expired, revoked, and superseded states.
- A record cannot claim a stronger status than its evidence supports.
- Any artifact, policy, dependency, license, locale, entrypoint, or test change requires a new record.

### 46.3 One-click setup transaction

- Preflight, plan, consent, apply, verify, commit, launch, receipt, and rollback are explicit phases within one bounded transaction.
- One click authorizes only the displayed plan; privilege elevation remains a separate operating-system consent boundary.
- Partial installation never reports success.
- Atomic promotion prevents half-written entrypoints, manifests, services, shortcuts, or uninstall records.
- A failed verification returns to the prior known-good state or emits an explicit manual-repair requirement.

### 46.4 Licensing

- License identity, product, edition, version, locale, text hash, effective date, publisher, scope, restrictions, entitlement, acceptance, and evidence are explicit.
- Acceptance applies only to the exact license version and localized text with equivalent semantics.
- Preview, evaluation, production, commercial, educational, and other editions remain distinct.
- Offline licensing never performs hidden remote activation.
- Missing, invalid, expired, revoked, or mismatched entitlement produces a clear bounded state rather than destructive lockout or data loss.

### 46.5 Installer integration

- Product identity, display name, version, publisher, architecture, runtime, application entrypoint, icons, protocols, file associations, data roots, logs, repair source, and uninstall identity are stable.
- Repository controls open the program’s selected input or work repository, not the installed application’s source folder.
- Installation launches the intended application UI; it does not open a directory full of program files as though that were the application.
- The integrated terminal uses a persistent owned process and visible lifecycle state rather than a transient flashing command window.
- Integration verifies shortcuts, Start Menu entries, desktop option, native runner, first-launch flow, repair, upgrade, and uninstall before certification.

### 46.6 Air-Gap Runtime

- Loads only verified local binaries, models, language packs, schemas, plugins, and configuration.
- Disables hidden network, telemetry, remote content, external authentication, and remote license dependencies.
- Sandboxes unknown or untrusted input and never executes uploaded content merely to inspect it.
- Enforces CPU, memory, process, handle, filesystem, device, output, and time limits.
- Runtime probes prove denied network behavior and preserve health, logs, traces, hashes, policy decisions, and Podium evidence.

### 46.7 Certification Fabric

- Links source, build, installer, runtime, policy, license, locale, accessibility, test, signature, and release evidence using stable identities and hashes.
- Validates evidence schema, signer or issuer authority, freshness, completeness, causal order, and artifact agreement.
- Preserves contradictions, uncertainty, failures, waivers, limitations, revocations, and supersession.
- Certification gates fail closed when a required record is missing or ambiguous.
- Fabric optimization may index evidence but cannot erase, rewrite, or reorder the causal record.

### 46.8 One-Click Setup

- Presents one clear install action after preflight, locale, license, destination, component, resource, and privilege requirements are resolved.
- Supports install, repair, upgrade, modify, launch, and uninstall without exposing internal folder structures as the workflow.
- Shows deterministic progress by named phase and keeps actionable diagnostics visible.
- A successful finish offers or performs launch through the verified native entrypoint.
- Setup state is resumable or safely reversible after interruption, reboot, power loss, or health failure.

### 46.9 Multilingual Setup

- Language selection occurs before localized license, options, progress, errors, help, and receipts are presented.
- The language selector fits long language names and scripts without clipping or truncating the dropdown.
- Locale, script direction, font coverage, plural rules, number/date formats, and fallback are validated offline.
- Switching language preserves setup progress but revalidates the displayed license identity and text hash.
- Every supported locale includes accessible names, keyboard navigation, text alternatives, and equivalent critical warnings.
- Missing translations remain diagnosed and cannot silently remove a condition, consent, warning, or failure.

### 46.10 Installer

- Verifies package hash, manifest, dependency lock, signature state, target compatibility, disk space, permissions, destination, conflicts, and repair source before mutation.
- Installs the native runner, application UI, required runtimes, assets, language packs, license documents, help, and uninstall support from local payloads.
- Uses explicit absolute targets, canonical path checks, atomic writes, and rollback-safe registration.
- Never uses a broad filesystem root, unresolved variable, implicit current directory, or filename extension alone as authority.
- Launch verification confirms the intended UI process remains alive, reaches a healthy first window, and does not degrade into a file-folder view.
- Uninstall removes owned artifacts while preserving user repositories and user-created data unless separate explicit consent is given.

### 46.11 License System

- Manages license catalogs, translations, editions, entitlements, acceptance versions, offline activation records, renewals, expiration, revocation, and migration.
- Uses stable license and entitlement identities rather than mutable filenames or display text.
- License state is stored locally with integrity protection and is recoverable during repair or upgrade.
- License checks are deterministic, privacy preserving, explainable, and available without network access.
- The License System never treats missing connectivity as license failure and never expands rights from ambiguous evidence.
- Podium preserves acceptance, entitlement, policy, locale, text hash, decision, and enforcement evidence.

## Installer lifecycle

```text
verify package -> select locale -> show matching license -> preflight
-> display exact plan -> obtain OS consent -> stage -> apply
-> verify runtime and UI entrypoint -> commit -> launch -> receipt
```

Failure before commit rolls back staged effects. Failure after commit enters an explicit repair or rollback path. Success is not declared until the application’s intended UI launches through the installed entrypoint and the offline runtime reaches a healthy state.

## Certification gate

A Suite 46 package passes only when:

- Source, module, workspace, target, compiler profile, dependency lock, package, installer, runtime, entrypoint, locale, license, service, worker, health, rollback, R12, MCRT, and Podium identities are stable.
- Every required payload is local, verified, versioned, and included in the dependency closure.
- Network denial and absence of hidden network fallbacks are proven.
- Install, repair, upgrade, launch, rollback, and uninstall paths are exercised.
- The intended UI launches and remains healthy.
- Language controls are unclipped, keyboard accessible, and semantically complete.
- License presentation, acceptance, entitlement, and offline enforcement refer to the same version and text hash.
- No user repository or user-created data is overwritten, exposed, or deleted without separate explicit consent.
- Repeated builds and installations preserve canonical package and evidence identities under the declared reproducibility profile.

The plane must not invent a signature, certification result, license entitlement, network proof, successful launch, rollback receipt, or test result.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Complete local payload, valid license, supported locale, clean install, healthy UI launch, and complete evidence | Pass |
| Negative | Missing payload, hash mismatch, remote dependency, invalid entitlement, failed launch, or incomplete rollback | Expected fail |
| Boundary | Minimum disk, exact path length, longest language label, privilege boundary, exact license expiry, or resource limit | Pass or explicit boundary diagnostic |
| Integration | Installer, runtime, entrypoint, locale, license, policy, certification, and Podium identities agree | Pass |
| Security | Path traversal, DLL search-order attack, payload substitution, secret leak, unsigned mutation, or network fallback | Deny |
| Performance | Preflight, staging, verification, launch, and repair meet declared offline budgets | Pass within profile |
| Determinism | Repeated clean-room builds and setup plans preserve ordering, hashes, decisions, and canonical records | Pass |
| Interoperability | Windows target, native runner, JA runtime, MSSLB packages, locale packs, and license adapters preserve semantics | Pass |
| Recovery | Interruption, reboot, health failure, or partial prior install resumes or rolls back without data loss | Pass or explicit repair requirement |
| Certification | R12, MCRT, signatures, offline proof, license, locale, install, launch, rollback, and Podium evidence are complete | Pass |

## Optimization restrictions

Permitted optimization includes dependency-digest reuse, deterministic staging caches, parallel read-only verification, package indexing, localized resource caching, and health-probe batching when operational semantics remain equivalent.

Optimization must not skip hash or signature checks, fetch a missing resource, weaken the air gap, reorder dependent mutations, hide OS consent, auto-accept a license, clip language controls, bypass launch verification, remove rollback data, delete user repositories, suppress diagnostics, erase provenance, or change stable R12/MCRT identities.

## 8S coupling and R12 preservation

When Smithson 8S Coupled Mechanics is enabled, certification preserves latent geometry, product-state separation, projected geometry, semantic distance, uncertainty, provenance, phase, and interaction order independently:

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium evidence retain the fifth-coordinate meaning, `eta_ind`, `W`, optional `H`, `g5`, `delta8`, `g3`, `gJ`, projection version, uncertainty, provenance, interaction order, relation class, package/build/runtime/installer identity, offline proof, locale, license, launch, rollback, certification status, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`; a visually successful installer or UI launch is not proof of latent coupling, offline closure, license validity, or complete certification. Smithson 8S is treated as a proposed computational framework, not an established physical law, proof of standard `S^8` topology, or evidence of physical quantum entanglement.

## Acceptance gate

Suite 46 is certifiable only when all eleven scripts preserve offline closure, locked dependencies, stable targets, bounded resources, health-checked ensemble services, native UI launch, multilingual and accessible setup, deterministic licensing, reproducible MSSLB packaging, rollback safety, user-data preservation, complete R12/MCRT evidence, and named emitted packages.
