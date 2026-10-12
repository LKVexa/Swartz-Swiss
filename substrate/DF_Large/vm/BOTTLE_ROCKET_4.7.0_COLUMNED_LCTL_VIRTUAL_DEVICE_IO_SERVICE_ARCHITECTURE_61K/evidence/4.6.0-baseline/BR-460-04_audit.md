# BR-460-04 — Stack redesign

Status: **OPERATIONAL (host-reference)**

Stack descriptors allocate backing only for live values and enforce depth/logical-byte ceilings.

Evidence inputs: RUN_BR460.log, inherited regression logs, MEMORY.json, DELTA.json, SIZE_GATE.log, BUILD_A/B.sha256, SANITIZER.log as applicable.
