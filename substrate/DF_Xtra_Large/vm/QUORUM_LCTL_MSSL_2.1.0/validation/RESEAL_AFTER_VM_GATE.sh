#!/bin/sh
# Audit remediation (F2/F3): the VM's own gate regenerates vm/deploy and vm/evidence in place, which the root
# SHA256SUMS.txt binds. Run this instead of `make -C vm operational` alone so the tree stays self-consistent.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
( cd "$ROOT/vm" && make operational )
python3 "$ROOT/validation/reseal_tree.py"
sh "$ROOT/validation/VERIFY_ALL.sh"
sh "$ROOT/validation/VERIFY_L4_L9_OPEN_GATES.sh"
printf '%s\n' "PASS: VM gate, MSSL seals, root manifest, L4-L9 evidence all consistent"
