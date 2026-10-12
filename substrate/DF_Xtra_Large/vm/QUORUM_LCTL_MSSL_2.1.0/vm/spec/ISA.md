# QUORUM Generic VM ISA 1

The QVM execution state is `PC + 16 registers + 4096-byte memory + 256-word stack + compare flag + deterministic device state`. Registers are unsigned values with a maximum width of **1,048,576 bits** and are stored lazily by the host runtime.

| ID | Opcode | Semantics |
|---:|---|---|
| 0 | NOP | No state change except PC/step clock. |
| 1 | MOVI | Load immediate into `dst`. |
| 2 | MOV | Copy `a` to `dst`. |
| 3 | ADD | `dst=a+b`. |
| 4 | SUB | `dst=a-b`. |
| 5 | MUL | `dst=a*b`. |
| 6 | DIVU | Unsigned `a/b`; divide-by-zero traps. |
| 7 | MODU | Unsigned `a%b`; divide-by-zero traps. |
| 8 | AND | Bitwise AND. |
| 9 | OR | Bitwise OR. |
| 10 | XOR | Bitwise XOR. |
| 11 | NOT | Word-width bitwise complement. |
| 12 | SHL | Left shift by immediate, bounded by word width. |
| 13 | SHR | Right shift by immediate. |
| 14 | LOAD | Little-endian bounded memory read with capability check. |
| 15 | STORE | Little-endian bounded memory write with capability check. |
| 16 | PUSH | Push register value; bounded to 256 entries. |
| 17 | POP | Pop to destination; underflow traps. |
| 18 | JMP | Unconditional verified instruction-index branch. |
| 19 | JZ | Branch when register `a` is zero. |
| 20 | JNZ | Branch when register `a` is nonzero. |
| 21 | CMP | Set compare state to -1/0/+1. |
| 22 | SVC | Invoke capability-gated versioned virtual service. |
| 23 | HALT | Stop successfully. |

Arithmetic mode is per instruction: `modular`, `checked`, `saturating`, or `exact`. Any operand/result outside the defined word envelope either wraps, saturates, or traps as defined by the selected mode. The current reference runtime treats `checked` and `exact` as fail-on-overflow modes.
