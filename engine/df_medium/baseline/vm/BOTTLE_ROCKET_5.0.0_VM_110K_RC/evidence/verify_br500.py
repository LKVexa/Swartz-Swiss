#!/usr/bin/env python3
import hashlib,json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/"evidence/br500";W=R/"workflows/5.0"
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
ids=[]
for p in sorted(W.glob("[0-9][0-9]_*.md")):
 for rid in re.findall(r'BR-500-\d\d-R\d\d',p.read_text(errors="replace")):
  if rid not in ids:ids.append(rid)
seen=[];op=bl=0
for i in range(1,16):
 pid=f"BR-500-{i:02d}";rp=D/f"{pid}_requirements.json";lp=D/f"{pid}_tests.log";ap=D/f"{pid}_audit.md";mp=D/f"{pid}_manifest.sha256"
 for p in (rp,lp,ap,mp):
  if not p.exists():raise SystemExit("missing "+str(p))
 for line in mp.read_text().splitlines():
  h,name=line.split("  ",1);p=D/name
  if not p.exists() or H(p)!=h:raise SystemExit("manifest mismatch "+str(p))
 rows=json.loads(rp.read_text())
 for r in rows:
  if r["requirement_id"] in seen:raise SystemExit("duplicate "+r["requirement_id"])
  seen.append(r["requirement_id"])
  if r["sha256"]!=H(R/r["evidence_path"]):raise SystemExit("evidence hash mismatch "+r["requirement_id"])
  if r["status"]=="OPERATIONAL":
   if r["exit_code"]!=0:raise SystemExit("operational nonzero "+r["requirement_id"])
   op+=1
  elif r["status"]=="BLOCKED":bl+=1
  else:raise SystemExit("unsupported status "+r["status"])
if set(seen)!=set(ids) or len(ids)!=96:raise SystemExit(f"requirement coverage mismatch workflow={len(ids)} ledger={len(seen)}")
accept=json.loads((R/"qualification/ACCEPTANCE_5_0.json").read_text())
if accept["operational_requirements"]!=op or accept["blocked_requirements"]!=bl:raise SystemExit("acceptance count mismatch")
print(f"BR-500 evidence verification: PASS packages=15 requirements={len(seen)} operational={op} blocked={bl} evidence_integrity=PASS strict_gate={accept['strict_gate']}")
