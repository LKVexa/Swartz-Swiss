# BR-460-02 — Lazy allocation

Status: **OPERATIONAL (host-reference)**

Small/zero values allocate no limb buffer; normalization shrinks representation.

Evidence inputs: RUN_BR460.log, inherited regression logs, MEMORY.json, DELTA.json, SIZE_GATE.log, BUILD_A/B.sha256, SANITIZER.log as applicable.
