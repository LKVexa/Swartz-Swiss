# Semantic Operator Registry

| Feature | Observed operators | Obligation |
| --- | --- | --- |
| `classification` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Assign governed labels while retaining source evidence and confidence. |
| `collection_schema` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Declare repeated or keyed structures with explicit element contracts. |
| `constraint` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Express data invariants that must hold before artifacts advance. |
| `dataframe_operation` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Transform tabular datasets through typed, auditable operators. |
| `dataset_version` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Bind data artifacts to stable version identities and compatibility rules. |
| `deterministic_test_mode` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Run repeatable data tests with controlled ordering and fixtures. |
| `distributed_execution` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Coordinate data work across bounded workers without hidden network use. |
| `document_traversal` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Walk nested documents through declared paths and null behavior. |
| `embedding_field` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Represent learned vector embeddings with fixed element type and dimension. |
| `export_adapter` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Emit governed artifacts through explicit format and capability adapters. |
| `graph_edge` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Declare typed graph relationships with endpoint and property contracts. |
| `graph_node` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Declare graph entities with stable identities and typed attributes. |
| `graph_traversal` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Navigate graph structures with bounded depth, predicates, and evidence. |
| `import_adapter` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Read external data through named, capability-scoped adapters. |
| `join` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Combine datasets using explicit keys, cardinality expectations, and null semantics. |
| `lineage` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Record derivation links between source, intermediate, and emitted artifacts. |
| `local_file_execution` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Execute file-backed workflows without implicit remote access. |
| `nullable_schema` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Model absence directly and require deliberate null handling. |
| `partition` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Divide data by declared keys for locality, parallelism, and reproducibility. |
| `record_schema` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Define named field structures with types, keys, and validation obligations. |
| `relational_query` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Express typed filtering, projection, grouping, and ordering. |
| `retention` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Apply lifecycle and deletion policies to governed data artifacts. |
| `rights` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Represent access, use, export, and disclosure permissions as data policy. |
| `scalar_schema` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Define atomic values, ranges, formats, and semantic constraints. |
| `schema_migration` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Transform versions under explicit compatibility and rollback rules. |
| `shard` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Assign partitions to bounded physical or logical storage units. |
| `similarity_query` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Retrieve nearby vectors using declared metric, threshold, and evidence. |
| `stream_processing` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Process ordered events with watermarks, state, and replay rules. |
| `time_series_window` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Aggregate temporal data under explicit event-time and window semantics. |
| `transaction` | `join`, `scan`, `schema_declare`, `traverse`, `window` | Group data mutations into atomic, isolated, auditable units. |
| `validation_rule` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Attach reusable checks and diagnostics to data contracts. |
| `vector_field` | `aggregate`, `filter`, `lineage`, `similarity`, `validate` | Declare fixed-dimensional numeric vectors and their legal operations. |
