# BOTTLE ROCKET 4.2.0 — Native COLUMNED LCTL Semantic Authority

## Authority boundary
Production executable source is `src/BOOT.lctlc` in `LCTLC/1.1`. Executable meaning is carried only by `OP`, `OUT`, `CTRL`, `IN`, and `ARG`. `META` is non-semantic provenance and any `br.*` executable metadata is rejected. The legacy `NOP + br.op/br.mode/br.imm` carrier path is not exposed by `brctl` and is rejected by the 4.2 compiler.

## Compilation pipeline
`tools/lctl420.py` performs UTF-8/LF/NFC lexical checks, eight-column structural checks, typed operand and immediate verification, register/memory/mode/service bounds, capability derivation, CFG/reachability/stack/termination verification, canonical BRIR construction, safe NOP elimination, BRIM/1 lowering, deterministic serialization, SHA-256 hashing, provenance emission, and optional host-mediated Ed25519 signing. Invalid source is rejected before the output image is created.

## Independent verification
`tools/brim_verify.py` is deliberately separate from the compiler and does not import compiler code. It independently validates BRIM headers, payload hash, instruction field bounds, branch targets, memory/shift/service bounds, requested capabilities, CFG reachability, stack effects, the native-LCTL provenance tag, and optional provenance-manifest linkage.

## Provenance
The generated BRIM header reserves bytes 64..71 for `BRLCTL42` and bytes 72..79 for the first eight bytes of the SHA-256 source hash. The sidecar provenance manifest records the full source, BRIR and BRIM SHA-256 values plus compiler, verifier, language, ISA and image versions.

## Runtime continuity
The 4.1 host-free `brvm-core`, fixed 16-call HAL, adapter boundary, capability sandbox, persistence/recovery model, APDU protocol, wide-word model, and offline-by-default posture are retained. 4.2 changes source authority and build qualification; it does not reintroduce host policy into the VM core.

## Explicit compatibility rule
`LCTLC/1.0` semantic-carrier input is production-rejected rather than silently translated. This is an intentional version boundary. Historical 4.1 evidence remains under `evidence/4.1.0-baseline/`.
