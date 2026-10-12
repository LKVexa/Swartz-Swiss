#!/usr/bin/env bash
set -euo pipefail
mkdir -p .build
run_san(){
  local name="$1"; shift
  echo "=== $name compile ==="
  cc -Isrc -Iadapters -std=c11 -O1 -g -Wall -Wextra -Werror -fsanitize=address,undefined "$@" -o ".build/san_$name"
  echo "=== $name run ==="
  ASAN_OPTIONS=detect_leaks=0 ".build/san_$name"
}
run_san br410 src/brvm.c adapters/br_memory_adapter.c adapters/br_file_adapter.c tests/test_410.c -DBR_DEVELOPMENT=1 -lcrypto
run_san br430 src/brvm.c adapters/br_memory_adapter.c tests/test_430.c -DBR_DEVELOPMENT=1
run_san br440 src/brvm.c src/brtrust.c adapters/br_file_adapter.c tests/test_440.c -lcrypto
run_san br450 src/brvm.c src/brtrust.c adapters/br_memory_adapter.c adapters/br_file_adapter.c tests/test_450.c -DBR_DEVELOPMENT=1 -lcrypto
echo SANITIZER_COMPONENTS_PASS
