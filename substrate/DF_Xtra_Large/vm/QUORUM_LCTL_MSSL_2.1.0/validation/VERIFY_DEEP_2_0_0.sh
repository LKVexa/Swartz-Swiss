#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
python3 "$ROOT/qualification/run_qualification.py"
python3 "$ROOT/validation/verify_repository.py"
