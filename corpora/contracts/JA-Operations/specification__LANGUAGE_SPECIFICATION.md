# JA Operations Language Specification — Standalone Profile

## Purpose

JA Operations Language describes reproducible builds, operational workspaces, service topologies, deployment and release transitions, observability, recovery, packaging, installers, offline execution, and air-gapped delivery as typed, policy-governed artifacts.

## Core artifact

A valid program produces or models a `DeploymentArtifact`. The artifact carries source and dependency identity, target and compiler profile, environment, resource envelope, service graph, network/storage/secret bindings, health and scaling behavior, upgrade and rollback transitions, packaging profile, and evidence references.

## Static semantics

The compiler resolves names, validates units and ranges, assigns operational types, computes effects and capabilities, checks policy, verifies topology and transition completeness, creates stable AST identities, and lowers accepted declarations to R12 records.

## Runtime semantics

The executor materializes a deterministic plan in a sandbox, records process/file/network/secret/deployment/package/ledger effects, evaluates probes, journals transitions, and emits an MCRT receipt. The language does not authorize hidden network access, embedded secrets, or unjournaled mutation.

## Determinism and reproducibility

Build and deployment equivalence depend on source, dependency lock, compiler, target, environment, policy, secret-reference identity, and artifact inputs. Caches must be invalidated when any relevant identity changes.

## Error model

Errors are staged as syntax, resolution, type, effect, capability, policy, topology, plan, runtime, recovery, or certification failures. Diagnostics must identify the source span, rejected authority or invariant, and remediation path.

## Evidence boundary

This release supplies a corpus specification and structural tooling. It does not include a native production compiler or executor.
