# QUORUM RC-PW 7.0.0 — World Partition and Ownership

Partitioning is a runtime optimization layer over the canonical world graph.

A partition record includes:
- partition ID/version;
- owned canonical regions/entities;
- shadow/read-only dependencies;
- active authority wells;
- lease/revision;
- checkpoint position;
- ledger range;
- resource budget;
- migration state.

Ownership transfer is transactional. A canonical mutable responsibility has one active owner unless a specifically qualified replicated-state algorithm is used.

Partition movement must not alter canonical coordinates, topology, world time, identity, route phase, event reservation, or historical provenance.
