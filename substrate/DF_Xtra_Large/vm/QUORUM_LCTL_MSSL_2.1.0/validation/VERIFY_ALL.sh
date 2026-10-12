#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
python3 "$ROOT/validation/verify_repository.py"
LCTL="$ROOT/toolchain/lctl_1_6_1_rc1/START_LCTL_1_6_1.sh"
for f in "$ROOT"/execution/*.lctlc "$ROOT"/modules/*/execution/*.lctlc; do
  sh "$LCTL" column-verify "$f" >/dev/null
done
printf '%s\n' "PASS: all Columned LCTL plans lowered and canonical-verified"
