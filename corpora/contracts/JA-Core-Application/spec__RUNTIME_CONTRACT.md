# JA Core Runtime Contract

## Runtime profile

The modeled corpus names the **JA Core VM** and a deterministic-test execution mode.

## Required services

- module initialization;
- value and collection storage;
- structured result and error propagation;
- ownership-aware resource finalization;
- capability enforcement;
- effect logging;
- async task scheduling, timeout, cancellation, and backpressure;
- serialization boundaries;
- FFI and host-adapter mediation;
- sandbox and secret-redaction controls;
- MCRT evidence emission.

## Safety defaults

Network access is explicit-only. Unknown code execution is disabled. Secret redaction is required. Host and foreign calls are denied unless the source, capability, ABI, memory, and policy contracts are satisfied.

## Evidence

Every execution outcome should bind the source hash, AST identity, R12 record, runtime profile, policy status, observed effects, consumed capabilities, result, causal parents, and replay identifier.
