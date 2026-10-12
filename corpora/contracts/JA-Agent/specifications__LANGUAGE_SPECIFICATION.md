# JA Agent Language Specification

## Status

This is a provisional standalone profile derived from the supplied 10,000-record corpus. It defines an implementation target, not evidence of a completed production compiler.

## Design principles

1. **Authority is typed.** Description, request, approval, and execution are distinct.
2. **Policy is executable semantics.** `policy no_network` is not documentation.
3. **Agent state is bounded.** Goals, budgets, quotas, memory, retries, timeouts, and termination are explicit.
4. **Evidence is first-class.** Observations, knowledge sources, confidence, uncertainty, approvals, tool results, R12, and MCRT are traceable.
5. **Untrusted text is data.** Retrieved content and tool output cannot silently become higher-priority instructions.
6. **Replay preserves governance.** Optimization and lowering must retain policy, capability, approval, confidence, and causal identity.

## Canonical unit

A `.jaa` compilation unit declares a source version, module, Agent profile, policy, one or more agents, assertions, and emitted MCRT evidence. An agent declares identity, role, goal, memory, resources, tools, and plans.

## Static semantics

The compiler resolves names and schemas, infers agent-plan types, computes effects and required capabilities, validates policy decisions, proves budget and termination obligations where possible, and lowers accepted programs to stable R12/MCRT identities.

## Dynamic semantics

A conforming scheduler executes only authorized plan steps, validates tool inputs and outputs, enforces network and capability policies, consumes budgets, records observations and approvals, redacts secrets, emits audit events, and terminates deterministically or enters a declared recovery state.
