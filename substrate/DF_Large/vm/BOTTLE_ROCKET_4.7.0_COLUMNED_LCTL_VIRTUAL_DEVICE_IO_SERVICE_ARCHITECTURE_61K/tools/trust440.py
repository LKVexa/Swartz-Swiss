#!/usr/bin/env python3
"""Offline BRTP/1 and BRMF/1 signing utility. Private keys are input-only and never generated into production trees."""
from __future__ import annotations
import argparse,hashlib,struct,sys
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding,PublicFormat
DP=b'BR-TRUST-POLICY-1\0';DM=b'BR-IMAGE-MANIFEST-1\0'
def raw(p,n):
 b=Path(p).read_bytes()
 if len(b)!=n:raise ValueError(f'{p}: expected {n} raw bytes')
 return b
def priv(p):return Ed25519PrivateKey.from_private_bytes(raw(p,32))
def pub_of(k):return k.public_key().public_bytes(Encoding.Raw,PublicFormat.Raw)
def kid(k):return hashlib.sha256(k).digest()[:8]
def hfile(p,canonical_json=False):
 b=Path(p).read_bytes();b=b.rstrip(b'\n') if canonical_json else b;return hashlib.sha256(b).digest()
def p32(b,o,v):struct.pack_into('<I',b,o,v)
def p64(b,o,v):struct.pack_into('<Q',b,o,v)
def keypub(path):return raw(path,32)
def cmd_keyid(a):print(kid(raw(a.public,32)).hex())
def cmd_policy(a):
 rk=priv(a.root_private);issuer=keypub(a.issuer_public);release=keypub(a.release_public);recovery=keypub(a.recovery_public)
 oldi=keypub(a.old_issuer_public) if a.old_issuer_public else None;oldr=keypub(a.old_release_public) if a.old_release_public else None
 rev=[bytes.fromhex(x) for x in a.revoke_key_id];rv=[int(x,0) for x in a.revoke_version]
 if len(rev)>4 or any(len(x)!=8 for x in rev) or len(rv)>4:raise ValueError('at most four 8-byte revoked key IDs and four revoked versions')
 b=bytearray(352);b[:4]=b'BRTP';b[4]=b[5]=1;b[7]=len(rev);p32(b,8,a.epoch);p32(b,12,a.min_version);p32(b,16,a.min_generation);p32(b,20,a.overlap_generation);p64(b,24,a.min_tx);p32(b,32,a.max_caps)
 b[40:48]=kid(issuer);b[48:56]=kid(release);b[56:64]=kid(recovery);b[80:112]=issuer;b[112:144]=release;b[144:176]=recovery
 if oldi:b[64:72]=kid(oldi)
 if oldr:b[72:80]=kid(oldr);b[176:208]=oldr
 for i,x in enumerate(rev):b[208+8*i:216+8*i]=x
 for i,x in enumerate(rv):p32(b,240+4*i,x)
 p64(b,256,a.sequence);b[288:352]=rk.sign(DP+bytes(b[:288]));Path(a.out).write_bytes(b)
 print(f'policy_sha256={hashlib.sha256(b).hexdigest()} root_id={kid(pub_of(rk)).hex()} issuer_id={kid(issuer).hex()} release_id={kid(release).hex()} recovery_id={kid(recovery).hex()}')
def cmd_manifest(a):
 k=priv(a.private);b=bytearray(216);b[:4]=b'BRMF';b[4]=b[5]=1;b[6]=1 if a.recovery else 0
 issuer=bytes.fromhex(a.issuer_id);release=bytes.fromhex(a.release_id)
 if len(issuer)!=8 or len(release)!=8:raise ValueError('issuer/release IDs must be 8-byte hex')
 b[8:16]=issuer;b[16:24]=release;p32(b,24,a.version);p32(b,28,a.generation);p32(b,32,a.epoch);p32(b,36,a.caps);p64(b,40,a.tx);p64(b,48,a.expiry)
 b[56:88]=hfile(a.source);b[88:120]=hfile(a.brir,True);b[120:152]=hfile(a.image);b[152:216]=k.sign(DM+bytes(b[:152]));Path(a.out).write_bytes(b)
 print(f'manifest_sha256={hashlib.sha256(b).hexdigest()} signer_id={kid(pub_of(k)).hex()}')
def main():
 ap=argparse.ArgumentParser();sp=ap.add_subparsers(required=True)
 q=sp.add_parser('key-id');q.add_argument('public');q.set_defaults(f=cmd_keyid)
 q=sp.add_parser('sign-policy');q.add_argument('--root-private',required=True);q.add_argument('--issuer-public',required=True);q.add_argument('--release-public',required=True);q.add_argument('--recovery-public',required=True);q.add_argument('--old-issuer-public');q.add_argument('--old-release-public');q.add_argument('--epoch',type=int,required=True);q.add_argument('--min-version',type=int,required=True);q.add_argument('--min-generation',type=int,required=True);q.add_argument('--overlap-generation',type=int,default=0);q.add_argument('--min-tx',type=int,required=True);q.add_argument('--max-caps',type=lambda x:int(x,0),default=0xff);q.add_argument('--sequence',type=int,required=True);q.add_argument('--revoke-key-id',action='append',default=[]);q.add_argument('--revoke-version',action='append',default=[]);q.add_argument('--out',required=True);q.set_defaults(f=cmd_policy)
 q=sp.add_parser('sign-manifest');q.add_argument('--private',required=True);q.add_argument('--source',required=True);q.add_argument('--brir',required=True);q.add_argument('--image',required=True);q.add_argument('--issuer-id',required=True);q.add_argument('--release-id',required=True);q.add_argument('--version',type=int,required=True);q.add_argument('--generation',type=int,required=True);q.add_argument('--epoch',type=int,required=True);q.add_argument('--tx',type=int,required=True);q.add_argument('--caps',type=lambda x:int(x,0),required=True);q.add_argument('--expiry',type=int,default=0);q.add_argument('--recovery',action='store_true');q.add_argument('--out',required=True);q.set_defaults(f=cmd_manifest)
 a=ap.parse_args()
 try:a.f(a)
 except Exception as e:print('ERROR:',e,file=sys.stderr);return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
