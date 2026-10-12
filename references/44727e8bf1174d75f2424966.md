# QUORUM Track A r2 → Exact Self-Hosting
## Master Remediation Prompt & Workflow 3.0.0

### Prime directive

Using QUORUM, convert the existing r2 Stage-0 JA21 capability into a **compiler-complete, deterministic, reproducible, self-hosting JA21 toolchain** by resolving the architectural blockers demonstrated by real execution.

Do not treat the problem as “add more syntax.” The blocker chain spans ISA control flow, flag consumption, exceptions, memory scale, allocation, artifact I/O, text/aggregate representation, compiler architecture, deterministic serialization, bootstrap custody, and reproducibility.

Every layer must become precise enough that a second clean build can reproduce the exact fixed point.

---

# 1. Protected baseline

Freeze the following as protected evidence and rerun them after every privileged change:

- r2 equality/inequality as 0/1 values;
- logical `!`;
- truthy `if`/`while`;
- 22/22 programs on BASIC-BWVM;
- 22/22 programs on BOTTLE_ROCKET;
- cross-engine result agreement;
- 12 r1 regression vectors.

Do not overwrite the original r2 evidence. Create additive evidence tied to each new candidate root.

---

# 2. Component map

```text
FOUNDATION
R0  Baseline custody and root freeze
R1  ISA CALL/RET / indirect control transfer
R2  ISA ordered comparisons
R3  Trap/exception/state-transition integration

MEMORY + I/O
R4  Native address-space architecture
R5  Native allocator/userspace memory ABI
R6  Compiler memory/capacity budget
R7  Native artifact-I/O capability ABI
R8  Artifact-I/O transaction/fault semantics

LANGUAGE
R9  Byte/text representation
R10 Bounded arrays/slices/records
R11 Bootstrap Profile r3 normative freeze

COMPILER FRONTEND
R12 Lexer
R13 Parser
R14 Symbols/scopes/functions
R15 Semantic analysis + deterministic diagnostics

COMPILER BACKEND
R16 IR/direct-lowering contract
R17 Storage/register assignment
R18 Labels/fixups/control-flow lowering
R19 Canonical object/artifact format
R20 Canonical compiler integration (A4)
R21 Compiler capacity/exhaustion qualification

BOOTSTRAP
R22 Stage-1 (A5)
R23 Stage-2
R24 Stage-3
R25 Determinism + exact convergence laboratory (A6)

QUALIFICATION
R26 Post-Stage-1 host-fallback audit
R27 Two-environment reproducibility
R28 Property/metamorphic + adversarial qualification
R29 Resource/performance envelope after correctness
R30 Evidence closure, replay readiness, G-05 promotion
```

---

# 3. Dependency constraints

- R1/R2 start after R0.
- R3 depends on R1/R2 because CALL/RET and ordered-control semantics must interact correctly with traps/state.
- R4 precedes R5; R5 precedes R6.
- R7 depends on stable memory ownership/capability conventions.
- R8 depends on R7.
- R9/R10 depend on R5 and may use R7 for test fixtures.
- R11 depends on R1-R10 and freezes the compiler-complete profile.
- R12-R15 implement the frontend against R11.
- R16-R19 implement the backend against R11.
- R20 depends on R12-R19.
- R21 qualifies the complete compiler limits before bootstrapping.
- R22→R23→R24 is strictly sequential.
- R25 cannot PASS until R24 exists.
- R26-R29 qualify the fixed point.
- R30 is the only G-05 promotion point.

---

# 4. Engineering philosophy

## 4.1 Correctness before optimization
Until R25 exact convergence:
- use bounded deterministic structures;
- prefer straightforward algorithms;
- retain trace instrumentation;
- prohibit optimization passes that introduce unstable ordering;
- prohibit performance-driven ABI changes without requalification.

## 4.2 Make nondeterminism impossible or visible
Every possible source of unstable output must be either:
- removed;
- canonicalized;
- frozen by a normative ordering rule; or
- explicitly proven irrelevant to artifact bytes.

## 4.3 Every capacity is a contract
No “large enough” assumptions. Every table/buffer has:
- a named capacity;
- rationale;
- exact-boundary positive test;
- one-over-limit deterministic refusal test;
- high-water telemetry.

## 4.4 Every ISA change has a state-transition proof obligation
For each instruction:
`pre-state + instruction + operands → post-state | deterministic trap`

The two engines must implement the same transition relation.

---

# 5. HARD-OPEN controller

For every builder-addressable false predicate:

```text
while predicate == false:
    find smallest false atomic term
    identify normative contract
    identify source owner
    create repair ticket
    reproduce failure with minimal vector
    instrument state at failure boundary
    implement smallest durable correction
    rotate candidate root if privileged semantics changed
    rebuild invalidated artifacts
    replay r1 + r2 regression corpus
    execute component positive tests
    execute boundary tests
    execute negative/fault tests
    execute property/metamorphic tests where defined
    regenerate current-root evidence
    recompute predicate
```

If a repair introduces a new blocker, insert it into the DAG with explicit dependencies rather than hiding it inside another component.

---

# 6. Proof obligations

