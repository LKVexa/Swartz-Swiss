#!/usr/bin/env python3
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=5:
    raise SystemExit('usage: provenance.py SOURCE BRIR BRIM OUT')
src,brir,img,out=map(Path,sys.argv[1:])
sb,bb,ib=src.read_bytes(),brir.read_bytes(),img.read_bytes()
if len(ib)<176 or ib[:4]!=b'BRIM' or not (ib[7]&4):
    raise SystemExit('BRPV provenance missing')
prov_len=struct.unpack_from('<I',ib,24)[0]
if prov_len!=96: raise SystemExit('unexpected BRPV length')
off=len(ib)-(64 if ib[7]&2 else 0)-prov_len
pv=ib[off:off+prov_len]
if pv[:4]!=b'BRPV': raise SystemExit('BRPV magic mismatch')
sh=hashlib.sha256(sb).digest(); bh=hashlib.sha256(bb).digest()
if pv[24:56]!=sh or pv[56:88]!=bh: raise SystemExit('embedded provenance hash mismatch')
u32=lambda o:struct.unpack_from('<I',pv,o)[0]
feat=u32(92); rec={
 'record':'BOTTLE_ROCKET.SourceBinaryProvenance','language':'LCTLC/1.1','brir':'BRIR/1.1',
 'compiler':'4.7.0','verifier':'4.7.0','isa_major':pv[7], 'isa_minor':(feat>>16)&0xff,
 'abi_version':(feat>>24)&0xff,'features':feat&0xffff,'image_abi':ib[8],
 'image_version':u32(88),'max_steps':u32(16),'declared_caps':struct.unpack_from('<I',ib,20)[0],
 'derived_caps':u32(20),'source_sha256':sh.hex(),'brir_sha256':bh.hex(),
 'brim_sha256':hashlib.sha256(ib).hexdigest()
}
out.write_text(json.dumps(rec,separators=(',',':'))+'\n')
print('Source/Binary provenance: PASS')
