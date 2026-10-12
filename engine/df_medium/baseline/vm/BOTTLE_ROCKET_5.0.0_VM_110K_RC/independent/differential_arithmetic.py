#!/usr/bin/env python3
import argparse, hashlib, os, random, subprocess, tempfile
from pathlib import Path
W=1048576; MOD=1<<W; MASK=MOD-1
OPS={'ADD':7,'SUB':8,'MUL':9,'DIVU':10,'MODU':11,'AND':12,'OR':13,'XOR':14,'NOT':15,'SHL':16,'SHR':17}
MODES={'WRAP':0,'CHECKED':1,'SATURATE':2,'TRAPPING':3}
def sparse(path,x):
    with open(path,'w') as f:
        i=0
        while x:
            limb=x & ((1<<64)-1)
            if limb: f.write(f'{i} {limb:016x}\n')
            x >>=64; i+=1
def expected(op,mode,a,b,imm):
    trap=False; overflow=False
    if op=='ADD': raw=a+b; overflow=raw>MASK; val=raw&MASK
    elif op=='SUB': overflow=a<b; val=(a-b)&MASK
    elif op=='MUL': raw=a*b; overflow=raw>MASK; val=raw&MASK
    elif op=='DIVU':
        if b==0:return 0,True
        val=a//b
    elif op=='MODU':
        if b==0:return 0,True
        val=a%b
    elif op=='AND': val=a&b
    elif op=='OR': val=a|b
    elif op=='XOR': val=a^b
    elif op=='NOT': val=(~a)&MASK
    elif op=='SHL': raw=a<<imm;overflow=raw>MASK;val=raw&MASK
    elif op=='SHR': val=a>>imm
    else: raise AssertionError(op)
    if mode=='SATURATE' and overflow:
        val=0 if op=='SUB' else MASK
    if mode=='TRAPPING' and overflow: trap=True
    return val,trap
def parse_meta(s): return {x.split('=',1)[0]:x.split('=',1)[1] for x in s.strip().split() if '=' in x}
def run_case(exe,td,idx,op,mode,a,b,imm=0):
    af=td/f'a{idx}';bf=td/f'b{idx}';of=td/f'o{idx}';sparse(af,a);sparse(bf,b)
    cp=subprocess.run([exe,str(OPS[op]),str(MODES[mode]),str(imm),str(af),str(bf),str(of)],capture_output=True,text=True,timeout=15)
    if cp.returncode: raise RuntimeError(cp.stderr or cp.stdout)
    m=parse_meta(cp.stdout); got=int.from_bytes(of.read_bytes(),'little'); exp,trap=expected(op,mode,a,b,imm)
    if trap:
        if int(m['rc'])==0 or int(m['trap']) not in (5,6): raise AssertionError((idx,op,mode,'expected trap',m))
    else:
        if int(m['rc'])!=0 or got!=exp: raise AssertionError((idx,op,mode,got,exp,m))
    return hashlib.sha256(of.read_bytes()).hexdigest()
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--exe',default='.build/br480_math_driver');ap.add_argument('--seed',type=int,default=48003);a=ap.parse_args();r=random.Random(a.seed)
    cases=[]
    # Boundary and maximum-width vectors.
    vals=[0,1,2,(1<<64)-1,1<<64,(1<<127)+3,1<<(W-1),MASK,MASK-1]
    for x in vals:
        cases += [('ADD','WRAP',x,0,0),('XOR','WRAP',x,x,0),('OR','WRAP',x,0,0)]
    cases += [('ADD','TRAPPING',MASK,1,0),('ADD','SATURATE',MASK,1,0),('SUB','WRAP',0,1,0),('SUB','SATURATE',0,1,0),('MUL','WRAP',1<<(W-1),2,0),('MUL','TRAPPING',1<<(W-1),2,0),('SHL','WRAP',1,0,W-1),('SHR','WRAP',1<<(W-1),0,W-1)]
    # Signed/two's-complement bit patterns and random/modular vectors.
    signed=[-1,-2,-7,-(1<<63),(1<<63)-1]
    for x in signed:
        ux=x & MASK; cases += [('ADD','WRAP',ux,1,0),('XOR','WRAP',ux,MASK,0)]
    for _ in range(24):
        bits=r.choice([64,128,256,512,1024,4096]);x=r.getrandbits(bits);y=r.getrandbits(bits) or 1
        cases += [('ADD','WRAP',x,y,0),('SUB','WRAP',x,y,0),('MUL','WRAP',x,y,0),('XOR','WRAP',x,y,0)]
        if bits<=512: cases += [('DIVU','WRAP',x,y,0),('MODU','WRAP',x,y,0)]
    with tempfile.TemporaryDirectory(prefix='br480diff-') as t:
        td=Path(t); hashes=[]
        for i,c in enumerate(cases): hashes.append(run_case(a.exe,td,i,*c))
    print(f'BR-480 differential arithmetic: PASS vectors={len(cases)} seed={a.seed} max_width_bits={W} digest={hashlib.sha256("".join(hashes).encode()).hexdigest()}')
if __name__=='__main__': main()