Track A must establish at least these proof obligations:

- **PO-ISA-01:** CALL/RET transition semantics are identical across both engines.
- **PO-ISA-02:** ordered-comparison value and branch semantics are equivalent.
- **PO-TRAP-01:** invalid call/memory/control state traps deterministically.
- **PO-MEM-01:** all compiler-visible accesses are within owned regions.
- **PO-MEM-02:** allocation failure occurs before state corruption.
- **PO-IO-01:** compiler source bytes read natively equal frozen source bytes.
- **PO-IO-02:** emitted artifact bytes originate from native compiler semantics, not host transformation.
- **PO-LANG-01:** compiler data structures are representable within the frozen bounded model.
- **PO-COMP-01:** frontend accepts/rejects exactly according to r3 grammar/semantics.
- **PO-COMP-02:** backend emits canonical instruction/object representation.
- **PO-COMP-03:** capacity exhaustion is explicit and deterministic.
- **PO-BOOT-01:** Stage-1 is built by Stage-0.
- **PO-BOOT-02:** Stage-2 is built by Stage-1.
- **PO-BOOT-03:** Stage-3 is built by Stage-2.
- **PO-CONV-01:** Stage-2 and Stage-3 length/SHA/bytes are identical.
- **PO-CONV-02:** Stage-2 and Stage-3 emit identical artifacts for every frozen corpus input.
- **PO-HOST-01:** no unauthorized host semantic process runs after Stage-1.
- **PO-REPRO-01:** both clean environments reproduce the same fixed point.
- **PO-G05-01:** all required Track A terms are current-root, zero-skip, no-override.

---

# 7. Final definition of done

G-05 may PASS only when all R0-R30 obligations are satisfied or explicitly non-applicable by a frozen rule, with:
- current-root evidence;
- zero required skips;
- no hidden host fallback;
- exact Stage-2/Stage-3 convergence;
- two-environment reproduction;
- adversarial qualification;
- resource envelope recorded;
- replay bundle complete;
- `manual_override:false`.

Until then, preserve the highest genuinely earned Track A maturity and continue HARD-OPEN remediation.


## Global QUORUM invariants — immutable

1. **Protect real r2 progress.** A1 `FROZEN (r2)` and A3 `NATIVE_EXECUTED (r2)` remain earned unless a replay demonstrates a real regression.
2. **22/22 dual-engine regression floor.** Every privileged ISA/runtime/language/compiler change must replay all 22 r2 programs on BASIC-BWVM and BOTTLE_ROCKET, with the original 12 r1 programs preserved as a nested regression set.
3. **Planning artifacts do not earn gates.** Design notes, simulated target-state files, manifests, expected outputs, placeholder source, or manually edited ledgers never count as native/self-hosting evidence.
4. **HARD-OPEN execution.** Every builder-addressable false predicate triggers active remediation until it passes or an irreducible external dependency is reached.
5. **Predicate immutability.** Do not weaken thresholds, remove failing required tests, rewrite expected hashes, waive byte convergence, or convert required tests to optional after a failure.
6. **Root rotation and invalidation.** Changes to ISA, ABI, semantics, memory model, compiler capacities, artifact I/O, aggregates, object format, compiler source, required corpus, trusted seed, deterministic-output policy, or gate predicate rotate the candidate root and invalidate dependent evidence.
7. **One production authority per role.** ISA semantics, VM execution, memory, artifact I/O, JA21 language semantics, compiler frontend, compiler backend, object serialization, and bootstrap custody each have one declared authority.
8. **Dual engines are oracles, not self-hosting credit.** BASIC-BWVM/BOTTLE_ROCKET agreement is required regression/differential evidence but does not by itself establish self-hosting.
9. **Stage-0 custody ends after Stage-1.** Stage-0 can bootstrap Stage-1 only. Stage-2 must be produced by Stage-1; Stage-3 by Stage-2.
10. **Exact fixed point.** Stage-2 == Stage-3 requires equal size, equal SHA-256, direct byte-for-byte identity, and byte-identical corresponding corpus outputs.
11. **No host semantic fallback after Stage-1.** Host compilers, interpreters, code generators, serializers, or verifiers may not perform production compiler semantics after Stage-1.
12. **Deterministic fail-closed behavior.** Invalid control flow, frame corruption, bad flags, OOB memory, OOM, bad capabilities, malformed artifacts, capacity exhaustion, corrupted stages, and invalid source must produce defined stable failures.
13. **Required skip = failure.** `required_skips` must equal zero for every PASS.
14. **Current-root evidence only.** Historical receipts can support ancestry/regression analysis but not current promotion unless explicitly root-independent by frozen policy.
15. **No manual override.** Accepted records require `manual_override:false`.
16. **No hidden compiler capacity dependence.** Every compiler table/buffer capacity is declared, tested at boundary, and fails safely one step beyond the declared limit.
17. **Deterministic ordering.** Symbol, label, fixup, section, diagnostic, function, and emitted-record ordering must be specified, not emergent from host/runtime iteration order.
18. **Traceability.** Every promoted predicate maps source → build → test → evidence → decision.
