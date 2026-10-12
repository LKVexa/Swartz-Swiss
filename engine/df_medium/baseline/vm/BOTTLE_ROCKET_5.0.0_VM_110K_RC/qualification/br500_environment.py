#!/usr/bin/env python3
import json,platform,shutil,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def v(cmd):
 try:return subprocess.check_output(cmd,text=True,stderr=subprocess.STDOUT).splitlines()[0]
 except Exception:return None
res={
 "record":"BOTTLE_ROCKET.Environment/5.0.0",
 "os":platform.platform(),"machine":platform.machine(),
 "gcc":v(["gcc","--version"]) if shutil.which("gcc") else None,
 "clang":v(["clang","--version"]) if shutil.which("clang") else None,
 "openssl":v(["openssl","version"]) if shutil.which("openssl") else None,
 "aarch64_runtime":bool(shutil.which("aarch64-linux-gnu-gcc") and shutil.which("qemu-aarch64")),
 "windows_runtime":bool(shutil.which("x86_64-w64-mingw32-gcc") and shutil.which("wine")),
 "valgrind":bool(shutil.which("valgrind")),
 "independent_machine_operator":False,
 "literal_72h_soak_completed":False
}
(R/"evidence/ENVIRONMENT_5_0.json").write_text(json.dumps(res,indent=2,sort_keys=True)+"\n")
print(json.dumps(res,sort_keys=True))
