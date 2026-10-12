# JA Core Application Language Feature Atlas

**Suite:** JA21 JA Core Application Language Suite 1.0.0  
**Profile:** `ja.core`  
**Purpose:** A navigable map from application-language concepts to corpus evidence and teaching scripts.

## Reading the atlas

Each feature is represented in the 10,000-record corpus and in the 1,000-script example pack. Counts below describe the source corpus and curated pack; modeled compiler/runtime outcomes are not native execution claims.

## `async_task`

Models a scheduled computation with cancellation, timeout, ownership, and deterministic-test obligations.

- Corpus records: **322**
- Example-pack scripts: **10**
- Publication track: `04_effects_async`
- Positive / expected-pass records: **243**
- Diagnostic / expected-fail records: **79**

Study path: begin with a positive `async_task` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `borrow`

Provides bounded access without transferring ownership; mutability and aliasing rules remain explicit.

- Corpus records: **322**
- Example-pack scripts: **52**
- Publication track: `03_memory_data`
- Positive / expected-pass records: **244**
- Diagnostic / expected-fail records: **78**

Study path: begin with a positive `borrow` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `capability`

Names explicit authority required to perform protected effects such as file, state, process, or host access.

- Corpus records: **322**
- Example-pack scripts: **26**
- Publication track: `04_effects_async`
- Positive / expected-pass records: **243**
- Diagnostic / expected-fail records: **79**

Study path: begin with a positive `capability` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `closure`

Captures lexical bindings in a callable value; capture mode and lifetime remain part of semantic identity.

- Corpus records: **322**
- Example-pack scripts: **28**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **241**
- Diagnostic / expected-fail records: **81**

Study path: begin with a positive `closure` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `collection`

Provides typed aggregate storage with declared ordering, mutation, allocation, and iteration semantics.

- Corpus records: **322**
- Example-pack scripts: **32**
- Publication track: `03_memory_data`
- Positive / expected-pass records: **241**
- Diagnostic / expected-fail records: **81**

Study path: begin with a positive `collection` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `compile_time_generation`

Produces declarations or artifacts before runtime while preserving generator identity and input hashes.

- Corpus records: **322**
- Example-pack scripts: **47**
- Publication track: `05_meta_integration`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `compile_time_generation` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `constant`

Declares a value whose identity is fixed for the compilation unit and may be safely folded when proof obligations are retained.

- Corpus records: **322**
- Example-pack scripts: **17**
- Publication track: `01_foundations`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `constant` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `constraint`

Restricts generic, type, or value parameters so specialization and validation can prove required properties.

- Corpus records: **322**
- Example-pack scripts: **36**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **243**
- Diagnostic / expected-fail records: **79**

Study path: begin with a positive `constraint` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `effect`

Declares observable operations beyond pure evaluation so optimization and policy cannot erase behavior.

- Corpus records: **323**
- Example-pack scripts: **45**
- Publication track: `04_effects_async`
- Positive / expected-pass records: **240**
- Diagnostic / expected-fail records: **83**

Study path: begin with a positive `effect` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `enum`

Defines a closed set of named alternatives suitable for exhaustive branching and stable wire representation.

- Corpus records: **323**
- Example-pack scripts: **30**
- Publication track: `01_foundations`
- Positive / expected-pass records: **241**
- Diagnostic / expected-fail records: **82**

Study path: begin with a positive `enum` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `foreign_function`

Bridges to external native functions through explicit ABI, memory, effect, and capability contracts.

- Corpus records: **322**
- Example-pack scripts: **23**
- Publication track: `05_meta_integration`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `foreign_function` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `function`

Defines a typed transformation with declared inputs, outputs, effects, and capability obligations.

- Corpus records: **322**
- Example-pack scripts: **44**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **239**
- Diagnostic / expected-fail records: **83**

Study path: begin with a positive `function` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `generic`

Abstracts a definition over types or values while preserving constraints needed for valid specialization.

- Corpus records: **324**
- Example-pack scripts: **23**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **243**
- Diagnostic / expected-fail records: **81**

Study path: begin with a positive `generic` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `host_integration`

Connects JA applications to approved host services while retaining sandbox, policy, and replay evidence.

- Corpus records: **323**
- Example-pack scripts: **28**
- Publication track: `05_meta_integration`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **81**

Study path: begin with a positive `host_integration` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `immutable_binding`

Introduces a stable local name. Immutability narrows the effect surface and improves reasoning, replay, and optimization.

