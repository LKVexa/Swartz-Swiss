#!/usr/bin/env python3
import json,re,sys,subprocess,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def fail(m): print("FAIL:",m); raise SystemExit(1)
def read(p): return (ROOT/p).read_text(errors="replace")
def freeze():
 f=json.loads(read("spec/RELEASE_FREEZE_4_9.json")); m=json.loads(read("MANIFEST.json"))
 checks=[
  (f["frozen"]["language"]==m["language"],"language"),
  (f["frozen"]["brir"]==m["brir"],"BRIR"),
  (f["frozen"]["core_abi"]==m["core_abi"],"core ABI"),
  (f["frozen"]["device_abi"]==m["device_abi"],"device ABI"),
  (f["frozen"]["secure_manifest"]==m["authority"]["secure_manifest"],"BRTM"),
  (f["frozen"]["transactional_persistence"]==m["authority"]["transactional_persistence"],"BRCR"),
  (f["frozen"]["guest_persistence"]==m["authority"]["guest_persistence"],"BRGD"),
  (m["isa"]["major"],"ISA major"),(m["isa"]["minor"]==1,"ISA minor"),(m["abi"]["major"]==1 and m["abi"]["minor"]==0,"ABI")
 ]
 for ok,n in checks:
  if not ok: fail("freeze mismatch "+n)
 h=read("src/brvm.h")
 for token in ["#define BR_ISA_MAJOR 4u","#define BR_ISA_MINOR 1u","#define BR_ABI_MAJOR 1u","#define BR_ABI_MINOR 0u","#define BR_CORE_ABI 0x00040700u","#define N20 51200u"]:
  if token not in h: fail("missing frozen token "+token)
 for op in f["frozen"]["host_abi"]["operations"]:
  if ("(*"+op+")") not in h: fail("host ABI operation missing "+op)
 print(json.dumps({"suite":"BR-490_FEATURE_FREEZE","requirements":6,"result":"PASS","format_change":False,"host_abi_operations":len(f["frozen"]["host_abi"]["operations"])},sort_keys=True))
def profiles():
 p=json.loads(read("spec/RELEASE_PROFILES_4_9.json"))["profiles"]
 need=["development","testing","production","constrained","diagnostic","recovery"]
 if sorted(p)!=sorted(need): fail("profile set")
 if p["production"]["raw_brim_execution"] or p["production"]["signing_admin"]: fail("production escape")
 if p["constrained"]["core_ceiling_bytes"]!=61000 or p["constrained"]["brim_ceiling_bytes"]!=51200: fail("constrained ceilings")
 if p["recovery"]["recovery_control"]!="signed BRCT/1 required": fail("recovery authority")
 print(json.dumps({"suite":"BR-490_RELEASE_PROFILES","requirements":6,"profiles":need,"result":"PASS"},sort_keys=True))
def hardening():
 ctl=read("host/brctl.c").lower()
 banned=["keygen","sign-image","run-signed","--unsigned","--no-verify","bypass"]
 for x in banned:
  if x in ctl: fail("production brctl contains "+x)
 prod=[ROOT/"src/brvm.c",ROOT/"src/brtrust.c",ROOT/"host/br_prod_host.c",ROOT/"host/brctl.c"]
 for p in prod:
  s=p.read_text(errors="replace")
  if re.search(r'\bassert\s*\(',s): fail("assert in production source "+str(p))
 keys=[p for p in ROOT.rglob("*") if p.is_file() and ("qualification_keys" in p.name or p.suffix.lower() in {".priv",".private",".pem"} and "public" not in p.name.lower()) and ".build" not in p.parts]
 if keys: fail("private/test key fixture in release: "+",".join(map(str,keys)))
 if "#ifdef BR_PRODUCTION" not in read("src/brvm.c"): fail("production policy missing")
 if "BR_DNET" not in read("src/brvm.c") or "BR_DOFF" not in read("src/brvm.c"): fail("network-off policy missing")
 print(json.dumps({"suite":"BR-490_PRODUCTION_HARDENING","requirements":7,"result":"PASS","private_key_fixtures":0,"production_bypass_tokens":0},sort_keys=True))
def docs():
 files=["ARCHITECTURE.md","COLUMNED_LCTL.md","ISA.md","ABI.md","BRIM.md","SECURITY.md","PERSISTENCE.md","DEVICE.md","BUILD.md","PORTING.md","OPERATIONAL.md","RECOVERY.md"]
 missing=[x for x in files if not (ROOT/"docs/4.9"/x).exists() or (ROOT/"docs/4.9"/x).stat().st_size<100]
 if missing: fail("docs missing "+repr(missing))
 print(json.dumps({"suite":"BR-490_DOCUMENTATION","requirements":12,"documents":files,"result":"PASS"},sort_keys=True))
if __name__=="__main__":
 if len(sys.argv)!=2 or sys.argv[1] not in ("freeze","profiles","hardening","docs"): raise SystemExit("usage: ... freeze|profiles|hardening|docs")
 globals()[sys.argv[1]]()
