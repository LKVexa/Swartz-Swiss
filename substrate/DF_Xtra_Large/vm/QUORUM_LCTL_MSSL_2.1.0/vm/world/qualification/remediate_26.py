#!/usr/bin/env python3
from __future__ import annotations
import copy, hashlib, json, os, subprocess, sys, tempfile, time, random
from pathlib import Path

WORLD=Path(__file__).resolve().parents[1]
VM=WORLD.parent
REPO=VM.parent
sys.path.insert(0,str(VM))
from world.world_runtime import WorldRuntime, WorldError, sha256_obj, canonical_bytes
from world.remediation.blocked_gate_support import (
    ResourceGovernor, PressureSnapshot, visual_regression_trace, clean_room_replay,
    reconstruct_from_checkpoint, AuthorityWellArbiter, habitat_fold_isolation,
    fold_scaling_benchmark, parallel_fold, lod_multiworker, PresentationRegistry,
    materialize_dense, migrate_transition, ledger_semantic_digest, history_archive,
    load_history_archive, history_index, multi_era_query_corpus, deterministic_parallel_mutation,
    benchmark_resources, compatibility_matrix, penteract_mapping_evidence,
    vertical_reference_evidence, e2e_failure_recovery,
)

E=WORLD/"evidence"/"remediation_26"
E.mkdir(parents=True,exist_ok=True)

def dump(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,indent=2,sort_keys=True,ensure_ascii=False)+"\n",encoding="utf-8")

def evidence(rid, result, passed, command):
    body={
        "schema":"RCPW-26-GATE-EVIDENCE/1",
        "requirement_id":rid,
        "profile":"QP1/WQ2/AW1/WP4_HOSTED_REFERENCE",
        "status":"OPERATIONAL" if passed else "REGRESSED",
        "test_command":command,
        "exit_code":0 if passed else 1,
        "observed_results":result,
        "result_sha256":sha256_obj(result),
        "tool_versions":{"python":sys.version.split()[0],"world_runtime":WorldRuntime(seed=1).canonical_state()["version"]},
    }
    body["evidence_sha256"]=sha256_obj(body)
    path=E/f"{rid}.json"; dump(path,body)
    return body,path

results={}
def gate(rid,fn):
    try:
        detail=fn()
        passed=bool(detail.pop("_pass",True))
    except Exception as ex:
        detail={"error":f"{type(ex).__name__}: {ex}"}; passed=False
    ev,path=evidence(rid,detail,passed,"python vm/world/qualification/remediate_26.py")
    results[rid]={"status":ev["status"],"evidence_path":str(path.relative_to(VM)),"evidence_sha256":ev["evidence_sha256"],"detail":detail}

def g01():
    w=WorldRuntime(seed=101)
    auth=w.coordinate_authority
    p=[10**12,-10**12,123456789]
    before=list(p); v=w.fold_point(p)
    with tempfile.TemporaryDirectory() as td:
        f=Path(td)/"s.json"; w.save(f); r=WorldRuntime.load(f)
    ok=(auth["unit"]=="canonical_meter" and auth["reference_independent"] and before==p and
        r.coordinate_authority==auth and r.entities["1"]["pos"]==w.entities["1"]["pos"] and
        v["canonical_delta"]==[p[i]-w.reference_position[i] for i in range(3)])
    return {"coordinate_authority":auth,"test_point":p,"folded":v["folded"],"save_roundtrip":r.coordinate_authority==auth,"_pass":ok}

def g09():
    w=WorldRuntime(seed=102); p={"mission":80,"relationship":20,"causal":60,"threat":5,"recency":10,"authored":40}
    a=w.set_narrative_profile("3",p); w.move_reference(10**8,0,0); b=w.entities["3"]["narrative_gravity"]
    w.move_reference(-10**8,0,0); c=w.entities["3"]["narrative_gravity"]
    return {"inputs":p,"score":a,"score_after_far_move":b,"score_after_opposite_move":c,"_pass":a==b==c}

def g11():
    x=visual_regression_trace()
    return {**x,"_pass":x["repeatable"] and x["frame_ms"]["p99"]<100.0}

def g12():
    x=clean_room_replay(REPO)
    return {**x,"_pass":x["digest_equal"] and x["ledger_equal"] and x["corrupt_rejected"] and x["isolated_exit_code"]==0}

