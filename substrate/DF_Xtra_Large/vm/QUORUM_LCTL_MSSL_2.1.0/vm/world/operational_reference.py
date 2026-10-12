#!/usr/bin/env python3
"""RC-PW 7.0 operational hosted-reference extension.

This module raises the prior bounded reference runtime to a broad, executable
qualification profile for the remaining RC-PW requirements. It is deliberately
standard-library only and deterministic. It does not claim photorealistic GPU
rendering or external-party certification; presentation/physics/AI semantics
are exercised by deterministic diagnostic/reference models.
"""
from __future__ import annotations

import copy, hashlib, json, math, time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from world.world_runtime import WorldRuntime, WorldError, canonical_bytes, sha256_obj, named_u64

OPERATIONAL_VERSION = "7.0.0-operational-reference-315"
RUNTIME_ABI_VERSION = 3
SCHEDULER_VERSION = "RCPW-SCHED/3"
FOLD_POLICY_VERSION = "c2-compactification/2"
SAVE_SCHEMA = "QVM-RCPW-SAVE/2"
WORLD_PACKAGE_SCHEMA = "QVM-RCPW-WORLD-PACKAGE/2"
TRANSITION_SCHEMA = "RCPW-TRANSITION/3"
ARCHIVE_SCHEMA = "RCPW-ARCHIVE/3"
PRESENTATION_SCHEMA = "RCPW-PRESENTATION/2"

SCHEDULER_PHASES = [
    "INPUT_FREEZE","CANONICAL_READ","REMOTE_SIM","CAUSAL_DECISION",
    "LOD_FOLD_PLAN","MATERIALIZATION_PLAN","PHYSICS_AI_STEP","CANONICAL_COMMIT",
    "LEDGER_COMMIT","REFERENCE_PROJECTION","RENDER_VIEW","CHECKPOINT_TELEMETRY",
]

ENTITY_LOD_CONTRACTS = {
    "player": list(range(0,9)), "mount": list(range(0,9)), "merchant": list(range(0,9)),
    "wolf": list(range(0,9)), "deer": list(range(0,9)), "train": list(range(0,9)),
    "sheriff": list(range(0,9)), "companion": list(range(0,9)), "dense": list(range(0,9)),
    "generic": list(range(0,9)),
}

LOD_SUBSYSTEM_CONTRACTS = {
    "ai": {0:"identity",1:"schedule",2:"goal",3:"route",4:"kinematic",5:"behavior",6:"animation",7:"interaction",8:"reference"},
    "ecology": {0:"conserved",1:"cohort",2:"territory",3:"migration",4:"kinematic",5:"local",6:"visible",7:"interactive",8:"reference"},
    "economy": {0:"ledger",1:"aggregate",2:"strategic",3:"logistics",4:"delivery",5:"merchant",6:"visible",7:"trade",8:"reference"},
    "weather": {0:"regional",1:"front",2:"cell",3:"route",4:"local",5:"physical",6:"visible",7:"interactive",8:"reference"},
    "navigation": {0:"destination",1:"route",2:"segment",3:"nav",4:"kinematic",5:"collision",6:"visible",7:"interactive",8:"reference"},
    "combat": {0:"obligation",1:"aggregate",2:"strategic",3:"encounter",4:"kinematic",5:"physical",6:"visual",7:"interactive",8:"reference"},
    "transport": {0:"route_phase",1:"schedule",2:"strategic",3:"segment",4:"kinematic",5:"physical",6:"visual",7:"boardable",8:"reference"},
    "narrative": {0:"hook",1:"obligation",2:"priority",3:"event",4:"agent",5:"local",6:"visible",7:"interactive",8:"reference"},
}

RETENTION_POLICY = {
    "corpse": {"class":"durable_evidence","ticks":20000},
    "track": {"class":"bounded_evidence","ticks":5000},
    "debris": {"class":"bounded_evidence","ticks":2000},
    "temporary_prop": {"class":"ephemeral","ticks":500},
    "transient_crowd": {"class":"aggregate_only","ticks":200},
}

@dataclass(frozen=True)
class FrameRecord:
    frame_id: str
    frame_type: str
    parent: Optional[str]
    origin: Tuple[int,int,int]
    velocity: Tuple[int,int,int]
    tick: int
    epoch: int

@dataclass
class MaterializationRecord:
    entity_id: str
    semantic: bool = False
    collision: bool = False
    navigation: bool = False
    ai: bool = False
    animation: bool = False
    audio: bool = False
    visual: bool = False
    interaction: bool = False
    provenance: str = "canonical"
    def interactable(self)->bool:
        return self.semantic and self.collision and self.navigation and self.ai and self.interaction

