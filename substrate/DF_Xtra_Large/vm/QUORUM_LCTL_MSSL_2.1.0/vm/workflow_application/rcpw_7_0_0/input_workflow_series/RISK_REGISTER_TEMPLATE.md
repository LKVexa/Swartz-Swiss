# RC-PW 3.0.0 Risk Register

| Risk ID | Area | Failure mode | Consequence | Required mitigation | Status |
|---|---|---|---|---|---|
| RISK-001 | Fold geometry | discontinuity/aliasing | visible topology error or wrong interaction target | continuity/Jacobian/property tests + canonical round-trip | OPEN |
| RISK-002 | Entity persistence | duplicate/fork identity | causal corruption | singular ownership + tombstones + endurance cycling | OPEN |
| RISK-003 | LOD | promotion storm/starvation | hitching or stale causality | rate limits, reserves, starvation bounds | OPEN |
| RISK-004 | Ledger | ordering/divergence | irreproducible world state | deterministic commit order + checkpoint digests | OPEN |
| RISK-005 | Save/recovery | torn/corrupt state | unrecoverable world | transactional commit + known-good rollback | OPEN |
| RISK-006 | Multi-reference | double simulation | duplicate world mutation | deterministic ownership arbitration | OPEN |
| RISK-007 | Performance | resource exhaustion | simulation state loss | global governor; degrade derived fidelity first | OPEN |
| RISK-008 | 8S adapter | unmapped/ill-conditioned math | invalid runtime authority | mapping matrix + numerical admission tests | OPEN |
| RISK-009 | Migration | stale schema semantics | silent state corruption | version gates + migration replay | OPEN |
| RISK-010 | Qualification | evidence laundering | false OPERATIONAL claim | fresh execution evidence + profile-specific promotion | OPEN |

| RISK-011 | Topology | folded display creates apparent/actual false adjacency | invalid traversal or targeting | canonical topology separation + portal tests | OPEN |
| RISK-012 | Worldbuilding | generated content loses provenance | irreproducible world state | seed/provenance/version contract | OPEN |
| RISK-013 | Event orchestration | abstract simulation skips critical event | fabricated causal outcome | event barriers + escalation/defer policy | OPEN |
| RISK-014 | Environment | fold distance changes propagation time | weather/fire/logistics causality error | canonical-time/geography propagation | OPEN |
| RISK-015 | Portals/interiors | exterior fold leaks into interior topology | invalid geometry/streaming | explicit portal/interior authority | OPEN |
| RISK-016 | Interaction | fold horizon aliases entities | wrong canonical target | unique inverse targeting + alias detector | OPEN |
| RISK-017 | Streaming | cache eviction removes sole authority | state loss | residency classes + canonical protection | OPEN |
| RISK-018 | Observability | derived telemetry mutates authority | debugging changes world | read-only debugger capability boundary | OPEN |

| RISK-019 | World compiler | nondeterministic package output | irreproducible world/replay | deterministic inputs + semantic digest comparison | OPEN |
| RISK-020 | Runtime ABI | hidden authority bypass | state corruption | capability-bound service ABI + integration audit | OPEN |
| RISK-021 | Randomness | stream drift | replay divergence | named versioned streams + draw-state evidence | OPEN |
| RISK-022 | Navigation | folded distance changes travel | causal/time error | canonical route/time authority | OPEN |
| RISK-023 | AI | local/remote decision mismatch | incoherent agents | fidelity contracts + event barriers + reconciliation | OPEN |
| RISK-024 | Combat | fold alias/abstract fabrication | wrong damage/death | unique targeting + qualified abstract resolver | OPEN |
| RISK-025 | Transport | moving-frame discontinuity | passenger/cargo teleport or velocity jump | nested frame contracts + route-phase persistence | OPEN |
| RISK-026 | Generation | regenerated identity collision | duplicate persistent world | seed provenance + identity registry | OPEN |
| RISK-027 | Scale | backlog never recovers | permanent low fidelity | admission control + debt/starvation bounds | OPEN |
| RISK-028 | Migration | version mismatch interpreted silently | corrupted history/save | compatibility matrix + fail-closed migration | OPEN |
| RISK-029 | Soak | long-run memory/storage drift | production instability | soak metrics + compaction/recovery gates | OPEN |
| RISK-030 | Headless verification | verifier differs from runtime semantics | false replay PASS | shared canonical core + digest cross-check | OPEN |

| RISK-031 | Parallelism | worker count changes canonical result | nondeterministic world | deterministic commit + conformance digests | OPEN |
| RISK-032 | Partitioning | ownership split-brain | duplicate mutation | lease/revision/transaction ownership | OPEN |
| RISK-033 | Transactions | duplicate/reordered delivery | double-applied consequence | idempotence + dedup + revision checks | OPEN |
| RISK-034 | Checkpoint | incoherent cross-partition cut | unreplayable save | coordinated snapshot/barrier | OPEN |
| RISK-035 | Recovery | worker restart resurrects stale state | canonical regression | committed revision + replay recovery | OPEN |
| RISK-036 | Hot patch | mixed content/policy versions | divergent world | activation barrier + rollback | OPEN |
| RISK-037 | Asset residency | eviction reaches authoritative state | irreversible loss | semantic/asset residency separation | OPEN |
| RISK-038 | Concurrency | unresolved write race | causal divergence | read/write conflict model + deterministic arbitration | OPEN |
| RISK-039 | Security | content gains unauthorized mutation | canonical compromise | capability sandbox + validation | OPEN |
| RISK-040 | Capacity | fabric overload cascades | world stalls/drift | global backpressure + reserves + capacity envelope | OPEN |

| RISK-041 | World expansion | new region perturbs old canonical truth | historical instability | mutation-set digest + admission transaction | OPEN |
| RISK-042 | World grammar | invalid generated topology/content | incoherent frontier | semantic grammar + compiler rejection | OPEN |
| RISK-043 | Knowledge | NPC omniscience | implausible narrative/law behavior | observer-local knowledge authority | OPEN |
| RISK-044 | Generations | identity recycling/succession confusion | broken history/ownership | unique identity + role/occupant split | OPEN |
| RISK-045 | Long horizon | abstraction drift | divergent world evolution | drift envelopes + fine-step comparison | OPEN |
| RISK-046 | Archive | required history compacted away | impossible rehydration/quests | protected proof classes + obligation retention | OPEN |
| RISK-047 | Rehydration | inferred detail presented as exact | false history | provenance class + reconstruction labels | OPEN |
| RISK-048 | Institutions | role succession loses obligations | contract/law discontinuity | institution/occupant separation | OPEN |
| RISK-049 | Frontier | render invents undefined geography | false canonical world | admission gate before interaction | OPEN |
| RISK-050 | Eras | model/version reinterpretation | save/history corruption | era/model/schema version capture | OPEN |
