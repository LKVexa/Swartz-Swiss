# Runtime and Validation Contract

The validation runtime shall:

- execute only declared local analysis and approved validators;
- forbid network access and unknown code execution unless an explicit capability profile authorizes them;
- enforce deterministic seeds, tool versions, validator schedules, and replay identities;
- bound ambiguity search, witness generation, automaton construction, and parser-table analysis;
- keep diagnostics stable and attach them to exact source spans;
- validate evidence freshness, signatures, profile compatibility, and bundle consistency;
- emit MCRT records for admitted analyses and durable rejection records for failed gates;
- preserve uncertainty when an analysis bound is exhausted or required evidence is missing;
- terminate explicitly with pass, fail-as-expected, rejected, unresolved, or certified status.

The runtime must never convert successful parsing alone into certification authority.
