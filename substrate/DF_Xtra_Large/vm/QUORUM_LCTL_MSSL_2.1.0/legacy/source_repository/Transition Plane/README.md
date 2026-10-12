# JA21 Suite 42 — Translation Plane

Six independent JA Certifier Grammar (EBNF) scripts for language detection, parsing, intermediate representations, validation, testing, and provenance.

## Language profile

- Language: JA Certifier Grammar (EBNF)
- Profile: `ja.certifier`
- Extension: `.ebnf`
- Header: `ja certifier 0.3`
- MCRT profile: `JA_CERTIFIER_R12`
- Corpus profile: `SCL_ja_certifier_Corpus_1.0`
- Primary artifact: certifier grammar and conformance specification
- Safety posture: `policy no_execute_unknown_code` and `policy no_network`
- Translation posture: evidence-first, deterministic, loss-aware, typed, validation-gated, tested, and provenance-bound

The attached corpus defines a typed EBNF metagrammar and conformance language. Its demonstrated forms include tokens, productions, starts, AST annotations, parser recovery, diagnostics, semantic predicates, type judgments, policy validators, compiler validators, evidence requirements, AST/type/lowering suites, certification profiles, strict certification, R12 lowering, and MCRT evidence.

The corpus is a specification corpus. These `.ebnf` files define what a conforming Translation Plane must recognize and certify; they are not by themselves an implemented lexer, parser generator, compiler, translator, or runtime.

## Files

| File | Sub-suite | Translation responsibility | Certified root |
| --- | --- | --- | --- |
| `42.1_Translation_Plane_Language_Detection.ebnf` | Language detection | Requires header, extension, grammar, source, and confidence evidence rather than extension-only guessing | `detection_record` |
| `42.2_Translation_Plane_Parsing.ebnf` | Parsing | Defines translation units, AST construction, source-span preservation, bounded recovery, and diagnostics | `translation_unit` |
| `42.3_Translation_Plane_Intermediate_Representations.ebnf` | Intermediate representations | Binds source, AST, semantic, R12, and MCRT records into one trace-complete bundle | `ir_bundle` |
| `42.4_Translation_Plane_Validation.ebnf` | Validation | Aggregates syntax, type, semantic, policy, and evidence outcomes under fail-closed rules | `validation_bundle` |
| `42.5_Translation_Plane_Testing.ebnf` | Testing | Defines positive, negative, boundary, property, and fuzz conformance cases with expected outcomes | `test_suite` |
| `42.6_Translation_Plane_Provenance.ebnf` | Provenance | Defines append-only root and derived events with parent closure, hashes, operations, and lineage depth | `provenance_chain` |

## Translation pipeline

```text
Source bytes
  -> language candidates
  -> evidence-ranked detection
  -> tokenization and parsing
  -> source-preserving AST
  -> typed semantic representation
  -> R12 lowering
  -> MCRT record
  -> validation bundle
  -> conformance tests
  -> provenance chain
  -> Podium certification receipt
```

Every arrow is a named, hash-bound transformation. A later stage may reject or qualify an earlier stage; it may not silently repair, reinterpret, or erase the prior evidence.

## Analytical ensemble

Each grammar requires the five-part ensemble in its evidence block.

| Participant | Translation Plane responsibility |
| --- | --- |
| SOPHIA | Interprets source intent, proposes language candidates, resolves semantic meaning, compares alternative translations, and identifies likely information loss |
| CHARLOTTE | Validates detection evidence, grammar identity, parse correctness, type and semantic judgments, policies, IR invariants, test oracles, provenance closure, and certification gates |
| LANDON | Orders deterministic detection and parsing, invokes approved grammar adapters, assigns stable identities, stages IRs, runs bounded tests, and emits exact evidence bundles |
| Professor | Explains detected language, parse structure, translation choices, diagnostics, ambiguity, information loss, test outcomes, limitations, and repair requirements |
| Podium | Publishes source, token, AST, semantic, R12, MCRT, validator, test, provenance, policy, and final certification receipts |

