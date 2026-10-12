PYTHON ?= python3
ROOT := $(CURDIR)

.PHONY: all clean compile sign verify test world-test world-qualify blocked-remediate operational size sanitize qualify world-demo
all: operational
clean:
	rm -f deploy/CORE.payload.json deploy/CORE.brir.json deploy/CORE.signed.brimg evidence/qualification_summary.json evidence/tests.log evidence/benchmark.json evidence/fuzz.json
	rm -f world/evidence/world_tests.log world/evidence/qualification_summary.json world/evidence/golden_world_executed.json
compile:
	$(PYTHON) toolchain/quorum_vm.py compile src/CORE.lctlc deploy/CORE.payload.json --brir deploy/CORE.brir.json
sign: compile
	$(PYTHON) toolchain/quorum_vm.py sign deploy/CORE.payload.json --key keys/DEV_ONLY_private_seed.hex --key-id dev-root --out deploy/CORE.signed.brimg
verify: sign
	$(PYTHON) toolchain/quorum_vm.py verify deploy/CORE.signed.brimg --trust keys/TRUST_STORE.json

test:
	$(PYTHON) tests/test_vm.py
world-test:
	$(PYTHON) world/tests/test_world_runtime.py
	$(PYTHON) world/tests/test_blocked_gate_remediation.py
world-qualify:
	$(PYTHON) world/qualification/qualify_world.py
blocked-remediate:
	$(PYTHON) world/qualification/remediate_26.py
world-demo:
	$(PYTHON) toolchain/quorum_vm.py compile src/WORLD_DEMO.lctlc world/evidence/WORLD_DEMO.payload.json --brir world/evidence/WORLD_DEMO.brir.json
	$(PYTHON) toolchain/quorum_vm.py sign world/evidence/WORLD_DEMO.payload.json --key keys/DEV_ONLY_private_seed.hex --key-id dev-root --out world/evidence/WORLD_DEMO.signed.brimg
	$(PYTHON) toolchain/quorum_vm.py run world/evidence/WORLD_DEMO.signed.brimg --trust keys/TRUST_STORE.json --snapshot world/evidence/WORLD_DEMO.snapshot.json --trace world/evidence/WORLD_DEMO.trace.json
sanitize:
	$(PYTHON) -m py_compile toolchain/quorum_vm.py tests/test_vm.py qualification/qualify.py world/world_runtime.py world/compiler/world_compiler.py world/tests/test_world_runtime.py world/tests/test_blocked_gate_remediation.py world/qualification/qualify_world.py world/qualification/qualify_world_legacy.py world/qualification/remediate_26.py world/qualification/headless_verify.py world/remediation/blocked_gate_support.py
size:
	wc -c toolchain/quorum_vm.py world/world_runtime.py deploy/CORE.signed.brimg src/CORE.lctlc src/WORLD_DEMO.lctlc || true
qualify: sign
	$(PYTHON) qualification/qualify.py
operational: verify test world-test sanitize world-qualify qualify