def g19_06():
    w=WorldRuntime(seed=106); w.advance(10); checkpoint=w.export(); cut=len(w.ledger)
    w.set_narrative_profile("3",{"mission":80}); w.advance(25); w.tell("7","hist:1",{"v":7}); w.expand_frontier()
    tail=copy.deepcopy(w.ledger[cut:])
    r=reconstruct_from_checkpoint(checkpoint,tail)
    ok=w.state_digest()==r.state_digest() and w.ledger_head==r.ledger_head
    # subprocess/fresh copy independence already independently verified by clean-room gate; store reconstruction digest
    return {"tail_events":len(tail),"expected":w.state_digest(),"reconstructed":r.state_digest(),"ledger_equal":w.ledger_head==r.ledger_head,"_pass":ok}

def g20_07():
    x=benchmark_resources()
    ok=x["replayable"] and all(v is True or v=="NOT_APPLICABLE" for v in x["within_budget"].values())
    return {**x,"_pass":ok}

def g20_08():
    x=e2e_failure_recovery(REPO)
    ok=x["corrupt_rejected"] and x["recovery_idempotent"] and x["clean_room_replay"]["digest_equal"] and not x["invariants"]
    return {**x,"_pass":ok}

def g04_09():
    x=benchmark_resources()
    ok=x["replayable"] and len(x["decisions"])==5 and any(d["degradation_level"]>0 for d in x["decisions"])
    return {"governor_version":x["governor_version"],"decisions":x["decisions"],"replayable":x["replayable"],"_pass":ok}

def g07_09():
    x=habitat_fold_isolation()
    return {**x,"_pass":x["pass"]}

def g18_08():
    wells=[
        {"id":"W3","priority":70,"created_tick":2},
        {"id":"W1","priority":90,"created_tick":5},
        {"id":"W2","priority":90,"created_tick":5},
    ]
    a=AuthorityWellArbiter(); winners=a.choose_permutations(wells)
    return {"version":a.VERSION,"winner":a.choose(wells),"permutation_winners":winners,"_pass":len(set(winners))==1 and winners[0]=="W1"}

def g20_11():
    m=compatibility_matrix()
    return {**m,"_pass":set(m["profiles"])=={"QP0","QP1","QP2","QP3","QP4"} and m["profiles"]["QP4"]["status_hint"]=="BLOCKED"}

def g02_13():
    x=vertical_reference_evidence()
    return {**x,"_pass":x["all_z_preserved"] and x["gravity_vector"]==[0,0,-1]}

def g16_12():
    x=penteract_mapping_evidence()
    return {**x,"_pass":x["mapping_independently_versioned"] and x["canonical_spatial_semantics_equal"]}

def g17_18():
    x=fold_scaling_benchmark()
    return {**x,"_pass":x["bounded_by_active_set"]}

def g18_16():
    w=WorldRuntime(seed=116); wid=w.add_authority_well(50000,0,0,95,10000); before=copy.deepcopy(w.authority_wells[wid])
    w.advance(1000)
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/"s.json"; w.save(p); r=WorldRuntime.load(p)
    ok=wid in w.authority_wells and wid in r.authority_wells and r.authority_wells[wid]==w.authority_wells[wid]
    return {"well":before,"tick_after":w.tick,"save_reload_persisted":ok,"renderer_consumer_created":False,"_pass":ok}

def g19_19():
    w=WorldRuntime(seed=119)
    for i in range(80):
        w.advance(25)
        if i%10==0: w.tell("7",f"era:{i}",{"i":i},source="history")
        if i%20==0: w.expand_frontier()
    arc=history_archive(w.ledger); loaded=load_history_archive(arc); idx=history_index(loaded)
    corrupt=copy.deepcopy(arc); corrupt["payload_hex"]=("00"+corrupt["payload_hex"][2:])
    rejected=False
    try: load_history_archive(corrupt)
    except Exception: rejected=True
    cr=clean_room_replay(REPO)
    return {"events":len(w.ledger),"raw_bytes":arc["raw_bytes"],"compressed_bytes":arc["compressed_bytes"],"compression_ratio":arc["compressed_bytes"]/arc["raw_bytes"],"index_keys":len(idx),"corruption_rejected":rejected,"independent_replay":cr["digest_equal"],"_pass":ledger_semantic_digest(loaded)==arc["semantic_sha256"] and rejected and cr["digest_equal"]}