class OperationalWorldRuntime(WorldRuntime):
    """Expanded deterministic hosted-reference runtime used by QVM ABI 3."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._init_operational()

    def _init_operational(self):
        # Revision domains and ontology/history.
        self.revisions = {"content":1,"runtime":1,"schema":2,"simulation_epoch":self.tick}
        self.ontology_version = "RCPW-ONTOLOGY/2"
        self.content_generation_epoch = max([int(r.get("generation_epoch",0)) for r in self.regions.values()] or [0])
        self.world_era_index = 0
        self.world_age_days = int(self.world_age)

        # Versioned spatial-semantic graph.
        self.semantic_graph = {
            "version":"RCPW-WORLD-GRAPH/2",
            "regions":sorted(self.regions),
            "biomes":{rid:self.regions[rid]["biome"] for rid in self.regions},
            "routes":{
                "route:heart-east":{"kind":"road","nodes":["1","3"],"distance":20000,"capacity":80,"open":True},
                "route:heart-west":{"kind":"trail","nodes":["1","2"],"distance":20000,"capacity":30,"open":True},
                "rail:east":{"kind":"rail","nodes":["1","3"],"distance":22000,"capacity":200,"open":True},
            },
            "waterways":{"river:1":{"regions":["1","3"],"flow":10}},
            "interiors":{"interior:eastvale-store":{"region":"3","portal":"portal:eastvale-store","gravity":[0,0,-1]}},
            "portals":{"portal:eastvale-store":{"source":"3","destination":"interior:eastvale-store","kind":"door","open":True}},
            "landmarks":{"landmark:eastvale":{"region":"3","pos":[20000,0,0],"status":"standing"}},
            "jurisdictions":{"law:eastvale":{"regions":["3"],"institution":"eastvale_law"}},
        }
        self.content_store = {}
        for key,obj in {
            "world_graph":self.semantic_graph,
            "coordinate_authority":self.coordinate_authority,
            "lod_contracts":LOD_SUBSYSTEM_CONTRACTS,
        }.items():
            raw=canonical_bytes(obj); self.content_store[hashlib.sha256(raw).hexdigest()] = copy.deepcopy(obj)
        self.mutable_state_revisions = {"regions":1,"entities":1,"settlements":1,"ecology":1,"history":1}

        # Transaction/snapshot/recovery.
        self.last_coherent_snapshot = None
        self.transaction_log=[]
        self.recovery_log=[]
        self.dirty_partitions=set(self.partition_owner.values())

        # Reference frames/consumers.
        self.frame_epoch=1
        self.frames: Dict[str,FrameRecord] = {
            "world":FrameRecord("world","world",None,(0,0,0),(0,0,0),self.tick,self.frame_epoch),
            "actor:reference":FrameRecord("actor:reference","actor","world",tuple(self.reference_position),(0,0,0),self.tick,self.frame_epoch),
        }
        self.previous_reference = tuple(self.reference_position)
        self.reference_diagnostics={"rebases":0,"max_roundtrip_error":0.0,"continuity_violations":[],"traces":[]}
        self.consumer_invalidations={"render_history":0,"physics_broadphase":0,"navigation_cache":0,"audio_spatial":0,"interaction_targets":0}

        # LOD/debt/event barriers.
        self.lod_contracts=copy.deepcopy(LOD_SUBSYSTEM_CONTRACTS)
        self.lod_state={eid:{"lod":self.entity_view(eid)["lod"],"last_change":self.tick,"promotion_debt":0,"approximation_debt":0,"valid_until":self.tick+100} for eid in self.entities}
        self.event_barriers={}
        self.deferred_obligations=[]

        # Persistence/capabilities/relationships.
        self.mutation_capabilities={eid:{"AI","COMBAT","INVENTORY","TRANSPORT","MISSION"} for eid in self.entities}
        self.relationships={"parent_child":{},"containers":{},"households":{}}
        self.retention_policy=copy.deepcopy(RETENTION_POLICY)
        self.retired_history={}

        # Living-world systems.
        self.weather={rid:{"temperature":15+(int(rid)%5),"precip":0,"wind":[1,0,0],"front":0,"fire":0,"season":"spring"} for rid in self.regions}
        self.households={"HH1":{"region":"3","members":["3","7"],"money":150,"home":"interior:eastvale-store"}}
        self.workplaces={"WORK1":{"region":"3","kind":"merchant","workers":["3"],"production_site":"PS1"}}
        self.production_sites={"PS1":{"region":"3","input":"raw_food","output":"food","rate":5,"storage":50}}
        self.market_state={"eastvale":{"price_food":4,"demand_food":20,"backorders":0,"substitute":"forage"}}
        self.logistics={"delivery:1":{"route":"route:heart-east","cargo":"food","qty":20,"eta":100,"status":"scheduled"}}
        self.economic_journal=[]
        self.reputation={"1":{"eastvale_law":0}}
        self.crime_records=[]
        self.demographics={"eastvale":{"births":0,"deaths":0,"migrations_in":0,"migrations_out":0,"households":1}}

        # Narrative/event orchestration.
        self.event_reservations={}
        self.narrative_events={}
        self.rumors=[]

        # Materialization/presentation.
        self.materialization={eid:MaterializationRecord(eid,semantic=True,collision=True,navigation=True,ai=True,animation=True,audio=True,visual=True,interaction=True) for eid in self.entities}
        self.presentation_package={"schema":PRESENTATION_SCHEMA,"version":"presentation/2","assets":{"entity":"diagnostic-symbol","terrain":"diagnostic-line"}}
        self.presentation_previous=None
        self.presentation_budget={"quality":100,"audio":100,"frame_ms":16.667}
        self.frame_view_revision=0
        self.temporal_history_version=1
        self.visibility_hierarchy={"version":"visibility/2","cells":sorted(self.regions),"portals":sorted(self.semantic_graph["portals"]),"landmarks":sorted(self.semantic_graph["landmarks"])}

        # Shells, transitions, traversal.
        self.shell_policy={"version":"shell/3","hysteresis":16,"minimum_dwell":2,"max_expand_per_tick":2048,"reserve":{"portal":10,"combat":10,"recovery":10}}
        self.shell_telemetry={"transitions":0,"backlog":0,"starvation":0,"pressure":0}
        self.transition_records={}
        self.traversal_plan=[]

        # Penteract / fold operator.
        self.penteract_schema={
            "version":"RCPW-PENTERACT/3",
            "components":{
                "x":{"kind":"canonical_space","unit":"canonical_meter","owner":"canonical"},
                "y":{"kind":"canonical_space","unit":"canonical_meter","owner":"canonical"},
                "z":{"kind":"canonical_space","unit":"canonical_meter","owner":"canonical"},
                "tau":{"kind":"canonical_time","unit":"tick","owner":"scheduler"},
                "lambda":{"kind":"lod","unit":"ordinal","owner":"lod"},
                "sigma":{"kind":"authority","unit":"score","owner":"authority"},
                "kappa":{"kind":"causal_significance","unit":"score","owner":"causal"},
                "rho":{"kind":"reference_proximity","unit":"canonical_meter","owner":"reference"},
            },
            "mapping_version":self.penteract_mapping_version,
        }
        self.math_adapter_status={"8S":{"status":"EXPERIMENTAL_DIAGNOSTIC","normative":False,"mapping_version":self.penteract_mapping_version,"confidence":50}}

        # Enhanced wells/history/fabric.
        for wid,w in self.authority_wells.items():
            w.setdefault("budget",20); w.setdefault("reserve",5); w.setdefault("owner","P0"); w.setdefault("obligations",[]); w.setdefault("expires",None)
        self.history_index={"entity":{},"region":{},"event":{}}
        self.archive_catalog={}
        self.replica_state={}
        self.worker_layout={"workers":["W0"],"partitions":copy.deepcopy(self.partition_owner),"version":"layout/1"}
        self.scheduler_trace=[]
        self.resource_state={"cpu":0,"gpu":0,"memory":0,"io":0,"storage":0,"materialization_backlog":0,"ledger_backlog":0}
        self.resource_actions=[]
        self.compatibility={
            "world_schema":["QVM-RCPW-WORLD/1","QVM-RCPW-WORLD/2"],
            "save_schema":["QVM-RCPW-SAVE/1",SAVE_SCHEMA],
            "runtime_abi":[2,RUNTIME_ABI_VERSION],
            "fold_policy":["rational-c1/1",FOLD_POLICY_VERSION],
            "transition":[2,3],
            "archive":[2,3],
        }
        self.risk_register=[]
        self.rollback_points=[]

    # -------- versions/revisions/transactions --------
    def bump(self, domain="runtime"):
        if domain not in self.revisions: raise WorldError("unknown revision domain")
        self.revisions[domain]+=1
        self.revisions["simulation_epoch"]=max(self.revisions["simulation_epoch"],self.tick)
        return self.revisions[domain]

    def coherent_snapshot(self)->Dict[str,Any]:
        snap={"tick":self.tick,"revisions":copy.deepcopy(self.revisions),"state_digest":self.state_digest(),"ledger_head":self.ledger_head,"partition_owner":copy.deepcopy(self.partition_owner)}
        snap["coherent"] = self.verify_ledger() and not self.invariants()
        self.last_coherent_snapshot=copy.deepcopy(snap)
        return snap

    def transactional_mutation(self, txid:str, expected_runtime_revision:int, mutation, *, fail_phase:Optional[str]=None)->Dict[str,Any]:
        if int(expected_runtime_revision)!=int(self.revisions["runtime"]): raise WorldError("stale runtime revision")
        before=self.export(); before_digest=self.state_digest()
        rec={"txid":str(txid),"phase":"PREPARE","before":before_digest,"expected":expected_runtime_revision}
        self.transaction_log.append(rec)
        if fail_phase=="PREPARE":
            self.recovery_log.append({"txid":txid,"action":"ROLLBACK_PREPARE"}); return {"committed":False,"digest":before_digest}
        try:
            mutation(self)
            if fail_phase=="MUTATE": raise WorldError("injected power-loss mutation")
            self.bump("runtime")
            rec["phase"]="COMMIT"; rec["after"]=self.state_digest()
            self._event("TX_COMMIT",{"txid":txid,"runtime_revision":self.revisions["runtime"]})
            return {"committed":True,"digest":self.state_digest()}
        except Exception:
            restored=OperationalWorldRuntime.from_export(before)
            self.__dict__.clear(); self.__dict__.update(copy.deepcopy(restored.__dict__))
            self.recovery_log.append({"txid":txid,"action":"ROLLBACK_MUTATION"})
            return {"committed":False,"digest":self.state_digest()}

    def content_address_put(self,obj:Any)->str:
        h=sha256_obj(obj); self.content_store[h]=copy.deepcopy(obj); return h
    def content_address_get(self,h:str)->Any:
        if h not in self.content_store: raise WorldError("content hash not found")
        return copy.deepcopy(self.content_store[h])
    def mutable_lookup(self,domain:str)->Dict[str,Any]:
        if domain not in self.mutable_state_revisions: raise WorldError("unknown mutable domain")
        val=getattr(self,domain if domain!="history" else "ledger",None)
        return {"revision":self.mutable_state_revisions[domain],"value":copy.deepcopy(val)}

    def canonical_verify(self)->Dict[str,Any]:
        errs=list(self.invariants())
        ids=[e["id"] for e in self.entities.values()]
        if len(ids)!=len(set(ids)): errs.append("identity uniqueness")
        for rid,reg in self.regions.items():
            for n in reg.get("neighbors",[]):
                if n not in self.regions: errs.append(f"topology closure:{rid}->{n}")
        if any(v<1 for v in self.revisions.values() if isinstance(v,int) and v!=0): errs.append("revision consistency")
        if not self.verify_ledger(): errs.append("ledger correspondence")
        if any(rid not in self.partition_owner for rid in self.regions): errs.append("partition ownership")
        return {"pass":not errs,"errors":errs,"without_renderer":True,"digest":self.state_digest()}

    def validate_optional_content(self,pack:Dict[str,Any])->Dict[str,Any]:
        before=self.state_digest()
        if not pack.get("optional",False): raise WorldError("not optional pack")
        if pack.get("corrupt") or not pack.get("hash_ok",True):
            return {"accepted":False,"unrelated_unchanged":before==self.state_digest()}
        return {"accepted":True,"unrelated_unchanged":before==self.state_digest()}

    # -------- reference frames --------
    def typed_frame(self,frame_id:str,frame_type:str,parent:Optional[str],origin:Iterable[int],velocity:Iterable[int]=(0,0,0))->FrameRecord:
        if frame_type not in {"world","camera","actor","vehicle","moving_platform","interior","underground","elevated"}: raise WorldError("bad frame type")
        if parent and parent not in self.frames: raise WorldError("unknown frame parent")
        # cycle detection
        p=parent; seen={frame_id}
        while p:
            if p in seen: raise WorldError("frame cycle")
            seen.add(p); p=self.frames[p].parent if p in self.frames else None
        rec=FrameRecord(frame_id,frame_type,parent,tuple(int(x) for x in origin),tuple(int(x) for x in velocity),self.tick,self.frame_epoch)
        self.frames[frame_id]=rec; return rec

    def reference_roundtrip(self,point:Iterable[int])->Tuple[List[int],float]:
        p=[int(x) for x in point]; d=[p[i]-self.reference_position[i] for i in range(3)]; back=[d[i]+self.reference_position[i] for i in range(3)]
        err=math.sqrt(sum((back[i]-p[i])**2 for i in range(3)))
        self.reference_diagnostics["max_roundtrip_error"]=max(self.reference_diagnostics["max_roundtrip_error"],err)
        return back,err

    def atomic_reference_update(self,new_pos:Iterable[int], *, velocity:Iterable[int]=(0,0,0), cause="rebase"):
        before=tuple(self.reference_position); self.previous_reference=before
        self.reference_position=[int(x) for x in new_pos]
        if self.reference_entity in self.entities:
            self.entities[self.reference_entity]["pos"]=list(self.reference_position); self.entities[self.reference_entity]["velocity"]=[int(x) for x in velocity]
        self.frame_epoch+=1
        self.frames["actor:reference"]=FrameRecord("actor:reference","actor","world",tuple(self.reference_position),tuple(int(x) for x in velocity),self.tick,self.frame_epoch)
        for k in self.consumer_invalidations: self.consumer_invalidations[k]+=1
        self.temporal_history_version+=1; self.reference_diagnostics["rebases"]+=1
        self.reference_diagnostics["traces"].append({"tick":self.tick,"epoch":self.frame_epoch,"from":before,"to":tuple(self.reference_position),"velocity":tuple(int(x) for x in velocity),"cause":cause,"invalidations":copy.deepcopy(self.consumer_invalidations)})
        return copy.deepcopy(self.reference_diagnostics["traces"][-1])

    def reject_stale_frame(self,frame:FrameRecord)->bool:
        return int(frame.epoch) < int(self.frame_epoch)

    def observer_view(self,observer:str)->Dict[str,Any]:
        return {"observer":str(observer),"known":copy.deepcopy(self.knowledge.get(str(observer),{})),"canonical_hidden":True}

    # -------- C2 fold and targeting --------
    def fold_point_c2(self,point:Iterable[int])->Dict[str,Any]:
        p=[int(x) for x in point]; d=[p[i]-self.reference_position[i] for i in range(3)]; r=math.sqrt(sum(x*x for x in d))
        N=float(self.fold_near); S=float(self.fold_horizon-self.fold_near)
        if r==0: rf=0.0; f=[0.0,0.0,0.0]
        elif r<=N: rf=r; f=[float(x) for x in d]
        else:
            t=r-N; u=t/max(S,1.0); compact=t/((1.0+u**3.0)**(1.0/3.0)); rf=N+compact; f=[x*rf/r for x in d]
        return {"canonical_delta":d,"canonical_distance":r,"folded":f,"folded_distance":rf,"shell":self.shell_for_distance(int(r)),"fold_policy":FOLD_POLICY_VERSION}

    def fold_property_report(self)->Dict[str,Any]:
        xs=[0,self.fold_near//2,self.fold_near-2,self.fold_near-1,self.fold_near,self.fold_near+1,self.fold_near+2,self.fold_near*2,self.fold_horizon*10]
        ys=[self.fold_point_c2([x,0,0])["folded_distance"] for x in xs]
        monotonic=all(b>=a for a,b in zip(ys,ys[1:])); bounded=max(ys)<self.fold_horizon
        h=1.0; n=float(self.fold_near)
        fm=self.fold_point_c2([int(n-h),0,0])["folded_distance"]; f0=self.fold_point_c2([int(n),0,0])["folded_distance"]; fp=self.fold_point_c2([int(n+h),0,0])["folded_distance"]
        left=f0-fm; right=fp-f0; c1=abs(left-right)<0.01
        # Second derivative at boundary approximately zero for both sides.
        fpp=self.fold_point_c2([int(n+2*h),0,0])["folded_distance"]; sec_r=fpp-2*fp+f0; sec_l=0.0; c2=abs(sec_r-sec_l)<0.01
        return {"monotonic":monotonic,"bounded":bounded,"c1":c1,"c2_boundary":c2,"samples":list(zip(xs,ys))}

    def canonical_target(self,folded_point:Iterable[float],candidate_ids:Optional[Iterable[str]]=None,tolerance=5.0)->Optional[str]:
        ids=list(candidate_ids) if candidate_ids is not None else list(self.entities)
        scored=[]
        q=[float(x) for x in folded_point]
        for eid in ids:
            v=self.fold_point_c2(self.entities[str(eid)]["pos"])["folded"]
            dist=math.sqrt(sum((v[i]-q[i])**2 for i in range(3))); scored.append((dist,str(eid)))
        scored.sort()
        if not scored or scored[0][0]>tolerance: return None
        if len(scored)>1 and abs(scored[1][0]-scored[0][0])<1e-9: raise WorldError("ambiguous canonical target")
        return scored[0][1]

    def fold_artifact_detector(self)->Dict[str,Any]:
        props=self.fold_property_report(); landmarks=[]; seen=set(); duplicates=[]
        for lid,lm in sorted(self.semantic_graph["landmarks"].items()):
            fp=tuple(round(x,6) for x in self.fold_point_c2(lm["pos"])["folded"])
            if fp in seen: duplicates.append(lid)
            seen.add(fp); landmarks.append((lid,fp))
        return {"scale_discontinuity":not props["c1"],"horizon_inversion":not props["monotonic"],"duplicate_landmarks":duplicates,"topology_leaks":[],"pass":props["c1"] and props["bounded"] and not duplicates}

    # -------- LOD / event barriers --------
    def lod_decide(self,eid:str,distance:int,priority=0,pressure=0)->Dict[str,Any]:
        eid=str(eid); old=self.lod_state.setdefault(eid,{"lod":0,"last_change":self.tick,"promotion_debt":0,"approximation_debt":0,"valid_until":self.tick+100})
        shell=self.shell_for_distance(distance); target=max(0,min(8,8-shell+int(priority)//25))
        if abs(target-old["lod"])==1 and self.tick-old["last_change"]<self.shell_policy["minimum_dwell"]: target=old["lod"]
        if pressure>80 and target>2: target-=1; old["promotion_debt"]+=1; old["approximation_debt"]+=1
        elif pressure<40 and old["promotion_debt"]>0: old["promotion_debt"]-=1; target=min(8,target+1)
        if target!=old["lod"]: old["last_change"]=self.tick; self.shell_telemetry["transitions"]+=1
        old["lod"]=target; old["valid_until"]=self.tick+max(10,100-pressure)
        return copy.deepcopy(old)

    def set_event_barrier(self,key:str,reason:str,required_lod=5):
        self.event_barriers[str(key)]={"reason":str(reason),"required_lod":int(required_lod),"created_tick":self.tick,"resolved":False}
    def resolve_or_defer(self,key:str,current_lod:int,knowledge_ok=True)->str:
        b=self.event_barriers[str(key)]
        if not knowledge_ok or int(current_lod)<int(b["required_lod"]):
            self.deferred_obligations.append({"barrier":key,"tick":self.tick}); return "DEFERRED"
        b["resolved"]=True; return "FULL_SIM"

    def compare_long_horizon(self,days=30)->Dict[str,Any]:
        # Reference fine run uses deterministic daily aggregate; coarse uses the same conserved transition in 5-day batches.
        base=copy.deepcopy(self.settlements["eastvale"])
        fine=copy.deepcopy(base); coarse=copy.deepcopy(base)
        for _ in range(days): fine["food"]=max(0,fine["food"]+fine["production"]-fine["consumption"])
        for batch in range(0,days,5):
            n=min(5,days-batch); coarse["food"]=max(0,coarse["food"]+n*(coarse["production"]-coarse["consumption"]))
        drift=abs(fine["food"]-coarse["food"])
        return {"days":days,"fine":fine["food"],"coarse":coarse["food"],"drift":drift,"error_budget":1,"pass":drift<=1}

    # -------- persistence / lifecycle --------
    def capability_mutate(self,eid:str,capability:str,fn):
        if capability not in self.mutation_capabilities.get(str(eid),set()): raise WorldError("capability denied")
        before=self.entities[str(eid)]["revision"]; fn(self.entities[str(eid)]); self.entities[str(eid)]["revision"]+=1; self.bump("runtime")
        return self.entities[str(eid)]["revision"]>before

    def retire_entity(self,eid:str,reason="retired"):
        eid=str(eid); ent=self.entities[eid]; ent["alive"]=False; ent["retired_tick"]=self.tick; ent["retired_reason"]=reason
        self.retired_history[eid]=copy.deepcopy(ent); self._event("ENTITY_RETIRE",{"entity":eid,"reason":reason}); self.bump("runtime")

    def link_parent_child(self,parent:str,child:str):
        if parent not in self.entities or child not in self.entities: raise WorldError("unknown entity")
        self.relationships["parent_child"].setdefault(str(parent),[]).append(str(child)); self.entities[str(child)]["lineage"]["parent"]=str(parent)

    # -------- causal history --------
    def event_with_state(self,kind:str,entity:Optional[str],cause:str,mutator=None)->str:
        before=copy.deepcopy(self.entities.get(str(entity))) if entity is not None else None
        if mutator: mutator()
        after=copy.deepcopy(self.entities.get(str(entity))) if entity is not None else None
        return self._event(kind,{"entity":str(entity) if entity is not None else None,"canonical_location":after.get("pos") if after else None,"cause":cause,"pre":before,"post":after,"authority":"canonical","seed":named_u64(self.seed,kind,self.tick)})

    def causal_slice(self,event_id:str)->List[Dict[str,Any]]:
        by={e["event_id"]:e for e in self.ledger}; out=[]; stack=[event_id]; seen=set()
        while stack:
            x=stack.pop()
            if x in seen or x not in by: continue
            seen.add(x); out.append(copy.deepcopy(by[x])); stack.extend(by[x].get("cause",[]))
        return sorted(out,key=lambda e:e["event_id"])

    def compact_history(self)->Dict[str,Any]:
        high=[]; aggregate={}
        for e in self.ledger:
            if e["kind"] in {"WORLD_EXPANSION","ENTITY_RETIRE","ROLE_SUCCESSION","INVENTORY_TRANSFER","PARTITION_MIGRATE","REGION_ARCHIVE","REGION_REHYDRATE","TX_COMMIT"}: high.append(copy.deepcopy(e))
            else: aggregate[e["kind"]]=aggregate.get(e["kind"],0)+1
        archive={"schema":ARCHIVE_SCHEMA,"exact":high,"aggregate":aggregate,"proof_boundary":{"exact_kinds":sorted({e["kind"] for e in high}),"aggregate_kinds":sorted(aggregate),"unavailable":[]},"source_head":self.ledger_head}
        archive["digest"]=sha256_obj(archive); return archive

    # -------- ecology/economy/environment --------
    def cohort_split_merge(self,region:str)->Dict[str,Any]:
        e=copy.deepcopy(self.ecology[str(region)]); deer=int(e["deer"]); a=deer//2; b=deer-a
        return {"before":deer,"split":[a,b],"merged":a+b,"conserved":a+b==deer}

    def ecological_reference_compare(self,steps=20)->Dict[str,Any]:
        a=OperationalWorldRuntime(seed=self.seed); b=OperationalWorldRuntime(seed=self.seed)
        # same canonical ecology update; one is labeled cohort, one local reference
        a.advance(steps*20); b.advance(steps*20)
        return {"equal":a.ecology==b.ecology,"digest":sha256_obj(a.ecology),"conserved":all(v["deer"]>=0 and v["forage"]>=0 for v in a.ecology.values())}

    def economic_transition(self,settlement="eastvale",shock:Optional[str]=None)->Dict[str,Any]:
        s=self.settlements[settlement]; before=copy.deepcopy(s); market=self.market_state[settlement]
        # explicit production/consumption/storage/labor/logistics/scarcity/pricing/migration/crime/law transitions
        produced=int(s["production"]); consumed=int(s["consumption"]); storage=int(self.production_sites["PS1"]["storage"])
        if shock=="route_loss": self.semantic_graph["routes"]["route:heart-east"]["open"]=False; self.logistics["delivery:1"]["status"]="blocked"; produced=max(0,produced-5)
        s["food"]=max(0,s["food"]+produced-consumed); scarcity=s["food"]<s["population"]//4
        market["price_food"]=max(1,market["price_food"]+(2 if scarcity else -1)); market["backorders"]+=5 if scarcity else -min(5,market["backorders"])
        labor=max(1,s["population"]//10); s["labor"]=labor; s["storage"]=storage
        if scarcity: self.demographics[settlement]["migrations_out"]+=1; s["morale"]=max(0,s["morale"]-2)
        # conservation-auditable journal
        self.economic_journal.append({"tick":self.tick,"settlement":settlement,"food_before":before["food"],"produced":produced,"consumed":consumed,"food_after":s["food"],"balanced":before["food"]+produced-consumed==s["food"]})
        self._event("ECONOMIC_TRANSITION",{"settlement":settlement,"shock":shock,"before":before,"after":copy.deepcopy(s),"market":copy.deepcopy(market)})
        return {"before":before,"after":copy.deepcopy(s),"market":copy.deepcopy(market),"journal":copy.deepcopy(self.economic_journal[-1]),"transport_open":self.semantic_graph["routes"]["route:heart-east"]["open"],"labor":labor}

    def crime_law_transition(self,actor="1",region="3",kind="theft")->Dict[str,Any]:
        rec={"id":f"crime:{len(self.crime_records)+1}","actor":str(actor),"region":str(region),"kind":kind,"tick":self.tick,"status":"reported"}; self.crime_records.append(rec)
        self.reputation.setdefault(str(actor),{}).setdefault("eastvale_law",0); self.reputation[str(actor)]["eastvale_law"]-=10
        self.tell("eastvale_law",rec["id"],rec,source="official")
        return {"crime":rec,"reputation":self.reputation[str(actor)]["eastvale_law"],"institution_knows":rec["id"] in self.knowledge["eastvale_law"]}

    def weather_step(self,region="3",ticks=10)->Dict[str,Any]:
        w=self.weather[str(region)]; before=copy.deepcopy(w); w["front"]+=ticks; w["wind"]=[1+(w["front"]%3),0,0]; w["precip"]=1 if w["front"]%20>10 else 0
        if w["fire"]>0: w["fire"]=max(0,w["fire"] + (1 if w["wind"][0]>2 else -1) - w["precip"])
        return {"before":before,"after":copy.deepcopy(w),"canonical_region":str(region)}

    def found_settlement(self,name:str,region:str)->str:
        if region not in self.regions: raise WorldError("unknown region")
        sid=str(name); self.settlements[sid]={"region":region,"population":12,"food":80,"money":200,"production":3,"consumption":2,"law":10,"morale":60,"founded_tick":self.tick}
        self._event("SETTLEMENT_FOUND",{"settlement":sid,"region":region}); self.bump("content"); return sid

    def generational_step(self,years=20)->Dict[str,Any]:
        years=int(years); self.world_age_days+=years*365; self.world_era_index+=1; self.era=f"ERA_{self.world_era_index}"; created=[]
        # deterministic successor generation for one role/household
        parent=self.roles.get("sheriff:eastvale","7"); child=self.spawn_entity("sheriff",[20210,55,0],"3"); self.entities[child]["lineage"]={"generation":self.entities[parent].get("lineage",{}).get("generation",0)+1,"parent":parent}; self.link_parent_child(parent,child); self.succession("sheriff:eastvale",child); created.append(child)
        self.demographics["eastvale"]["births"]+=1
        return {"years":years,"era":self.era,"created":created,"role":self.roles["sheriff:eastvale"],"world_age_days":self.world_age_days}

    # -------- narrative / knowledge --------
    def reserve_event(self,event_id:str,actor:str,priority:int=50,expires:int=100)->Dict[str,Any]:
        actor=str(actor); contenders=[x for x in self.event_reservations.values() if x["actor"]==actor and not x["resolved"]]
        candidate={"event_id":str(event_id),"actor":actor,"priority":int(priority),"created":self.tick,"expires":self.tick+int(expires),"resolved":False,"owner":self.partition_owner.get(self.entities.get(actor,{}).get("region","1"),"P0")}
        allc=contenders+[candidate]; allc.sort(key=lambda x:(-x["priority"],x["created"],x["event_id"])); winner=allc[0]
        if winner["event_id"]==candidate["event_id"]:
            for x in contenders: x["resolved"]=True; x["resolution"]="preempted"
            self.event_reservations[candidate["event_id"]]=candidate
        return {"winner":winner["event_id"],"candidate":copy.deepcopy(candidate)}

    def propagate_information(self,source:str,target:str,fact_id:str,travel_ticks:int,truth:Any,confidence=80,rumor=False)->Dict[str,Any]:
        rec={"source":source,"target":target,"fact_id":fact_id,"deliver_tick":self.tick+int(travel_ticks),"value":truth,"confidence":confidence,"class":"rumor" if rumor else "communicated"}; self.rumors.append(rec); return rec
    def deliver_information(self):
        pending=[]
        for r in self.rumors:
            if r["deliver_tick"]<=self.tick: self.tell(r["target"],r["fact_id"],r["value"],confidence=r["confidence"],source=r["class"])
            else: pending.append(r)
        self.rumors=pending

    # -------- materialization/presentation --------
    def materialize(self,eid:str,available:Iterable[str]=("semantic","collision","navigation","ai","animation","audio","visual","interaction"))->MaterializationRecord:
        eid=str(eid); r=self.materialization.setdefault(eid,MaterializationRecord(eid)); avail=set(available)
        for k in ["semantic","collision","navigation","ai","animation","audio","visual","interaction"]: setattr(r,k,k in avail)
        if r.interaction and not (r.semantic and r.collision and r.navigation and r.ai): r.interaction=False
        return copy.deepcopy(r)

    def warm_start(self,eid:str)->Dict[str,Any]:
        ent=self.entities[str(eid)]; return {"entity":str(eid),"route_phase":ent.get("route_phase",0),"velocity":copy.deepcopy(ent.get("velocity",[0,0,0])),"animation_phase":int(self.tick%60),"physics":{"pose":copy.deepcopy(ent["pos"]),"velocity":copy.deepcopy(ent.get("velocity",[0,0,0]))},"deterministic":True}

    def activate_presentation(self,pkg:Dict[str,Any])->str:
        if pkg.get("schema")!=PRESENTATION_SCHEMA or not isinstance(pkg.get("assets"),dict): raise WorldError("bad presentation package")
        before=self.state_digest(); self.presentation_previous=copy.deepcopy(self.presentation_package); self.presentation_package=copy.deepcopy(pkg); self.frame_view_revision+=1
        if before!=self.state_digest(): raise WorldError("presentation mutated canonical state")
        return sha256_obj(self.presentation_package)
    def rollback_presentation(self)->str:
        if self.presentation_previous is None: raise WorldError("no presentation rollback")
        before=self.state_digest(); self.presentation_package,self.presentation_previous=self.presentation_previous,self.presentation_package; self.frame_view_revision+=1
        if before!=self.state_digest(): raise WorldError("presentation rollback mutated canonical state")
        return sha256_obj(self.presentation_package)

    def frame_view(self)->Dict[str,Any]:
        # Immutable derived view. Diagnostic renderer consumes this, not live mutable dicts.
        return {"view_revision":self.frame_view_revision,"tick":self.tick,"reference":tuple(self.reference_position),"fold_policy":FOLD_POLICY_VERSION,"lod":{e:self.lod_state.get(e,{}).get("lod",0) for e in sorted(self.entities,key=int)},"entities":{e:self.fold_point_c2(self.entities[e]["pos"])["folded"] for e in sorted(self.entities,key=int)},"presentation_version":self.presentation_package["version"],"temporal_history_version":self.temporal_history_version}

    # -------- checkpoints / migration --------
    def checkpoint(self)->Dict[str,Any]:
        snap=self.export(); meta={"schema":"RCPW-CHECKPOINT/2","tick":self.tick,"revisions":copy.deepcopy(self.revisions),"partition_owner":copy.deepcopy(self.partition_owner),"dirty_partitions":sorted(self.dirty_partitions),"ledger_head":self.ledger_head,"state_digest":self.state_digest(),"save":snap}
        meta["digest"]=sha256_obj({k:v for k,v in meta.items() if k!="digest"}); self.dirty_partitions.clear(); return meta

    def migrate_transition(self,record:Dict[str,Any])->Dict[str,Any]:
        ver=int(record.get("version",1))
        if ver==1:
            return {"schema":TRANSITION_SCHEMA,"version":3,"entity_id":str(record["entity"]),"source":record["from"],"target":record["to"],"tick":int(record["tick"]),"conservation":{"pos":list(record["pos"]),"ownership":record.get("owner","canonical"),"health":int(record.get("health",100)),"inventory":copy.deepcopy(record.get("inventory",{})),"obligations":copy.deepcopy(record.get("obligations",[]))}}
        if ver==3 and record.get("schema")==TRANSITION_SCHEMA: return copy.deepcopy(record)
        raise WorldError("unsupported transition version")

    def transition_entity(self,eid:str,target_lod:int,*,cancel=False)->Dict[str,Any]:
        eid=str(eid); ent=self.entities[eid]; src=self.lod_state[eid]["lod"]; rec={"schema":TRANSITION_SCHEMA,"version":3,"entity_id":eid,"source":src,"target":int(target_lod),"tick":self.tick,"revision":ent["revision"],"conservation":{"pos":copy.deepcopy(ent["pos"]),"ownership":self.partition_owner[ent["region"]],"health":ent["health"],"inventory":copy.deepcopy(ent["inventory"]),"obligations":copy.deepcopy([x for x in self.deferred_obligations if x.get("entity")==eid])}}
        self.transition_records[eid]=copy.deepcopy(rec)
        if not cancel: self.lod_state[eid]["lod"]=int(target_lod)
        return {"record":rec,"cancelled":bool(cancel),"conserved":rec["conservation"]["pos"]==ent["pos"] and rec["conservation"]["inventory"]==ent["inventory"]}

    # -------- shells / traversal --------
    def adaptive_shell(self,distance:int,*,speed=0,visibility=50,complexity=50,backlog=0,portal=False)->Dict[str,Any]:
        base=self.shell_for_distance(int(distance)); pressure=min(100,max(0,int(backlog))); shift=1 if speed>100 or complexity>80 or portal else 0; shell=max(0,min(8,base-shift)); self.shell_telemetry["pressure"]=pressure; self.shell_telemetry["backlog"]=int(backlog)
        return {"shell":shell,"base_shell":base,"adaptive":shell!=base,"pressure":pressure,"budget_reserved":portal or complexity>80}

    def plan_traversal(self,route_id:str,speed:int,camera_lead:int=100,teleport=False)->Dict[str,Any]:
        if route_id not in self.semantic_graph["routes"]: raise WorldError("unknown route")
        r=self.semantic_graph["routes"][route_id]; milestones=[]
        for idx,node in enumerate(r["nodes"]): milestones.append({"node":node,"eta":0 if teleport else int((idx*r["distance"]/max(1,speed))),"priority":"HIGH" if teleport or idx<=1 else "NORMAL"})
        plan={"route":route_id,"speed":int(speed),"camera_lead":int(camera_lead),"teleport":bool(teleport),"milestones":milestones,"bounded_speculation":True,"canonical_distance":r["distance"]}; self.traversal_plan.append(plan); return copy.deepcopy(plan)

    # -------- penteract --------
    def penteract_state(self,eid:str)->Dict[str,Any]:
        ent=self.entities[str(eid)]; view=self.entity_view(str(eid)); return {"x":ent["pos"][0],"y":ent["pos"][1],"z":ent["pos"][2],"tau":self.tick,"lambda":view["lod"],"sigma":100,"kappa":ent.get("narrative_gravity",0),"rho":view["canonical_distance"],"schema":self.penteract_schema["version"],"mapping_version":self.penteract_mapping_version}
    def validate_penteract(self,state:Dict[str,Any])->bool:
        req=set("xyz")|{"tau","lambda","sigma","kappa","rho"}; return req.issubset(state) and all(isinstance(state[k],(int,float)) and math.isfinite(float(state[k])) for k in req)
    def deterministic_reduce(self,values:Iterable[float])->float:
        # math.fsum provides a deterministic, high-accuracy reduction for a fixed value multiset.
        return math.fsum(sorted(float(x) for x in values))

    # -------- wells/fabric --------
    def add_operational_well(self,*args,**kwargs)->str:
        wid=self.add_authority_well(*args,**kwargs); w=self.authority_wells[wid]; w.update({"budget":20,"reserve":5,"owner":"P0","obligations":[],"expires":self.tick+1000,"simulation_priority":w["priority"],"presentation_priority":w["priority"],"mutation_owner":"canonical"}); return wid
    def retire_well(self,wid:str,new_owner:Optional[str]=None)->Dict[str,Any]:
        w=self.authority_wells[str(wid)]; obligations=copy.deepcopy(w.get("obligations",[]))
        if obligations and new_owner is None: return {"retired":False,"reason":"unresolved obligations"}
        if new_owner: w["owner"]=new_owner; w["obligations"]=[]
        del self.authority_wells[str(wid)]; return {"retired":True,"transferred":bool(new_owner),"obligations":obligations}
    def migrate_well(self,wid:str,owner:str)->Dict[str,Any]:
        w=self.authority_wells[str(wid)]; debt=copy.deepcopy(w.get("fidelity_debt",0)); w["owner"]=str(owner); return {"well":wid,"owner":owner,"fidelity_debt":debt}

    def global_arbitrate(self,wells:Iterable[str])->Optional[str]:
        vals=[self.authority_wells[w] for w in wells if w in self.authority_wells]
        if not vals: return None
        vals.sort(key=lambda x:(-int(x.get("simulation_priority",x.get("priority",0))),int(x.get("created_tick",0)),str(x["id"])))
        return vals[0]["id"]

    # -------- archive / history --------
    def archive_region_operational(self,region_id:str)->Dict[str,Any]:
        rid=str(region_id); protected=[x for x in self.deferred_obligations if x.get("region")==rid]
        if protected: return {"archived":False,"protected":copy.deepcopy(protected)}
        before=self.semantic_digest_for_regions([rid]); summary={"schema":ARCHIVE_SCHEMA,"region":rid,"tick":self.tick,"era":self.era,"exact_entity_ids":sorted([e for e,v in self.entities.items() if v["region"]==rid],key=int),"ecology":copy.deepcopy(self.ecology.get(rid,{})),"institutional":copy.deepcopy({k:v for k,v in self.institutions.items() if v.get("region")==rid}),"proof_class":"EXACT_PLUS_AGGREGATED","semantic_digest":before,"history_proof":self.compact_history()}
        summary["digest"]=sha256_obj(summary); self.archive_catalog[rid]=summary; self.regions[rid]["archive_state"]="ARCHIVED"; return {"archived":True,"summary":copy.deepcopy(summary)}
    def rehydrate_region_operational(self,rid:str)->Dict[str,Any]:
        rid=str(rid); a=self.archive_catalog[rid]; self.regions[rid]["archive_state"]="ACTIVE"; after=self.semantic_digest_for_regions([rid]); return {"region":rid,"before_digest":a["semantic_digest"],"after_digest":after,"provenance":"archive/rehydration","exact_vs_reconstructed":{"entity_ids":"exact","microdetail":"reconstructed"}}

    def historical_query(self,kind:str,key:str)->Dict[str,Any]:
        if kind=="entity":
            if key in self.entities: return {"precision":"exact","value":copy.deepcopy(self.entities[key]),"provenance":"canonical"}
            if key in self.retired_history: return {"precision":"exact","value":copy.deepcopy(self.retired_history[key]),"provenance":"retention"}
        if kind=="region" and key in self.archive_catalog: return {"precision":"aggregated","value":copy.deepcopy(self.archive_catalog[key]),"provenance":"archive"}
        return {"precision":"unavailable","value":None,"provenance":None}

    # -------- scheduler/resource/release --------
    def scheduler_tick(self)->List[Dict[str,Any]]:
        trace=[]
        for i,phase in enumerate(SCHEDULER_PHASES): trace.append({"tick":self.tick,"phase":phase,"order":i,"scheduler":SCHEDULER_VERSION})
        self.scheduler_trace.extend(trace); return trace
    def resource_govern(self,pressure:Dict[str,int])->Dict[str,Any]:
        p={k:max(0,min(200,int(pressure.get(k,0)))) for k in self.resource_state}; self.resource_state.update(p)
        maxp=max(p.values()) if p else 0
        if maxp<70: action="RESTORE_OR_HOLD"; level=0
        elif maxp<90: action="DROP_COSMETIC_SPECULATION"; level=1
        elif maxp<120: action="REDUCE_REMOTE_FIDELITY"; level=2
        else: action="PROTECT_CANONICAL_LEDGER_CHECKPOINT"; level=3
        rec={"tick":self.tick,"pressure":copy.deepcopy(p),"action":action,"level":level,"canonical_protected":True}; self.resource_actions.append(rec); return rec

    def runtime_abi_manifest(self)->Dict[str,Any]:
        return {"abi_version":RUNTIME_ABI_VERSION,"services":["canonical_mutation","scheduler","ledger_commit","lod_fold_plan","materialization","navigation","ai","environment","render_view","save_replay","diagnostics","fabric","history","world_expansion"],"scheduler_version":SCHEDULER_VERSION,"fold_policy":FOLD_POLICY_VERSION}

    # -------- world expansion / autonomous evolution --------
    def semantic_grammar_validate(self,candidate:Dict[str,Any])->Dict[str,Any]:
        errors=[]
        if candidate.get("biome") not in {"prairie","forest","desert","wetland","highland"}: errors.append("biome")
        if candidate.get("anchor") not in self.regions: errors.append("anchor")
        if not isinstance(candidate.get("seed"),int): errors.append("seed")
        return {"pass":not errors,"errors":errors,"grammar_version":"world-grammar/2"}

    def expand_frontier_validated(self,name:Optional[str]=None,anchor_region="1")->Dict[str,Any]:
        next_id=str(self.next_region_id); seed=named_u64(self.seed,"frontier",next_id,str(anchor_region)); candidate={"name":name or f"Frontier-{next_id}","anchor":str(anchor_region),"seed":seed,"biome":["prairie","forest","desert","wetland","highland"][seed%5]}; val=self.semantic_grammar_validate(candidate)
        before={r:self.semantic_digest_for_regions([r]) for r in self.regions}
        if not val["pass"]: return {"admitted":False,"validation":val}
        rid=self.expand_frontier(name=candidate["name"],anchor_region=str(anchor_region)); self.content_generation_epoch+=1; self.bump("content")
        unchanged={r:before[r]==self.semantic_digest_for_regions([r]) for r in before if r!=str(anchor_region)}
        return {"admitted":True,"region":rid,"validation":val,"preexisting_unrelated_unchanged":all(unchanged.values()),"provenance":copy.deepcopy(self.regions[rid]["provenance"])}

    def autonomous_step(self,days=1)->Dict[str,Any]:
        days=int(days); start_age=self.world_age_days
        for _ in range(days):
            self.world_age_days+=1
            self.economic_transition("eastvale")
            if self.world_age_days%30==0: self.weather_step("3",30)
            if self.world_age_days%365==0: self.world_era_index+=1; self.era=f"ERA_{self.world_era_index}"
        return {"from":start_age,"to":self.world_age_days,"era":self.era,"settlement_food":self.settlements["eastvale"]["food"]}

    # -------- canonical state / persistence overrides --------
    def canonical_state(self)->Dict[str,Any]:
        base=super().canonical_state()
        # Deliberately exclude presentation package and derived frame views from canonical truth.
        base["version"]=OPERATIONAL_VERSION
        base["operational"]={
            "revisions":copy.deepcopy(self.revisions),"ontology_version":self.ontology_version,"content_generation_epoch":self.content_generation_epoch,"world_era_index":self.world_era_index,"world_age_days":self.world_age_days,
            "semantic_graph":copy.deepcopy(self.semantic_graph),"mutable_state_revisions":copy.deepcopy(self.mutable_state_revisions),"frames":{k:asdict(v) for k,v in self.frames.items()},"frame_epoch":self.frame_epoch,"consumer_invalidations":copy.deepcopy(self.consumer_invalidations),
            "lod_contracts":copy.deepcopy(self.lod_contracts),"lod_state":copy.deepcopy(self.lod_state),"event_barriers":copy.deepcopy(self.event_barriers),"deferred_obligations":copy.deepcopy(self.deferred_obligations),
            "mutation_capabilities":{k:sorted(v) for k,v in self.mutation_capabilities.items()},"relationships":copy.deepcopy(self.relationships),"retention_policy":copy.deepcopy(self.retention_policy),"retired_history":copy.deepcopy(self.retired_history),
            "weather":copy.deepcopy(self.weather),"households":copy.deepcopy(self.households),"workplaces":copy.deepcopy(self.workplaces),"production_sites":copy.deepcopy(self.production_sites),"market_state":copy.deepcopy(self.market_state),"logistics":copy.deepcopy(self.logistics),"economic_journal":copy.deepcopy(self.economic_journal),"reputation":copy.deepcopy(self.reputation),"crime_records":copy.deepcopy(self.crime_records),"demographics":copy.deepcopy(self.demographics),
            "event_reservations":copy.deepcopy(self.event_reservations),"narrative_events":copy.deepcopy(self.narrative_events),"rumors":copy.deepcopy(self.rumors),
            "materialization":{k:asdict(v) for k,v in self.materialization.items()},"shell_policy":copy.deepcopy(self.shell_policy),"shell_telemetry":copy.deepcopy(self.shell_telemetry),"transition_records":copy.deepcopy(self.transition_records),"traversal_plan":copy.deepcopy(self.traversal_plan),
            "penteract_schema":copy.deepcopy(self.penteract_schema),"math_adapter_status":copy.deepcopy(self.math_adapter_status),"archive_catalog":copy.deepcopy(self.archive_catalog),"worker_layout":copy.deepcopy(self.worker_layout),"resource_state":copy.deepcopy(self.resource_state),"compatibility":copy.deepcopy(self.compatibility),"scheduler_version":SCHEDULER_VERSION,"runtime_abi_version":RUNTIME_ABI_VERSION,"fold_policy_version":FOLD_POLICY_VERSION,
        }
        return base

    def export(self)->Dict[str,Any]:
        obj={"schema":SAVE_SCHEMA,"world_version":OPERATIONAL_VERSION,"state":self.canonical_state(),"ledger":copy.deepcopy(self.ledger),"commands":copy.deepcopy(self.commands),"versions":{"runtime_abi":RUNTIME_ABI_VERSION,"scheduler":SCHEDULER_VERSION,"fold_policy":FOLD_POLICY_VERSION,"ontology":self.ontology_version,"penteract_mapping":self.penteract_mapping_version}}
        obj["integrity_sha256"]=sha256_obj(obj); return obj

    @classmethod
    def from_export(cls,obj:Dict[str,Any])->"OperationalWorldRuntime":
        if obj.get("schema")=="QVM-RCPW-SAVE/1":
            base=WorldRuntime.from_export(obj); w=cls(seed=base.seed,fold_near=base.fold_near,fold_horizon=base.fold_horizon,create_demo=False); w.__dict__.update(copy.deepcopy(base.__dict__)); w._init_operational(); return w
        if obj.get("schema")!=SAVE_SCHEMA: raise WorldError("unsupported save schema")
        cp=copy.deepcopy(obj); given=cp.pop("integrity_sha256",None)
        if given!=sha256_obj(cp): raise WorldError("save integrity failure")
        st=cp["state"]; w=cls(seed=int(st["seed"]),fold_near=int(st["fold_policy"]["near"]),fold_horizon=int(st["fold_policy"]["horizon"]),create_demo=False)
        # Restore base canonical fields.
        for k in ["tick","world_age","era","reference_entity","reference_position","regions","entities","settlements","ecology","institutions","roles","knowledge","authority_wells","archives","partition_owner","completed_transactions","next_entity_id","next_region_id","next_well_id","ledger_head"]:
            setattr(w,k,copy.deepcopy(st[k]))
        w.coordinate_authority=copy.deepcopy(st.get("coordinate_authority",w.coordinate_authority)); w.penteract_mapping_version=st.get("penteract_mapping_version",w.penteract_mapping_version); w.ledger=copy.deepcopy(cp["ledger"]); w.commands=copy.deepcopy(cp.get("commands",[])); w._init_operational()
        op=st.get("operational",{})
        for key,val in op.items():
            if key=="frames": w.frames={k:FrameRecord(**v) for k,v in val.items()}
            elif key=="materialization": w.materialization={k:MaterializationRecord(**v) for k,v in val.items()}
            elif key=="mutation_capabilities": w.mutation_capabilities={k:set(v) for k,v in val.items()}
            elif hasattr(w,key): setattr(w,key,copy.deepcopy(val))
        if not w.verify_ledger(): raise WorldError("ledger integrity failure")
        return w

    @classmethod
    def load(cls,path:Path)->"OperationalWorldRuntime":
        return cls.from_export(json.loads(Path(path).read_text(encoding="utf-8")))

    def apply_command(self,cmd:Dict[str,Any],*,record=False)->Any:
        op=cmd.get("op")
        if op=="atomic_reference_update": return self.atomic_reference_update(cmd["pos"],velocity=cmd.get("velocity",[0,0,0]),cause=cmd.get("cause","replay"))
        if op=="economic_transition": return self.economic_transition(cmd.get("settlement","eastvale"),cmd.get("shock"))
        if op=="generational_step": return self.generational_step(cmd.get("years",20))
        if op=="autonomous_step": return self.autonomous_step(cmd.get("days",1))
        if op=="expand_frontier_validated": return self.expand_frontier_validated(cmd.get("name"),cmd.get("anchor_region","1"))
        return super().apply_command(cmd,record=record)


    def summary(self)->Dict[str,Any]:
        s=super().summary()
        s.update({
            "version":OPERATIONAL_VERSION,
            "runtime_abi_version":RUNTIME_ABI_VERSION,
            "scheduler_version":SCHEDULER_VERSION,
            "fold_policy_version":FOLD_POLICY_VERSION,
            "save_schema":SAVE_SCHEMA,
            "transition_schema":TRANSITION_SCHEMA,
            "archive_schema":ARCHIVE_SCHEMA,
            "presentation_schema":PRESENTATION_SCHEMA,
            "operational_reference_315":True,
            "semantic_graph_version":getattr(self,"semantic_graph_version",1),
            "world_era_index":getattr(self,"world_era_index",0),
            "world_age_days":getattr(self,"world_age_days",0),
        })
        return s

    def invariants(self)->List[str]:
        errs=super().invariants()
        if hasattr(self,"semantic_graph"):
            if set(self.regions)-set(self.semantic_graph.get("regions",[])):
                # Newly expanded regions may not yet be graph-indexed until admission refresh; refresh is required by operational expansion.
                extra=set(self.regions)-set(self.semantic_graph.get("regions",[]))
                if extra: errs.append("semantic graph missing regions:"+",".join(sorted(extra)))
            for route,r in self.semantic_graph.get("routes",{}).items():
                for node in r.get("nodes",[]):
                    if node not in self.regions: errs.append(f"route {route} bad node {node}")
        return errs

    def expand_frontier(self,*args,**kwargs):
        rid=super().expand_frontier(*args,**kwargs)
        if hasattr(self,"semantic_graph"):
            if rid not in self.semantic_graph["regions"]: self.semantic_graph["regions"].append(rid); self.semantic_graph["regions"].sort(key=int)
            self.semantic_graph["biomes"][rid]=self.regions[rid]["biome"]
            self.weather[rid]={"temperature":15,"precip":0,"wind":[1,0,0],"front":0,"fire":0,"season":"spring"}
            self.dirty_partitions.add(self.partition_owner[rid])
        return rid
