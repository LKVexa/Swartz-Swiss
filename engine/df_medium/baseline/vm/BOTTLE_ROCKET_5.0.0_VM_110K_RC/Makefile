CC ?= cc
CPPFLAGS := -Isrc -Ihost
CFLAGS := -std=c11 -O2 -Wall -Wextra -Werror -fno-common -fstack-protector-strong
LDLIBS := -lcrypto
BUILD := .build
CORE := src/brvm.c
HOST := host/br_host.c
PRODHOST := host/br_prod_host.c
COMPILER := src/brlctlc.c
TRUST := src/brtrust.c
SIGN := host/brsign.c
IMAGE := deploy/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE.brimg
BRIR := deploy/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE.brir
PROVENANCE := deploy/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE.provenance.json
SECURE_IMAGE := deploy/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE.brsb
LEGACY41 := compat/BOTTLE_ROCKET_4.1.0.brimg
LEGACY42 := compat/BOTTLE_ROCKET_4.2.0.brimg
LEGACY46 := compat/BOTTLE_ROCKET_4.6.0.brimg
LEGACY46S := compat/BOTTLE_ROCKET_4.6.0.brsb
DIST_MAX := 110000
BRIM_MAX := 51200
PROD := src/brvm.c src/brvm.h src/brtrust.c src/brtrust.h host/br_prod_host.c host/br_prod_host.h host/brctl.c src/brlctlc.c src/brlctlc.h src/CORE.lctlc examples/boot.lctlc spec/BR_SPEC.json spec/LCTLC_1_1.json $(SECURE_IMAGE) $(BRIR) $(PROVENANCE)
.PHONY: bench
.PHONY: all core test semantic-test spec-sync isa-conformance abi-conformance wide-conformance constant-fold image secure-acceptance trust-conformance persistence-conformance persistence-audit trust-sanitize persistence-sanitize wide-sanitize device-conformance device-audit device-sanitize qualification repro roundtrip compatibility signed-smoke boundary acceptance operational sanitize size clean
all: core $(BUILD)/brctl $(BUILD)/bradmin $(BUILD)/brverify $(BUILD)/br_tests $(BUILD)/br_sizes
$(BUILD):
	mkdir -p $(BUILD)
core: $(BUILD)/brvm-core.o $(BUILD)/brtrust-core.o
$(BUILD)/brvm-core.o: $(CORE) src/brvm.h src/brtrust.h | $(BUILD)
	$(CC) -DBR_PRODUCTION -Isrc $(CFLAGS) -ffreestanding -c $(CORE) -o $@
$(BUILD)/brtrust-core.o: $(TRUST) src/brtrust.h src/brvm.h | $(BUILD)
	$(CC) -DBR_PRODUCTION -Isrc $(CFLAGS) -ffreestanding -c $(TRUST) -o $@
$(BUILD)/brctl: $(CORE) $(TRUST) $(PRODHOST) $(COMPILER) src/brvm.h src/brtrust.h src/brlctlc.h host/br_prod_host.h host/brctl.c | $(BUILD)
	$(CC) -DBR_PRODUCTION $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(PRODHOST) $(COMPILER) host/brctl.c -o $@ $(LDLIBS)
$(BUILD)/bradmin: $(CORE) $(TRUST) $(HOST) $(COMPILER) $(SIGN) src/brvm.h src/brtrust.h src/brlctlc.h host/br_host.h host/brsign.h host/bradmin.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) $(COMPILER) $(SIGN) host/bradmin.c -o $@ $(LDLIBS)
$(BUILD)/brverify: host/brverify.c src/brvm.h | $(BUILD)
	$(CC) -Isrc $(CFLAGS) host/brverify.c -o $@ $(LDLIBS)
$(BUILD)/br_tests: $(CORE) $(TRUST) $(HOST) $(COMPILER) src/brvm.h host/br_host.h src/brlctlc.h tests/test_main.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) $(COMPILER) tests/test_main.c -o $@ $(LDLIBS)
$(BUILD)/br_sizes: src/brvm.h host/br_sizes.c | $(BUILD)
	$(CC) -Isrc $(CFLAGS) host/br_sizes.c -o $@
$(BUILD)/br_bench: $(CORE) $(TRUST) $(HOST) src/brvm.h host/br_host.h host/br_bench.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) host/br_bench.c -o $@ $(LDLIBS)
bench: $(BUILD)/br_bench
	$(BUILD)/br_bench
