# 07. Grinder — DeepML Specialized Language

This package contains five independent DeepML Specialized Language 0.3 scripts:

1. **Optimization** — scores, searches, optimizes, audits, and selects candidates.
2. **Reduction** — factors and reduces workloads while auditing semantic equivalence.
3. **Repeated evaluation** — evaluates the same candidates three times and gates deterministic replay agreement.
4. **Stress analysis** — evaluates nominal, elevated, severe, and extreme bounded loads.
5. **Candidate improvement** — establishes a baseline, proposes and applies an improvement, compares the result, and promotes only audited candidates.

## Suite roles

| Layer | Responsibility |
|---|---|
| SOPHIA | Objective definition, semantic preservation, evaluation, and baselining |
| CHARLOTTE | Search, factoring, comparison, and candidate proposals |
| LANDON | Optimization, reduction, deterministic replay, bounds, and improvement execution |
| Professor | Equivalence, provenance, hash, risk, and improvement audits |
| Podium | Final selection, admission, stress gating, and promotion |

## Corpus alignment

Every script uses the corpus header `deepml specialized 0.3`, deterministic and no-network policies, unit-bearing tensors, evidence schemas with provenance hashes, pure deterministic operators, bounded calibration, validation chains, the six corpus optimization passes, `DEEPML_SPECIALIZED_R12` lowering, and `.msslb` packaging.

The scripts retain unit and constraint information through optimization. They do not execute unknown kernels, perform network access, silently change solver categories, drop constraints, or reorder reductions outside a declared tolerance.

## Suggested execution order

Run optimization, reduction, repeated evaluation, stress analysis, and candidate improvement. Each module is independently lowerable and produces its own MSSLB domain package.
