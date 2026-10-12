#!/usr/bin/env bash
set -euo pipefail
# Match actual networking functions without false positives such as br_mailbox_host_send().
bad='(^|[^A-Za-z0-9_])(socket|connect|accept|listen|getaddrinfo|send|recv)[[:space:]]*\('
if grep -nE '#include[[:space:]]*[<"](sys/socket|netdb|winsock)' src/brvm.c host/br_prod_host.c || grep -nE "$bad" src/brvm.c host/br_prod_host.c; then
  echo 'implicit host networking found' >&2; exit 1
fi
# Guest-facing external I/O services must route through dx, not direct HAL callbacks in e8.
python3 - <<'PY'
from pathlib import Path
s=Path('src/brvm.c').read_text();a=s.index('static int e8(');b=s.index('int br_vm_step',a);x=s[a:b]
for f in ['console_read(','console_write(','random_bytes(','clock_read(','monotonic_read(','storage_read(','storage_write(','device_call(']:
    if 'hal->'+f in x: raise SystemExit('direct HAL I/O remains in guest service dispatcher: '+f)
print('guest-host device boundary: PASS')
PY
echo 'network default/implicit networking audit: PASS'
