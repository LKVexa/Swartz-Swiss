# QUORUM BASIC_MSSL SHS2 → Fully Operational Native VM/OS
## Master Prompt & Workflow 3.0.0

### Authoritative objective

Using QUORUM, transform the reconstructed `BASIC_MSSL_VM_3.0.0_SHS2` candidate into a genuinely **fully operational native self-hosting VM/OS**. Do not optimize for a passing label. Implement the missing native system, collect current-root evidence, qualify it mechanically, and preserve refusal whenever a requirement is not actually proven.

The workflow must earn two nested release levels in sequence:

1. **OPERATIONAL_SELF_HOSTING_SYSTEM**
2. **FULL_WIDTH_VM_OS_OPERATIONAL**

The second level may not be inferred from the first.

### Phase architecture

**Phase 0 — Reassembly, root reconciliation, and evidence reset**
- Reassemble the two SHS2 parts in the verified order.
- Verify fragment hashes, combined hash, 4,470-entry archive integrity.
- Preserve inner roots (`58a39492…`, older provenance roots) as historical.
- Freeze a new current candidate root for actual remediation.
- Open a fresh root-bound component ledger.

**Phase 1 — Complete Track A self-hosting**
- Freeze compiler-complete JA21 Bootstrap Profile.
- Implement capability-mediated native artifact I/O.
- Extend Stage-0 seed only as necessary.
- Re-express canonical compiler in JA21.
- Build Stage-1, Stage-2, Stage-3.
- Require Stage-2 == Stage-3 by length, SHA-256, and bytes.
- Require byte-identical corpus outputs.
- Prove no post-Stage-1 host fallback.
- Rebuild in a second clean environment.
- Run adversarial compiler qualification.

**Phase 2 — Complete Track B native MSSL/MCRT**
- Freeze complete MSSL execution semantics for the frozen corpus.
- Implement native JA21 MSSL loader, parser, κ/SHA-256 verifier, and execution engine under `src/mssl/`.
- Implement native canonical MCRT codec/compatibility layer under `src/mcrt/`.
- Wire JA21/MSSL/MCRT through a versioned ABI.
- Build them with the converged JA21 compiler.
- Remove legacy verifier/runtime from the production trusted path.
- Re-run full positive/negative/mutation qualification.

**Phase 3 — Create the native operating-system foundation (P-17)**
Populate the authorized `src/*` boundaries with reviewed JA21-native implementation in dependency order:
- architecture/CPU state and wide execution;
- boot/UEFI;
- kernel entry and isolation;
- physical/virtual memory and allocator;
- interrupts/time;
- scheduler/SMP;
- executable format/loader;
- Ring-3 userspace;
- syscall ABI;
- IPC;
- PID1/service manager;
- block/storage/GPT;
- VFS/filesystems/system hierarchy;
- device discovery/input/USB;
- graphics/compositor/window manager;
- native JAXD;
- networking/policy/Sovereign Link;
- security/capabilities/cryptography;
- PSE67 sidecar separation;
- package/install/update/rollback/recovery;
- power/time/debug/logging;
- SDK/ABI compatibility.

For every subsystem: specification → implementation → native build → native execution → positive/negative/fault qualification → root-bound evidence. HOST1 remains an oracle only.

**Phase 4 — Build deterministic native image and verified UEFI boot**
- Provision pinned QEMU + OVMF qualification tooling.
- Build BOOTX64.EFI and deterministic GPT/system image.
- Boot only native artifacts.
- Exercise cold boot, warm reboot, shutdown, failure recovery, corrupted image, bad signature, downgrade, interrupted update.
- Prove entry into native kernel, Ring-3 userspace, PID1, storage, IPC, and JAXD shell.
- Close G-06 only from boot evidence.

**Phase 5 — Native kernel/userspace/storage/JAXD closure**
Close G-03, G-04, G-07, G-08, G-09, G-10, G-12, G-13 by native execution:
- full-width state and ISA semantics;
- isolation/interrupts/SMP;
- userspace/syscalls/IPC/services;
- block/VFS/filesystem and power-loss recovery;
- native JAXD launch/render/input/accessibility/shutdown;
- air-gap + Sovereign Link enforcement;
- install/update/rollback/recovery.

**Phase 6 — W67 61/61 operationalization**
Process W67-01 through W67-61 in frozen dependency order. Each item must advance through:
`SPECIFIED → IMPLEMENTED → NATIVE_EXECUTED → QUALIFIED → OPERATIONAL`.
A HOST1_EXECUTED item does not skip native execution.
Final W67 release distribution must be exactly:
`OPERATIONAL=61`, with all other terminal maturity buckets zero.

**Phase 7 — Master 144/144 operationalization**
Re-evaluate every A001-A144 against the actual native system. Each requirement must have:
- current-root authoritative source;
- native execution path;
- positive and negative tests;
- dependency/gate linkage;
- qualification evidence;
- independent replayability where required.
Final master distribution: `OPERATIONAL=144`.

**Phase 8 — Hardware/driver and qualification infrastructure**
- qualify on two named x86-64 physical systems with firmware/device inventories;
- implement native storage/power-loss harness;
- authoritative fuzz instrumentation;
- performance/resource instrumentation;
- accessibility matrix;
- fault injection.