$(BUILD)/br_isa_conformance: $(CORE) $(TRUST) $(HOST) src/brvm.h host/br_host.h tests/isa_abi_conformance.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/isa_abi_conformance.c -o $@ $(LDLIBS)
$(BUILD)/br_wide_conformance: $(CORE) $(TRUST) $(HOST) src/brvm.h host/br_host.h tests/wide_state_conformance.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/wide_state_conformance.c -o $@ $(LDLIBS)
wide-conformance: $(BUILD)/br_wide_conformance
	$(BUILD)/br_wide_conformance
constant-fold: $(BUILD)/bradmin $(BUILD)/brverify
	BRCTL=$(CURDIR)/$(BUILD)/bradmin BRVERIFY=$(CURDIR)/$(BUILD)/brverify sh tests/constant_fold.sh

$(BUILD)/br_persistence_conformance: $(CORE) $(TRUST) $(HOST) $(SIGN) src/brvm.h src/brtrust.h host/br_host.h host/brsign.h tests/persistence_conformance.c tests/qualification_keys.h | $(BUILD)
	$(CC) -DBR_PRODUCTION $(CPPFLAGS) -Itests $(CFLAGS) $(CORE) $(TRUST) $(HOST) $(SIGN) tests/persistence_conformance.c -o $@ $(LDLIBS)

$(BUILD)/br_trust_conformance: $(CORE) $(TRUST) $(HOST) $(SIGN) src/brvm.h src/brtrust.h host/br_host.h host/brsign.h tests/trust_conformance.c tests/qualification_keys.h | $(BUILD)
	$(CC) -DBR_PRODUCTION $(CPPFLAGS) -Itests $(CFLAGS) $(CORE) $(TRUST) $(HOST) $(SIGN) tests/trust_conformance.c -o $@ $(LDLIBS)

trust-conformance: image $(BUILD)/br_trust_conformance
	$(BUILD)/br_trust_conformance $(IMAGE) $(LEGACY42)
persistence-conformance: image $(BUILD)/br_persistence_conformance
	$(BUILD)/br_persistence_conformance $(IMAGE)
persistence-audit:
	sh tests/persistence_audit.sh
$(BUILD)/brctl.debug: $(CORE) $(TRUST) $(PRODHOST) $(COMPILER) host/brctl.c | $(BUILD)
	$(CC) -DBR_PRODUCTION $(CPPFLAGS) -std=c11 -O0 -g3 -Wall -Wextra -Werror -ffile-prefix-map=$(CURDIR)=. -fdebug-prefix-map=$(CURDIR)=. $(CORE) $(TRUST) $(PRODHOST) $(COMPILER) host/brctl.c -o $@ $(LDLIBS)
$(BUILD)/brctl.stripped: $(BUILD)/brctl
	cp $< $@ && strip $@
test: $(BUILD)/br_tests
	$(BUILD)/br_tests
image: $(BUILD)/brctl $(BUILD)/brverify examples/boot.lctlc
	$(BUILD)/brctl verify-lctlc examples/boot.lctlc
	$(BUILD)/brctl verify-lctlc src/CORE.lctlc
	$(BUILD)/brctl lctl-to-brir examples/boot.lctlc $(BRIR)
	$(BUILD)/brctl compile-lctlc examples/boot.lctlc $(IMAGE)
	python3 tools/provenance.py examples/boot.lctlc $(BRIR) $(IMAGE) $(PROVENANCE)
	$(BUILD)/brverify $(IMAGE) examples/boot.lctlc $(BRIR)
	test "$$(wc -c < $(IMAGE))" -le $(BRIM_MAX)
repro: $(BUILD)/brctl
	$(BUILD)/brctl lctl-to-brir examples/boot.lctlc $(BUILD)/a.brir
	$(BUILD)/brctl lctl-to-brir examples/boot.lctlc $(BUILD)/b.brir
	cmp $(BUILD)/a.brir $(BUILD)/b.brir
	$(BUILD)/brctl compile-lctlc examples/boot.lctlc $(BUILD)/a.brimg
	$(BUILD)/brctl compile-lctlc examples/boot.lctlc $(BUILD)/b.brimg
	cmp $(BUILD)/a.brimg $(BUILD)/b.brimg
roundtrip: image
	$(BUILD)/brverify --disasm $(IMAGE) > $(BUILD)/disasm.txt
	awk -F'|' 'NR>2 && $$1 ~ /^[0-9]+$$/ {print $$1"|"$$3"|"$$4"|"$$5"|"$$6"|"$$7"|"$$8"|"$$9"|"$$10"|"$$11}' $(BRIR) > $(BUILD)/brir.semantic
	awk -F'|' '{print $$1"|"$$2"|"$$3"|"$$4"|"$$5"|"$$6"|"$$7"|"$$8"|"$$9"|"$$10}' $(BUILD)/disasm.txt > $(BUILD)/disasm.semantic
	cmp $(BUILD)/brir.semantic $(BUILD)/disasm.semantic
