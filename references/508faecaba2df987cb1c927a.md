# QUORUM Track A r2 Architectural Remediation Package 3.0.0
## Deep-Execution / Proof-Oriented Edition

This package upgrades the 2.0.0 Track A remediation system into a more comprehensive execution and proof framework for reaching genuine JA21 self-hosting.

### Protected starting point

The workflow preserves the real r2 baseline:
- A1 Bootstrap Profile: `FROZEN (r2)`;
- A3 Stage-0 Seed Extension: `NATIVE_EXECUTED (r2)`;
- 22/22 programs pass on BASIC-BWVM and BOTTLE_ROCKET;
- the prior 12 r1 vectors remain regression-clean;
- A4/A5/A6/G-05 remain unearned until actual self-hosting proof exists.

### Major 3.0.0 upgrades

Version 3.0.0 expands the remediation into **31 atomic execution components (R0-R30)** and adds:
- explicit trap/exception semantics around CALL/RET and memory faults;
- a formal state-transition contract for ISA changes;
- separate address-space, allocator, and compiler-memory-budget gates;
- artifact-I/O capability security and transaction semantics;
- byte/text/aggregate semantics separated from memory implementation;
- frontend split into lexer, parser, symbols/scopes, and semantic analysis;
- backend split into IR/lowering, storage/register assignment, labels/fixups, and canonical object emission;
- an explicit deterministic-diagnostics gate;
- compiler capacity and exhaustion qualification;
- Stage-1, Stage-2, Stage-3 custody as separate gates;
- a dedicated determinism audit before convergence is accepted;
- a first-difference convergence laboratory;
- property-based and metamorphic tests in addition to example vectors;
- no-host-fallback process/file-access audit;
- two-environment reproducibility;
- adversarial/fault qualification;
- performance/resource envelopes after correctness;
- evidence closure, replay-readiness, and mechanical G-05 promotion;
- downstream Track B handoff with version/hash compatibility controls.

### Terminal objective

A4, A5, A6 and G-05 may be promoted only after the canonical compiler is authored in JA21, Stage-1→2→3 is executed with correct custody, Stage-2/3 reach an exact byte fixed point, post-Stage-1 host semantics are absent, reproducibility and adversarial qualification pass, and all current-root evidence is complete.


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
