# JA Training and Evaluation Language Specification

## Purpose

The language describes reproducible training experiments, evaluation contracts, release decisions, and lineage evidence in the JA21 ecosystem.

## Core invariants

- Local and immutable artifact references are preferred.
- Network access is denied unless separately authorized.
- Randomness is explicit through seed provenance.
- Training success, evaluation acceptance, and registry promotion are distinct states.
- Negative and security cases retain diagnostics and evidence.
- R12 and MCRT identities are stable and reviewable.

## Evidence model

A conforming implementation should expose source, typed AST, semantic judgment, lowered experiment plan, execution receipt, evaluation receipt, registry transition, and provenance identities. The corpus provides modeled examples of these layers; a production implementation must produce its own native evidence.