compatibility: $(BUILD)/bradmin $(BUILD)/brctl
	$(BUILD)/bradmin run $(LEGACY41) | grep 'R2.low64=42'
	$(BUILD)/bradmin run $(LEGACY42) | grep 'R2.low64=42'
	$(BUILD)/bradmin run $(LEGACY46) | grep 'R2.low64=42'
	$(BUILD)/brctl verify-secure $(LEGACY46S)
	$(BUILD)/brctl secure-run $(LEGACY46S) | grep 'R2.low64=42'
signed-smoke: $(BUILD)/brctl $(BUILD)/bradmin $(BUILD)/brverify image
	$(BUILD)/bradmin keygen $(BUILD)/k.private $(BUILD)/k.public
	$(BUILD)/bradmin sign-image $(IMAGE) $(BUILD)/signed.brimg $(BUILD)/k.private
	$(BUILD)/bradmin verify-image $(BUILD)/signed.brimg $(BUILD)/k.public
	$(BUILD)/brverify $(BUILD)/signed.brimg examples/boot.lctlc $(BRIR)
	$(BUILD)/bradmin run-signed $(BUILD)/signed.brimg $(BUILD)/k.public | grep 'R2.low64=42'
boundary: core
	! grep -En '#include <(stdio|unistd|fcntl|openssl|windows|io)[.]h>|(^|[^A-Za-z_])(fopen|fread|fwrite|fsync|getenv|isatty|socket|connect|EVP_|RAND_|SHA256)[[:space:]]*[(]' src/brvm.c
	nm $(BUILD)/brvm-core.o $(BUILD)/brtrust-core.o | awk '$$2 ~ /^[bBdD]$$/ {bad=1} END {exit bad}'
	! nm -u $(BUILD)/brvm-core.o $(BUILD)/brtrust-core.o | grep -E 'EVP_|RAND_|SHA256|fopen|fread|fwrite|fsync|socket|connect|getenv|isatty'
	grep -q 'typedef struct br_hal' src/brvm.h
	grep -q 'N02' src/brvm.h
	! grep -Eiq 'keygen|sign-image|run-signed|--unsigned|--no-verify|bypass' host/brctl.c
	grep -q '#ifdef BR_PRODUCTION' src/brvm.c
semantic-test: $(BUILD)/bradmin $(BUILD)/brverify
	BRCTL=$(CURDIR)/$(BUILD)/bradmin BRVERIFY=$(CURDIR)/$(BUILD)/brverify PROVTOOL=$(CURDIR)/tools/provenance.py sh tests/semantic_tests.sh
spec-sync:
	python3 tests/spec_sync.py
isa-conformance: signed-smoke $(BUILD)/br_isa_conformance
	$(BUILD)/br_isa_conformance $(BUILD)/signed.brimg
abi-conformance: isa-conformance
secure-acceptance: image $(BUILD)/brctl $(SECURE_IMAGE)
	$(BUILD)/brctl verify-secure $(SECURE_IMAGE)
	$(BUILD)/brctl secure-run $(SECURE_IMAGE) | grep 'R2.low64=42'
	! $(BUILD)/brctl run $(IMAGE) >/dev/null 2>&1

acceptance: test image boundary repro roundtrip compatibility signed-smoke semantic-test spec-sync isa-conformance wide-conformance constant-fold secure-acceptance device-conformance device-audit
	$(BUILD)/bradmin run $(IMAGE) | grep 'R2.low64=42'
operational: acceptance size
qualification: operational trust-conformance persistence-conformance persistence-audit sanitize wide-sanitize trust-sanitize persistence-sanitize device-sanitize
sanitize: signed-smoke
	$(CC) $(CPPFLAGS) -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined -fno-omit-frame-pointer $(CORE) $(TRUST) $(HOST) $(COMPILER) tests/test_main.c -o $(BUILD)/br_tests_san $(LDLIBS)
	ASAN_OPTIONS=detect_leaks=0 $(BUILD)/br_tests_san
	$(CC) $(CPPFLAGS) -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined -fno-omit-frame-pointer $(CORE) $(TRUST) $(HOST) tests/isa_abi_conformance.c -o $(BUILD)/br_isa_conformance_san $(LDLIBS)
	ASAN_OPTIONS=detect_leaks=0 $(BUILD)/br_isa_conformance_san $(BUILD)/signed.brimg
