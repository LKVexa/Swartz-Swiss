# RC-PW source authority

1. MSSL world semantic contracts under `world/authority/`.
2. JSON world schemas and deterministic world-package compiler.
3. Columned LCTL-C executable guest source (`vm/src/WORLD_DEMO.lctlc`).
4. Canonical LCTL lowering/verifier PASS from bundled LCTL 1.6.1-RC1 tooling.
5. Hosted QVM world service implementation (`world/world_runtime.py` + `toolchain/quorum_vm.py`).
6. Fresh tests, Golden World evidence, requirement ledger and release hashes.

The supplied Columned LCTL corpus, LCTL 1.6.1-RC1 package, and MSSL Writers Corpus are guidance/source-language references. They are not silently copied into runtime authority.
