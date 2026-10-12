# QUORUM RC-PW 7.0.0 — Hot Patch, Live Content, and Rollback

Support versioned updates to world content, fold policy, presentation assets, schemas, generators, and runtime modules without silent canonical reinterpretation.

Every patch declares:
- package ID/version;
- dependencies;
- affected canonical/derived domains;
- migration requirements;
- activation barrier;
- compatibility profile;
- rollback package;
- provenance/hashes.

Canonical-content patches activate transactionally at a declared simulation barrier. Presentation-only patches may activate at a frame boundary if they cannot affect canonical results.

Failed activation rolls back to the last known-good package/state.
