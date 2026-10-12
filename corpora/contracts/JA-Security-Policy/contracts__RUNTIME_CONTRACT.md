# JA Security Policy Runtime Contract

A conforming runtime should execute only verified compiled policy; evaluate current identity, resource, delegation, revocation, expiry, and approval state; sandbox process and network effects; treat secrets as reference-only inputs; fail closed on missing enforcement or evidence; preserve deterministic decision ordering; emit redacted, tamper-evident audit history; produce an MCRT receipt tied to exact source, policy state, inputs, and outputs; and never promote modeled expectations into native claims.
