# QUORUM BASIC_MSSL — SHS Master Controller 2.0.0

## Mission

Transform the frozen BASIC_MSSL 3.0.0 Native JA21 Stage-0 candidate into an honestly earned Operational Self-Hosting System by satisfying three independent claims:

- **A — Self-hosting and reproducibility:** a canonical JA21 compiler is written in JA21, Stage-1→2→3 bootstraps without post-Stage-1 host fallback, Stage-2 == Stage-3 byte-for-byte, and the result reproduces in two clean environments.
- **B — Native MSSL/MCRT authority:** production loader/parser/verifier/engine and codec exist under `src/mssl` and `src/mcrt`, are executed natively, qualify against the frozen corpus, and retire legacy trusted-path implementations.
- **C — Independent operational qualification:** non-builder principals independently implement/check/replay/review/sign the frozen candidate and external hardware/fuzz/soak qualification passes.

## Controller states

`START0_ONLY → BOOTSTRAP_PROFILE_FROZEN → SELF_DESCRIBED → SELF_HOSTING_CONVERGED → REPRODUCIBLE → NATIVE_MSSL_MCRT → NATIVE_REPRODUCIBLE_CANDIDATE → INDEPENDENTLY_VERIFIED → OPERATIONAL_SELF_HOSTING_SYSTEM`

No state may be skipped.

## Mechanical controller predicate

```text
A0 = intake_integrity && candidate_root_frozen
A1 = bootstrap_profile_frozen
A2 = native_artifact_io_qualified
A3 = stage0_extended_without_regression
A4 = canonical_compiler_is_JA21 && canonical_compiler_native_exec
A5 = stage1_built_by_stage0 && stage1_full_corpus_pass
A6 = stage2_built_by_stage1 && stage3_built_by_stage2
     && byte_length(stage2)==byte_length(stage3)
     && sha256(stage2)==sha256(stage3)
     && bytes(stage2)==bytes(stage3)
     && stage2_stage3_corpus_outputs_byte_equal
A7 = post_stage1_host_fallback_detected == false
A8 = two_environment_reproducibility == true
A9 = compiler_adversarial_qualification == true

B1 = mssl_semantics_frozen
B2 = native_mssl_loader_qualified
B3 = native_mssl_parser_qualified
B4 = native_mssl_verifier_qualified
B5 = native_mssl_engine_qualified
B6 = native_mcrt_codec_qualified
B7 = ja21_mssl_mcrt_abi_qualified
B8 = legacy_trusted_path_retired && production_authority_unique
B9 = native_runtime_adversarial_qualification == true

C1 = independent_second_implementation_pass
C2 = independent_security_review_clean
C3 = external_signature_valid && anti_rollback_anchored
C4 = independent_replay_pass
C5 = two_named_hardware_systems_pass
C6 = authoritative_fuzz_and_fault_injection_pass
C7 = uninterrupted_72h_soak_pass
C8 = terminal_evaluator_pass

GLOBAL = inherited_invariants_pass
         && all_evidence_current_root_bound
         && required_tests_skipped == 0
         && manual_override == false

OPERATIONAL_SELF_HOSTING_SYSTEM =
  A0&&A1&&A2&&A3&&A4&&A5&&A6&&A7&&A8&&A9
  && B1&&B2&&B3&&B4&&B5&&B6&&B7&&B8&&B9
  && C1&&C2&&C3&&C4&&C5&&C6&&C7&&C8
  && GLOBAL
```

## Privileged-change rule

After any compiler grammar, compiler implementation, ABI, MSSL/MCRT semantic, runtime, trusted-path, or gate-predicate change:
1. rotate the candidate root;
2. invalidate dependent evidence;
3. re-run the inherited Stage-0 conformance suite;
4. re-run applicable A6/A7/A8/A9 convergence/reproducibility qualification;
5. re-run affected Track B qualification.

## Required aggregate outputs

- `SHS_COMPONENT_LEDGER.json`
- `SHS_SELF_HOSTING_LADDER.json`
- `SHS_NATIVE_RUNTIME_STATUS.json`
- `SHS_HOST_DEPENDENCE_PROOF.json`
- `SHS_REPRODUCIBILITY_COMPARISON.json`
- `SHS_INDEPENDENCE_EVIDENCE.json`
- `SHS_GATE_EVALUATION.json`
- `SHS_RELEASE_DECISION.md`
- final root manifest, SBOM/provenance bundle, signature bundle, independent replay receipt.


## Global non-negotiable rules

1. **Evidence precedes promotion.** Never edit a ledger, threshold, expected hash, or maturity field to manufacture a PASS.
2. **Exact self-hosting proof.** Stage-2 and Stage-3 must have the same byte length, identical SHA-256, and byte-for-byte equality. “Semantic equality” is not an acceptable substitute.
3. **Trusted-seed containment.** The C11 `src/ja21/ja21c.c` compiler is a Stage-0 bootstrap seed only. After Stage-1 is produced it may not participate in the production Stage-2/Stage-3 bootstrap.
4. **Unique native authority.** Canonical JA21 source belongs under `src/ja21/`; canonical MSSL runtime/verifier source under `src/mssl/`; canonical MCRT codec/compatibility source under `src/mcrt/`.
5. **HOST1/BOTTLE_ROCKET are oracles only.** They may produce differential vectors and diagnostics, but never native, self-hosting, reproducibility, or independence credit.
6. **No hidden host fallback.** After Stage-1, no C, Go, Python, Rust, .NET, Java, JavaScript/Node, shell code generator, host serializer, or undeclared external compiler/interpreter may perform production compiler/runtime work.
7. **Air-gapped qualification.** Bootstrap and qualification run with network denied except where a separately documented external signing/review transfer is required; only detached evidence returns to the candidate.
8. **Determinism.** Outputs may not depend on wall-clock time, random state, unstable directory order, locale, username, absolute build paths, or network state.
9. **Fail closed.** Malformed input, unsupported syntax/profile, bad seals, capability denial, bounds errors, corrupt stage artifacts, and ambiguous formats must return deterministic failures.
10. **Root binding.** Every evidence receipt binds candidate-root hash, input hashes, executable hashes, environment identity, command, exit code, output hashes, and test-set identity.
11. **No circular independence.** Builder-created second implementations, self-review, and self-replay do not satisfy Track C.
12. **Historical evidence is immutable.** New evidence supersedes prior blocked records; it does not rewrite them.
13. **Threshold changes rotate the candidate root.** Any change to grammar, ABI, corpus, pass threshold, expected hash, gate predicate, or trusted seed identity invalidates downstream evidence.
14. **SHS is not the whole OS.** `OPERATIONAL_SELF_HOSTING_SYSTEM` does not imply `FULL_WIDTH_VM_OS_OPERATIONAL`; downstream boot/kernel/hardware/security/soak OS gates remain separate.
