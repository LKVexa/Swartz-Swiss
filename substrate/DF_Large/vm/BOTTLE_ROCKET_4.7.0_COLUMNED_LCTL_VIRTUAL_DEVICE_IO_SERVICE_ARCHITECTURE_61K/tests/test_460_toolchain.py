#!/usr/bin/env python3
import json,subprocess,tempfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];T=R/'tools/lctl430.py';B=(R/'src/BOOT.lctlc').read_text()
def run(src,expect=True):
 with tempfile.TemporaryDirectory() as d:
  p=Path(d)/'x.lctlc';o=Path(d)/'x.brir.json';p.write_text(src)
  q=subprocess.run(['python3',str(T),'brir',str(p),str(o)],text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
  if expect:
   assert q.returncode==0,q.stdout;return json.loads(o.read_text())
  assert q.returncode!=0,q.stdout
x=run(B.replace('imm=42','imm=40+2'));assert x['instructions'][0]['imm']==42
run(B.replace('imm=42','imm=18446744073709551615+1'),False)
print(json.dumps({'suite':'BR-460-toolchain','tests':2,'failures':0,'result':'PASS'}))
