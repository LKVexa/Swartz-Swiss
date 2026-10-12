#!/usr/bin/env python3
import argparse,json,subprocess,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1]
req=["Makefile","spec/RELEASE_FREEZE_4_9.json","spec/RELEASE_PROFILES_4_9.json","examples/boot.lctlc","src/brvm.c","src/brvm.h","src/brlctlc.c","host/brctl.c","independent/brim_ref.py","qualification/br490_contract_checks.py","qualification/br490_core61.py","qualification/br490_brim51.py","qualification/br490_memory.py","qualification/br490_performance.py","qualification/br490_release_manifest.py","qualification/br490_acceptance.py","replay/EXPECTED_4_9.json","evidence/verify_br490.py"]
def run(c):
 p=subprocess.run(c,cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 print("$"," ".join(c)); print(p.stdout[-4000:])
 if p.returncode: raise SystemExit(p.returncode)
def main():
 a=argparse.ArgumentParser();a.add_argument("--check-only",action="store_true");a.add_argument("--execute",action="store_true");ns=a.parse_args()
 miss=[x for x in req if not (R/x).exists()]
 if miss: raise SystemExit("missing replay inputs: "+repr(miss))
 exp=json.loads((R/"replay/EXPECTED_4_9.json").read_text())
 if ns.check_only or not ns.execute:
  print(json.dumps({"suite":"BR-490_REPLAY_PACKAGE","requirements":7,"result":"PASS","independence_claimed":False,"expected":exp},sort_keys=True));return
 for c in [["make","clean","operational"],["make","br490-freeze","br490-profiles","br490-hardening","br490-core61","br490-brim51","br490-docs"],["python3","qualification/br490_release_manifest.py"]]:run(c)
 image=next((R/"deploy").glob("*.brimg")); secure=next((R/"deploy").glob("*.brsb"))
 ih=hashlib.sha256(image.read_bytes()).hexdigest()
 if ih!=exp["brim_sha256"]: raise SystemExit("BRIM hash mismatch")
 current=json.loads((R/"evidence/RELEASE_HASHES_4_9.json").read_text())
 checks={"source_sha256":current["source"]["sha256"],"binary_sha256":current["binary"]["sha256"],"compiler_sha256":current["compiler"]["sha256"],"verifier_sha256":current["verifier"]["sha256"],"test_suite_sha256":current["test_suite"]["sha256"],"specification_sha256":current["specification"]["sha256"],"evidence_sha256":current["evidence"]["sha256"]}
 for k,v in checks.items():
  if exp.get(k)!=v: raise SystemExit(k+" mismatch")
 run([str(R/".build/brctl"),"verify-secure",str(secure)])
 run([str(R/".build/brctl"),"secure-run",str(secure)])
 print(json.dumps({"suite":"BR-490_LOCAL_REPLAY","result":"PASS","independent_machine_operator":"NOT_PROVEN","brim_sha256":ih},sort_keys=True))
if __name__=="__main__":main()
