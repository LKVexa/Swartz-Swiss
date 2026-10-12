# BOTTLE ROCKET 4.3.0 — BR/1.1 ISA + ABI/2

## Authority
Production source is `LCTLC/1.2`, language `columned-lctl/4.3`, compiled to canonical BRIR and BRIM/1. `spec/BR_SPEC.json` and `src/brvm.h` freeze numeric ISA/ABI identifiers. `tools/brim_verify.py` independently validates images without importing the compiler.

## Compatibility
Current images use product 4.3.0, ABI 2, ISA marker 21 and 41 opcodes. The loader explicitly accepts only the legacy 4.2.0 ABI 1 / marker 20 / 24-opcode header contract. Unknown ABI/ISA combinations fail closed; they are never reinterpreted. No BR/1.1 opcode is deprecated. Opcodes 48–63 are the reserved extension range; unsupported extensions trap/reject.

## Registers and ABI
R0–R5 are arguments, R0–R1 returns, R0–R7 caller scratch, R8–R13 callee-preserved by conforming code, R14 frame pointer, R15 reserved. CALL pushes a return IP; RET restores it. ENTER/LEAVE save and restore R14 on the 256-wide-word stack. Services use R0–R5 for arguments and R0–R1 for results. Capability authority remains explicit per instruction/capability slot; CAPQ provides bounded introspection.

## Arithmetic and flags
ADD/SUB/MUL operate across the complete 1,048,576-bit word. DIVU/MODU are unsigned and trap on zero divisor. NEG is two’s-complement. CMP is unsigned unless the signed instruction flag is set. ZERO, LESS, GREATER, CARRY and OVERFLOW are architectural flags. WRAP keeps low W bits; CHECKED and TRAPPING fail on overflow; SATURATE clamps to the appropriate signed/unsigned endpoint. MIN/MAX are intentionally omitted and synthesized with CMP+branch; POPCOUNT is omitted because the workflow supplied no measured production need.

## Logic, shift and rotation
AND/OR/XOR/NOT are full-width. BITTST sets ZERO when the selected bit is clear. SHL/SHR are logical; oversized counts yield zero. ASHR sign-fills and an oversized count yields all sign bits. ROL/ROR use count modulo W. Zero-count operations are identity transformations.

## Memory and stack
The VM has 4,096 byte-addressed memory. LOAD/STORE access an unaligned little-endian 64-bit scalar at direct offsets 0..4088. LOADX/STOREX use low64(base)+offset with checked addition. Explicit non-MEM region access traps ACCESS. PUSH/POP move a complete wide word. Stack overflow and underflow have distinct canonical traps.

## Control flow
JMP is direct. JZ/JNZ test flags. BEQ compares registers. JMPR uses the low 64 bits of a register as a checked target. CALL/RET provide direct call control. Falling off code or branching outside the verified code extent traps BOUNDS.

## System and services
TRAP accepts canonical trap IDs 1..27. CHECKPOINT persists through the HAL. YIELD invokes the HAL and enters the suspended lifecycle. ABI/2 exposes 22 services: NOP, STATUS, REVOKE, GRANT, CONFIG, SAVE, DIAG, SHA256, VERIFY, TRUST, ENTROPY, TIMER, CONSOLE_WRITE, CONSOLE_READ, DEVICE_CALL, YIELD, STORAGE_READ, STORAGE_WRITE, MONOTONIC, MAILBOX_PUT, MAILBOX_GET, DEVICE_ENUM. Raw host errno values are not part of the ABI; host failures map to VM status/trap classes. Networking remains absent/offline.

## Image contract
BRIM/1 current images carry ABI 2, ISA marker 21, opcode count 41, tag `BRLCTL43`, SHA-256 payload integrity, and a source-hash prefix in header bytes 72..79. Signed images use Ed25519 through the HAL/host adapter boundary.