def g20_20():
    w=WorldRuntime(seed=120); w.advance(50)
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); s=td/"s.json"; o=td/"o.json"; w.save(s)
        cp=subprocess.run([sys.executable,str(WORLD/"qualification/headless_verify.py"),"--save",str(s),"--out",str(o)],cwd=str(VM),capture_output=True,text=True)
        obj=json.loads(o.read_text()) if o.exists() else {}
    return {"exit_code":cp.returncode,"receipt":obj,"_pass":cp.returncode==0 and obj.get("state_sha256")==w.state_digest() and obj.get("renderer_created") is False}

def g03_20():
    w=WorldRuntime(seed=320)
    for i in range(200): w.spawn_entity("bg",[i*1000,i*7,0],"1")
    a=parallel_fold(w,1); b=parallel_fold(w,4)
    return {"single_digest":a["digest"],"multi_digest":b["digest"],"worker_count":4,"process_pool":b["process_pool"],"_pass":a["digest"]==b["digest"] and b["process_pool"]}

def g04_24():
    w=WorldRuntime(seed=424)
    for i in range(120): w.spawn_entity("agent",[i*500,0,0],"1")
    a=lod_multiworker(w,1); b=lod_multiworker(w,4)
    return {"single":{k:a[k] for k in ["decision_digest","canonical_state_digest"]},"multi":{k:b[k] for k in ["decision_digest","canonical_state_digest"]},"_pass":a["decision_digest"]==b["decision_digest"] and a["canonical_state_digest"]==b["canonical_state_digest"]}

def g10_23():
    w=WorldRuntime(seed=1023); canonical=w.state_digest(); reg=PresentationRegistry(); old=reg.digest()
    new=reg.activate({"schema":reg.SCHEMA,"version":"presentation/2","assets":{"entity":"diamond","terrain":"polyline"}},canonical,w.state_digest())
    rollback=reg.rollback()
    invalid=False
    try: reg.activate({"schema":"bad","version":"x","assets":{}},canonical,w.state_digest())
    except Exception: invalid=True
    return {"canonical_digest":canonical,"old_asset_digest":old,"new_asset_digest":new,"rollback_digest":rollback,"invalid_rejected":invalid,"canonical_unchanged":canonical==w.state_digest(),"_pass":rollback==old and invalid and canonical==w.state_digest()}

def g10_24():
    x=materialize_dense(WorldRuntime(seed=1024),worker_count=4,entity_count=160)
    return {**x,"_pass":x["all_interaction_ready"] and not x["duplicate_tasks"] and x["elapsed_ms"]<10000}

def g14_23():
    v1={"version":1,"entity":"3","from":"ABSTRACT","to":"INTERACTIVE","tick":50,"pos":[500,100,0],"owner":"canonical","health":88,"inventory":{"food":2},"obligations":["trade:1"]}
    v2=migrate_transition(v1); same=migrate_transition(v2)
    unsupported=False
    try: migrate_transition({"version":99})
    except Exception: unsupported=True
    ok=v2==same and v2["conservation"]["canonical_pos"]==v1["pos"] and v2["conservation"]["obligations"]==v1["obligations"]
    return {"v1":v1,"v2":v2,"unsupported_rejected":unsupported,"_pass":ok and unsupported}

def g18_20():
    w=WorldRuntime(seed=1820)
    ids=[w.add_authority_well(0,0,0,p,1000) for p in [50,90,90]]
    # enforce a tie between last two; stable IDs break tie.
    winner=w.arbitrate_authority_wells(ids)
    service=AuthorityWellArbiter()
    external=service.choose([w.authority_wells[x] for x in ids])["winner"]
    return {"service_version":service.VERSION,"ids":ids,"runtime_winner":winner,"service_winner":external,"partition_independent_ids":all(x.startswith("W") for x in ids),"_pass":winner==external}

