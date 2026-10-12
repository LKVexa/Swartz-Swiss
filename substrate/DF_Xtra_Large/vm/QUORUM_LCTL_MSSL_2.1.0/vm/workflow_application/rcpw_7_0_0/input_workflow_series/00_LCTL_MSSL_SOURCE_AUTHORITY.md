# QUORUM RC-PW 7.0.0 — LCTL/MSSL Source Authority Contract

## Inputs used by this revision

This revision is designed to consume the staged project sources as authority/tooling references:

- `COLUMNED_LCTL_CORPUS_1.0.0.zip`
- `LCTL_1.6.1_RC1_COLUMNED_HYPERFEDERATED_EXECUTION_LANGUAGE.zip`
- `MSSL_WRITERS_CORPUS_1.0.0 (1).zip`
- `QUORUM_GENERIC_PROJECT_LCTL_MSSL_VIRTUAL_MACHINE_5.0.0_CANDIDATE.zip`
- supplied 8S Penteract–S³ Master Coupled Mechanics Law image

## Source-authority order

For RC-PW implementation work, apply the following order unless an explicit project specification supersedes it:

1. **MSSL semantic authority** — contracts, invariants, state meanings, policy, failure semantics, evidence obligations.
2. **Typed semantic graph / schemas** — machine-checkable state, dependency, and transition structure.
3. **Columned LCTL editable execution source** — compact executable source.
4. **Canonical LCTL after lowering and verifier PASS** — execution/verification authority.
5. **Evidence and qualification ledgers** — fresh outputs from the modified repository.
6. **Legacy/reference assets** — preserved evidence and migration input; they do not silently outrank the authorities above.

## Columned LCTL profile

When LCTL-C 1.0 is used, ordinary editable rows should conform to the eight-column shape:

`ID │ LANE │ OP │ OUT │ CTRL │ IN │ ARG │ META`

Stable/inferable semantic cells may be inherited or lowered according to the installed LCTL toolchain. A compact `.lctlc` file is not the final semantic authority merely because it parses: it must lower to canonical LCTL and pass the governing verifier before execution/verification claims are promoted.

## Required source artifacts per work package

Each work package should produce, as applicable:

- semantic contract in `.mssl`;
- editable executable source in `.lctlc`;
- lowered canonical `.lctl`;
- schemas/manifests;
- deterministic fixtures;
- positive and negative tests;
- replay receipt;
- resource/performance report;
- qualification ledger;
- hashes of source and evidence.

## Claim boundary

`OPEN`, `RUNNABLE`, or `REFERENCE PASS` is not automatically equivalent to production certification. Hardware, distributed, external adapter, security custody, long soak, independent rebuild, and production-domain claims must remain `BLOCKED` or `PARTIAL` until their own evidence exists.

## 3.0 additions

A successful parse is not an execution qualification. A successful lowering is not a runtime qualification. A successful hosted reference run is not automatically a native-VM qualification.

For each claimed native feature, preserve a trace from the MSSL semantic clause through the Columned LCTL source row(s), lowered canonical LCTL, verifier output, runtime execution output, and replay/qualification evidence.
