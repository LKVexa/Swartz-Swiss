# QUORUM RC-PW 7.0.0 — World Compiler and Content Pipeline

## Mission
Compile authored/generated world content into a deterministic, validated runtime world package without allowing presentation assets to become canonical authority.

## Required compiler inputs
- world semantic schema;
- regions/biomes;
- terrain/elevation;
- topology/routes/portals/interiors;
- settlements/jurisdictions;
- persistent entities/agents;
- ecology/economy/environment parameters;
- narrative/event anchors;
- visibility/landmark metadata;
- deterministic seeds;
- asset/content dependencies;
- schema and ABI versions.

## Compiler outputs
- canonical world-package manifest;
- stable identity table;
- region/topology graph;
- portal/interior graph;
- route/navigation graph;
- content provenance index;
- visibility/materialization hierarchy;
- deterministic seed registry;
- dependency DAG;
- content budget report;
- source/evidence SHA-256 manifests.

## Required gates
The compiler must reject duplicate canonical identity, invalid portal/topology edges, missing hard dependencies, incompatible schema/ABI versions, malformed seed/provenance records, dependency cycles where forbidden, and unresolved authoritative references.

The world package is a reproducible build artifact: same authoritative inputs + same compiler/toolchain version must yield semantically equivalent canonical outputs.
