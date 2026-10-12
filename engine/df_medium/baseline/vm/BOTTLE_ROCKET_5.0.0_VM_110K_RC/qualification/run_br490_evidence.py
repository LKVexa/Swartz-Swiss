#!/usr/bin/env python3
import subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]; D=R/"evidence/br490";D.mkdir(parents=True,exist_ok=True)
jobs=[
("BR-490-01",["python3","qualification/br490_contract_checks.py","freeze"]),
("BR-490-02",["python3","qualification/br490_contract_checks.py","profiles"]),
("BR-490-03",["python3","qualification/br490_contract_checks.py","hardening"]),
("BR-490-04",["python3","qualification/br490_core61.py"]),
("BR-490-05",["python3","qualification/br490_brim51.py"]),
("BR-490-06",["python3","qualification/br490_memory.py"]),
("BR-490-07",["python3","qualification/br490_performance.py"]),
("BR-490-08",["python3","qualification/br490_release_manifest.py"]),
("BR-490-09",["python3","qualification/br490_contract_checks.py","docs"]),
("BR-490-10",["python3","replay/run.py","--check-only"]),
]
for ident,cmd in jobs:
 p=subprocess.run(cmd,cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 text="COMMAND: "+" ".join(cmd)+"\n"+p.stdout+"\nEXIT_CODE: "+str(p.returncode)+"\n"
 (D/(ident+"_tests.log")).write_text(text)
 print(ident,p.returncode)
 if p.returncode: raise SystemExit(p.returncode)
