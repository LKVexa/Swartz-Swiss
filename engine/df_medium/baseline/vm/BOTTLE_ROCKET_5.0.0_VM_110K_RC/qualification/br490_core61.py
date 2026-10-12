#!/usr/bin/env python3
import subprocess,json,hashlib,os
from pathlib import Path
R=Path(__file__).resolve().parents[1]; B=R/".build"; B.mkdir(exist_ok=True)
out=B/"brvm-core61.o"; stripped=B/"brvm-core61.stripped.o"
cmd=["cc","-DBR_PRODUCTION","-Isrc","-std=c11","-Os","-Wall","-Wextra","-Werror","-fno-common","-fstack-protector-strong","-ffreestanding","-c","src/brvm.c","-o",".build/brvm-core61.o"]
p=subprocess.run(cmd,cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
if p.returncode: print(p.stdout); raise SystemExit(p.returncode)
stripped.write_bytes(out.read_bytes())
p=subprocess.run(["strip","--strip-unneeded",str(stripped)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
if p.returncode: print(p.stdout); raise SystemExit(p.returncode)
n=stripped.stat().st_size; ceiling=61000
result={"record":"BOTTLE_ROCKET.Core61/4.9.0","counted_boundary":"stripped relocatable freestanding production execution core compiled solely from src/brvm.c; excludes trust/compiler/HAL/CLI, which remain covered by the separate 110000-byte production runtime-and-authority source boundary","compiler_command":" ".join(cmd),"raw_object_bytes":out.stat().st_size,"stripped_core_bytes":n,"ceiling_bytes":ceiling,"sha256":hashlib.sha256(stripped.read_bytes()).hexdigest(),"result":"PASS" if n<=ceiling else "BLOCKED"}
(R/"evidence/CORE61_4_9.json").write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
print(json.dumps(result,sort_keys=True))
if n>ceiling: raise SystemExit(2)
