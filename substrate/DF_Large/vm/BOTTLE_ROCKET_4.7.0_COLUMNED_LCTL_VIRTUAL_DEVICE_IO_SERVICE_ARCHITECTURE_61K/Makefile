CC?=cc
AR?=ar
I=-Isrc -Iadapters
F=-std=c11 -O2 -Wall -Wextra -Werror -fno-common -fstack-protector-strong
B=.build
V=src/brvm.c
T=src/brtrust.c
M=adapters/br_memory_adapter.c
P=adapters/br_file_adapter.c
D=deploy/BOTTLE_ROCKET_SIM_CORE_4.7.0
L=python3 tools/lctl430.py
C=$(CC) $(I) $(F)
all: operational
.PHONY: brctl-dev bench regenerate-evidence
regenerate-evidence:;python3 tools/regenerate_evidence470.py
$(B):;mkdir -p $@
$(B)/libbrvm_core.a: $(V) $(T) src/brvm.h src/brtrust.h|$(B);$(C) -c $(V) -o $(B)/v.o;$(C) -c $(T) -o $(B)/t.o;$(AR) rcs $@ $(B)/v.o $(B)/t.o
core: $(B)/libbrvm_core.a
core-scan:;! grep -En '#include <(stdio|unistd|fcntl|sys/|openssl)|\b(fopen|fread|fwrite|open|read|write|rename|unlink|fsync|getenv|isatty|EVP_|RAND_)\b' $(V) $(T)
$(B)/brctl: $(V) $(T) $(P) host/brctl.c|$(B);$(C) $(V) $(T) $(P) host/brctl.c -o $@ -lcrypto
$(B)/brctl-dev: $(V) $(T) $(P) host/brctl.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(T) $(P) host/brctl.c -o $@ -lcrypto
brctl-dev: $(B)/brctl-dev
$(B)/br_bench: $(V) tools/br_bench.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) tools/br_bench.c -o $@
bench: $(B)/br_bench;$(B)/br_bench
$(B)/t410: $(V) $(M) $(P) tests/test_410.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(M) $(P) tests/test_410.c -o $@ -lcrypto
$(B)/t430: $(V) $(M) tests/test_430.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(M) tests/test_430.c -o $@
$(B)/t440: $(V) $(T) $(P) tests/test_440.c|$(B);$(C) $(V) $(T) $(P) tests/test_440.c -o $@ -lcrypto
$(B)/t450: $(V) $(T) $(M) $(P) tests/test_450.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(T) $(M) $(P) tests/test_450.c -o $@ -lcrypto
$(B)/thw: $(V) $(T) $(P) tests/test_440_hw.c|$(B);$(C) -DBR_TRUST_HARDWARE_ANCHOR=1 $(V) $(T) $(P) tests/test_440_hw.c -o $@ -lcrypto
$(B)/t460: $(V) $(M) tests/test_460.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(M) tests/test_460.c -o $@
$(B)/t470: $(V) $(M) tests/test_470.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(M) tests/test_470.c -o $@
$(B)/t470p: $(V) $(M) tests/test_470_prod.c|$(B);$(C) $(V) $(M) tests/test_470_prod.c -o $@
$(B)/t470f: $(V) $(M) tests/test_470_apdu_fuzz.c|$(B);$(C) $(V) $(M) tests/test_470_apdu_fuzz.c -o $@
$(B)/t470x: $(V) $(P) tests/test_470_file.c|$(B);$(C) -DBR_DEVELOPMENT=1 $(V) $(P) tests/test_470_file.c -o $@ -lcrypto
test: $(B)/t410 $(B)/t430 $(B)/t440 $(B)/t450 $(B)/thw $(B)/t460 $(B)/t470 $(B)/t470p $(B)/t470f $(B)/t470x;@for x in $^;do $$x||exit;done
image:;@$L check src/BOOT.lctlc --executable;mkdir -p deploy;$L compile src/BOOT.lctlc $(D).brimg --factory --manifest $(D).provenance.json --brir-out $(D).brir.json;python3 tools/brim_verify.py $(D).brimg --manifest $(D).provenance.json
verify: core core-scan test image $(B)/brctl;@test "$$(wc -c < $(D).brimg)" -le 51200;$L provenance src/BOOT.lctlc $(D).brimg $(D).provenance.json;python3 tests/test_430_semantic.py;python3 tests/test_460_toolchain.py;python3 tests/test_470_static.py
operational: verify
sanitize:;./tools/sanitize470.sh
qualify: operational size;python3 tools/qualify470.py --assemble;python3 tools/regenerate_evidence470.py --contents-only
qualify-full: sanitize qualify
size:;@n=$$({ find src -type f \( -name '*.c' -o -name '*.h' -o -name 'BOOT.lctlc' \) -printf '%s\n';find adapters -type f -printf '%s\n';}|awk '{s+=$$1}END{print s+0}');r=$$({ find src adapters spec -type f -printf '%s\n';stat -c '%s' Makefile;}|awk '{s+=$$1}END{print s+0}');echo production_exec_source_bytes=$$n ceiling_lt=61000 boundary=runtime_c_h+all_adapters+authoritative_BOOT_LCTL;echo repository_build_spec_bytes=$$r informational_only=1;test $$n -lt 61000
clean:;rm -rf $(B)
