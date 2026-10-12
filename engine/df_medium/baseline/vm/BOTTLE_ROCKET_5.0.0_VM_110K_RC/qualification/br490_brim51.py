#!/usr/bin/env python3
import subprocess,re,json,tempfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
h=(R/"src/brvm.h").read_text(); m=re.search(r'#define N20 (\d+)u',h)
if not m or int(m.group(1))!=51200: raise SystemExit("N20/BRIM ceiling mismatch")
if "n>N20" not in (R/"host/br_prod_host.c").read_text(): raise SystemExit("compiler/image-writer ceiling check missing")
vm=(R/"src/brvm.c").read_text()
if "length>N20" not in vm: raise SystemExit("loader/inspector ceiling check missing")
subprocess.run(["make","image",".build/brctl",".build/bradmin"],cwd=R,check=True,stdout=subprocess.DEVNULL)
image=next((R/"deploy").glob("*.brimg")); n=image.stat().st_size
if n>51200: raise SystemExit("native BRIM oversize")
bad=R/".build/BRIM51_OVERSIZE_51201.brimg"
data=image.read_bytes(); bad.write_bytes(data+b"\0"*(51201-len(data) if len(data)<51201 else 1))
checks=[]
cases=[([str(R/".build/brctl"),"inspect-image",str(bad)],"brctl inspect-image <BRIM51_OVERSIZE_51201>"),([str(R/".build/bradmin"),"run",str(bad)],"bradmin run <BRIM51_OVERSIZE_51201>")]
for cmd,label in cases:
 p=subprocess.run(cmd,cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 checks.append({"command":label,"exit_code":p.returncode})
 if p.returncode==0: raise SystemExit("oversized image accepted")
bad.unlink(missing_ok=True)
res={"record":"BOTTLE_ROCKET.BRIM51/4.9.0","profile_ceiling_bytes":51200,"native_brim_bytes":n,"compiler_enforcement":"PASS","loader_enforcement":"PASS","oversized_rejection":checks,"result":"PASS"}
(R/"evidence/BRIM51_4_9.json").write_text(json.dumps(res,indent=2,sort_keys=True)+"\n")
print(json.dumps(res,sort_keys=True))
