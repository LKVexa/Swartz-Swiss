#!/usr/bin/env python3
import subprocess,json,statistics,re,shutil
from pathlib import Path
R=Path(__file__).resolve().parents[1]
subprocess.run(["make",".build/br_sizes",".build/brctl","wide-conformance"],cwd=R,check=True,stdout=subprocess.DEVNULL)
p=subprocess.run([str(R/".build/br_sizes")],cwd=R,stdout=subprocess.PIPE,text=True,check=True)
g=json.loads(p.stdout.strip())
secure=next((R/"deploy").glob("*.brsb"))
rss=[]
timer=shutil.which("/usr/bin/time") or "/usr/bin/time"
for _ in range(5):
 p=subprocess.run([timer,"-f","%M",str(R/".build/brctl"),"secure-run",str(secure)],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 if p.returncode: raise SystemExit(p.stdout+p.stderr)
 try:rss.append(int(p.stderr.strip().splitlines()[-1]))
 except: raise SystemExit("unable to parse RSS")
idle=g["vm_struct_bytes"]+g["zero_init_wide_heap_bytes"]
worst=g["vm_struct_bytes"]+g["legacy_dense_register_bytes"]+g["stack_byte_ceiling"]+g["scratch_byte_ceiling"]+g["device_buffer_ceiling"]
maxcfg=g["vm_struct_bytes"]+g["vm_wide_ceiling"]
res={"record":"BOTTLE_ROCKET.RuntimeMemory/4.9.0","idle_vm_bytes":idle,"typical_secure_run_peak_rss_median_kib":statistics.median(rss),"peak_rss_max_kib":max(rss),"maximum_configured_vm_bytes":maxcfg,"worst_case_maximum_width_accounted_bytes":worst,"wide_quota_ceiling_bytes":g["vm_wide_ceiling"],"quota_conformance":"PASS via make wide-conformance","rss_samples_kib":rss,"result":"PASS"}
(R/"evidence/MEMORY_4_9.json").write_text(json.dumps(res,indent=2,sort_keys=True)+"\n")
print(json.dumps(res,sort_keys=True))
