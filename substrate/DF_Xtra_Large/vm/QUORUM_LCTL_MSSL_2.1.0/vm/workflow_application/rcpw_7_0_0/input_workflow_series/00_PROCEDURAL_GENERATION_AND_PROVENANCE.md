# QUORUM RC-PW 7.0.0 — Procedural Generation and Provenance

Generated content must be reproducible and distinguishable from authored content.

Every generated artifact records:
- generator ID/version;
- parent region/template;
- seed lineage;
- canonical identity allocation;
- generation parameters;
- source dependencies;
- post-generation validation;
- author override/migration history.

Regeneration must never duplicate a persistent entity that already exists in canonical state. Author overrides are explicit versioned mutations, not hidden edits to prior historical truth.
