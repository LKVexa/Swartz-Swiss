#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, sys
from pathlib import Path

WORLD=Path(__file__).resolve().parents[1]
VM=WORLD.parent
sys.path.insert(0,str(VM))
from world.world_runtime import WorldRuntime, WorldError

def main(argv=None):
    ap=argparse.ArgumentParser()
    ap.add_argument("--save",required=True)
    ap.add_argument("--out")
    args=ap.parse_args(argv)
    try:
        w=WorldRuntime.load(Path(args.save))
        errors=w.invariants()
        if errors:
            raise WorldError("invariant failure: "+"; ".join(errors))
        receipt={
            "schema":"RCPW-HEADLESS-VERIFY/1",
            "status":"PASS",
            "state_sha256":w.state_digest(),
            "ledger_head":w.ledger_head,
            "semantic_ledger_sha256":w.semantic_ledger_digest(),
            "tick":w.tick,
            "entities":len(w.entities),
            "regions":len(w.regions),
            "unresolved_obligations":sum(1 for e in w.entities.values() if int(e.get("narrative_gravity",0))>=75),
            "renderer_created":False,
        }
        if args.out:
            Path(args.out).write_text(json.dumps(receipt,indent=2,sort_keys=True)+"\n")
        else:
            print(json.dumps(receipt,sort_keys=True))
        return 0
    except Exception as ex:
        err={"schema":"RCPW-HEADLESS-VERIFY/1","status":"FAIL","error":f"{type(ex).__name__}: {ex}","renderer_created":False}
        if args.out:
            Path(args.out).write_text(json.dumps(err,indent=2,sort_keys=True)+"\n")
        else:
            print(json.dumps(err,sort_keys=True),file=sys.stderr)
        return 2

if __name__=="__main__":
    raise SystemExit(main())
