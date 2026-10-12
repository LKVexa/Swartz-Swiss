# LCTL 1.6.1-RC1 — Columned Hyperfederated Execution Language

This package refines LCTL 1.6.0-RC1 into a leaner **LCTL-C 1.0** source language while preserving the existing Java 21 hyperfederated runtime and canonical LCTL verification authority.

## The new source shape

Canonical LCTL executable rows use 18 semantic cells. LCTL-C source uses 8 columns:

```text
ID │ LANE │ OP │ OUT │ CTRL │ IN │ ARG │ META
```

Stable or inferable semantics—`FACE`, `QSPACE`, `TYPE`, `BASIS`, `REGIME`, `ASSUME`, `ERROR`, `RESOURCE`, `CONF`, and `PROOF`—no longer need to be repeated on every ordinary row. They are inferred, inherited, or carried only when overridden.

Example:

```text
LCTLC/1.0
@unit id=lctl.example.bell.column version=1.6.1 profile=native
@defaults qspace=H basis=computational regime=exact assume=finite_dimension error=exact conf=1.0
@frame id=F0000 parent=ROOT module=lctl.example.bell.column
ID│LANE│OP│OUT│CTRL│IN│ARG│META
D1│alloc│Q│q│_│_│2│res=logical_qubits=2
D2│alloc│C│c│_│_│2│res=classical_bits=2
C1│q│H│q[0]│_│q[0]│_│_
C2│q│CX│q[1]│q[0]│q[1]│_│_
M1│m│MZ│c[0]│_│q[0]│_│_
M2│m│MZ│c[1]│_│q[1]│_│_
@end
```

## Start

Unix/macOS:

```sh
./START_LCTL_1_6_1.sh column-selftest
./START_LCTL_1_6_1.sh column-verify examples_column/01_bell_state/program.lctlc
./START_LCTL_1_6_1.sh simulate examples_column/01_bell_state/program.lctlc 256 20260810
./START_LCTL_1_6_1.sh parallel-depth examples_column/24_parallel_bell_pair_generation/program.lctlc
./VERIFY_LCTL_1_6_1.sh
```

Windows:

```bat
START_LCTL_1_6_1.cmd column-selftest
START_LCTL_1_6_1.cmd column-verify examples_column_bell_state\program.lctlc
VERIFY_LCTL_1_6_1.cmd
```

## Column commands

- `columnize SOURCE.lctl OUT.lctlc` — compress canonical source.
- `column-compile SOURCE.lctlc OUT.lctl` — lower to sealed canonical LCTL.
- `column-verify SOURCE.lctlc` — lower and run the canonical verifier.
- `column-stats SOURCE.lctlc` — report source/canonical compression.
- `column-roundtrip SOURCE.lctl` — prove canonical → column → canonical semantic equivalence.
- `column-selftest` — compact parser/compiler positive/negative campaign.

## Verified refinement

- LCTL-C compiler/parser selftest: **512/512 PASS**.
- Bundled canonical examples converted and round-tripped: **53/53 PASS**.
- Aggregate example source size: **58,857 bytes compact vs 123,330 bytes lowered canonical**.
- Aggregate reduction: **52.28%**.
- Existing LCTL 1.6 smoke verification after integration: **PASS**.
- Existing 1.6 conformance remains **1024/1024 PASS**.
- Preserved 1.5 conformance remains **512/512 PASS**.
- Preserved 1.4 baseline remains **320/320 PASS**.

## Why it is safe

LCTL-C does not become a second semantic authority. It is a compact front-end. Every compact source lowers into the existing sealed 18-cell canonical form before semantic verification or execution authority is claimed.

This keeps ownership, no-cloning, measurement causality, typed error regimes, distributed evidence, replay, and the physical-QPU firewall intact.

## Documentation

Start with:

- `language/LCTL_C_1_0_SPEC.md`
- `language/LCTL_C_ALIAS_CATALOG.md`
- `language/LCTL_C_MIGRATION_GUIDE.md`
- `language/LCTL_C_DESIGN_RATIONALE.md`
- `proof/LCTL_1_6_1_COLUMN_LANGUAGE_REPORT.md`
- `proof/COLUMN_LANGUAGE_LEDGER.json`
- `proof/COLUMN_LANGUAGE_EXAMPLE_CAMPAIGN.json`

## Qualification boundary

This remains an RC development candidate. The 1-hour, 8-hour, and 24-hour soak gates remain `NOT_RUN`. Physical parallel/distributed QPU execution and physical multi-QPU federation remain `BLOCKED_EXTERNAL_AUTHORITY`.
