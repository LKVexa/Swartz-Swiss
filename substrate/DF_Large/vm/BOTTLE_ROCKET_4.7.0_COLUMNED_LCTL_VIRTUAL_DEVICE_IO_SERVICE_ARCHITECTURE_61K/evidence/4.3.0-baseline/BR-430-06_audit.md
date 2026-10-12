# BR-430-06 — Memory operations

Decision: **OPERATIONAL** in the 4.3.0 host-reference production ISA/ABI scope.

Fresh evidence: memory_call_abi_contract + bounds/capability negatives. All 9 atomic requirements inherit the complete operational, sanitizer, size, determinism, semantic-authority and fail-closed release gates; no external hardware/certification claim is implied.
