# QUORUM HARD-OPEN GATE CONTROLLER 3.1.0

## Invocation

Using QUORUM, run the BASIC_MSSL full operationalization package in `HARD_OPEN` mode.

Do not merely audit blocked gates. For every builder-addressable blocker, recursively execute its remediation chain: implement missing authority, repair defective code, build, natively execute, qualify, regenerate current-root evidence, and immediately re-evaluate the gate. Continue through dependencies until the gate is `OPEN_PASS` or the only remaining term is genuinely external.

## Global closure algorithm

1. Freeze/reconcile current root.
2. Parse SHS A/B/C predicates, P-01..P-17, G-01..G-17, W67-01..W67-61, and A001..A144 into one dependency DAG.
3. Mark every false atomic predicate.
4. Topologically select the first builder-addressable false predicate.
5. Enter HARD_OPEN repair loop.
6. On repair, rotate root when required and invalidate dependent evidence.
7. Rebuild and rerun all invalidated tests automatically.
8. When a prerequisite opens, immediately retry every gate that depended on it.
9. When a W67 subsystem qualifies, immediately recompute linked master requirements and G-gates.
10. When all builder-addressable predicates pass, freeze a Native Reproducible Candidate and build external handoff bundles.
11. Process external evidence only from non-builder principals/resources.
12. Rerun the final signed positive-control and G-17 refusal suite.
13. Evaluate the full terminal predicate.

## Builder-addressable gates: no passive stop

For A1-A9, B1-B9, P-01/P-02/P-03/P-04/P-09/P-10/P-17, G-03..G-13 where implementation is in scope, W67 implementation/qualification work, and master implementation work:

**Do not return “blocked” without also creating and executing the next concrete engineering action.**

A return is allowed only after:
- the atomic blocker is fixed and the predicate passes; or
- execution is impossible because a required external principal/resource is absent.

## External gates

P-06, P-08 (when physical machines are absent), P-11 real-time soak completion, P-12, P-15, and independent portions of Track C must be prepared to handoff-ready state but cannot be self-certified.

## Closure metrics

Continuously recompute:
- SHS A/B/C pass counts;
- prerequisites satisfied;
- G-gates PASS;
- W67 maturity distribution;
- 144-requirement maturity distribution;
- native-authority coverage;
- required skips;
- current-root evidence coverage;
- external actions remaining.

Do not target percentages. Target exact terminal counts:
- W67: 61/61 OPERATIONAL;
- master: 144/144 OPERATIONAL;
- G-gates: 17/17 PASS;
- SHS: operational;
- required skips: 0;
- manual override: false.

## Final output

If all predicates pass:
`FULL_WIDTH_VM_OS_OPERATIONAL`

Otherwise:
`REFUSED`, but with every remaining false term reduced to its smallest actionable blocker and, for each external blocker, a complete handoff bundle.
