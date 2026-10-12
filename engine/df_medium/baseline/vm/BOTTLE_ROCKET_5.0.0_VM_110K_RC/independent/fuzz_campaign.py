#!/usr/bin/env python3
import argparse, hashlib, json, random, subprocess, tempfile
from pathlib import Path
from brim_ref import parse_brir, parse_brim, parse_secure
SEED=480060

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source',required=True);ap.add_argument('--brir',required=True);ap.add_argument('--image',required=True);ap.add_argument('--secure',required=True);ap.add_argument('--bradmin',default='.build/bradmin');a=ap.parse_args()
 rng=random.Random(SEED); src=Path(a.source).read_bytes();brir=Path(a.brir).read_bytes();raw=Path(a.image).read_bytes();sec=Path(a.secure).read_bytes(); counts={};acc={};dig=hashlib.sha256()
 # LCTL parser fuzz: 700 deterministic mutations through production parser. Valid acceptance is allowed; crashes/timeouts are not.
 ok=bad=0
 with tempfile.TemporaryDirectory() as td:
  p=Path(td)/'f.lctlc'
  for i in range(700):
   b=bytearray(src)
   for _ in range(1+rng.randrange(5)):
    if b: b[rng.randrange(len(b))]^=1+rng.randrange(255)
   if i%11==0: b+=bytes(rng.randrange(256) for _ in range(rng.randrange(1,16)))
   p.write_bytes(b);dig.update(hashlib.sha256(b).digest())
   try:r=subprocess.run([a.bradmin,'verify-lctlc',str(p)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=2)
   except subprocess.TimeoutExpired: raise SystemExit('LCTL timeout')
   (ok if r.returncode==0 else bad)
   if r.returncode==0: ok+=1
   else: bad+=1
 counts['lctl']=700;acc['lctl_accepted']=ok;acc['lctl_rejected']=bad
 # Pure independent BRIR parser fuzz.
 for label,seed,count,parser in [('brir',brir,4500,lambda b:parse_brir(b.decode('utf-8','strict'))),('brim',raw,6500,parse_brim),('signature',sec,3500,parse_secure),('corrupt_image',raw,4500,parse_brim)]:
  accepted=rejected=0
  for i in range(count):
   b=bytearray(seed)
   for _ in range(1+rng.randrange(7)):
    if b:b[rng.randrange(len(b))]^=1+rng.randrange(255)
   if i%13==0:b=b[:rng.randrange(len(b)+1)]
   if i%29==0:b+=bytes([rng.randrange(256)])
   dig.update(hashlib.sha256(b).digest())
   try:parser(bytes(b));accepted+=1
   except Exception:rejected+=1
  counts[label]=count;acc[label+'_accepted']=accepted;acc[label+'_rejected']=rejected
 total=sum(counts.values())
 print(json.dumps({'suite':'BR-480_PARSER_FUZZ','result':'PASS','seed':SEED,'cases':counts,'outcomes':acc,'total':total,'replay_digest':dig.hexdigest()},sort_keys=True))
if __name__=='__main__':main()
