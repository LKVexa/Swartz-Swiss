#!/usr/bin/env python3
import argparse, hashlib, json, struct, subprocess, tempfile
from pathlib import Path
from brim_ref import parse_brim, parse_secure, VerifyError, HEADER, INSN, PROV, TRUST

def run(cmd):
 p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);return p.returncode

def fix_payload(b):
 cc=int.from_bytes(b[28:30],'little');dl=int.from_bytes(b[30:32],'little');ext=int.from_bytes(b[24:28],'little')
 if ext>4096 or cc>256: return b
 end=HEADER+cc*INSN+dl+ext
 if end<=len(b): b[32:64]=hashlib.sha256(bytes(b[HEADER:end])).digest()
 return b

def expect_reject(name,b,kind,source,brir,brverify,brctl,td,source_binding=False):
 p=Path(td)/(name+('.brsb' if kind=='secure' else '.brimg'));p.write_bytes(b)
 try:
  x=parse_secure(b) if kind=='secure' else parse_brim(b)
  if source_binding:
   image=x['brim'] if isinstance(x,dict) else x.__dict__
   got=image['source_sha256'] if isinstance(image,dict) else image.source_sha256
   if got!=hashlib.sha256(Path(source).read_bytes()).hexdigest(): raise VerifyError('source hash mismatch')
  py=False
 except Exception: py=True
 if kind=='secure': c=run([brctl,'verify-secure',str(p)])
 else: c=run([brverify,str(p),source,brir])
 if not py or c==0: raise RuntimeError(f'{name}: reject mismatch python={py} c_rc={c}')
 return {'id':name,'python':'REJECT','c':'REJECT'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--image',required=True);ap.add_argument('--secure',required=True);ap.add_argument('--source',required=True);ap.add_argument('--brir',required=True);ap.add_argument('--brverify',default='.build/brverify');ap.add_argument('--brctl',default='.build/brctl');a=ap.parse_args()
 raw=Path(a.image).read_bytes();sec=Path(a.secure).read_bytes(); results=[]
 with tempfile.TemporaryDirectory() as td:
  # R01 header
  b=bytearray(raw);b[0]^=0x20;results.append(expect_reject('BR-480-10-R01',bytes(b),'raw',a.source,a.brir,a.brverify,a.brctl,td))
  # R02 payload (do not repair payload digest)
  b=bytearray(raw);b[HEADER+1]^=1;results.append(expect_reject('BR-480-10-R02',bytes(b),'raw',a.source,a.brir,a.brverify,a.brctl,td))
  # R03 signature chain
  b=bytearray(sec);b[-1]^=1;results.append(expect_reject('BR-480-10-R03',bytes(b),'secure',a.source,a.brir,a.brverify,a.brctl,td))
  # R04 source hash, repair ordinary payload hash so semantic provenance check is tested
  cc=int.from_bytes(raw[28:30],'little');dl=int.from_bytes(raw[30:32],'little');poff=HEADER+cc*INSN+dl
  b=bytearray(raw);b[poff+24]^=1;fix_payload(b);results.append(expect_reject('BR-480-10-R04',bytes(b),'raw',a.source,a.brir,a.brverify,a.brctl,td,True))
  # R05 image version header vs provenance
  b=bytearray(raw);struct.pack_into('<I',b,16,int.from_bytes(raw[16:20],'little')+1);results.append(expect_reject('BR-480-10-R05',bytes(b),'raw',a.source,a.brir,a.brverify,a.brctl,td))
  # R06 issuer id, signature remains old
  b=bytearray(sec); rawlen=len(sec)-TRUST; b[rawlen+44]^=1;results.append(expect_reject('BR-480-10-R06',bytes(b),'secure',a.source,a.brir,a.brverify,a.brctl,td))
  # R07 truncation
  results.append(expect_reject('BR-480-10-R07',raw[:-1],'raw',a.source,a.brir,a.brverify,a.brctl,td))
  # R08 extension/trailing byte forbidden by exact length
  results.append(expect_reject('BR-480-10-R08',raw+b'X','raw',a.source,a.brir,a.brverify,a.brctl,td))
  # R09 duplicate BRPV section / duplicated data forbidden by exact length
  results.append(expect_reject('BR-480-10-R09',raw+raw[poff:poff+PROV],'raw',a.source,a.brir,a.brverify,a.brctl,td))
 print(json.dumps({'suite':'BR-480_IMAGE_ATTACKS','result':'PASS','requirements':9,'attacks':results},sort_keys=True))
if __name__=='__main__': main()
