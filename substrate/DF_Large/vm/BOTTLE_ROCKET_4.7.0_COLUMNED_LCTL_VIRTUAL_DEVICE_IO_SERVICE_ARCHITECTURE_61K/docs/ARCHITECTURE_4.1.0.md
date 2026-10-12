# BOTTLE ROCKET 4.1.0 Production Execution Architecture

The 4.1.0 trust boundary is split into three layers:

1. **brvm-core** owns deterministic VM semantics, state, parsing of BRIM bytes, ISA execution, wide arithmetic/register/stack behavior, traps, lifecycle, capability checks, quotas, persistence protocol semantics, APDU semantics, and portable hashing.
2. **HAL** is the sole core-to-host service contract. The core receives a `br_hal` table plus an opaque per-instance host context; it does not know host paths, file descriptors, terminals, environment variables, sockets, OpenSSL objects, or process-global VM state.
3. **Adapters/host tooling** implement platform services and CLI concerns. Adapter choice may change service implementation, but it must not change VM semantic results for deterministic inputs.

Guest-visible host service requests are mapped through a fixed service table, capability-checked, buffer/length checked, and charged against per-instance service/host-call budgets before reaching a HAL callback. Multiple VM instances carry independent state, storage context, devices, capabilities, counters, and lifecycle state.

The acceptance suite proves the same BRIM semantic result under multiple adapters and independently builds the core archive. Native deployment qualification for a particular operating system or physical smart-card target remains a separate hardware/platform qualification activity.
