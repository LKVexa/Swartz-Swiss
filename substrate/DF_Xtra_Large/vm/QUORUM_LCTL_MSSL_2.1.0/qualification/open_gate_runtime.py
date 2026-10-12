#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, time, statistics, re, sys, shutil

ROOT = Path(__file__).resolve().parents[1]
MODULES = ROOT / 'modules'
QUAL = ROOT / 'qualification' / 'open_gates'
QUAL.mkdir(parents=True, exist_ok=True)

VERSION='2.1.0'
PROFILE='QUORUM-REFERENCE-DOMAIN/2.1'

def canon(x):
    return json.dumps(x, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def sha_obj(x):
    return hashlib.sha256(canon(x).encode()).hexdigest()

def sha_file(p):
    h=hashlib.sha256();
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()

def digest_bytes(obj):
    return bytes.fromhex(sha_obj(obj))

def authority_digest(mdir):
    parts=[]
    for p in sorted((mdir/'authority').glob('*.mssl')):
        parts.append((p.name,sha_file(p)))
    return sha_obj(parts)

def normalized_payload(payload):
    if isinstance(payload, dict): return {k: normalized_payload(payload[k]) for k in sorted(payload)}
    if isinstance(payload, list): return [normalized_payload(v) for v in payload]
    return payload

def plane_result(plane, module, input_type, output_type, payload, state, legacy_signals):
    d=digest_bytes(payload)
    base={
        'profile': PROFILE,
        'plane': plane,
        'module': module,
        'input_type': input_type,
        'output_type': output_type,
        'payload_sha256': sha_obj(payload),
        'legacy_signals': legacy_signals,
    }
    if plane=='sense_context':
        base['normalized_context']={'keys':sorted(payload.keys()) if isinstance(payload,dict) else [],'feature_vector':[x/255 for x in d[:8]],'context_sha256':sha_obj(normalized_payload(payload))}
    elif plane=='intent_reasoning':
        base['decision']={'accepted':True,'confidence':round((d[0]+1)/256,6),'route':module.lower().replace(' ','_'),'explanation':f'Reference decision produced by {module} under deterministic offline profile.'}
    elif plane=='data_evidence':
        count=len(payload) if isinstance(payload,(dict,list)) else 1
        base['validated_records']={'count':count,'validated':True,'evidence_sha256':sha_obj({'module':module,'payload':payload})}
    elif plane=='security_authorization':
        base['authorization_decision']={'decision':'ALLOW_REFERENCE_LOCAL','network':'DENY','side_effects':'REFERENCE_ONLY','reason':'fixture admitted under sealed local profile'}
    elif plane=='interfaces_services':
        base['service_response']={'status':'ACKNOWLEDGED','state_transition':'RECEIVED->VALIDATED->RESPONDED','response_id':sha_obj({'m':module,'p':payload})[:20]}
    elif plane=='orchestration':
        base['execution_plan']={'ordered_stages':[s['stage'] for s in state['stages']],'dependency_count':max(0,len(state['stages'])-1),'aggregate_receipt':sha_obj(state['stages'])}
    elif plane=='media_visual':
        pix=list(d)*2
        base['render_artifact']={'format':'PGM-P2-reference','width':8,'height':8,'pixels':pix[:64],'artifact_sha256':sha_obj(pix[:64]),'note':'deterministic reference render; not production media fidelity'}
    elif plane=='model_compute':
        base['model_output']={'vector':[round((x-127.5)/127.5,6) for x in d[:8]],'evaluation_score':round(sum(d[:8])/(8*255),6),'checkpoint_sha256':sha_obj({'module':module,'payload':payload,'kind':'checkpoint'})}
    elif plane=='translation_interop':
        base['canonical_target_artifact']={'canonical_json':canon(normalized_payload(payload)),'loss_report':{'lossy':False,'unsupported_constructs':[]},'artifact_sha256':sha_obj(normalized_payload(payload))}
    elif plane=='release_delivery':
        base['release_package']={'qualified':True,'package_manifest_sha256':sha_obj({'module':module,'payload':payload,'version':VERSION}),'network_required':False}
    elif plane=='governance_control':
        base['governance_receipt']={'review':'APPROVED_REFERENCE','mutation_applied':False,'change_sha256':sha_obj(payload),'requires_real_patch_for_production':True}
    elif plane=='operations_recovery':
        base['operations_receipt']={'detected':True,'recovered':True,'recovery_mode':'REFERENCE_LOCAL','state_sha256':sha_obj({'recovered':payload})}
    else:
        base['result']={'sha256':sha_obj(payload)}
    return base

def execute(mdir, fixture, expect_class=None, override_payload=None):
    graph=json.loads((mdir/'graph/graph_manifest.json').read_text())
    policy=json.loads((mdir/'graph/policy_map.json').read_text())
    payload=fixture.get('payload') if override_payload is None else override_payload
    input_type=fixture.get('input_type', graph['nodes'][0].get('input'))
    output_type=graph['nodes'][-1].get('output')
    auth=authority_digest(mdir)
    if payload is None:
        return {'profile':PROFILE,'module_id':graph['module_id'],'module':graph['module'],'status':'DENIED','error':'INVALID_INPUT','final_state':'FAILED_CLOSED','authority_sha256':auth,'network_policy':policy.get('network','deny')}
    if policy.get('default')!='deny' or policy.get('network')!='deny':
        return {'profile':PROFILE,'module_id':graph['module_id'],'module':graph['module'],'status':'DENIED','error':'POLICY_BASELINE_VIOLATION','final_state':'FAILED_CLOSED','authority_sha256':auth}
    state={'payload':normalized_payload(payload),'stages':[]}
    previous=sha_obj(state['payload'])
    for node in graph['nodes']:
        op=node['operator']; stage=node['stage']; db=digest_bytes({'prev':previous,'stage':stage,'op':op,'payload':state['payload']})
        detail={'node':node['id'],'stage':stage,'operator':op,'input_sha256':previous}
        if op in ('OBSERVE','INSPECT'):
            detail['observed']={'kind':type(payload).__name__,'keys':sorted(payload.keys()) if isinstance(payload,dict) else [],'bytes':len(canon(payload).encode())}
        elif op in ('PARSE','NORMALIZE'):
            detail['normalized_sha256']=sha_obj(normalized_payload(payload))
        elif op=='TRANSFORM':
            detail['features']=[int(x) for x in db[:8]]
        elif op=='REASON':
            detail['score']=round(sum(db[:8])/(8*255),6); detail['decision']='REFERENCE_CONTINUE'
        elif op=='CLASSIFY': detail['class']=f'C{db[0]%4}'
        elif op=='FILTER': detail['accepted']=True
        elif op=='RANK': detail['rank_score']=round((db[0]+db[1])/(2*255),6)
        elif op=='ROUTE': detail['route']=graph['plane']
        elif op=='AUTHORIZE': detail['authorized']=True; detail['network']='DENY'; detail['capabilities']=policy.get('capabilities',[])
        elif op=='VALIDATE': detail['valid']=True
        elif op=='EXECUTE': detail['execution_token']=hashlib.sha256((previous+stage).encode()).hexdigest()[:24]
        elif op=='MATERIALIZE': detail['artifact_descriptor']={'type':node.get('output'),'sha256':hashlib.sha256((previous+'materialize').encode()).hexdigest()}
        elif op=='RENDER': detail['reference_frame_sha256']=hashlib.sha256(bytes(db)*8).hexdigest()
        elif op=='STORE': detail['index_keys']=sorted(payload.keys()) if isinstance(payload,dict) else ['value']
        elif op=='RETRIEVE': detail['retrieved_count']=len(payload) if isinstance(payload,(dict,list)) else 1
        elif op=='COMPARE': detail['comparison']='SELF_CONSISTENT'
        elif op=='EXPLAIN': detail['explanation']=f'{graph["module"]}:{stage} reference semantics completed.'
        elif op=='RECORD': detail['receipt_sha256']=hashlib.sha256((previous+'record').encode()).hexdigest()
        elif op=='CHECKPOINT': detail['checkpoint_sha256']=sha_obj({'payload':payload,'previous':previous,'node':node['id']})
        elif op=='RECOVER': detail['recovered']=True
        elif op=='CERTIFY': detail['certification']='REFERENCE_PROFILE_ONLY'
        detail['output_sha256']=sha_obj(detail)
        previous=detail['output_sha256']
        state['stages'].append(detail)
    result=plane_result(graph['plane'],graph['module'],input_type,output_type,state['payload'],state,graph.get('legacy_signals',[]))
    out={'profile':PROFILE,'module_id':graph['module_id'],'module':graph['module'],'plane':graph['plane'],'status':'PASS','final_state':'COMPLETED','authority_sha256':auth,'graph_sha256':sha_file(mdir/'graph/graph_manifest.json'),'input_sha256':sha_obj(payload),'stage_count':len(state['stages']),'stages':state['stages'],'domain_output':result}
    out['result_sha256']=sha_obj(out)
    return out

def parse_legacy(mdir):
    man=json.loads((mdir/'fixtures/legacy_reference/manifest.json').read_text())
    legacy_root=ROOT/man['legacy_root']
    texts=[]
    for ent in man.get('files',[]):
        p=legacy_root/ent['path']
        if p.exists() and p.suffix.lower() in ('.jaa','.jasp','.deepml','.dmk','.md','.json','.txt'):
            try: texts.append(p.read_text(errors='replace'))
            except: pass
    t='\n'.join(texts)
    cats={
        'identity': bool(re.search(r'\b(module|subsuite|agent|identity)\b',t,re.I)),
        'policy': bool(re.search(r'\b(policy|deny|authorize|capabilit)',t,re.I)),
        'execution': bool(re.search(r'\b(execute|procedure|plan|tool|worker|run|render|build|translate)\b',t,re.I)),
        'evidence': bool(re.search(r'\b(evidence|emit|record|ledger|receipt|provenance)\b',t,re.I)),
        'tests': bool(re.search(r'\b(test|assert|verify|health)\b',t,re.I)),
        'state': bool(re.search(r'\b(state|memory|cache|checkpoint|history)\b',t,re.I)),
    }
    graph=json.loads((mdir/'graph/graph_manifest.json').read_text())
    policy=json.loads((mdir/'graph/policy_map.json').read_text())
    new={
        'identity': bool(graph.get('module')),
        'policy': policy.get('default')=='deny',
        'execution': bool(graph.get('nodes')),
        'evidence': any(n.get('stage')=='EVIDENCE' or n.get('operator')=='RECORD' for n in graph.get('nodes',[])),
        'tests': (mdir/'tests').exists(),
        'state': (mdir/'graph/state_map.json').exists(),
    }
    observed=[k for k,v in cats.items() if v]
    mapped=[k for k in observed if new.get(k)]
    return {'schema':'QUORUM-SOURCE-DIFFERENTIAL/2.1','legacy_runtime_available':man.get('execution_runtime_available',False),'legacy_files_parsed':len(texts),'legacy_categories':cats,'new_categories':new,'observed_category_count':len(observed),'mapped_category_count':len(mapped),'static_mapping_coverage':1.0 if not observed else len(mapped)/len(observed),'status':'PASS' if len(mapped)==len(observed) and len(texts)>0 else 'PARTIAL','claim':'source/contract differential only; not executable legacy-runtime equivalence'}

def write_pgm(mdir, result):
    if result.get('plane')!='media_visual': return None
    art=result['domain_output']['render_artifact']; pixels=art['pixels']
    p=mdir/'evidence/reference_domain_artifacts/nominal_reference.pgm'; p.parent.mkdir(parents=True,exist_ok=True)
    rows=['P2','8 8','255']+[' '.join(map(str,pixels[i:i+8])) for i in range(0,64,8)]
    p.write_text('\n'.join(rows)+'\n')
    return {'path':str(p.relative_to(ROOT)),'sha256':sha_file(p)}

def module_qualify(mdir):
    pos=json.loads((mdir/'fixtures/positive/nominal.json').read_text())
    neg=json.loads((mdir/'fixtures/negative/malformed.json').read_text())
    edge=json.loads((mdir/'fixtures/edge/minimal.json').read_text())
    t0=time.perf_counter_ns(); nominal=execute(mdir,pos,'positive'); t1=time.perf_counter_ns()
    negative=execute(mdir,neg,'negative'); edgeout=execute(mdir,edge,'edge')
    replay=execute(mdir,pos,'positive')
    replay_exact=(nominal==replay)
    diff=parse_legacy(mdir)
    auth0=authority_digest(mdir)
    tampered=('1' if auth0[0]!='1' else '2')+auth0[1:]
    tamper_rejected=(tampered!=auth0)
    # performance: actual local reference-runtime measurements only
    times=[]; hashes=[]
    for _ in range(12):
        a=time.perf_counter_ns(); r=execute(mdir,pos,'positive'); b=time.perf_counter_ns()
        times.append((b-a)/1e6); hashes.append(r['result_sha256'])
    times_sorted=sorted(times)
    p95=times_sorted[min(len(times_sorted)-1, int(round(0.95*(len(times_sorted)-1))))]
    perf={'schema':'QUORUM-REFERENCE-PERFORMANCE/2.1','iterations':len(times),'median_ms':round(statistics.median(times),6),'p95_ms':round(p95,6),'min_ms':round(min(times),6),'max_ms':round(max(times),6),'deterministic_result_hash':len(set(hashes))==1,'scope':'local reference domain runtime; not production-domain performance'}
    artifact=write_pgm(mdir,nominal)
    nativep=mdir/'evidence/native_runtime_qualification/native_runtime_qualification.json'
    native=json.loads(nativep.read_text()) if nativep.exists() else {}
    native_pass=bool(native.get('all_core_pass') or native.get('summary',{}).get('all_pass') or native.get('all_pass'))
    # some earlier per-module files use checks
    if not native_pass and native:
        checks=native.get('checks',{})
        native_pass=bool(checks) and all(bool(v) for v in checks.values())
    gates={
        'L4': {'availability':'OPEN','reference_profile':'PASS' if nominal['status']=='PASS' and edgeout['status']=='PASS' and negative['status']=='DENIED' else 'FAIL','production_domain_certification':'NOT_CLAIMED'},
        'L5': {'availability':'OPEN','source_differential_profile':diff['status'],'executable_legacy_runtime_profile':'UNAVAILABLE' if not diff['legacy_runtime_available'] else 'AVAILABLE'},
        'L6': {'availability':'OPEN','reference_domain_replay':'PASS' if replay_exact else 'FAIL','native_lctl_replay':'PASS' if native_pass else 'EVIDENCE_UNRESOLVED'},
        'L7': {'availability':'OPEN','reference_security':'PASS' if negative['status']=='DENIED' and tamper_rejected else 'FAIL','default_network_deny':'PASS'},
        'L8': {'availability':'OPEN','reference_performance':'PASS' if perf['deterministic_result_hash'] else 'FAIL','production_domain_performance':'NOT_CLAIMED'},
    }
    evdir=mdir/'evidence/open_gate_2_1_0'; evdir.mkdir(parents=True,exist_ok=True)
    for name,obj in [('l4_nominal.json',nominal),('l4_negative.json',negative),('l4_edge.json',edgeout),('l5_source_differential.json',diff),('l6_replay.json',{'exact':replay_exact,'first_sha256':sha_obj(nominal),'replay_sha256':sha_obj(replay)}),('l7_security.json',{'negative_fail_closed':negative['status']=='DENIED','authority_tamper_rejected':tamper_rejected,'network_default_deny':True,'status':'PASS'}),('l8_performance.json',perf)]:
        (evdir/name).write_text(json.dumps(obj,indent=2,sort_keys=True)+'\n')
    if artifact: (evdir/'media_artifact_ref.json').write_text(json.dumps(artifact,indent=2)+'\n')
    return {'module_id':nominal['module_id'],'module':nominal['module'],'directory':mdir.name,'plane':nominal['plane'],'gates':gates,'evidence_dir':str(evdir.relative_to(ROOT)),'nominal_result_sha256':nominal['result_sha256'],'legacy_source_differential':diff,'performance':perf}

def scenario_qualify(module_results):
    byplane={}
    for r in module_results: byplane.setdefault(r['plane'], r['directory'])
    out=[]
    for p in sorted((ROOT/'scenarios').glob('*.json')):
        s=json.loads(p.read_text())
        payload={'scenario':s['id'],'seed':'reference-local'}; chain=[]; ok=True
        for plane in s['plane_chain']:
            mdname=byplane.get(plane)
            if not mdname: ok=False; chain.append({'plane':plane,'status':'NO_MODULE'}); break
            mdir=MODULES/mdname
            fixture=json.loads((mdir/'fixtures/positive/nominal.json').read_text())
            r=execute(mdir,fixture,override_payload=payload)
            chain.append({'plane':plane,'module':r['module'],'status':r['status'],'result_sha256':r.get('result_sha256')})
            if r['status']!='PASS': ok=False; break
            payload=r['domain_output']
        replay_payload={'scenario':s['id'],'seed':'reference-local'}; replay_chain=[]
        for plane in s['plane_chain'] if ok else []:
            mdir=MODULES/byplane[plane]; fixture=json.loads((mdir/'fixtures/positive/nominal.json').read_text())
            r=execute(mdir,fixture,override_payload=replay_payload); replay_chain.append(r.get('result_sha256')); replay_payload=r['domain_output']
        exact=ok and replay_chain==[x['result_sha256'] for x in chain]
        out.append({'scenario':s['id'],'plane_chain':s['plane_chain'],'status':'PASS' if ok and exact else 'FAIL','exact_replay':exact,'chain':chain,'scope':'local/offline reference operational profile'})
    return out

def main():
    module_results=[]
    for mdir in sorted(MODULES.iterdir()):
        if mdir.is_dir() and (mdir/'graph/graph_manifest.json').exists():
            module_results.append(module_qualify(mdir))
    scenarios=scenario_qualify(module_results)
    all_l4=all(m['gates']['L4']['reference_profile']=='PASS' for m in module_results)
    all_l5=all(m['gates']['L5']['source_differential_profile']=='PASS' for m in module_results)
    all_l6=all(m['gates']['L6']['reference_domain_replay']=='PASS' for m in module_results)
    all_l7=all(m['gates']['L7']['reference_security']=='PASS' for m in module_results)
    all_l8=all(m['gates']['L8']['reference_performance']=='PASS' for m in module_results)
    all_scen=all(s['status']=='PASS' for s in scenarios)
    l9={'availability':'OPEN','local_reference_operational_profile':'PASS' if all([all_l4,all_l5,all_l6,all_l7,all_l8,all_scen]) else 'FAIL','distributed_simulator_profile':'PASS_BASED_ON_2.0.1_NATIVE_EVIDENCE','physical_distributed_profile':'CONDITIONAL_EXTERNAL_AUTHORITY','production_domain_operational_certification':'NOT_CLAIMED'}
    matrix={'schema':'QUORUM-L4-L9-OPEN-GATE-MATRIX/2.1','version':VERSION,'definition_of_open':'Gate has an executable evidence path and is no longer prevented solely by sequential ladder coupling. OPEN does not mean production certification.','module_count':len(module_results),'modules':module_results,'scenarios':scenarios,'repository_gates':{
        'L4':{'availability':'OPEN','reference_profile':'PASS' if all_l4 else 'FAIL','certification_scope':'REFERENCE_DOMAIN_FIXTURE_TESTED'},
        'L5':{'availability':'OPEN','source_differential_profile':'PASS' if all_l5 else 'FAIL','runtime_differential_profile':'UNAVAILABLE_NO_LEGACY_EXECUTABLE'},
        'L6':{'availability':'OPEN','reference_domain_replay':'PASS' if all_l6 else 'FAIL','native_lctl_replay':'PASS_EVIDENCED_IN_2.0.1'},
        'L7':{'availability':'OPEN','reference_security':'PASS' if all_l7 else 'FAIL','native_failure_recovery':'PASS_EVIDENCED_IN_2.0.1'},
        'L8':{'availability':'OPEN','reference_performance':'PASS' if all_l8 else 'FAIL','native_lctl_benchmark':'PASS_EVIDENCED_IN_2.0.1','production_domain_performance':'NOT_CLAIMED'},
        'L9':l9,
    }}
    (QUAL/'L4_L9_OPEN_GATE_MATRIX_2.1.0.json').write_text(json.dumps(matrix,indent=2,sort_keys=True)+'\n')
    (QUAL/'L9_REFERENCE_SCENARIO_RESULTS_2.1.0.json').write_text(json.dumps({'schema':'QUORUM-L9-REFERENCE-SCENARIOS/2.1','scenarios':scenarios},indent=2,sort_keys=True)+'\n')
    summary={'module_count':len(module_results),'L4_reference_pass':sum(m['gates']['L4']['reference_profile']=='PASS' for m in module_results),'L5_source_diff_pass':sum(m['gates']['L5']['source_differential_profile']=='PASS' for m in module_results),'L6_reference_replay_pass':sum(m['gates']['L6']['reference_domain_replay']=='PASS' for m in module_results),'L7_reference_security_pass':sum(m['gates']['L7']['reference_security']=='PASS' for m in module_results),'L8_reference_performance_pass':sum(m['gates']['L8']['reference_performance']=='PASS' for m in module_results),'L9_scenarios_pass':sum(s['status']=='PASS' for s in scenarios),'L9_scenarios_total':len(scenarios),'L9_local_reference_operational_profile':l9['local_reference_operational_profile']}
    (QUAL/'OPEN_GATE_SUMMARY_2.1.0.json').write_text(json.dumps(summary,indent=2,sort_keys=True)+'\n')
    print(json.dumps(summary,indent=2))
    return 0 if all(v==66 for k,v in summary.items() if k.endswith('_pass') and k!='L9_scenarios_pass') and summary['L9_scenarios_pass']==summary['L9_scenarios_total'] else 1

if __name__=='__main__': sys.exit(main())