- Corpus records: **322**
- Example-pack scripts: **40**
- Publication track: `01_foundations`
- Positive / expected-pass records: **240**
- Diagnostic / expected-fail records: **82**

Study path: begin with a positive `immutable_binding` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `lifetime`

Names or infers the valid duration of references and captured resources.

- Corpus records: **323**
- Example-pack scripts: **36**
- Publication track: `03_memory_data`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **81**

Study path: begin with a positive `lifetime` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `macro`

Transforms syntax under controlled expansion rules, with hygiene and source provenance retained.

- Corpus records: **324**
- Example-pack scripts: **30**
- Publication track: `05_meta_integration`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **82**

Study path: begin with a positive `macro` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `module`

Defines a compilation and naming boundary. Modules provide stable identity for imports, policy application, and incremental compilation.

- Corpus records: **322**
- Example-pack scripts: **40**
- Publication track: `01_foundations`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `module` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `mutable_state`

Declares controlled state change. Mutation must remain explicit in the effect and capability path.

- Corpus records: **324**
- Example-pack scripts: **16**
- Publication track: `01_foundations`
- Positive / expected-pass records: **245**
- Diagnostic / expected-fail records: **79**

Study path: begin with a positive `mutable_state` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `option`

Represents presence or absence without sentinel values, forcing the caller to handle both states deliberately.

- Corpus records: **323**
- Example-pack scripts: **31**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **243**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `option` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `ownership`

Assigns responsibility for resource lifetime and prevents implicit duplication or unsafe concurrent access.

- Corpus records: **322**
- Example-pack scripts: **34**
- Publication track: `03_memory_data`
- Positive / expected-pass records: **240**
- Diagnostic / expected-fail records: **82**

Study path: begin with a positive `ownership` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `package`

Groups modules and distribution metadata into a deployable application unit while preserving dependency and provenance boundaries.

- Corpus records: **324**
- Example-pack scripts: **35**
- Publication track: `01_foundations`
- Positive / expected-pass records: **244**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `package` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `pattern_match`

Deconstructs structured values and requires coverage, guard consistency, and predictable case ordering.

- Corpus records: **322**
- Example-pack scripts: **37**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **244**
- Diagnostic / expected-fail records: **78**

Study path: begin with a positive `pattern_match` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `record`

Defines a product type with named fields and predictable serialization, construction, and pattern semantics.

- Corpus records: **323**
- Example-pack scripts: **40**
- Publication track: `01_foundations`
- Positive / expected-pass records: **245**
- Diagnostic / expected-fail records: **78**

Study path: begin with a positive `record` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `reflection`

Examines declared structure under a governed policy rather than unrestricted runtime introspection.

- Corpus records: **322**
- Example-pack scripts: **28**
- Publication track: `05_meta_integration`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `reflection` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `result`

Represents successful or failed computation as data, enabling typed propagation and explicit recovery.

- Corpus records: **323**
- Example-pack scripts: **25**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **240**
- Diagnostic / expected-fail records: **83**

Study path: begin with a positive `result` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `serialization`

Maps values to stable external representations while preserving schema, version, and safety requirements.

- Corpus records: **323**
- Example-pack scripts: **47**
- Publication track: `03_memory_data`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **81**

Study path: begin with a positive `serialization` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `stream`

Models ordered or bounded sequences of values over time, including backpressure and completion behavior.

- Corpus records: **324**
- Example-pack scripts: **20**
- Publication track: `04_effects_async`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **82**

Study path: begin with a positive `stream` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `structured_error`

Carries machine-readable failure identity, context, and recovery information instead of unstructured text alone.

- Corpus records: **322**
- Example-pack scripts: **34**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **242**
- Diagnostic / expected-fail records: **80**

Study path: begin with a positive `structured_error` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `trait`

Describes a behavioral contract that implementations satisfy without erasing type, effect, or provenance evidence.

- Corpus records: **322**
- Example-pack scripts: **47**
- Publication track: `02_types_functions`
- Positive / expected-pass records: **239**
- Diagnostic / expected-fail records: **83**

Study path: begin with a positive `trait` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.

## `variant`

Defines a tagged union whose active case is represented explicitly and checked during pattern matching.

- Corpus records: **322**
- Example-pack scripts: **19**
- Publication track: `01_foundations`
- Positive / expected-pass records: **240**
- Diagnostic / expected-fail records: **82**

Study path: begin with a positive `variant` script, compare a diagnostic case, inspect its semantic judgment and AST node, then trace the R12 and MCRT identities through the catalog.
