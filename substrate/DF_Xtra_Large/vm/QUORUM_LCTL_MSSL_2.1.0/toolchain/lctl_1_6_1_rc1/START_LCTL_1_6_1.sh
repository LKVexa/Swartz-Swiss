#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec java -jar "$ROOT/runtime/bin/lctl-hyperfederated.jar" "$@"
