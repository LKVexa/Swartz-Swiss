# JA Service and Protocol Language Specification

## Purpose

JA Service and Protocol Language (`.jasp`) is the JA21 contract language for defining service boundaries, message schemas, endpoint authority, conversational protocols, transport capabilities, reliability policy, compatibility, and deterministic validation evidence.

## Normative principles

- **Contract before implementation.** A service is first a typed, versioned contract.
- **Explicit effects.** Remote network access is never ambient.
- **Protocol legality.** State transitions must be reachable, typed, and terminating where required.
- **Retry safety.** Retry, delivery guarantee, backoff, deadline, and idempotency are analyzed together.
- **Fail closed.** Missing authority or incompatible schemas block lowering.
- **Stable evidence.** AST, semantic, R12, MCRT, serialization, and compatibility identities are retained.
- **Air-gap compatibility.** Offline transports and local test doubles are first-class.

## Core semantic domains

A service contract maps a set of typed messages, endpoints, authority requirements, protocol automata, reliability policies, and transports to a validated runtime plan. The semantic judgment records the inferred contract type, effect set, capability requirements, policy decision, proof obligations, and stable identities.

## Status

This specification is a corpus-derived standalone profile. Native execution claims require a separately supplied JA compiler and JA Service Runtime.