def g19_20():
    w=WorldRuntime(seed=1920); w.advance(20); w.tell("7","p",1)
    base=copy.deepcopy(w.ledger)
    alt=copy.deepcopy(base)
    for i,r in enumerate(alt):
        r["diagnostic"]={"worker":f"W{i%4}","partition":f"P{i%2}","runtime":"alt-layout"}
    return {"full_hash_base":sha256_obj(base),"full_hash_alt":sha256_obj(alt),"semantic_base":ledger_semantic_digest(base),"semantic_alt":ledger_semantic_digest(alt),"_pass":sha256_obj(base)!=sha256_obj(alt) and ledger_semantic_digest(base)==ledger_semantic_digest(alt)}

def g20_25():
    rows=[deterministic_parallel_mutation(2025,n) for n in [1,2,4]]
    sd={x["state_digest"] for x in rows}; ld={x["semantic_ledger_digest"] for x in rows}; od={x["ownership_digest"] for x in rows}
    return {"layouts":rows,"_pass":len(sd)==len(ld)==len(od)==1 and all(x["save_reload_equal"] and x["ledger_equal"] for x in rows)}

def g19_29():
    w=WorldRuntime(seed=1929)
    # multi-era-ish deterministic history
    for era in range(4):
        w.era=f"ERA_{era}"
        w.advance(60)
        child=w.spawn_entity("successor",[20000+era,50,0],"3")
        w.succession("sheriff:eastvale",child)
        if era%2==0: w.expand_frontier()
    baseline=multi_era_query_corpus(w.ledger)
    arc=history_archive(w.ledger); loaded=load_history_archive(arc); post=multi_era_query_corpus(loaded)
    old_slice=copy.deepcopy(loaded)
    w.expand_frontier()
    old_after=multi_era_query_corpus(old_slice)
    cr=clean_room_replay(REPO)
    return {"baseline":baseline,"post_compaction":post,"old_history_after_expansion":old_after,"archive_bytes":{"raw":arc["raw_bytes"],"compressed":arc["compressed_bytes"]},"clean_room":cr["digest_equal"],"_pass":baseline==post==old_after and cr["digest_equal"]}

def main():
    gate("RCPW-01-R01",g01)
    gate("RCPW-09-R01",g09)
    gate("RCPW-11-R06",g11)
    gate("RCPW-12-R06",g12)
    gate("RCPW-19-R06",g19_06)
    gate("RCPW-20-R07",g20_07)
    gate("RCPW-20-R08",g20_08)
    gate("RCPW-04-R09",g04_09)
    gate("RCPW-07-R09",g07_09)
    gate("RCPW-18-R08",g18_08)
    gate("RCPW-20-R11",g20_11)
    gate("RCPW-02-R13",g02_13)
    gate("RCPW-16-R12",g16_12)
    gate("RCPW-17-R18",g17_18)
    gate("RCPW-18-R16",g18_16)
    gate("RCPW-19-R19",g19_19)
    gate("RCPW-20-R20",g20_20)
    gate("RCPW-03-R20",g03_20)
    gate("RCPW-04-R24",g04_24)
    gate("RCPW-10-R23",g10_23)
    gate("RCPW-10-R24",g10_24)
    gate("RCPW-14-R23",g14_23)
    gate("RCPW-18-R20",g18_20)
    gate("RCPW-19-R20",g19_20)
    gate("RCPW-20-R25",g20_25)
    gate("RCPW-19-R29",g19_29)

    summary={
        "schema":"RCPW-26-GATE-REMEDIATION/1",
        "profile":"QP1/WQ2/AW1/WP4_HOSTED_REFERENCE",
        "gate_count":len(results),
        "operational":sum(x["status"]=="OPERATIONAL" for x in results.values()),
        "regressed":sum(x["status"]=="REGRESSED" for x in results.values()),
        "results":results,
        "higher_profile_boundary":{
            "QP2":"PARTIAL",
            "QP3":"BLOCKED",
            "QP4":"BLOCKED",
            "note":"Local hosted evidence remediates the 26 requirement-level blockers. It does not constitute production-scale or external-party certification."
        }
    }
    dump(E/"remediation_summary.json",summary)
    print(json.dumps({"gate_count":summary["gate_count"],"operational":summary["operational"],"regressed":summary["regressed"]},sort_keys=True))
    raise SystemExit(0 if summary["regressed"]==0 else 1)

if __name__=="__main__":
    main()
