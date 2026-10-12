# BR-460-06 — Scratch allocator

Status: **OPERATIONAL (host-reference)**

Scratch uses one lazy bounded reusable arena; exhaustion traps safely.

Evidence inputs: RUN_BR460.log, inherited regression logs, MEMORY.json, DELTA.json, SIZE_GATE.log, BUILD_A/B.sha256, SANITIZER.log as applicable.
