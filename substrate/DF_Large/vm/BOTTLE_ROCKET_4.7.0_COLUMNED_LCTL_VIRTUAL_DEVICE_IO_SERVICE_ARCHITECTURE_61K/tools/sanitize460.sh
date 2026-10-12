#!/usr/bin/env bash
set -euo pipefail
mkdir -p .build
run(){ n="$1"; shift; echo "=== $n compile ==="; cc -Isrc -Iadapters -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined "$@" -o ".build/san_$n"; echo "=== $n run ==="; ASAN_OPTIONS=detect_leaks=0 ".build/san_$n"; }
run br410 src/brvm.c adapters/br_memory_adapter.c adapters/br_file_adapter.c tests/test_410.c -DBR_DEVELOPMENT=1 -lcrypto
run br430 src/brvm.c adapters/br_memory_adapter.c tests/test_430.c -DBR_DEVELOPMENT=1
run br440 src/brvm.c src/brtrust.c adapters/br_file_adapter.c tests/test_440.c -lcrypto
run br450 src/brvm.c src/brtrust.c adapters/br_memory_adapter.c adapters/br_file_adapter.c tests/test_450.c -DBR_DEVELOPMENT=1 -lcrypto
run br460 src/brvm.c adapters/br_memory_adapter.c tests/test_460.c -DBR_DEVELOPMENT=1
echo SANITIZER_COMPONENTS_PASS
