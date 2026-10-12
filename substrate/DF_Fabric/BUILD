#!/bin/sh
# DF_Fabric/BUILD -- BUILD every node container found beside this one
# Offline. Nothing here opens a socket (NETWORK=deny, BACKEND=none).
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT"
PY="${PYTHON:-python3}"
exec "$PY" -B adapter/dfabric/cli.py fabric-build "$@"
