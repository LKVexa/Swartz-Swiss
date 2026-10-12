#!/usr/bin/env python3
import json,re,hashlib,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
h=(R/'src/brvm.h').read_text();c=(R/'src/brvm.c').read_text();f=(R/'adapters/br_file_adapter.c').read_text();m=(R/'adapters/br_memory_adapter.c').read_text();s=json.loads((R/'spec/DEVICE_ABI.json').read_text())
checks={
'device_abi': all(x in h for x in ['BR_DEVICE_ABI_VERSION=1u','BR_DEVICE_CONSOLE=1u','BR_DEVICE_NETWORK','BR_DEVICE_WALL_CLOCK']),
'device_contract': all(x in c for x in ['case BR_SVC_DEVICE_CALL','BR_DEVICE_BUFFER_BYTES','BR_TRAP_DEVICE','v->S[di].rc_']),
'console': all(x in c for x in ['BR_SVC_CONSOLE_WRITE','BR_SVC_CONSOLE_READ']) and 'fflush(stdout)' in f,
'block': all(x in c for x in ['BR_SVC_STORAGE_READ','BR_SVC_STORAGE_WRITE','BR_STORAGE_OBJECT_BYTES-48u']) and all(x in f for x in ['fsync','rename(a,b)','ds(b)']),
'monotonic': all(x in c for x in ['BR_SVC_MONOTONIC','br_vm_save','br_vm_recover']) and 'mc_' in h,
'entropy': 'BR_SVC_ENTROPY' in c and 'RAND_bytes' in f and 'br_hal_deterministic' in m,
'clock': 'BR_SVC_TIMER' in c and 'CLOCK_MONOTONIC' in f and 'BR_DEVICE_WALL_CLOCK' in h and 'id==BR_DEVICE_WALL_CLOCK' in f and 'id==BR_DEVICE_WALL_CLOCK' in m,
'mailbox': all(x in c for x in ['br_vm_mailbox_host_put','br_vm_mailbox_host_get','BR_SVC_MAILBOX_PUT','BR_SVC_MAILBOX_GET','v->am_']),
'apdu': all(x in c for x in ['BR_SW_BAD_LENGTH','BR_SW_SECURITY','BR_SW_REPLAY','rawload(cmd,req[0])']) and (R/'tests/fuzz/apdu/CORPUS.sha256').exists(),
'diagnostic': all(x in c for x in ['case BR_APDU_STATUS','case BR_APDU_STATE','case BR_APDU_DIAG','case BR_APDU_HELLO','v->ih_','v->mu_','v->stu_']),
'network_default_off': not re.search(r'\b(socket|connect|send|recv|bind|listen|accept)\s*\(',c+f+m) and s['devices'][7]['default_present'] is False,
'discovery': 'case BR_SVC_DEVICE_ENUM' in c and 'BR_DEVICE_ABI_VERSION' in c,
'quotas': all(x in c for x in ['>v->sb_','AH(len,1)','AH(len,i->imm==Z42?2:0)','if(v->ml_)'])
}
# verify corpus hash file exactly
lines=(R/'tests/fuzz/apdu/CORPUS.sha256').read_text().splitlines(); corpus_ok=True
for ln in lines:
 hv,n=ln.split(None,1); p=R/'tests/fuzz/apdu'/n.strip();corpus_ok &= p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==hv
checks['fuzz_corpus_integrity']=corpus_ok and len(lines)>=8
bad=[k for k,v in checks.items() if not v]
print(json.dumps({'suite':'BR-470-STATIC','tests':len(checks),'failures':len(bad),'failed':bad,'result':'FAIL' if bad else 'PASS'},sort_keys=True))
sys.exit(bool(bad))
