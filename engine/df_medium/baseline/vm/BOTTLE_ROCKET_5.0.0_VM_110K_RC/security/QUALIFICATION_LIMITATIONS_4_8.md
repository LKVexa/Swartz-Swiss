# 4.8.0 Qualification Limitations

The following are deliberately not represented as PASS:

1. **BR-480-13-R04 AArch64:** no AArch64 runtime or cross-toolchain is available in this environment.
2. **BR-480-13-R06 Windows adapter:** no native Windows runtime, MinGW/Wine path, or Windows qualification host is available here.
3. **BR-480-14-R01 independent build machine:** all builds executed on one available x86-64 Linux host.
4. **BR-480-14-R02 independent operator:** the same QUORUM execution performed the available build/replay work.
5. **BR-480-15-R01 literal 72-hour soak:** an accelerated repeated-operation soak was executed, but 72 elapsed hours did not occur.
6. **BR-480-17-R03 independent replay:** implementation-independent parsing/verification and compiler-differential replay pass locally, but strict independent-machine/operator replay is not proven.
7. **BR-480-17-R04 72-hour soak:** blocked by item 5.
8. **BR-480-17-R05 cross-platform conformance:** blocked because the requested AArch64 and Windows execution evidence is unavailable.

These blockers are qualification-evidence limitations. They are not converted into PASS by accelerated testing, documentation, simulation, or same-host compiler diversity.
