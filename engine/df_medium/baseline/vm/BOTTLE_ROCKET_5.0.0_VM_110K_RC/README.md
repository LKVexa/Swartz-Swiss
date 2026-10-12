# BOTTLE ROCKET 5.0.0 — Fully Operational VM Qualification Candidate

The BR-500 workflow has been applied to the 4.9.0 release candidate as a **production-release qualification overlay** over the frozen executable contract. Repository-local implementation and qualification are complete for the native Columned LCTL source authority, compiler, verifier, execution core, loader, persistence, Device ABI, wide-state memory, security, fuzzing, resource bounds, release engineering, evidence hashing, and reproducible local builds.

The machine-readable 5.0 ledger records **88/96 atomic requirements OPERATIONAL and 8/96 BLOCKED**. The strict gate is therefore **BLOCKED, not failed**. The remaining records require evidence that cannot be generated on this single x86-64 Linux session: independent machine/operator replay and rebuild, AArch64/Windows execution qualification, a literal 72-hour native soak, and the final 100% ledger item that depends on those proofs. No documentation or accelerated test is substituted for those requirements.

Frozen runtime contract: **LCTLC/1.1 → BRIR/1.1 → BRIM/1+BRPV/1 → BRTM/1; ISA 4.1; ABI 1.0; Device ABI 1.0; BRCR/1; BRGD/1; core ABI 0x00040700**.

Fresh measured gates: **Core-61 49,072/61,000 bytes PASS**, **BRIM-51 272/51,200 bytes PASS**, **production runtime/authority source boundary 107,675/110,000 bytes PASS**, secure execution **R2.low64=42**, unresolved CRITICAL/HIGH findings **0/0**. See `qualification/ACCEPTANCE_5_0.json`, `evidence/BR500_ACCEPTANCE.json`, `evidence/BR500_FINAL_LOCAL_QUALIFICATION.log`, `release/IMMUTABLE_RELEASE_MANIFEST.json`, and `REPRODUCE_5_0.md`.

The release manifest is Ed25519-signed by a qualification/release-engineering key whose private key is **not packaged**. This is reproducible release-integrity evidence, not a claim of production HSM/root provisioning.

---

# BOTTLE ROCKET 4.9.0 — Release Candidate & Operational Qualification

4.9.0 freezes the 4.7 runtime contract and applies the BR-490 release-candidate workflow without changing the executable formats. All repository-local work packages pass: feature/API freeze, six release profiles, production hardening, Core-61, BRIM-51, runtime-memory qualification, performance qualification, release manifests, documentation, and replay-package construction.

Measured gates: **Core-61 49,072/61,000 bytes PASS**, **BRIM 272/51,200 bytes PASS**, and **full production runtime/authority source boundary 107,675/110,000 bytes PASS**.

The strict final RC gate remains **BLOCKED 76/78**, not failed. The only remaining BR-490 requirements are the literal **72-hour soak** and a **genuinely independent second-machine/operator replay**. The included accelerated soak and local replay tools are preparation/evidence, not substitutes for those external proofs. See `evidence/BR490_ACCEPTANCE.json`, `REPRODUCE_4_9.md`, and `replay/README.md`.

---

# BOTTLE ROCKET 4.8.0 — Independent Verification, Security & Qualification

BOTTLE ROCKET 4.8.0 applies an independent-verification and hostile-qualification overlay to the 4.7.0 runtime. It intentionally preserves **LCTLC/1.1, BRIR/1.1, BRIM/1 + BRPV/1, BRTM/1, ISA 4.1, ABI 1.0, Device ABI 1.0, BRCR/1 and BRGD/1** rather than changing executable formats merely to add tests.

New qualification assets include a separate pure-Python BRIM/BRPV/BRTM implementation, differential 1,048,576-bit arithmetic, opcode/trap boundary testing, algebraic property tests, deterministic multi-surface fuzzing, sanitizer/static-analysis gates, control-flow/capability/image/rollback/persistence attack matrices, compiler/optimization reproducibility checks, an accelerated repeated-operation soak, and a written security review.

