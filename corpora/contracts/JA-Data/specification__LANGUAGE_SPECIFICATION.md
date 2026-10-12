# JA Data Language Specification

## Purpose

JA Data is the governed data-programming profile of JA21. It combines typed schemas, local and declared adapters, relational and dataframe operations, streams, graphs, documents, vectors, lineage, rights, retention, transactions, partitioning, and deterministic evidence.

## Core invariants

1. Every program has a stable module identity.
2. Network access is denied unless explicitly declared and authorized.
3. Schema validity does not imply rights to use, export, or retain data.
4. Optimizations preserve data results, null semantics, ordering requirements, policy decisions, and lineage.
5. Distributed execution cannot broaden capabilities.
6. Every persisted or emitted artifact has a source and derivation identity.
7. R12 and MCRT identities remain stable across canonicalization.
8. Modeled corpus expectations are not native execution claims.

## Data domains

The language covers scalar, record, nullable, collection, relational, dataframe, stream, time-series, graph, document, vector, and embedding data. Dataset versions, schema migrations, validation rules, transactions, rights, retention, lineage, partitions, and shards form the governance and operational envelope.
