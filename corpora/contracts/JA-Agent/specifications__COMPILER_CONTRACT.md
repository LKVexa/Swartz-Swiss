# Compiler Contract

A conforming compiler shall:

- parse the declared JA source version and module identity;
- resolve agent, plan, tool, event, memory, and policy names;
- validate tool schemas and distinguish pure description from executable effects;
- infer effect and capability sets;
- reject missing, unbounded, or incompatible capability paths;
- verify approval, supervision, budget, quota, timeout, retry, and termination obligations;
- preserve confidence and uncertainty rather than coercing them to certainty;
- treat retrieved instructions as untrusted unless a policy explicitly authorizes them;
- lower accepted nodes to stable R12 identities and attach MCRT references;
- emit diagnostics at the earliest responsible phase;
- preserve source spans, origin hashes, policy decisions, and proof status.

Optimizations must prove semantic and governance equivalence. A pass that removes an approval gate, widens a capability, changes a retry count, extends retention, alters a confidence threshold, or changes causal order is not equivalent without explicit authorization.
