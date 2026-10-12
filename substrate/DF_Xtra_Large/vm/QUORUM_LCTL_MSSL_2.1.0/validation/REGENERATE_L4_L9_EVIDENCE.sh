#!/usr/bin/env sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
python3 "$ROOT/qualification/open_gate_runtime.py"
echo "Evidence regenerated. Rebuild SHA256SUMS.txt before treating repository-integrity verification as current."
