#!/usr/bin/env python3
import hashlib,json,re,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]; D=R/"evidence/br490"
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
rows=[]
for f in sorted(D.glob("BR-490-??_requirements.json")):
 a=json.loads(f.read_text())
 if not isinstance(a,list): raise SystemExit("requirements file not list: "+str(f))
 rows.extend(a)
for r in rows:
 p=R/r["evidence_path"]
 if not p.exists(): raise SystemExit("missing evidence "+str(p))
 if H(p)!=r["sha256"]: raise SystemExit("evidence hash mismatch "+r["requirement_id"])
for mf in sorted(D.glob("BR-490-??_manifest.sha256")):
 for line in mf.read_text().splitlines():
  if not line.strip():continue
  h,path=line.split("  ",1); p=R/path
  if not p.exists() or H(p)!=h: raise SystemExit("package manifest mismatch "+path)
ids=[r["requirement_id"] for r in rows]
if len(rows)!=78 or len(set(ids))!=78: raise SystemExit(f"requirement count/uniqueness failure {len(rows)}/{len(set(ids))}")
op=sum(r["status"]=="OPERATIONAL" for r in rows); blocked=sum(r["status"]=="BLOCKED" for r in rows)
expected={"BR-490-11-R08","BR-490-11-R09"}
actual={r["requirement_id"] for r in rows if r["status"]=="BLOCKED"}
if (op,blocked)!=(76,2) or actual!=expected: raise SystemExit(f"status model mismatch op={op} blocked={blocked} {actual}")
print(json.dumps({"suite":"BR-490_EVIDENCE_VERIFIER","packages":11,"requirements":78,"operational":76,"blocked":2,"evidence_integrity":"PASS","strict_gate":"BLOCKED","blocked_ids":sorted(actual)},sort_keys=True))
