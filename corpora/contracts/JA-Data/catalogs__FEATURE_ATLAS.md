# JA Data Language Feature Atlas

This atlas connects every language feature to its engineering purpose, corpus coverage, curated script representation, and semantic-operator family.

| Feature | Learning track | Corpus | Scripts | Purpose | Operator sample |
| --- | --- | --- | --- | --- | --- |
| `classification` | 01 schema modeling | 312 | 10 | Assign governed labels while retaining source evidence and confidence. | aggregate, filter, lineage, similarity |
| `collection_schema` | 01 schema modeling | 313 | 43 | Declare repeated or keyed structures with explicit element contracts. | join, scan, schema_declare, traverse |
| `constraint` | 01 schema modeling | 314 | 28 | Express data invariants that must hold before artifacts advance. | join, scan, schema_declare, traverse |
| `dataframe_operation` | 02 relational analytics | 314 | 39 | Transform tabular datasets through typed, auditable operators. | aggregate, filter, lineage, similarity |
| `dataset_version` | 03 ingestion exchange | 313 | 25 | Bind data artifacts to stable version identities and compatibility rules. | aggregate, filter, lineage, similarity |
| `deterministic_test_mode` | 04 partition stream | 312 | 40 | Run repeatable data tests with controlled ordering and fixtures. | join, scan, schema_declare, traverse |
| `distributed_execution` | 04 partition stream | 313 | 29 | Coordinate data work across bounded workers without hidden network use. | aggregate, filter, lineage, similarity |
| `document_traversal` | 05 graph document vector | 312 | 37 | Walk nested documents through declared paths and null behavior. | join, scan, schema_declare, traverse |
| `embedding_field` | 05 graph document vector | 314 | 28 | Represent learned vector embeddings with fixed element type and dimension. | join, scan, schema_declare, traverse |
| `export_adapter` | 03 ingestion exchange | 312 | 38 | Emit governed artifacts through explicit format and capability adapters. | aggregate, filter, lineage, similarity |
| `graph_edge` | 05 graph document vector | 313 | 30 | Declare typed graph relationships with endpoint and property contracts. | aggregate, filter, lineage, similarity |
| `graph_node` | 05 graph document vector | 312 | 40 | Declare graph entities with stable identities and typed attributes. | join, scan, schema_declare, traverse |
| `graph_traversal` | 05 graph document vector | 312 | 13 | Navigate graph structures with bounded depth, predicates, and evidence. | join, scan, schema_declare, traverse |
| `import_adapter` | 03 ingestion exchange | 313 | 25 | Read external data through named, capability-scoped adapters. | join, scan, schema_declare, traverse |
| `join` | 02 relational analytics | 313 | 42 | Combine datasets using explicit keys, cardinality expectations, and null semantics. | aggregate, filter, lineage, similarity |
| `lineage` | 06 governance provenance | 312 | 31 | Record derivation links between source, intermediate, and emitted artifacts. | join, scan, schema_declare, traverse |
| `local_file_execution` | 03 ingestion exchange | 312 | 25 | Execute file-backed workflows without implicit remote access. | join, scan, schema_declare, traverse |
| `nullable_schema` | 01 schema modeling | 312 | 48 | Model absence directly and require deliberate null handling. | aggregate, filter, lineage, similarity |
| `partition` | 04 partition stream | 312 | 29 | Divide data by declared keys for locality, parallelism, and reproducibility. | join, scan, schema_declare, traverse |
| `record_schema` | 01 schema modeling | 312 | 13 | Define named field structures with types, keys, and validation obligations. | aggregate, filter, lineage, similarity |
| `relational_query` | 02 relational analytics | 312 | 35 | Express typed filtering, projection, grouping, and ordering. | join, scan, schema_declare, traverse |
| `retention` | 06 governance provenance | 313 | 26 | Apply lifecycle and deletion policies to governed data artifacts. | join, scan, schema_declare, traverse |
| `rights` | 06 governance provenance | 312 | 44 | Represent access, use, export, and disclosure permissions as data policy. | aggregate, filter, lineage, similarity |
| `scalar_schema` | 01 schema modeling | 312 | 26 | Define atomic values, ranges, formats, and semantic constraints. | join, scan, schema_declare, traverse |
| `schema_migration` | 03 ingestion exchange | 313 | 43 | Transform versions under explicit compatibility and rollback rules. | aggregate, filter, lineage, similarity |
| `shard` | 04 partition stream | 313 | 24 | Assign partitions to bounded physical or logical storage units. | aggregate, filter, lineage, similarity |
| `similarity_query` | 05 graph document vector | 312 | 36 | Retrieve nearby vectors using declared metric, threshold, and evidence. | aggregate, filter, lineage, similarity |
| `stream_processing` | 04 partition stream | 312 | 33 | Process ordered events with watermarks, state, and replay rules. | aggregate, filter, lineage, similarity |
| `time_series_window` | 04 partition stream | 313 | 26 | Aggregate temporal data under explicit event-time and window semantics. | join, scan, schema_declare, traverse |
| `transaction` | 02 relational analytics | 312 | 33 | Group data mutations into atomic, isolated, auditable units. | join, scan, schema_declare, traverse |
| `validation_rule` | 01 schema modeling | 312 | 44 | Attach reusable checks and diagnostics to data contracts. | aggregate, filter, lineage, similarity |
| `vector_field` | 05 graph document vector | 312 | 17 | Declare fixed-dimensional numeric vectors and their legal operations. | aggregate, filter, lineage, similarity |
