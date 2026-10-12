# JA Security Policy Language Specification — Standalone Profile

## Purpose

JA Security Policy Language describes identity, authorization, resource classification, capabilities, decision rules, delegation, revocation, expiry, approval, sandboxing, secrets, audit, data lifecycle, proof, runtime enforcement, and certification as typed, policy-governed artifacts.

## Static semantics

The compiler resolves principals, groups, roles, resources, scopes, and policies; assigns types; computes effects and capabilities; establishes conflict precedence; checks attenuation and lifecycle rules; creates proof obligations; and lowers accepted policy to stable R12 records.

## Runtime semantics

The policy runtime evaluates current identity/resource/lifecycle state, enforces network and process sandboxes, redacts secret material, journals privileged decisions, and emits MCRT receipts. Missing evidence or unavailable enforcement fails closed or returns an explicit unresolved result.

## Determinism

Equivalent source, policy inputs, identity state, resource state, lifecycle clocks, proof identities, and sandbox profiles must produce equivalent decisions and receipts. Caches must be invalidated when any relevant identity or revocation/expiry state changes.

## Evidence boundary

This suite contains modeled corpus expectations and structural validators. It does not include a production parser, compiler, proof checker, policy engine, sandbox, audit sink, or signer.
