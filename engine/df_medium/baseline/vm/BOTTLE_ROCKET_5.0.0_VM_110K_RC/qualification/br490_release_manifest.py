#!/usr/bin/env python3
import hashlib,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def H(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def tree_hash(paths):
 rows=[]
 for base in paths:
  p=R/base
  if p.is_file(): rows.append((base,H(p)))
  elif p.exists():
   for f in sorted(x for x in p.rglob("*") if x.is_file() and ".build" not in x.parts and "__pycache__" not in x.parts and x.suffix!=".pyc"):
    rows.append((str(f.relative_to(R)),H(f)))
 h=hashlib.sha256()
 for n,d in rows:h.update((n+"\0"+d+"\n").encode())
 return h.hexdigest(),len(rows)
subprocess.run(["make",".build/brctl.stripped","image"],cwd=R,check=True,stdout=subprocess.DEVNULL)
image=next((R/"deploy").glob("*.brimg"))
source_hash,source_n=tree_hash(["src","host","include"])
# Test-suite hash covers executable test/qualification code, not generated result JSON.
test_paths=["tests","independent"]+[str(x.relative_to(R)) for x in sorted((R/"qualification").glob("*.py"))]
test_hash,test_n=tree_hash(test_paths)
spec_hash,spec_n=tree_hash(["spec","docs/4.9"])
evid_hash,evid_n=tree_hash(["evidence/BASELINE_4_9.json","evidence/CORE61_4_9.json","evidence/BRIM51_4_9.json","evidence/MEMORY_4_9.json","evidence/PERFORMANCE_4_9.json","evidence/SIZE.json","evidence/AUDIT_DIGEST.json","qualification/ACCEPTANCE_4_9.json"])
ver_hash,ver_n=tree_hash(["host/brverify.c","independent/brim_ref.py"])
res={"record":"BOTTLE_ROCKET.ReleaseHashes/4.9.0","source":{"sha256":source_hash,"files":source_n},"binary":{"path":".build/brctl.stripped","sha256":H(R/".build/brctl.stripped")},"brim":{"path":str(image.relative_to(R)),"sha256":H(image)},"compiler":{"path":"src/brlctlc.c","sha256":H(R/"src/brlctlc.c")},"verifier":{"sha256":ver_hash,"files":ver_n},"test_suite":{"sha256":test_hash,"files":test_n},"specification":{"sha256":spec_hash,"files":spec_n},"evidence":{"sha256":evid_hash,"files":evid_n}}
(R/"evidence/RELEASE_HASHES_4_9.json").write_text(json.dumps(res,indent=2,sort_keys=True)+"\n")
print(json.dumps(res,sort_keys=True))
