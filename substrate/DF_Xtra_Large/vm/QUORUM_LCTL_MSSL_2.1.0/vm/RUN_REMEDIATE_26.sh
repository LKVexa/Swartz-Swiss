#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
python3 "$ROOT/world/qualification/remediate_26.py"
exec python3 "$ROOT/world/qualification/qualify_world.py"
