# 4.3.0 Release Invariants

- Production source boundary remains `Makefile + src/** + adapters/** + spec/**` and must be strictly below 61,000 bytes.
- BRIM must be at most 51,200 bytes.
- `src/brvm.c` remains host-free and has no direct POSIX, stdio, environment, terminal, network, or OpenSSL dependency.
- Native source authority remains LCTLC/1.2 / columned-lctl/4.3; hidden executable `br.*` metadata is forbidden.
- Every current BRIM is independently verifiable as ABI/2 + BR/1.1; legacy 4.2 compatibility is explicit only.
- Every opcode has positive and capability-negative runtime coverage; canonical traps and ABI frame behavior are tested.
- Resource budgets, bounds, capabilities, image integrity, signatures and lifecycle checks fail closed.
