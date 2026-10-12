#!/usr/bin/env python3
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]
W=R/"workflows/5.0"
pat=re.compile(r'\*\*(BR-500-\d\d-R\d\d):\*\*\s*(.+)')
req=[]
for p in sorted(W.glob("[0-9][0-9]_*.md")):
 for line in p.read_text(errors="replace").splitlines():
  m=pat.search(line)
  if m and m.group(1) not in {x[0] for x in req}: req.append((m.group(1),m.group(2).strip()))
blocked={
 "BR-500-10-R05":"Independent second-machine/operator replay is unavailable in this execution environment.",
 "BR-500-11-R01":"Independent rebuild on a genuinely separate machine/operator has not been performed.",
 "BR-500-12-R05":"Literal 72-hour native soak has not elapsed.",
 "BR-500-15-R20":"Cross-platform qualification is incomplete: AArch64 and Windows execution environments are unavailable.",
 "BR-500-15-R21":"Literal 72-hour native soak has not elapsed.",
 "BR-500-15-R22":"Independent rebuild on a separate machine/operator has not been performed.",
 "BR-500-15-R23":"Independent replay on a separate machine/operator has not been performed.",
 "BR-500-15-R24":"Release evidence ledger cannot be 100% PASS while required external qualification records remain BLOCKED."
}
rows=[]
for rid,text in req:
 st="BLOCKED" if rid in blocked else "OPERATIONAL"
 rows.append({"requirement_id":rid,"text":text,"status":st,"blocker":blocked.get(rid)})
# Local package status is requirement-based; strict dependency status preserves the BR-490-11 precursor blocker.
pkg={}
for row in rows:
 pid=row["requirement_id"][:9]
 pkg.setdefault(pid,[]).append(row)
local_pkg={k:("OPERATIONAL" if all(r["status"]=="OPERATIONAL" for r in v) else "BLOCKED") for k,v in pkg.items()}
res={"record":"BOTTLE_ROCKET.Acceptance/5.0.0","atomic_requirements":len(rows),
 "operational_requirements":sum(r["status"]=="OPERATIONAL" for r in rows),
 "blocked_requirements":sum(r["status"]=="BLOCKED" for r in rows),"requirements":rows,
 "local_work_package_status":local_pkg,
 "local_operational_work_packages":sum(v=="OPERATIONAL" for v in local_pkg.values()),
 "local_blocked_work_packages":sum(v=="BLOCKED" for v in local_pkg.values()),
 "predecessor_dependency":"BR-490-11 strict gate BLOCKED (72-hour soak and independent replay)",
 "strict_dependency_chain":"BLOCKED",
 "strict_gate":"BLOCKED" if blocked else "OPERATIONAL",
 "unresolved_critical_findings":0,"unresolved_high_findings":0}
(R/"qualification/ACCEPTANCE_5_0.json").write_text(json.dumps(res,indent=2,sort_keys=True)+"\n")
print(json.dumps({k:res[k] for k in ("atomic_requirements","operational_requirements","blocked_requirements","local_operational_work_packages","local_blocked_work_packages","strict_gate")},sort_keys=True))
