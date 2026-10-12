# CHANGELOG — 4.2.0

- Promoted native COLUMNED LCTL `LCTLC/1.1` to executable source authority.
- Replaced executable `NOP + br.*` carrier rows with direct opcode/operand/capability/argument columns.
- Added formal machine-readable LCTL grammar, lexical, column, type, canonicalization and version contracts.
- Added deterministic semantic compiler and canonical BRIR.
- Added static opcode/operand/type/register/memory/immediate/mode/service verification.
- Added CFG, reachability, loop-policy and stack-effect verification; unsupported CALL/RET fail closed for BR/1.
- Added capability derivation and declaration enforcement for control, arithmetic, memory, stack and services.
- Added deterministic source→BRIR→BRIM pipeline, safe NOP-elision pass and source-to-binary provenance.
- Added separate independent BRIM verifier and round-trip/disassembly tooling.
- Removed the legacy hidden-semantic assembler from the `brctl` command surface.
- Retained 4.1 core/HAL, six adapter contracts, persistence, signing, update/recovery and sandbox behavior.
