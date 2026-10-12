#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
python3 "$ROOT/toolchain/quorum_vm.py" compile "$ROOT/src/WORLD_DEMO.lctlc" "$ROOT/world/evidence/WORLD_DEMO.payload.json" --brir "$ROOT/world/evidence/WORLD_DEMO.brir.json"
python3 "$ROOT/toolchain/quorum_vm.py" sign "$ROOT/world/evidence/WORLD_DEMO.payload.json" --key "$ROOT/keys/DEV_ONLY_private_seed.hex" --key-id dev-root --out "$ROOT/world/evidence/WORLD_DEMO.signed.brimg"
exec python3 "$ROOT/toolchain/quorum_vm.py" run "$ROOT/world/evidence/WORLD_DEMO.signed.brimg" --trust "$ROOT/keys/TRUST_STORE.json" --snapshot "$ROOT/world/evidence/WORLD_DEMO.snapshot.json" --trace "$ROOT/world/evidence/WORLD_DEMO.trace.json"