wide-sanitize:
	$(CC) $(CPPFLAGS) -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined -fno-omit-frame-pointer $(CORE) $(TRUST) $(HOST) tests/wide_state_conformance.c -o $(BUILD)/br_wide_conformance_san $(LDLIBS)
	ASAN_OPTIONS=detect_leaks=0 $(BUILD)/br_wide_conformance_san
persistence-sanitize: image
	$(CC) -DBR_PRODUCTION $(CPPFLAGS) -Itests -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined -fno-omit-frame-pointer $(CORE) $(TRUST) $(HOST) $(SIGN) tests/persistence_conformance.c -o $(BUILD)/br_persistence_conformance_san $(LDLIBS)
	ASAN_OPTIONS=detect_leaks=0 $(BUILD)/br_persistence_conformance_san $(IMAGE)
trust-sanitize: image
	$(CC) -DBR_PRODUCTION $(CPPFLAGS) -Itests -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined -fno-omit-frame-pointer $(CORE) $(TRUST) $(HOST) $(SIGN) tests/trust_conformance.c -o $(BUILD)/br_trust_conformance_san $(LDLIBS)
	ASAN_OPTIONS=detect_leaks=0 $(BUILD)/br_trust_conformance_san $(IMAGE) $(LEGACY42)
size: image $(BUILD)/brctl.stripped $(BUILD)/brctl.debug $(BUILD)/br_sizes
	@echo stripped_executable_bytes=$$(wc -c < $(BUILD)/brctl.stripped)
	@echo debug_executable_bytes=$$(wc -c < $(BUILD)/brctl.debug)
	@echo brim_bytes=$$(wc -c < $(IMAGE)) ceiling=$(BRIM_MAX)
	@$(BUILD)/br_sizes
	@set -e; n=0; for f in $(PROD); do n=$$((n+$$(wc -c < $$f))); done; echo production_runtime_and_authority_source_bytes=$$n ceiling=$(DIST_MAX); test $$n -le $(DIST_MAX)
	@echo independent_verifier_source_bytes=$$(wc -c < host/brverify.c)
	@echo qualification_test_source_bytes=$$(wc -c < tests/semantic_tests.sh)
	@echo isa_abi_conformance_source_bytes=$$(wc -c < tests/isa_abi_conformance.c)
clean:
	rm -rf $(BUILD)

$(BUILD)/br_device_conformance: src/brvm.c src/brvm.h src/brtrust.c src/brtrust.h host/br_prod_host.c host/br_prod_host.h tests/device_io_conformance.c | $(BUILD)
	$(CC) -DBR_PRODUCTION -Isrc -Ihost $(CFLAGS) src/brvm.c src/brtrust.c host/br_prod_host.c tests/device_io_conformance.c -o $@ $(LDLIBS)
device-conformance: $(BUILD)/br_device_conformance
	$(BUILD)/br_device_conformance
device-audit:
	bash tests/device_boundary_audit.sh
device-sanitize:
	$(CC) -DBR_PRODUCTION -Isrc -Ihost -std=c11 -O1 -g -fsanitize=address,undefined -fno-omit-frame-pointer src/brvm.c src/brtrust.c host/br_prod_host.c tests/device_io_conformance.c -o $(BUILD)/br_device_sanitize $(LDLIBS)
	ASAN_OPTIONS=detect_leaks=1 $(BUILD)/br_device_sanitize

# BOTTLE ROCKET 4.8.0 safe release-candidate verification targets.
# Adversarial signing-key fixtures and full sanitizer/Q7 generation live only in the QUALIFIED candidate.
.PHONY: br480-independent br480-differential br480-opcode br480-property br480-fuzz br480-image-attacks br480-cross br480-soak-fast br480-security
$(BUILD)/br480_math_driver: $(CORE) $(TRUST) $(HOST) tests/br480_math_driver.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/br480_math_driver.c -o $@ $(LDLIBS)
$(BUILD)/br480_property: $(CORE) $(TRUST) $(HOST) tests/br480_property_conformance.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/br480_property_conformance.c -o $@ $(LDLIBS)
$(BUILD)/br480_fuzz: $(CORE) $(TRUST) $(HOST) tests/br480_fuzz.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/br480_fuzz.c -o $@ $(LDLIBS)
$(BUILD)/br480_opcode_edges: $(CORE) $(TRUST) $(HOST) tests/br480_opcode_edges.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/br480_opcode_edges.c -o $@ $(LDLIBS)
$(BUILD)/br480_soak: $(CORE) $(TRUST) $(HOST) tests/br480_soak.c | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(CORE) $(TRUST) $(HOST) tests/br480_soak.c -o $@ $(LDLIBS)
br480-independent: image $(BUILD)/bradmin $(BUILD)/brverify
	python3 independent/parser_compare.py --image $(IMAGE) --secure $(SECURE_IMAGE) --source examples/boot.lctlc --brir $(BRIR)
	python3 independent/brim_ref.py $(SECURE_IMAGE) --source examples/boot.lctlc --brir $(BRIR) --json
