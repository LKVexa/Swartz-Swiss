# 4.3.0 Change Log

4.3.0 completes the production ISA/ABI layer above 4.2.0 semantic authority. It freezes BR/1.1 and ABI/2, expands the production opcode set from 24 to 41, expands the service ABI to 22 calls, adds CALL/RET/frame behavior, indexed memory, NEG/BITTST/ASHR/ROL/ROR, BEQ/JMPR, explicit traps, capability query, checkpoint/yield, trap frames, compatibility rules, an ISA conformance corpus and independent current/legacy BRIM verification. Adapter duplication was structurally removed to preserve the 61K source ceiling without moving runtime behavior outside the measured boundary.

Final qualification also removes a duplicated capability lookup from the dispatch path; the resulting production-source measurement is 60,930 bytes.