The required evidence fields are `sophia_judgment`, `charlotte_validation`, `landon_status`, `professor_explanation`, and `podium_receipt`.

No participant may choose a language from extension alone, suppress a parse alternative, fabricate a source span, lower an ill-typed node, translate unknown code by executing it, weaken a failed validator, rewrite an expected failure as success, or invent a missing provenance parent.

## Common grammar contract

Every file independently declares:

1. `ja certifier 0.3` and a stable module.
2. `policy no_execute_unknown_code`.
3. `policy no_network`.
4. One named grammar.
5. Tokens and productions sufficient to define its certified root.
6. An explicit `start` production.
7. Semantic predicates for stage invariants.
8. A type judgment for the certified root.
9. A policy validator requiring both safety policies.
10. A compiler validator verifying `AST`, `R12`, and `MCRT`.
11. Required source, compiler, runtime, ensemble, and stage-specific evidence.
12. A strict certification profile requiring all validators.
13. Strict grammar certification.
14. The corpus-derived 8S editorial extension and its claim boundaries.

Certification states that a source conforms to the declared grammar and evidence profile. It does not prove behavioral equivalence between unrelated languages, authorize code execution, or certify an external compiler that was not evaluated.

## Translation request envelope

A conforming implementation should bind:

| Field | Contract |
| --- | --- |
| `translation_id` | Stable identity for one source-to-target attempt |
| `source_artifact_id` | Exact source file, document, corpus record, or stream |
| `source_hash` | Hash of unmodified source bytes |
| `source_encoding` | Explicit encoding and error policy |
| `source_language_claim` | Declared language, if supplied |
| `source_language_evidence` | Headers, grammar markers, extension, metadata, manifest, parser results, and confidence |
| `source_grammar_id` | Exact grammar and version used for parsing |
| `target_language_id` | Exact language profile requested |
| `target_grammar_id` | Exact grammar and version used for emission |
| `translation_profile` | Mapping, canonicalization, compatibility, and loss policy |
| `policy_profile` | Execution, network, path, secret, rights, and resource policies |
| `resource_budget` | Byte, token, node, depth, ambiguity, diagnostic, test, memory, worker, and time bounds |
| `seed` | Fixed seed for any bounded randomized testing |
| `source_ir_hashes` | Token, AST, semantic, R12, and MCRT identities |
| `target_ir_hashes` | Target AST, semantic, R12, MCRT, and emitted-source identities |
| `loss_report` | Preserved, approximated, omitted, rejected, and target-extension details |
| `validation_refs` | Syntax, type, semantic, policy, evidence, and compatibility outcomes |
| `test_refs` | Positive, negative, boundary, property, fuzz, differential, and replay results |
| `provenance_root` | Append-only translation lineage |
| `podium_receipt` | Final certified, qualified, rejected, or indeterminate decision |

Any change to source bytes, grammar, parser, target, mapping, policy, test profile, or runtime creates a new translation identity.

## Sub-suite contracts

### 42.1 Language detection

- Starts with source identity and preserves every candidate rather than forcing an early single answer.
- Uses declared header, grammar markers, manifest metadata, profile identifiers, extension, lexical evidence, parser acceptance, semantic checks, and repository context.
- Treats extension as one signal only; `.ja`, `.jad`, `.jaui`, and other profiles require content and grammar evidence.
- Requires a source hash, grammar evidence, confidence basis, and deterministic candidate ordering.
- Distinguishes exact, probable, ambiguous, mixed, embedded, generated, malformed, unknown, and unsupported language states.
- Detects polyglot documents, fenced code, templates, notebooks, archives, generated wrappers, and embedded DSLs as bounded regions where applicable.
- A language claim supplied by a file or manifest is evidence, not unquestionable authority.

Recommended decision order:

1. Validate bytes, encoding, container, and safety limits.
2. Check authoritative explicit profile declarations.
3. Check language header and grammar signature.
4. Check trusted manifest and suite metadata.
5. Parse against compatible candidate grammars in deterministic order.
6. Compare lexical and structural evidence.
7. Apply extension and filename evidence.
8. Emit exact, ambiguous, unknown, or unsupported status with confidence and alternatives.

