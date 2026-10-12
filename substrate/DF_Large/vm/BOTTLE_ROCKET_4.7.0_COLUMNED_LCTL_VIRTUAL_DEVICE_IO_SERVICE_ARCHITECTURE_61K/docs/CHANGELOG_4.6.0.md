# 4.6.0 change log

- Replaced eager full-width register/stack/scratch buffers with descriptor-backed wide words.
- Added canonical zero, small-inline, sparse-single-limb and dense-active-limb representations.
- Added reference-counted copy-on-write dense storage and deterministic normalization.
- Added lazy reusable scratch allocation and explicit per-VM heap/stack/scratch ceilings.
- Added word-width and scratch resource traps and memory-accounting APIs.
- Added immutable small constant pool and immediate constant folding in the LCTL compiler.
- Added BR-460 memory/performance acceptance suite and direct runtime-memory measurement.
- Preserved BR/1.1, ABI/2, LCTLC/1.2, secure boot, transactional persistence and guest-object formats.
