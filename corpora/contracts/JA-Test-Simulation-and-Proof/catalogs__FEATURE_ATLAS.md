# JA Test, Simulation, and Proof Feature Atlas

The atlas connects the complete 10,000-record corpus to the curated 1,000-program laboratory pack.

## Test Construction

**Directory:** `scripts/01_test_construction/`

| Feature | Full corpus | Script pack | Purpose |
|---|---:|---:|---|
| `fixture` | 314 | 1 | declare reusable test inputs and expected results |
| `matcher` | 312 | 61 | compare observed values against typed expectations |
| `assertion` | 313 | 1 | state a local executable truth claim |
| `unit_test` | 312 | 1 | verify one bounded unit in isolation |
| `parameterized_test` | 312 | 61 | execute one oracle across a declared case table |
| `integration_test` | 312 | 61 | verify interacting modules and boundaries |
| `behavior_test` | 313 | 61 | verify externally visible behavior |
| `scenario_test` | 312 | 1 | verify a named end-to-end situation |

## Generative and Property Testing

**Directory:** `scripts/02_generative_testing/`

| Feature | Full corpus | Script pack | Purpose |
|---|---:|---:|---|
| `generator` | 313 | 61 | produce deterministic test values from a declared seed |
| `property_test` | 312 | 1 | quantify an invariant over generated values |
| `fuzz_target` | 314 | 61 | exercise a bounded target with generated or mutated data |
| `shrinker` | 312 | 1 | minimize a failing case without losing the failure |
| `counterexample` | 313 | 62 | preserve a minimal witness that falsifies a claim |
| `invariant` | 313 | 62 | state a property required across a state space |

## Simulation and Failure Systems

**Directory:** `scripts/03_simulation_systems/`

| Feature | Full corpus | Script pack | Purpose |
|---|---:|---:|---|
| `time_simulation` | 312 | 1 | advance a virtual clock under explicit rules |
| `event_simulation` | 312 | 61 | schedule and replay ordered events |
| `ui_interaction_simulation` | 312 | 61 | model input, focus, and interface transitions |
| `agent_environment_simulation` | 313 | 1 | model an agent and its governed environment |
| `network_failure_simulation` | 314 | 1 | inject partitions, delay, loss, or outage |
| `distributed_failure_simulation` | 312 | 61 | inject node and coordination failures |
| `resource_limit` | 313 | 1 | bound CPU, memory, time, storage, or concurrency |

## Formal Proof and Model Reasoning

**Directory:** `scripts/04_formal_proof/`

| Feature | Full corpus | Script pack | Purpose |
|---|---:|---:|---|
| `theorem` | 313 | 62 | state a proposition requiring a proof |
| `lemma` | 312 | 1 | prove a reusable supporting proposition |
| `proof_obligation` | 313 | 1 | name a condition that compilation or execution must discharge |
| `proof_term` | 312 | 62 | carry a checkable proof object |
| `model_assertion` | 312 | 1 | state a claim about the modeled system |
| `temporal_property` | 312 | 1 | state safety or liveness across time |

## Coverage, Performance, and Evidence

**Directory:** `scripts/05_coverage_performance/`

| Feature | Full corpus | Script pack | Purpose |
|---|---:|---:|---|
| `source_coverage` | 312 | 62 | measure executed source regions |
| `ast_coverage` | 312 | 1 | measure exercised syntax and typed-AST nodes |
| `runtime_coverage` | 312 | 1 | measure runtime paths and effects |
| `r12_coverage` | 313 | 62 | measure lowered evidence-record coverage |
| `benchmark` | 312 | 63 | measure a declared workload under explicit resource conditions |
