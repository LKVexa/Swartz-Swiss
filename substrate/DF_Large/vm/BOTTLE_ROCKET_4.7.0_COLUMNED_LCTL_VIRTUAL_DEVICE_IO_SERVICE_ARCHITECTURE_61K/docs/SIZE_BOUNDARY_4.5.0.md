# 4.5.0 size boundary

The enforced `<61,000` gate is:

- `src/*.c`
- `src/*.h`
- `src/BOOT.lctlc`
- all files in `adapters/`

This is the executable production source: VM core, trust/persistence implementation, all HAL adapters, public contracts, and the authoritative executable LCTL unit.

The Makefile, `src/CORE.lctlc`, `spec/`, tests, tools, docs and evidence remain in the delivered repository and are measured separately. They are build/qualification/specification support, not code executed by the VM. Both measurements are emitted by `make size` so the boundary change from 4.4.0 is explicit and auditable.
