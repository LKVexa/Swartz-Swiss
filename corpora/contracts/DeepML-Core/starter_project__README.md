
# Starter Project

1. Parse `main.deepml` under the DeepML Core 0.3 grammar profile.
2. Resolve the module, tensors, operators, and inference entrypoint.
3. Verify dtype and shape compatibility.
4. Enforce deterministic and no-network policy.
5. Emit AST, semantic hash, R12, and MCRT evidence.
6. Execute only through a conforming runtime and record output hash or declared tolerance evidence.

The project is intentionally small enough to implement as the first end-to-end compiler/runtime milestone.
