# QUORUM HARD-OPEN GATE PROTOCOL 3.1.0

## Purpose

`HARD_OPEN` means **aggressively complete the engineering and evidence necessary to make a gate true**.
It does **not** mean bypassing the gate, weakening its predicate, editing a ledger to PASS, changing an expected hash, suppressing a failed test, or setting a manual override.

The protocol converts every blocked prerequisite, SHS component, W67 item, master requirement, and G-gate into an active executable closure loop.

## Operating modes

Every gate/component exists in exactly one of these execution states:

- `CLOSED_UNANALYZED` — predicate is false and the closure path has not been decomposed.
- `HARD_OPEN_ACTIVE` — builder-addressable remediation is actively executable.
- `REPAIR_REQUIRED` — a concrete implementation/test failure was discovered; repair work is the next action.
- `EVIDENCE_REBUILD_REQUIRED` — implementation may be correct, but current-root evidence is missing/stale.
- `DEPENDENCY_CLOSED` — an upstream prerequisite must be opened first.
- `EXTERNAL_ACTION_REQUIRED` — the remaining predicate requires a genuinely non-builder principal or real external resource.
- `QUALIFICATION_ACTIVE` — implementation exists and required qualification is being executed.
- `OPEN_PASS` — the exact mechanical predicate is true on current-root evidence.
- `REFUSED` — a terminal release decision while one or more required predicates remain false.

`PENDING` is not a closure strategy. Every non-pass item must identify one of the actionable states above.

## HARD-OPEN invariant

For every builder-addressable false predicate:

```text
while predicate == false:
    identify_first_failing_atomic_term()
    identify_authoritative_owner()
    identify_missing_or_defective_artifact()
    implement_or_repair_artifact()
    build_with_authoritative_toolchain()
    execute_native_positive_tests()
    execute_negative_boundary_fault_tests()
    repair_any_failure()
    regenerate_current_root_evidence()
    rerun_inherited_regression()
    recompute_predicate()
```

The loop stops only when:

1. the predicate becomes mechanically true; or
2. the remaining term requires a non-builder party, unavailable physical hardware, external signer, independent reviewer/operator, or uninterrupted real-time soak.

Case 2 is **not PASS**. Emit `EXTERNAL_ACTION_REQUIRED` plus a ready-to-run handoff bundle.

## Dependency-chain opening

When a gate is blocked by another gate/prerequisite, do not merely report the dependency. Recursively HARD-OPEN the dependency first.

Example:

```text
G-06 UEFI boot blocked by P-04 QEMU/OVMF and P-17 native source
→ hard-open P-17
→ hard-open P-04
→ build native image
→ run boot matrix
→ repair failures
→ re-run G-06
```

The controller must operate on the dependency DAG, not in document order alone.

## Gate attack order

Within a gate, attack atomic terms in this priority:

1. missing authoritative source;
2. missing build capability/toolchain;
3. missing native execution path;
4. deterministic correctness failures;
5. security/capability/refusal failures;
6. reproducibility failures;
7. hardware/driver failures;
8. performance/accessibility/serviceability failures;
9. independent/external evidence;
10. final signing and release predicate.

## Repair discipline

A failing test produces a repair ticket containing:

- gate/component/requirement ID;
- exact failed predicate;
- command/test ID;
- observed output;
- expected output;
- source owner/path;
- suspected failure class;
- proposed smallest corrective change;
- dependencies potentially invalidated;
- candidate-root rotation requirement;
- regression suites to rerun.

Apply the smallest durable correction. If source/spec/ABI/predicate changes, rotate the candidate root and invalidate downstream evidence automatically.

## Evidence regeneration

After each successful repair:

1. rebuild the affected native artifact;
2. hash source, tools, inputs, and outputs;
3. run all component-local required tests;
4. run inherited regressions;
5. update **new** current-root evidence;
6. do not rewrite historical evidence;
7. recompute the component maturity;
8. immediately attempt the downstream gate again.

## Parallel hard-open lanes

Independent dependency branches may be worked in parallel, but a gate can open only after all required branches converge on the same current candidate root.

Recommended lanes:

- Lane A — JA21 self-hosting/compiler convergence.
- Lane B — MSSL/MCRT native authority.
- Lane C — boot/kernel/memory/userspace/IPC.
- Lane D — storage/VFS/filesystems/recovery.
- Lane E — graphics/JAXD/input/accessibility.
- Lane F — networking/security/Sovereign Link.
- Lane G — packages/update/rollback/recovery.
- Lane H — W67/master evidence closure.
- Lane I — reproducibility/supply chain/operability.
- Lane J — hardware/fuzz/security/soak/external independence.

Any source-changing lane rotates the shared root and forces dependent evidence lanes to rerun.

## External-gate hard-open behavior

For C-track / external gates, HARD_OPEN must perform **everything the builder can legitimately do before handoff**:

- freeze the exact candidate root;
- create minimal replay bundle;
- create reviewer scope and threat model;
- create external signing request and canonical attestation bytes;
- create hardware qualification scripts/matrix;
- create fuzz/fault campaign harness;
- create soak harness/telemetry schema;
- create expected-output/hash manifests;
- create independent-operator instructions;
- create evidence schemas and signature locations.

Then emit:

```text
state = EXTERNAL_ACTION_REQUIRED
builder_preparation = PASS
external_predicate = false
handoff_bundle = <path/hash>
```

Never relabel builder preparation as independent completion.

## Gate-open receipt

Every gate must emit:

```json
{
  "gate_id": "...",
  "candidate_root": "...",
  "starting_state": "...",
  "hard_open_attempted": true,
  "atomic_predicates": {},
  "repairs_applied": [],
  "tests_executed": [],
  "required_skips": 0,
  "external_actions_remaining": [],
  "final_state": "OPEN_PASS | EXTERNAL_ACTION_REQUIRED | REFUSED",
  "manual_override": false
}
```

## No-ceiling rule

Do not stop because the previous maturity was `SPECIFIED`, `IMPLEMENTED`, or `HOST1_EXECUTED`. Continue until the exact next native maturity is earned. For W67 and master requirements, continue through the full ladder to `OPERATIONAL` unless an irreducible external predicate is encountered.

## HARD-OPEN terminal principle

The goal is to make gates true by making the **system** satisfy them.

The following are prohibited:

- `--force-pass`;
- lowering test counts or thresholds after failures;
- replacing byte equality with semantic equality;
- editing expected hashes to match accidental outputs;
- counting HOST1/oracles as native;
- counting same-builder evidence as independent;
- suppressing negative tests;
- leaving a required skip hidden;
- manually increasing W67/master operational counts;
- signing a changed root with an old signature.

A gate is “hard open” only when its original exact predicate is true.
