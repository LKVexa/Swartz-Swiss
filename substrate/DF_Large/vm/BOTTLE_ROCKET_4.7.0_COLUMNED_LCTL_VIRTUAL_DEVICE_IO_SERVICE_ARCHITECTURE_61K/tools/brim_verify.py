#!/usr/bin/env python3
# Independent BRIM/1 verifier; intentionally does not import compiler code.
import argparse,hashlib,json,struct,sys
from pathlib import Path
HDR=80;REGS=16;CAPS=16;MODES=4;MEM=4096;STACK=256;WB=1048576
OPCAP=[]
for i in range(41):
 if i==23: OPCAP.append(0)
 elif i in (19,20,29,30): OPCAP.append(4)
 elif i in (21,22,32,33,35,36): OPCAP.append(8)
 elif i in tuple(range(7,19))+(24,25,26,27,28): OPCAP.append(2)
 elif i==39: OPCAP.append(32)
 elif i==40: OPCAP.append(16)
 else: OPCAP.append(1)
SVCCAP=[16,16,1,1,32,32,128,16,16,64,16,16,16,16,16,16,32,32,32,16,16,16]
def bad(x): raise ValueError(x)
def verify(path,manifest=None):
 b=Path(path).read_bytes()
 if len(b)<HDR or b[:4]!=b'BRIM' or struct.unpack_from('<H',b,14)[0]!=HDR:bad('magic/header')
 cur=b[4:7]==bytes([4,3,0]) and b[8]==2 and b[9]==21 and b[12]==41 and b[64:72]==b'BRLCTL43'
 leg=b[4:7]==bytes([4,2,0]) and b[8]==1 and b[9]==20 and b[12]==24 and b[64:72]==b'BRLCTL42'
 if not(cur or leg) or b[10]!=REGS or b[11]!=CAPS or b[13]!=MODES:bad('versioned ISA/ABI contract')
 ops=41 if cur else 24; svcs=22 if cur else 16
 req=struct.unpack_from('<Q',b,20)[0];cn=struct.unpack_from('<H',b,28)[0];dn=struct.unpack_from('<H',b,30)[0];sig=bool(b[7]&2);need=HDR+cn*16+dn+(64 if sig else 0)
 if not cn or cn>256 or dn>MEM or len(b)!=need:bad('bounds/length')
 if hashlib.sha256(b[HDR:HDR+cn*16+dn]).digest()!=b[32:64]:bad('payload hash')
 ins=[]
 for j in range(cn):
  op,mo,rd,ra,rb,cap,fl,imm=struct.unpack_from('<6BH Q',b,HDR+j*16)
  if op>=ops or mo>=MODES or max(rd,ra,rb)>=REGS or cap>=CAPS:bad('instruction field bounds')
  needcap=(SVCCAP[imm] if cur and op==23 and imm<22 else ([16,16,1,1,32,32,128,16,16,64,16,16,16,16,16,16][imm] if leg and op==23 and imm<16 else OPCAP[op]))
  if not needcap or not(req&needcap):bad('capability declaration')
  if op in (3,4,5,31,32) and imm>=cn:bad('branch/call target')
  if op in (19,20,29,30) and imm>MEM-8:bad('memory bound')
  if op==25 and imm>=WB:bad('bit index')
  if op==23 and imm>=svcs:bad('service id')
  if op==37 and (imm<1 or imm>27):bad('trap id')
  ins.append((op,imm))
 # Reachability for images that do not use indirect return/jump; CALL includes return edge.
 edges=[[] for _ in ins]
 for j,(op,imm) in enumerate(ins):
  if op in (6,33,34,40) or (op==23 and imm==15):continue
  if op==3:edges[j]=[imm]
  elif op in (4,5,31):
   if j+1>=cn:bad('conditional falloff')
   edges[j]=[imm,j+1]
  elif op==32:
   edges[j]=[imm]+([j+1] if j+1<cn else [])
  elif j+1<cn:edges[j]=[j+1]
  else:bad('falloff')
 seen=set();q=[0]
 while q:
  j=q.pop()
  if j in seen:continue
  seen.add(j);q.extend(edges[j])
 if len(seen)!=cn:bad('unreachable code')
 out={'status':'PASS','image':str(path),'profile':'4.3-current' if cur else '4.2-legacy','instructions':cn,'signed':sig,'requested_caps':req,'checks':{'header':True,'payload_sha256':True,'instruction_semantics':True,'cfg':True,'capabilities':True,'versioned_isa_abi':True},'sha256':hashlib.sha256(b).hexdigest()}
 if manifest:
  m=json.loads(Path(manifest).read_text())
  if out['sha256']!=m.get('brim_sha256') or b[72:80].hex()!=m.get('header_source_hash_prefix'):bad('manifest provenance')
  out['checks']['manifest']=True
 return out
def main():
 a=argparse.ArgumentParser();a.add_argument('image');a.add_argument('--manifest');x=a.parse_args()
 try:print(json.dumps(verify(x.image,x.manifest),sort_keys=True))
 except Exception as e:print('ERROR:',e,file=sys.stderr);sys.exit(1)
if __name__=='__main__':main()