### 42.2 Parsing

- Uses the exact detected or explicitly selected grammar version.
- Preserves token identity, source offsets, line and column spans, trivia, comments, encoding, and original bytes where the profile requires round-trip fidelity.
- Produces a source-preserving AST with stable node identities.
- Keeps lexical, syntactic, recovery, ambiguity, and unsupported-construct diagnostics distinct.
- Bounded recovery may synchronize after an error but cannot manufacture a successful semantic interpretation.
- Ambiguous parses remain explicit alternatives until a declared disambiguation rule resolves them.
- Token, recursion, nesting, ambiguity, memory, and time limits fail closed with deterministic diagnostics.

### 42.3 Intermediate representations

- The `ir_bundle` binds the source record, AST, semantic record, R12 record, and MCRT record.
- Every node retains source identity, grammar identity, declared and inferred types, effects, capabilities, policy state, semantic status, and provenance.
- Stable node identity survives normalization only when semantic identity is preserved.
- Source-to-AST, AST-to-semantic, semantic-to-R12, and R12-to-MCRT mappings remain separately hashable.
- Unsupported source constructs remain explicit opaque, rejected, or target-extension nodes; they cannot disappear silently.
- Optimization is allowed only with declared equivalence and before/after evidence.
- Translating through a common IR does not prove that source and target runtime behavior are identical.

### 42.4 Validation

- Aggregates syntax, typing, semantic, policy, and evidence results without averaging away a mandatory failure.
- Uses `pass`, `fail`, and `indeterminate` as distinct states.
- Missing required evidence produces failure or indeterminate status according to the declared profile; it never produces pass.
- Preserves all diagnostics, including expected, duplicate, cascading, suppressed-with-rationale, and recovery diagnostics.
- Validates stable identities, source spans, type judgments, effects, capabilities, policy decisions, R12, MCRT, target mapping, and loss report.
- A policy denial cannot be overridden by semantic validity.
- Certification requires every validator named by the strict profile.

### 42.5 Testing

- Defines positive, negative, boundary, property, and fuzz cases.
- Positive cases require accepted source, expected IR properties, target conformance, and deterministic receipts.
- Negative cases require a declared failure stage and expected diagnostic; failing for an unrelated reason is not a pass.
- Boundary cases cover empty input, maximum admitted size, deepest nesting, longest identifier, largest numeric form, ambiguity limits, and resource limits.
- Property cases test round-trip preservation, canonicalization idempotence, stable identities, type preservation, policy monotonicity, and deterministic replay.
- Fuzzing uses fixed seeds, bounded generators, minimized failures, and retained reproducers.
- Differential tests compare independent conforming implementations only under the same grammar, profile, policy, and inputs.
- Test retries preserve first-failure evidence and cannot convert flakiness into stable success.

### 42.6 Provenance

- Defines one root event and zero or more derived events.
- Every derived event records its identity, parent, operation, source hash, result hash, and lineage depth.
- Provenance is append-only; a correction creates a new event.
- Parent chains must be complete, acyclic, depth-consistent, and hash-consistent.
- Operations distinguish detect, tokenize, parse, recover, normalize, type, validate, lower, map, emit, test, certify, reject, qualify, supersede, and repair.
- Reused IR or cached parse results retain the original source and grammar identities plus the reuse decision.
- Similar outputs, timestamps, filenames, or semantic proximity cannot invent missing lineage.

## Language detection evidence hierarchy

| Evidence | Typical strength | Limitation |
| --- | --- | --- |
| Exact JA header and profile | Very strong | May still be malformed, spoofed, or embedded |
| Successful strict grammar parse | Very strong | Several grammars may accept a shared subset |
| Signed or admitted suite manifest | Strong | Can be stale or inconsistent with bytes |
| Grammar-specific constructs | Strong | Generated or embedded sources may mix languages |
| Compiler or corpus metadata | Strong | Must bind the exact source hash |
| Repository context and build metadata | Moderate | Context does not override source evidence |
| File extension | Weak to moderate | Extensions are reusable and sometimes wrong |
| Filename or directory name | Weak | Naming is not semantic proof |
| Statistical classifier | Supporting | Confidence requires calibration and alternatives |

