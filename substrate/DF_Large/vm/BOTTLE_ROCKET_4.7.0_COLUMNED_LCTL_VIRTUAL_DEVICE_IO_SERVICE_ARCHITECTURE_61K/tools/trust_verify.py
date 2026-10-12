#!/usr/bin/env python3
"""Independent BRTP/1 + BRMF/1 verifier for BOTTLE ROCKET 4.4.0.
Intentionally does not import VM/compiler/trust runtime code.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, sys
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

R=Path(__file__).resolve().parents[1]
F=R/'tests/trust_fixtures'
DP=b'BR-TRUST-POLICY-1\0'; DM=b'BR-IMAGE-MANIFEST-1\0'
POLICY_BYTES=352; MANIFEST_BYTES=216; HDR=80

def h(b:bytes)->bytes:return hashlib.sha256(b).digest()
def hx(b:bytes)->str:return hashlib.sha256(b).hexdigest()
def u32(b,o):return struct.unpack_from('<I',b,o)[0]
def u64(b,o):return struct.unpack_from('<Q',b,o)[0]
def kid(k:bytes)->bytes:return h(k)[:8]
def verify_sig(pk:bytes,msg:bytes,sig:bytes)->bool:
 try:Ed25519PublicKey.from_public_bytes(pk).verify(sig,msg);return True
 except Exception:return False

def policy(path:Path,root:bytes):
 b=path.read_bytes();ok=len(b)==POLICY_BYTES and b[:4]==b'BRTP' and b[4]==1 and b[5]==1
 sigok=ok and verify_sig(root,DP+b[:288],b[288:352])
 return {'name':path.name,'bytes':len(b),'format':ok,'signature':sigok,'epoch':u32(b,8) if ok else None,'min_version':u32(b,12) if ok else None,'min_generation':u32(b,16) if ok else None,'overlap_generation':u32(b,20) if ok else None,'min_tx':u64(b,24) if ok else None,'max_caps':u32(b,32) if ok else None,'issuer_id':b[40:48].hex() if ok else None,'release_id':b[48:56].hex() if ok else None,'recovery_id':b[56:64].hex() if ok else None,'old_issuer_id':b[64:72].hex() if ok else None,'old_release_id':b[72:80].hex() if ok else None,'issuer_key':b[80:112] if ok else b'','release_key':b[112:144] if ok else b'','recovery_key':b[144:176] if ok else b'','old_release_key':b[176:208] if ok else b'','revoked_count':b[7] if ok else None,'sequence':u64(b,256) if ok else None,'sha256':hx(b)}

def manifest(path:Path,pk:bytes,image:Path,source:Path,brir:Path,expect_sig=True):
 b=path.read_bytes();im=image.read_bytes();src=source.read_bytes();br=brir.read_bytes().rstrip(b'\n')
 fmt=len(b)==MANIFEST_BYTES and b[:4]==b'BRMF' and b[4]==1 and b[5]==1
 sig=fmt and verify_sig(pk,DM+b[:152],b[152:216])
 binds=fmt and b[56:88]==h(src) and b[88:120]==h(br) and b[120:152]==h(im)
 # BRIM independent structural/signature check under same release authority.
 signed=False; image_sig=False; payload=False; image_contract=False
 if len(im)>=HDR:
  cn=struct.unpack_from('<H',im,28)[0];dn=struct.unpack_from('<H',im,30)[0];plen=cn*16+dn;need=HDR+plen+(64 if im[7]&2 else 0)
  image_contract=(im[:4]==b'BRIM' and struct.unpack_from('<H',im,14)[0]==HDR and len(im)==need and im[8]==2 and im[9]==21 and im[12]==41)
  payload=image_contract and h(im[HDR:HDR+plen])==im[32:64]
  signed=image_contract and bool(im[7]&2)
  image_sig=signed and verify_sig(pk,im[:HDR+plen],im[HDR+plen:HDR+plen+64])
 version_match=fmt and image_contract and u32(b,24)==u32(im,16)
 caps_match=fmt and image_contract and (u32(im,20)&~u32(b,36))==0
 return {'name':path.name,'image':image.name,'format':fmt,'signature':sig,'signature_expected':expect_sig,'source_hash':fmt and b[56:88]==h(src),'brir_hash':fmt and b[88:120]==h(br),'brim_hash':fmt and b[120:152]==h(im),'bindings':binds,'issuer_id':b[8:16].hex() if fmt else None,'release_id':b[16:24].hex() if fmt else None,'version':u32(b,24) if fmt else None,'generation':u32(b,28) if fmt else None,'epoch':u32(b,32) if fmt else None,'caps':u32(b,36) if fmt else None,'tx':u64(b,40) if fmt else None,'expiry':u64(b,48) if fmt else None,'recovery':bool(b[6]&1) if fmt else None,'image_contract':image_contract,'payload_hash':payload,'image_signed':signed,'image_signature':image_sig,'version_match':version_match,'capability_binding':caps_match,'sha256':hx(b)}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--json-out');a=ap.parse_args()
 meta=json.loads((F/'metadata.json').read_text());root=bytes.fromhex(meta['root_public']);dev=(R/'tests/keys/DEV_ONLY_DO_NOT_DEPLOY/dev.pub').read_bytes()
 checks={}
 checks['root_id']=kid(root).hex()==meta['root_id']
 # Compiled root is verified independently by parsing the C initializer bytes as hex literals.
 import re
 c=(R/'src/brtrust.c').read_text();m=re.search(r'static const uint8_t ROOT\[32\]=\{([^}]+)\};',c);rid=re.search(r'static const uint8_t RID\[8\]=\{([^}]+)\};',c)
 parse=lambda s:bytes(int(x,16) for x in re.findall(r'0x([0-9a-fA-F]{2})',s))
 checks['compiled_root_matches_metadata']=bool(m) and parse(m.group(1))==root
 checks['compiled_root_id_matches']=bool(rid) and parse(rid.group(1))==kid(root)
 checks['root_private_absent']=not any(p.is_file() and (p.suffix in {'.key','.pem'} or 'private' in p.name.lower()) for d in [R/'src',R/'adapters',R/'spec',R/'deploy'] for p in d.rglob('*'))
 checks['dev_private_only_test_tree']=(R/'tests/keys/DEV_ONLY_DO_NOT_DEPLOY/dev.key').is_file() and not any('DEV_ONLY_DO_NOT_DEPLOY' not in str(p) for p in (R/'tests/keys').rglob('*.key'))
 policies={}
 for n in ['policy_v1.brtp','policy_rotated.brtp','policy_revoked.brtp','policy_revoke_v10.brtp','policy_stale.brtp']:
  policies[n]=policy(F/n,root)
 checks['root_signed_policies']=all(x['format'] and x['signature'] for x in policies.values())
 hw=policy(F/'hw_policy.brtp',dev);policies['hw_policy.brtp']=hw;checks['hardware_fixture_dev_signed']=hw['format'] and hw['signature']
 p1=policies['policy_v1.brtp'];p2=policies['policy_rotated.brtp']
 checks['key_ids_derived']=(kid(p1['issuer_key']).hex()==p1['issuer_id'] and kid(p1['release_key']).hex()==p1['release_id'] and kid(p1['recovery_key']).hex()==p1['recovery_id'] and kid(p2['issuer_key']).hex()==p2['issuer_id'] and kid(p2['release_key']).hex()==p2['release_id'])
 checks['rotation_epoch_sequence_monotonic']=p2['epoch']>p1['epoch'] and p2['sequence']>p1['sequence'] and p2['old_issuer_id']==p1['issuer_id'] and p2['old_release_id']==p1['release_id'] and p2['old_release_key']==p1['release_key']
 source=R/'src/BOOT.lctlc';brir=R/'deploy/BOTTLE_ROCKET_SIM_CORE_4.3.0.brir.json'
 cases=[
  ('manifest_r1.brmf',p1['release_key'],'image_r1.brimg',True),('manifest_r2.brmf',p2['release_key'],'image_r2.brimg',True),
  ('manifest_old_overlap.brmf',p2['old_release_key'],'image_r1.brimg',True),('manifest_old_expired.brmf',p2['old_release_key'],'image_r1.brimg',True),
  ('manifest_revoked.brmf',p1['release_key'],'image_r1.brimg',True),('manifest_recovery.brmf',p1['recovery_key'],'image_recovery.brimg',True),
  ('manifest_v9.brmf',p1['release_key'],'image_v9.brimg',True),('manifest_caps_low.brmf',p1['release_key'],'image_r1.brimg',True),
  ('manifest_expired.brmf',p1['release_key'],'image_r1.brimg',True),('manifest_bad_digest.brmf',p1['release_key'],'image_r1.brimg',False),
  ('manifest_bad_signature.brmf',p1['release_key'],'image_r1.brimg',False)]
 mans={}
 for mn,pk,im,es in cases:mans[mn]=manifest(F/mn,pk,F/im,source,brir,es)
 good=[n for n,_,_,es in cases if es]
 checks['valid_manifest_signatures']=all(mans[n]['signature'] for n in good)
 checks['valid_manifest_source_brir_bindings']=all(mans[n]['source_hash'] and mans[n]['brir_hash'] for n in good)
 checks['valid_manifest_image_bindings']=all(mans[n]['brim_hash'] for n in good)
 checks['valid_signed_brim_signatures']=all(mans[n]['image_contract'] and mans[n]['payload_hash'] and mans[n]['image_signature'] for n in good)
 checks['bad_digest_fixture_detected']=not mans['manifest_bad_digest.brmf']['signature'] and not mans['manifest_bad_digest.brmf']['brim_hash']
 checks['bad_signature_fixture_detected']=not mans['manifest_bad_signature.brmf']['signature']
 checks['recovery_issuer_bound_to_root']=mans['manifest_recovery.brmf']['issuer_id']==meta['root_id'] and mans['manifest_recovery.brmf']['release_id']==meta['recovery_id']
 checks['production_source_bound']=h(source.read_bytes()).hex()==mans['manifest_r1.brmf']['source_hash']*0 if False else mans['manifest_r1.brmf']['source_hash']
 # Last expression above stores bool; also explicitly require current compiler artifacts to match signed manifest source/BRIR hashes.
 checks['current_source_hash_matches_manifest']=mans['manifest_r1.brmf']['source_hash']
 checks['current_brir_hash_matches_manifest']=mans['manifest_r1.brmf']['brir_hash']
 # Static fail-closed controls that an independent verifier can inspect without trusting runtime output.
 vm=(R/'src/brvm.c').read_text();tr=(R/'src/brtrust.c').read_text()
 checks['production_start_requires_secure_authorization']='#ifndef BR_DEVELOPMENT\nif(!v->sa_)return Z12;' in vm
 checks['direct_loader_clears_authorization']='v->lc_=Z21;v->sa_=0;return Z30;' in vm
 checks['raw_apdu_loader_compile_time_denied']='return c==BR_APDU_LOAD;' in vm and '#ifdef BR_DEVELOPMENT' in vm
 checks['policy_replay_strict']='seq<=t->ps_' in tr
 checks['manifest_generation_monotonic']='gen<t->lg_' in tr
 checks['recovery_issuer_enforced']='m+8,t->root_id' in tr
 checks['bounded_security_log']='BR_TRUST_LOGS=16u' in (R/'src/brtrust.h').read_text()
 # Fix accidental non-bool legacy key if present.
 checks['production_source_bound']=checks['current_source_hash_matches_manifest'] and checks['current_brir_hash_matches_manifest']
 status='PASS' if all(bool(v) for v in checks.values()) else 'FAIL'
 out={'record':'BR.TrustIndependentVerification','release':'4.4.0','status':status,'checks':checks,'policies':{k:{kk:vv.hex() if isinstance(vv,bytes) else vv for kk,vv in v.items()} for k,v in policies.items()},'manifests':mans,'root_public':root.hex(),'root_id':kid(root).hex(),'source_sha256':hx(source.read_bytes()),'brir_sha256':hx(brir.read_bytes().rstrip(b'\n'))}
 txt=json.dumps(out,indent=2,sort_keys=True)+'\n'
 if a.json_out:Path(a.json_out).write_text(txt)
 print(json.dumps({'status':status,'checks':sum(bool(v) for v in checks.values()),'total_checks':len(checks),'policies':len(policies),'manifests':len(mans),'root_id':kid(root).hex(),'source_bound':checks['production_source_bound']},sort_keys=True))
 if status!='PASS':
  print('failed checks:',[k for k,v in checks.items() if not v],file=sys.stderr);return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
