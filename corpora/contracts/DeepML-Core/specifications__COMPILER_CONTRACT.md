
# DeepML Core Compiler Contract

## Required pipeline

`lex -> parse -> AST -> name_resolution -> type_check -> semantic_validation -> safety_gate -> normalization -> optimization -> R12_lowering -> MCRT_emission`

The compiler must preserve source identity and provenance through every accepted transformation. Parsing establishes structure; name resolution binds symbols and targets; type checking proves dtype and shape compatibility; semantic validation checks graph rules; the safety gate enforces capability policy; normalization creates canonical form; optimization is admitted only under a declared equivalence class; R12 and MCRT emission create replayable evidence.

## Admission requirements

- Deterministic behavior is required by default.
- Network access is forbidden unless a separately governed profile explicitly allows it.
- Unknown code execution is rejected.
- Stable source, semantic, AST, R12, and MCRT identities are retained.
- Negative records stop at their expected failure stage and must not be lowered as valid programs.
- Diagnostics identify stage, source span where available, violated contract, and bounded repair guidance.

## Optimization boundary

An optimization may change representation but not the declared semantic relation, required effects, policy outcome, numeric equivalence class, or provenance chain. A conforming compiler emits the optimization list and evidence supporting equivalence.

## 8S profile

The optional Smithson 8S editorial profile is carried as explicit structured evidence. It does not silently alter tensor semantics and must remain distinguishable from normative DeepML Core productions until compiler adoption is separately established.