**Phase 9 — Security and formal assurance**
- enumerate TCB and threat model;
- test capability isolation, privilege boundaries, parser/verifier hardening, image/update verification, air-gap/Sovereign Link;
- run fuzz/fault/adversarial campaigns;
- obtain independent security review with zero unresolved critical/high.

**Phase 10 — Reproducibility, supply chain, operability**
- two clean environment complete native rebuilds;
- byte-stable outputs where declared;
- full SBOM and provenance;
- deterministic normalized packaging;
- documented diagnostics/runbooks;
- independent operator replay using release bundle only.

**Phase 11 — 72-hour native soak**
Run an uninterrupted 72-hour acceptance window on the signed/frozen native candidate using repeated boot, self-compile, MSSL execution, storage, IPC, JAXD, update/refusal, and serviceability workloads. Any crash, hang, invariant failure, unauthorized capability event, root drift, or interruption restarts the acceptance window.

**Phase 12 — Track C independent SHS qualification**
Obtain non-builder:
- trust-diverse second implementation/check;
- security review;
- external signing authority;
- independent replay;
- two-hardware qualification evidence;
- fuzz/fault evidence;
- soak evidence.
Only then may `OPERATIONAL_SELF_HOSTING_SYSTEM` be true under the package's strict definition.

**Phase 13 — External signing and anti-rollback**
Freeze release root and immutable manifest. External authority signs canonical attestation bytes. Import detached signature/public material only. Anchor anti-rollback release sequence. Rerun signed positive-control and tamper/downgrade refusal suites.

**Phase 14 — Final VM/OS terminal gate**
Require mechanically:
- SHS operational;
- P-01/P-02/P-03/P-04/P-06/P-08/P-09/P-10/P-11/P-12/P-15/P-17 all satisfied as applicable;
- G-01 through G-17 PASS;
- W67 exactly 61/61 OPERATIONAL;
- master requirements exactly 144/144 OPERATIONAL;
- native boot/image/kernel/userspace/storage/JAXD/network/security/update paths qualified;
- two-hardware pass;
- fuzz/fault/security/performance/accessibility pass;
- two-environment native reproducibility pass;
- independent replay pass;
- 72-hour soak pass;
- external signature/anti-rollback pass;
- inherited invariants pass;
- required skips zero;
- all evidence tied to current release root;
- `manual_override:false`.

Only this conjunction may emit:

`FULL_WIDTH_VM_OS_OPERATIONAL`

Otherwise emit `REFUSED`, list every failed predicate, blocker, evidence path, current maturity, and next executable remediation.


## Global QUORUM rules

1. **Never promote from file presence.** A source file, specification, manifest, installed tool, HOST1 pass, or ledger edit is not native operational evidence.
2. **Current-root evidence only.** Historical evidence remains useful for regression/oracle comparison but never satisfies a current-root native gate unless explicitly regenerated against the current candidate.
3. **Root rotation is mandatory.** Any change to source, ABI, grammar, semantics, expected vectors, qualification thresholds, trusted seed, build tools that affect outputs, or release predicate rotates the candidate root and invalidates downstream evidence.
4. **Stage-2 == Stage-3 means exact convergence.** Require equal byte length, equal SHA-256, and direct byte-for-byte equality. Semantic similarity is insufficient.
5. **Stage-0 is bootstrap seed only.** After Stage-1 exists, the C seed may not perform production Stage-2/Stage-3 compiler work.
6. **HOST1/BOTTLE_ROCKET are differential oracles only.** They never receive native, self-hosting, independent, hardware, or final operational credit.
7. **Native authority is unique.** Production JA21, MSSL, MCRT, JAXD, boot, kernel, userspace, drivers, storage, networking, package/update, SDK, and other native roles must resolve to explicit authoritative `src/*` roots.
8. **No hidden host fallback.** Fail if native execution silently falls back to C, Go, Python, Rust, .NET, JavaScript/Node, external serializers, host-side code generation, or HOST1 semantic implementation.
9. **Network denied by default.** Network remains unavailable except through the explicitly qualified Sovereign Link/policy path or documented external signing/review transfer.
10. **Fail closed.** Malformed inputs, bad seals, unsupported versions, corrupt stages, capability violations, bounds errors, storage corruption, downgrade/tamper, and missing authority must fail deterministically.
11. **Required skips are failures.** A skipped required test cannot be counted as PASS.
12. **Independent means non-builder.** Builder-created replays, second implementations, self-review, or same-trust-domain signatures do not satisfy independence.
13. **External resource gates are real.** Two physical systems, external signing, independent review, independent replay, and a continuous 72-hour soak cannot be manufactured by a prompt.
14. **Atomic final promotion.** W67/master/gate ledgers become OPERATIONAL only from a final current-root signed evidence set; do not increment operational counts by declaration.
15. **SHS and VM/OS are distinct gates.** Operational self-hosting is necessary but not sufficient for `FULL_WIDTH_VM_OS_OPERATIONAL`.
16. **No manual override.** Every terminal record must state `manual_override:false`.
