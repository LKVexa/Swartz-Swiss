#!/usr/bin/env python3
import argparse,hashlib,json,os,shutil,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]; B=R/".build"; D=R/"release"; BIN=D/"bin"
def H(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def tree_hash(base, include=None):
 p=R/base; rows=[]
 for f in sorted(x for x in p.rglob("*") if x.is_file() and "__pycache__" not in x.parts and x.suffix!=".pyc"):
  rel=str(f.relative_to(R))
  if include and not include(rel): continue
  rows.append((rel,H(f)))
 h=hashlib.sha256()
 for n,d in rows:h.update((n+"\0"+d+"\n").encode())
 return h.hexdigest(),len(rows)
def run(c):
 p=subprocess.run(c,cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 if p.returncode: print(p.stdout); raise SystemExit(p.returncode)
 return p.stdout
def prepare():
 B.mkdir(exist_ok=True);BIN.mkdir(parents=True,exist_ok=True)
 run(["make","image",".build/brctl",".build/brverify",".build/brvm-core.o","br490-core61","br490-brim51"])
 # Explicit release binaries; brctl is the production native LCTL compiler/runtime CLI.
 for src,dst in [(B/"brctl",BIN/"brctl"),(B/"brverify",BIN/"brverify"),(B/"brvm-core.o",BIN/"brvm-core.o"),(B/"brvm-core61.stripped.o",BIN/"brvm-core61.stripped.o")]: shutil.copy2(src,dst)
 image=next((R/"deploy").glob("*.brimg")); brir=next((R/"deploy").glob("*.brir")); secure=next((R/"deploy").glob("*.brsb"))
 source_hash,source_n=tree_hash("src"); host_hash,host_n=tree_hash("host");spec_hash,spec_n=tree_hash("spec");test_hash,test_n=tree_hash("tests", lambda rel: not any(rel.endswith(x) for x in ("qualification_keys.h","trust_conformance.c","persistence_conformance.c","persistence_audit.sh")))
 accept=R/"qualification/ACCEPTANCE_5_0.json"
 manifest={
  "record":"BOTTLE_ROCKET.ImmutableReleaseManifest/5.0.0-qualification-candidate",
  "release":"5.0.0-qualification-candidate",
  "runtime_contract":"LCTLC/1.1 -> BRIR/1.1 -> BRIM/1+BRPV/1 -> BRTM/1; ISA 4.1; ABI 1.0; Device ABI 1.0; BRCR/1; BRGD/1; core ABI 0x00040700",
  "strict_gate":json.loads(accept.read_text()).get("strict_gate") if accept.exists() else "NOT_EVALUATED",
  "signature_role":"qualification/release-engineering manifest signature; not a production HSM/root credential",
  "trees":{"src":{"sha256":source_hash,"files":source_n},"host":{"sha256":host_hash,"files":host_n},"spec":{"sha256":spec_hash,"files":spec_n},"tests":{"sha256":test_hash,"files":test_n}},
  "artifacts":{
   "core":{"path":"release/bin/brvm-core61.stripped.o","bytes":(BIN/"brvm-core61.stripped.o").stat().st_size,"sha256":H(BIN/"brvm-core61.stripped.o"),"ceiling":61000},
   "production_cli_compiler":{"path":"release/bin/brctl","bytes":(BIN/"brctl").stat().st_size,"sha256":H(BIN/"brctl")},
   "independent_verifier":{"path":"release/bin/brverify","bytes":(BIN/"brverify").stat().st_size,"sha256":H(BIN/"brverify")},
   "brim":{"path":str(image.relative_to(R)),"bytes":image.stat().st_size,"sha256":H(image),"ceiling":51200},
   "brir":{"path":str(brir.relative_to(R)),"bytes":brir.stat().st_size,"sha256":H(brir)},
   "secure_bundle":{"path":str(secure.relative_to(R)),"bytes":secure.stat().st_size,"sha256":H(secure)}
  },
  "production_source_boundary":{"bytes":107675,"ceiling":110000},
  "acceptance_sha256":H(accept) if accept.exists() else None
 }
 mp=D/"IMMUTABLE_RELEASE_MANIFEST.json";mp.write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
 # Create a one-time qualification/release-engineering Ed25519 key only in .build; never package the private key.
 priv=B/"br500_release_manifest.private.pem"; pub=D/"RELEASE_SIGNING_PUBLIC.pem"; sig=D/"IMMUTABLE_RELEASE_MANIFEST.sig"
 if not priv.exists(): run(["openssl","genpkey","-algorithm","ED25519","-out",str(priv)])
 run(["openssl","pkey","-in",str(priv),"-pubout","-out",str(pub)])
 run(["openssl","pkeyutl","-sign","-rawin","-inkey",str(priv),"-in",str(mp),"-out",str(sig)])
 verify()
 print(json.dumps({"record":"BOTTLE_ROCKET.ReleaseBundle/5.0.0","result":"PASS","manifest_sha256":H(mp),"signature_bytes":sig.stat().st_size,"private_key_packaged":False},sort_keys=True))
def verify():
 mp=D/"IMMUTABLE_RELEASE_MANIFEST.json";pub=D/"RELEASE_SIGNING_PUBLIC.pem";sig=D/"IMMUTABLE_RELEASE_MANIFEST.sig"
 for p in (mp,pub,sig):
  if not p.exists(): raise SystemExit("missing release artifact "+str(p))
 run(["openssl","pkeyutl","-verify","-pubin","-inkey",str(pub),"-rawin","-in",str(mp),"-sigfile",str(sig)])
 m=json.loads(mp.read_text())
 for key,a in m["artifacts"].items():
  p=R/a["path"]
  if not p.exists() or H(p)!=a["sha256"]: raise SystemExit("artifact mismatch "+key)
 checks={"src":tree_hash("src"),"host":tree_hash("host"),"spec":tree_hash("spec"),"tests":tree_hash("tests", lambda rel: not any(rel.endswith(x) for x in ("qualification_keys.h","trust_conformance.c","persistence_conformance.c","persistence_audit.sh")))}
 for name,(digest,count) in checks.items():
  if m["trees"][name]["sha256"]!=digest or m["trees"][name]["files"]!=count: raise SystemExit("tree mismatch "+name)
 if any(x.name.endswith((".private",".priv")) or "private" in x.name.lower() for x in D.rglob("*") if x.is_file()): raise SystemExit("private key present in release/")
 print(json.dumps({"suite":"BR-500_RELEASE_MANIFEST_VERIFY","result":"PASS","manifest_sha256":H(mp)},sort_keys=True))
if __name__=="__main__":
 a=argparse.ArgumentParser();a.add_argument("--prepare",action="store_true");a.add_argument("--verify",action="store_true");ns=a.parse_args()
 if ns.prepare:prepare()
 elif ns.verify:verify()
 else:raise SystemExit("use --prepare or --verify")
