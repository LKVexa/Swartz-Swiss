# Feature Atlas

**Suite:** JA21 JA Service and Protocol Language Suite 1.0.0

The atlas connects each language feature to its publication track, corpus evidence, and curated teaching programs.

## 01 — Service Foundations

| Feature | Corpus | Pack | Purpose |
|---|---:|---:|---|
| `client_stub` | 312 | 25 | Defines generated or verified client-side service bindings. |
| `endpoint` | 312 | 32 | Declares a callable service boundary with typed input, output, effects, and policy. |
| `method` | 313 | 35 | Defines an operation within a service interface. |
| `server_interface` | 312 | 31 | Defines the server-side implementation boundary and dispatch obligations. |
| `service_declaration` | 312 | 31 | Introduces a named service contract and its message/protocol namespace. |
| `test_double` | 313 | 31 | Defines deterministic mocks, fakes, or simulators for service verification. |

## 02 — Contracts And Schemas

| Feature | Corpus | Pack | Purpose |
|---|---:|---:|---|
| `compatibility_version` | 313 | 29 | Defines version ranges, wire compatibility, and migration boundaries. |
| `error_contract` | 312 | 33 | Specifies structured failures, retryability, and stable diagnostic identity. |
| `request_schema` | 312 | 30 | Defines the typed request envelope and validation obligations. |
| `response_schema` | 314 | 31 | Defines the typed response envelope, stream item, or terminal result. |
| `schema_validator` | 313 | 32 | Validates request, response, event, and command data before execution or emission. |
| `serialization` | 312 | 33 | Defines canonical wire or storage representation and hash stability. |

## 03 — Protocol And Streaming

| Feature | Corpus | Pack | Purpose |
|---|---:|---:|---|
| `bidirectional_stream` | 313 | 28 | Models simultaneous request and response streams with ordered termination. |
| `command` | 312 | 27 | Represents an imperative protocol message with explicit acknowledgement semantics. |
| `delivery_guarantee` | 313 | 34 | States at-most-once, at-least-once, or exactly-once delivery expectations. |
| `event` | 312 | 31 | Represents an observable protocol fact that may be published or subscribed to. |
| `protocol_state` | 312 | 33 | Declares legal states and transitions for a conversational protocol. |
| `protocol_validator` | 312 | 31 | Checks transition legality, reachability, termination, and ordering. |

## 04 — Reliability And Flow

| Feature | Corpus | Pack | Purpose |
|---|---:|---:|---|
| `backoff` | 312 | 28 | Defines deterministic delay growth between retry attempts. |
| `backpressure` | 312 | 29 | Bounds producer pressure when consumers or transports cannot keep pace. |
| `deadline` | 312 | 30 | Places a deterministic upper bound on service work and propagation. |
| `idempotency` | 313 | 35 | Declares the identity key that makes replay or retry safe. |
| `quota` | 312 | 33 | Caps aggregate resource or request consumption for a principal or service. |
| `rate_limit` | 313 | 33 | Constrains request frequency with an explicit time window and policy. |
| `retry` | 314 | 33 | Specifies retry eligibility, limits, and interaction with idempotency. |

## 05 — Security And Transport

| Feature | Corpus | Pack | Purpose |
|---|---:|---:|---|
| `authentication` | 314 | 29 | Declares how callers prove identity before invoking a service. |
| `authorization` | 312 | 30 | Constrains which authenticated principals may use an endpoint or protocol transition. |
| `local_transport` | 313 | 33 | Binds a service to an in-process, loopback, or local IPC transport. |
| `network_capability` | 313 | 33 | Makes network access an explicit capability rather than an ambient effect. |
| `offline_transport` | 312 | 31 | Defines queue, file, bundle, or air-gapped message exchange. |
| `remote_transport` | 312 | 33 | Binds an endpoint to a governed remote transport with declared network effects. |
| `service_discovery` | 312 | 33 | Resolves service identity without bypassing compatibility or authority checks. |