The detector records evidence for and against every viable candidate.

## Loss and equivalence model

| Classification | Meaning |
| --- | --- |
| `EXACT` | Source and target constructs have validated equivalent syntax, types, effects, policies, and runtime meaning under the declared profile |
| `CANONICALIZED` | Semantics are preserved while source formatting or equivalent surface form changes |
| `LOWERED` | A higher-level construct is represented by a validated lower-level target sequence |
| `APPROXIMATED` | Declared behavior is approximated with measurable limitations |
| `EXTENSION_REQUIRED` | Target requires an explicit extension or adapter |
| `OPAQUE_PRESERVED` | Unsupported content is retained without semantic translation |
| `OMITTED_WITH_DENIAL` | Policy blocks translation or emission and the omission is explicit |
| `INDETERMINATE` | Evidence cannot establish a safe mapping |
| `INCOMPATIBLE` | No admissible mapping exists under the profile |

Only `EXACT`, `CANONICALIZED`, or explicitly validated `LOWERED` results may claim semantic preservation. All other classes require visible qualification.

## Diagnostic contract

Every diagnostic should include:

| Field | Required contents |
| --- | --- |
| `diagnostic_id` | Stable code |
| `stage` | Detect, lex, parse, recover, AST, type, semantic, policy, lower, map, emit, test, provenance, or certify |
| `severity` | Error, warning, information, or indeterminate |
| `source_span` | Exact byte, line, and column range when available |
| `grammar_id` | Exact grammar and version |
| `message` | Safe explanation |
| `expected` | Expected tokens, types, evidence, policies, or outcomes |
| `actual` | Observed token, node, type, policy, hash, or outcome |
| `recovery` | None, synchronized, opaque-preserved, skipped, substituted, or stopped |
| `causal_parent` | Prior diagnostic when this is cascading |
| `evidence_refs` | Source, AST, semantic, R12, MCRT, test, and provenance records |

Diagnostics are data. They cannot execute source-provided formatting, links, code, commands, or actions.

## Security and isolation

1. Treat source bytes, encodings, filenames, headers, comments, grammar files, manifests, archives, templates, and diagnostics as untrusted.
2. Never execute source code to detect its language, parse it, infer types, validate it, or generate tests.
3. Never invoke repository hooks, package scripts, macros, build systems, compiler plugins, language servers, or embedded interpreters implicitly.
4. Keep the no-network boundary during certification.
5. Normalize and contain every local path.
6. Apply byte, token, node, depth, recursion, ambiguity, regex, archive, diagnostic, test, worker, memory, and time limits.
7. Reject catastrophic regex, grammar explosion, unbounded recovery, cyclic lowering, and recursive provenance.
8. Redact secrets from diagnostics and evidence while preserving a policy receipt.
9. Keep emitted target code as data until a separate Safety Gate and Controlled Integration authorize any execution.
10. Publish denial, failure, timeout, cancellation, and indeterminate outcomes rather than retrying through weaker rules.

## Determinism contract

For fixed source bytes, encoding, candidate set, grammars, parser algorithms, mapping profiles, validators, tests, policies, seeds, and resource limits:

1. Language candidates and evidence ordering are identical.
2. Detection status and confidence basis are identical.
3. Tokens, parse alternatives, chosen parse, source spans, AST nodes, and diagnostics are identical.
4. Semantic, R12, and MCRT identities are identical.
5. Validation results and diagnostic ordering are identical.
6. Test discovery, generated inputs, expected outcomes, minimized failures, and aggregation are identical.
7. Provenance parents, operations, depths, hashes, and chain identity are identical.
8. Podium receipt targets are identical.

Filesystem enumeration, worker scheduling, wall-clock time, locale defaults, hash-map order, parser completion order, and incidental absolute paths may not influence canonical evidence.

