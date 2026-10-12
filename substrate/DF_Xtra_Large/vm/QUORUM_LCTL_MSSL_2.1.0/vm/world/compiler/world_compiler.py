#!/usr/bin/env python3
"""Deterministic RC-PW world-package compiler (host reference)."""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
from typing import Any, Dict

SOURCE_SCHEMA="QVM-RCPW-WORLD-SOURCE/1"
PACKAGE_SCHEMA="QVM-RCPW-WORLD-PACKAGE/1"
COMPILER_VERSION="1.0.0"

def canonical(obj: Any)->bytes:
    return json.dumps(obj,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode("utf-8")

def sha(obj: Any)->str:
    return hashlib.sha256(canonical(obj)).hexdigest()

def validate(src: Dict[str,Any])->None:
    if src.get("schema")!=SOURCE_SCHEMA: raise ValueError("bad source schema")
    regions=src.get("regions",[]); entities=src.get("entities",[])
    rids=[str(r["id"]) for r in regions]
    if len(rids)!=len(set(rids)): raise ValueError("duplicate region id")
    known=set(rids)
    for r in regions:
        if len(r.get("center",[]))!=3: raise ValueError(f"region {r['id']} center")
        for n in r.get("neighbors",[]):
            if str(n) not in known: raise ValueError(f"region {r['id']} unknown neighbor {n}")
    eids=[str(e["id"]) for e in entities]
    if len(eids)!=len(set(eids)): raise ValueError("duplicate entity id")
    for e in entities:
        if str(e.get("region")) not in known: raise ValueError(f"entity {e['id']} unknown region")
        if len(e.get("pos",[]))!=3: raise ValueError(f"entity {e['id']} pos")

def compile_world(src: Dict[str,Any])->Dict[str,Any]:
    validate(src)
    regions=sorted(src.get("regions",[]),key=lambda x:int(x["id"]))
    entities=sorted(src.get("entities",[]),key=lambda x:int(x["id"]))
    topology=[{"region":str(r["id"]),"neighbors":sorted(map(str,r.get("neighbors",[])),key=int)} for r in regions]
    package={
        "schema":PACKAGE_SCHEMA,
        "compiler_version":COMPILER_VERSION,
        "world_id":src.get("world_id","unnamed"),
        "world_version":src.get("world_version","0"),
        "seed":int(src.get("seed",1)),
        "regions":regions,
        "entities":entities,
        "settlements":src.get("settlements",{}),
        "ecology":src.get("ecology",{}),
        "institutions":src.get("institutions",{}),
        "roles":src.get("roles",{}),
        "topology":topology,
        "provenance":src.get("provenance",{}),
        "source_sha256":sha(src),
    }
    package["semantic_sha256"]=sha(package)
    return package

def main()->int:
    ap=argparse.ArgumentParser(); ap.add_argument("source"); ap.add_argument("out")
    a=ap.parse_args(); src=json.loads(Path(a.source).read_text(encoding="utf-8")); pkg=compile_world(src)
    Path(a.out).parent.mkdir(parents=True,exist_ok=True); Path(a.out).write_bytes(canonical(pkg)+b"\n")
    print(json.dumps({"status":"PASS","schema":PACKAGE_SCHEMA,"semantic_sha256":pkg["semantic_sha256"],"out":a.out},indent=2)); return 0
if __name__=="__main__": raise SystemExit(main())