The strict 4.8.0 acceptance gate is **BLOCKED, not failed — 105/113 atomic requirements are OPERATIONAL and 8/113 are BLOCKED**: repository-local testing is green, but this execution environment cannot truthfully supply a second independent machine/operator, AArch64 execution, Windows-adapter execution, or 72 elapsed soak hours. See `security/QUALIFICATION_LIMITATIONS_4_8.md`. This lean release candidate retains safe local verification targets. Full adversarial-signing, sanitizer, and Q7 regeneration assets are intentionally segregated into the QUALIFIED candidate; neither package claims the external blockers as PASS.

---

# BOTTLE ROCKET 4.7.0 — Virtual Device I/O & Service Architecture

BOTTLE ROCKET 4.7.0 turns host I/O into a formal, discoverable, capability-gated **Device ABI 1.0** while preserving the 4.6 wide-state architecture, secure boot, transactional persistence, and executable formats. The authority chain remains **LCTLC/1.1 → BRIR/1.1 → BRIM/1 + BRPV/1 → BRTM/1** with **ISA 4.1 / ABI 1.0**. Core/compiler authority is **0x00040700** and the native image version is **9**.

## Device ABI 1.0

Eight device classes are standardized: console, persistent block storage, monotonic state, entropy, clock, mailbox, diagnostics, and optional network. Discovery is deterministic. Each descriptor declares a stable ID, required capabilities, deterministic/nondeterministic/optional/offline flags, operation count, and maximum input/output sizes. Device calls cross one validated `br_device_invoke` boundary; guest buffers are copied and bounded before reaching a host adapter.

Legacy console, storage, entropy, monotonic, timer, diagnostics, mailbox, and device-enumeration services are retained and internally routed through the Device ABI so existing service programs do not gain a second host-I/O path.

Default per-run governance is 64 device calls, 8,192 I/O bytes, 16 write-class operations, 8 entropy calls, and mailbox depth 4. Exhaustion produces typed resource/budget status rather than unbounded host activity.

## Deterministic replay

Replay mode substitutes deterministic sources for entropy, monotonic time, wall-clock time, and mailbox input while retaining the same guest-visible device contract. Console input becomes deterministic empty input. Networking is never enabled by replay substitution. Allocation representation and replay choice do not change instruction counts or ISA semantics.

## APDU and network policy

APDU commands are validated for command-specific length before dispatch. Production raw-code loading remains denied. Recovery requires an authenticated **BRCT/1 recovery control** before transactional recovery can run. Unknown instructions and malformed lengths fail closed.

No network device exists by default. The core contains no socket/DNS implementation and performs no implicit networking. A network device can only appear through explicit host registration, is marked optional/offline/nondeterministic, requires SERVICE + UPDATE authority, and remains bounded by the 512-byte network packet limit and ordinary device quotas.

## Security, persistence, and wide state

BRTM/1 still enforces the Root → Issuer → Release → Image trust chain, anti-rollback, revocation, expiry, and capability binding. BRCR/1 still provides authenticated dual-control records, candidate/previous-good recovery, first-boot confirmation, and monotonic trust sequencing; BRGD/1 remains the guest-persistence format.

The 4.6 zero/small/sparse/dense/constant wide-state descriptors, copy-on-write registers/stack, lazy scratch allocation, and 1,048,576-bit arithmetic semantics remain intact.

## Source compatibility and size discipline

To keep the complete production runtime/authority surface within the inherited 110,000-byte source ceiling, high-frequency internal C constant identifiers are compacted. Their numeric values and guest/file ABIs are unchanged. Embedders that need the historical readable C names can include `include/brvm_compat_names.h` after or instead of `src/brvm.h`.

Use `make operational` for the production acceptance gate, `make device-conformance` for the 66 Device-I/O requirements, `make device-audit` for static boundary checks, `make device-sanitize` for ASan/UBSan coverage, and `make qualification` for inherited trust/persistence/wide-state plus 4.7 device qualification.

See `spec/DEVICE_IO_4_7.md` for the readable Device ABI authority and `spec/BR_SPEC.json` for the compact machine-readable contract.
