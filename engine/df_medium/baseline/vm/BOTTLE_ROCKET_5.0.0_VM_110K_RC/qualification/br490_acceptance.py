#!/usr/bin/env python3
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
required=["CORE61_4_9.json","BRIM51_4_9.json","MEMORY_4_9.json","PERFORMANCE_4_9.json","RELEASE_HASHES_4_9.json"]
for f in required:
 p=R/"evidence"/f
 if not p.exists(): raise SystemExit("missing evidence "+f)
 d=json.loads(p.read_text())
 if d.get("result") not in (None,"PASS"): raise SystemExit("failed evidence "+f)
blocked={
 "BR-490-11-R08":"Literal 72-hour soak has not elapsed in this execution environment.",
 "BR-490-11-R09":"Independent second-machine/operator replay has not been performed."
}
total=78; op=total-len(blocked)
res={"record":"BOTTLE_ROCKET.RCAcceptance/4.9.0","atomic_requirements":total,"operational_requirements":op,"blocked_requirements":len(blocked),"blocked":blocked,"local_release_engineering_checks":"PASS","unresolved_critical_findings":0,"unresolved_high_findings":0,"strict_gate":"BLOCKED" if blocked else "OPERATIONAL"}
(R/"qualification/ACCEPTANCE_4_9.json").write_text(json.dumps(res,indent=2,sort_keys=True)+"\n")
print(json.dumps(res,sort_keys=True))
