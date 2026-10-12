#!/usr/bin/env python3
import argparse, json, subprocess, tempfile, sys, hashlib
from pathlib import Path
from brim_ref import parse_brim, parse_secure, VerifyError

def run(cmd):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    return p.returncode,p.stdout.strip(),p.stderr.strip()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--image',required=True);ap.add_argument('--secure',required=True)
    ap.add_argument('--source',required=True);ap.add_argument('--brir',required=True)
    ap.add_argument('--bradmin',default='.build/bradmin');ap.add_argument('--brverify',default='.build/brverify')
    a=ap.parse_args()
    raw=Path(a.image).read_bytes(); sec=Path(a.secure).read_bytes()
    py=parse_brim(raw)
    pysec=parse_secure(sec)
    rc,out,err=run([a.bradmin,'inspect-image',a.image])
    if rc: raise SystemExit('C parser failed: '+err)
    c=json.loads(out)
    keys={'version':py.image_version,'flags':py.flags,'code':py.code_count,'data':py.data_bytes,'caps':py.requested_caps,'bytes':py.bytes}
    mism={k:(v,c.get(k)) for k,v in keys.items() if c.get(k)!=v}
    if mism: raise SystemExit('parser mismatch '+repr(mism))
    rc,_,err=run([a.brverify,a.image,a.source,a.brir])
    if rc: raise SystemExit('C verifier failed: '+err)
    # Independent parser must reject assumptions the production parser might otherwise hide.
    muts=[]
    def m(name,off,val):
        b=bytearray(raw); b[off]=val; muts.append((name,bytes(b)))
    m('bad_magic',0,ord('X'));m('future_isa',5,255);m('bad_abi',6,2);m('reserved_geometry',9,19)
    m('register_geometry',10,15);m('opcode_geometry',12,31);m('mode_geometry',13,3)
    b=bytearray(raw); b[24:28]=(0).to_bytes(4,'little');muts.append(('missing_provenance',bytes(b)))
    rejects=0
    with tempfile.TemporaryDirectory() as td:
        for name,b in muts:
            p=Path(td)/(name+'.brimg'); p.write_bytes(b)
            try: parse_brim(b); pyrej=False
            except VerifyError: pyrej=True
            crc,_,_=run([a.brverify,str(p),a.source,a.brir])
            if not pyrej or crc==0: raise SystemExit(f'assumption mutation accepted: {name} python_reject={pyrej} c_rc={crc}')
            rejects+=1
    result={
      'suite':'BR-480_INDEPENDENT_PARSER_COMPARE','result':'PASS','requirements':4,
      'independent_impl':'pure-python/no-production-imports','compared_fields':keys,
      'raw_sha256':hashlib.sha256(raw).hexdigest(),'secure_signature_chain':pysec['trust']['signature_chain'],
      'assumption_mutations_rejected':rejects
    }
    print(json.dumps(result,sort_keys=True))
if __name__=='__main__': main()