br480-differential: $(BUILD)/br480_math_driver
	python3 independent/differential_arithmetic.py --exe $(BUILD)/br480_math_driver
br480-opcode: isa-conformance $(BUILD)/br480_opcode_edges
	$(BUILD)/br480_opcode_edges
br480-property: $(BUILD)/br480_property
	$(BUILD)/br480_property
br480-fuzz: image $(BUILD)/bradmin $(BUILD)/br480_fuzz
	$(BUILD)/br480_fuzz $(IMAGE)
	python3 independent/fuzz_campaign.py --source examples/boot.lctlc --brir $(BRIR) --image $(IMAGE) --secure $(SECURE_IMAGE)
br480-image-attacks: image $(BUILD)/brverify $(BUILD)/brctl
	python3 independent/image_attacks.py --image $(IMAGE) --secure $(SECURE_IMAGE) --source examples/boot.lctlc --brir $(BRIR)
br480-cross: image
	python3 qualification/cross_platform_repro.py
br480-soak-fast: image $(BUILD)/br480_soak
	$(BUILD)/br480_soak $(IMAGE)
br480-security:
	python3 qualification/security_review_check.py

# BOTTLE ROCKET 4.9.0 release-candidate operational qualification overlay.
.PHONY: br490-freeze br490-profiles br490-hardening br490-core61 br490-brim51 br490-memory br490-performance br490-manifest br490-docs br490-replay-check br490-local-conformance br490-rc-local
br490-freeze:
	python3 qualification/br490_contract_checks.py freeze
br490-profiles:
	python3 qualification/br490_contract_checks.py profiles
br490-hardening:
	python3 qualification/br490_contract_checks.py hardening
br490-core61:
	python3 qualification/br490_core61.py
br490-brim51:
	python3 qualification/br490_brim51.py
br490-memory:
	python3 qualification/br490_memory.py
br490-performance:
	python3 qualification/br490_performance.py
br490-manifest:
	python3 qualification/br490_release_manifest.py
br490-docs:
	python3 qualification/br490_contract_checks.py docs
br490-replay-check:
	python3 replay/run.py --check-only
br490-local-conformance: operational br480-independent br480-differential br480-opcode br480-property br480-fuzz br480-image-attacks br480-soak-fast br480-security
br490-rc-local: br490-freeze br490-profiles br490-hardening br490-core61 br490-brim51 br490-memory br490-performance br490-docs br490-local-conformance br490-manifest br490-replay-check
	python3 qualification/br490_acceptance.py

.PHONY: profile-development profile-testing profile-production profile-constrained profile-diagnostic profile-recovery
profile-development: $(BUILD)/bradmin
	@echo BR_PROFILE=development artifact=$(BUILD)/bradmin
profile-testing: br480-property br480-opcode
	@echo BR_PROFILE=testing
profile-production: operational
	@echo BR_PROFILE=production secure_only=1 network_default=offline
profile-constrained: br490-core61 br490-brim51 secure-acceptance
	@echo BR_PROFILE=constrained core_ceiling=61000 brim_ceiling=51200
profile-diagnostic: secure-acceptance
	@echo BR_PROFILE=diagnostic diagnostics=capability-gated
profile-recovery: br480-soak-fast secure-acceptance
	@echo BR_PROFILE=recovery signed_control_required=BRCT/1

.PHONY: br500-environment br500-local br500-evidence br500-acceptance br500-release-check
br500-environment:
	python3 qualification/br500_environment.py
br500-local: operational br480-independent br480-differential br480-opcode br480-property br480-fuzz br480-image-attacks br480-soak-fast br480-security br490-core61 br490-brim51 br490-memory br490-performance br490-docs
	python3 qualification/cross_platform_repro.py > evidence/CROSS_PLATFORM_5_0.json
br500-acceptance:
	python3 qualification/br500_acceptance.py
br500-evidence:
	python3 qualification/br500_evidence.py
br500-release-check:
	python3 qualification/br500_release_bundle.py --verify
