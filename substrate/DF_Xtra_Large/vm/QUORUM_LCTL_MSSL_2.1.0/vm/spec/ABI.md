# QUORUM Generic VM ABI 2

- Registers: `R0..R15`, unsigned, 1,048,576-bit maximum.
- Memory: 4,096 guest bytes, all reads/writes range checked and capability checked.
- Stack: 256 guest words; overflow and underflow are deterministic traps.
- Program counter: instruction index, never a host pointer.
- Service ABI: `SVC svc=<id>`.
- Legacy deterministic services 0-3 are retained.
- RC-PW world services 16-31 are defined in `world/spec/WORLD_SERVICE_ABI.md`.
- World coordinates crossing the service boundary use signed 64-bit two's-complement values carried inside QVM wide registers.
- Return/result convention: `R0` is the primary result register; additional world results use R1-R5 as documented.
- Image ABI and ISA versions are checked before execution.
- Host objects, paths, file descriptors, environment variables, network sockets, process handles, and native pointers are not directly visible to guests.
- World services are denied unless explicitly present in the signed image capability manifest.
