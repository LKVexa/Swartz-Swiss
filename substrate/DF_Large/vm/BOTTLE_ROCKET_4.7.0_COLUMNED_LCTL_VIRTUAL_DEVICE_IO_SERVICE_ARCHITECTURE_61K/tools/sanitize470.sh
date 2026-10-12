#!/usr/bin/env bash
set -euo pipefail
./tools/sanitize460.sh
run(){ n="$1"; shift; echo "=== $n compile ==="; cc -Isrc -Iadapters -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined "$@" -o ".build/san_$n"; echo "=== $n run ==="; ASAN_OPTIONS=detect_leaks=0 ".build/san_$n"; }
run br470 src/brvm.c adapters/br_memory_adapter.c tests/test_470.c -DBR_DEVELOPMENT=1
run br470p src/brvm.c adapters/br_memory_adapter.c tests/test_470_prod.c
run br470f src/brvm.c adapters/br_memory_adapter.c tests/test_470_apdu_fuzz.c
run br470x src/brvm.c adapters/br_file_adapter.c tests/test_470_file.c -DBR_DEVELOPMENT=1 -lcrypto
echo SANITIZER_470_PASS