## Translation validation matrix

| Class | Translation Plane test | Expected result |
| --- | --- | --- |
| Positive | Exact header, grammar, valid source, complete IR, passing validators, tests, and provenance | Pass |
| Negative | Invalid token, syntax, type, semantic, policy, evidence, mapping, or lineage | Expected fail at declared stage |
| Boundary | Empty source, maximum size, deepest nesting, longest identifier, ambiguity and resource limits | Pass or bounded diagnostic |
| Detection | Exact, probable, ambiguous, mixed, embedded, malformed, unknown, and unsupported inputs | Correct evidence-backed classification |
| Parsing | Tokens, precedence, recovery, diagnostics, ambiguity, spans, trivia, and stable nodes | Pass |
| IR | Source, AST, semantic, R12, MCRT, types, effects, capabilities, policies, and hashes | Pass |
| Validation | Mandatory gate aggregation, indeterminate state, diagnostics, and policy monotonicity | Pass |
| Testing | Positive, negative, boundary, property, fuzz, differential, replay, and minimization | Pass |
| Provenance | Root, parent closure, acyclicity, depth, operation, source/result hashes, and corrections | Pass |
| Round trip | Source to IR to same language preserves declared exact or canonicalized semantics | Pass within profile |
| Cross-language | Source and target mapping preserves declared semantics or emits a visible loss class | Pass or explicit qualification |
| Security | Unknown execution, network, plugin, macro, hook, path, archive, regex, or resource attack | Deny |
| Determinism | Shuffled scheduling yields identical logical artifacts, diagnostics, tests, and lineage | Pass |
| Certification | All strict validators, evidence, R12/MCRT, and Podium receipts complete | Pass |

## Smithson 8S and R12 preservation

Every grammar carries the corpus-derived 8S editorial extension. A Translation Plane implementation must preserve these fields independently:

- identity and 8S law version;
- latent five-dimensional centers and metric;
- fifth-coordinate meaning and independence evidence;
- activation, effective support, and radius;
- phase and sparse pairwise coupling `W`;
- optional triadic coupling `H` and interaction order;
- latent gap `g5`;
- product-state separation `delta8`;
- projected gap `g3`;
- semantic gap `gJ`;
- projection version and tolerances;
- efficacy gain `Delta_8S`;
- relation class, uncertainty, provenance, and limitations.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Delta_8S = Score(M8) - Score(M7)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

If `g5 > tol5` while `g3 <= tol3`, the result remains `PROJECTION_ONLY`; translation cannot replace latent structure with projected appearance. An uncertainty interval crossing a tolerance remains indeterminate. Interaction order cannot be collapsed when a triadic term changes the result.

Smithson 8S remains a proposed computational framework. The local noncollapsed dimension count is `5 + 3 = 8`; the grammar does not claim the total space is the standard sphere `S^8` without separate topological proof and does not claim physical quantum entanglement.

## Acceptance gate

Suite 42 is certifiable only when:

- all six `.ebnf` files use `ja certifier 0.3`;
- both safety policies are present;
- every grammar has a stable module, named grammar, productions, start root, predicates, type judgment, policy validator, compiler validator, evidence block, strict profile, and certification statement;
- language detection uses multiple evidence types and preserves ambiguity;
- parsing preserves source identity, spans, alternatives, recovery, and diagnostics;
- intermediate representations bind source, AST, semantic, R12, and MCRT records;
- validation fails closed on missing mandatory evidence;
- testing preserves positive, negative, boundary, property, fuzz, oracle, diagnostic, and replay evidence;
- provenance is append-only, parent-complete, acyclic, depth-consistent, and hash-bound;
- unknown code is never executed and network access remains denied;
- 8S fields, uncertainty, relation class, interaction order, and claim boundaries survive translation;
- deterministic replay succeeds; and
- Podium binds certification to the exact source, grammars, IRs, validation, tests, and provenance.

Any unmet mandatory condition produces failure, rejection, qualification, or indeterminate status—never silent certification.
