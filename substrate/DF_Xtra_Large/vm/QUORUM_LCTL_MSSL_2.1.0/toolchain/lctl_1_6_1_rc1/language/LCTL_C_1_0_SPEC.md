# LCTL-C 1.0 — Compact Column Language

LCTL-C is the lean source form of LCTL 1.6.1. It reduces the executable row surface from the canonical 18-cell QTUPLE to 8 source columns while preserving canonical LCTL as the verification and execution authority.

## Design law

> Write only what changes. Infer or inherit what is stable. Lower everything before authority is claimed.

LCTL-C never bypasses the canonical verifier. A `.lctlc` source is lowered to a sealed canonical LCTL/1.3 unit, then the existing parser, ownership verifier, numerical runtime, parallel planner, and evidence machinery operate on that lowered unit.

## Source skeleton

```text
LCTLC/1.0
@unit id=lctl.example.column version=1.6.1 profile=native
@defaults qspace=H basis=computational regime=exact assume=finite_dimension error=exact conf=1.0
@frame id=F0000 parent=ROOT module=lctl.example.column
ID│LANE│OP│OUT│CTRL│IN│ARG│META
D1│alloc│Q│q│_│_│2│res=logical_qubits=2
D2│alloc│C│c│_│_│2│res=classical_bits=2
C1│q0│H│q[0]│_│q[0]│_│_
C2│q0│CX│q[1]│q[0]│q[1]│_│_
M1│m│MZ│c[0]│_│q[0]│_│_
M2│m│MZ│c[1]│_│q[1]│_│_
@end
```

## Eight columns

| Column | Meaning |
|---|---|
| `ID` | Stable row identity. Never inferred. |
| `LANE` | Semantic or scheduling lane. `_` means no explicit lane. |
| `OP` | Operation or compact alias. The operation normally determines `FACE`. |
| `OUT` | Output/destination. |
| `CTRL` | Explicit control operand or classical condition source. |
| `IN` | Primary input `A`; when `B` is also required use `A›B`. |
| `ARG` | Canonical `PARAM` payload. May contain commas and semicolons. |
| `META` | Only semantic overrides that cannot be inferred/inherited. |

The `›` character is the A/B packing separator. This leaves commas free for mathematical expressions, parameter lists, Pauli expressions, and metadata payloads.

## Inherited/inferred canonical cells

LCTL-C normally removes these ten repeated cells from source rows:

`FACE`, `QSPACE`, `TYPE`, `BASIS`, `REGIME`, `ASSUME`, `ERROR`, `RESOURCE`, `CONF`, `PROOF`.

They are reconstructed by operation semantics, `@defaults`, and compact `META` overrides.

## META keys

Compact keys are preferred:

- `f=` face override
- `qs=` QSPACE
- `t=` TYPE
- `basis=` BASIS
- `r=` REGIME
- `asm=` ASSUME
- `err=` ERROR
- `res=` RESOURCE
- `c=` CONF
- `p=` PROOF

Values containing semicolons, spaces, quotes, or embedded `=` should be quoted.

Example:

```text
M1│m│MZ│c[0]│_│q[0]│_│res="shots=runtime"
```

## Operation inference

The compiler infers `FACE` from the canonical operation family:

- `QREG`, `CREG`, `QUBIT` → `DECL`
- quantum/classical executable operations → `CODE`
- `REGION`, `DEPENDENCY`, `COMM_MODEL`, ... → `PARALLEL`
- partition/message/ownership metadata → `DISTRIBUTED`
- node/link/device/calibration metadata → `TOPOLOGY`
- teleport/EPR/remote-gate metadata → `PROTOCOL`
- memory operations → `MEMORY`
- failure operations → `FAILURE`
- calculus transforms → `TRANSFORM`
- assertion operators → `ASSERT`

Ambiguous operations remain explicit with `f=...` in `META`.

## Canonical lowering

Each compact row lowers to:

```text
ROW¦FACE¦LANE¦QSPACE¦OP¦OUT¦CTRL¦A¦B¦PARAM¦TYPE¦BASIS¦REGIME¦ASSUME¦ERROR¦RESOURCE¦CONF¦PROOF
```

The lowerer generates canonical frame and bundle SHA-256 seals. The lowered source is then parsed by the pre-existing canonical verifier. Therefore LCTL-C is syntactic compression, not semantic weakening.

## Determinism

With the same compact source and compiler generation:

- inferred cells are deterministic;
- row order is preserved;
- IDs are preserved;
- canonical frame seals are deterministic;
- canonical bundle seals are deterministic;
- execution still obeys the selected LCTL deterministic mode.

## File extension

Preferred source extension: `.lctlc`.

Canonical lowered extension: `.lctl`.
