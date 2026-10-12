#!/usr/bin/env python3
import copy, json, math, tempfile, unittest, sys
from pathlib import Path
VM=Path(__file__).resolve().parents[2]
if str(VM) not in sys.path: sys.path.insert(0,str(VM))
from world.operational_reference import OperationalWorldRuntime, FrameRecord, PRESENTATION_SCHEMA, SCHEDULER_PHASES
from world.world_runtime import WorldError

class OperationalReferenceTests(unittest.TestCase):
    def test_01_canonical_revisions_snapshot_verifier(self):
        w=OperationalWorldRuntime(seed=1); s=w.coherent_snapshot(); self.assertTrue(s['coherent']); self.assertTrue(w.canonical_verify()['pass']); self.assertTrue(all(k in w.revisions for k in ['content','runtime','schema','simulation_epoch']))
    def test_02_transaction_rollback_and_stale(self):
        w=OperationalWorldRuntime(seed=2); d=w.state_digest(); rev=w.revisions['runtime']; out=w.transactional_mutation('t1',rev,lambda x:x.entities['3']['inventory'].update({'x':1}),fail_phase='MUTATE'); self.assertFalse(out['committed']); self.assertEqual(w.state_digest(),d)
        with self.assertRaises(WorldError): w.transactional_mutation('t2',rev-1,lambda x:None)
    def test_03_semantic_graph_content_store_optional_pack(self):
        w=OperationalWorldRuntime(seed=3); self.assertTrue({'routes','waterways','interiors','landmarks','jurisdictions'}.issubset(w.semantic_graph)); h=w.content_address_put({'x':1}); self.assertEqual(w.content_address_get(h),{'x':1}); self.assertTrue(w.validate_optional_content({'optional':True,'corrupt':True})['unrelated_unchanged'])
    def test_04_reference_roundtrip_atomic_typed_stale(self):
        w=OperationalWorldRuntime(seed=4); back,err=w.reference_roundtrip([10**12,-10**12,999999]); self.assertEqual(back,[10**12,-10**12,999999]); self.assertEqual(err,0); old=w.frames['actor:reference']; tr=w.atomic_reference_update([100,200,300],velocity=[5,0,0]); self.assertTrue(w.reject_stale_frame(old)); self.assertTrue(all(v==1 for v in tr['invalidations'].values())); f=w.typed_frame('vehicle:1','vehicle','world',[100,200,300],[5,0,0]); self.assertEqual(f.frame_type,'vehicle')
    def test_05_knowledge_locality(self):
        w=OperationalWorldRuntime(seed=5); w.tell('3','fact',1); self.assertIn('fact',w.observer_view('3')['known']); self.assertNotIn('fact',w.observer_view('7')['known'])
    def test_06_c2_fold_properties_targeting(self):
        w=OperationalWorldRuntime(seed=6); p=w.fold_property_report(); self.assertTrue(p['monotonic'] and p['bounded'] and p['c1'] and p['c2_boundary']); fp=w.fold_point_c2(w.entities['3']['pos'])['folded']; self.assertEqual(w.canonical_target(fp,tolerance=.01),'3'); self.assertTrue(w.fold_artifact_detector()['pass'])
    def test_07_lod_hysteresis_debt_and_barrier(self):
        w=OperationalWorldRuntime(seed=7); eid='3'; a=w.lod_decide(eid,100,pressure=90); self.assertGreaterEqual(a['promotion_debt'],1); w.set_event_barrier('combat','needs physical',5); self.assertEqual(w.resolve_or_defer('combat',2),'DEFERRED'); self.assertEqual(w.resolve_or_defer('combat',6),'FULL_SIM'); self.assertTrue(w.compare_long_horizon(30)['pass'])
    def test_08_persistence_capabilities_relationships_retire(self):
        w=OperationalWorldRuntime(seed=8); c=w.spawn_entity('companion',[1,0,0],'1'); w.mutation_capabilities[c]={'AI'}; self.assertTrue(w.capability_mutate(c,'AI',lambda e:e.update({'goal':'follow'}))); w.link_parent_child('1',c); self.assertIn(c,w.relationships['parent_child']['1']); w.retire_entity(c); self.assertIn(c,w.retired_history); self.assertEqual(w.historical_query('entity',c)['precision'],'exact')
    def test_09_causal_slice_compaction(self):
        w=OperationalWorldRuntime(seed=9); e=w.event_with_state('TEST','3','unit',lambda:w.entities['3'].update({'goal':'trade'})); self.assertTrue(w.causal_slice(e)); a=w.compact_history(); self.assertEqual(a['schema'],'RCPW-ARCHIVE/3'); self.assertIn('proof_boundary',a)
    def test_10_ecology_conservation(self):
        w=OperationalWorldRuntime(seed=10); self.assertTrue(w.cohort_split_merge('2')['conserved']); self.assertTrue(w.ecological_reference_compare(5)['equal'])
    def test_11_economy_explicit_transitions_and_conservation(self):
        w=OperationalWorldRuntime(seed=11); r=w.economic_transition('eastvale'); self.assertTrue(r['journal']['balanced']); self.assertIn('labor',r); r2=w.economic_transition('eastvale','route_loss'); self.assertFalse(r2['transport_open']); self.assertGreaterEqual(r2['market']['price_food'],1)
    def test_12_law_reputation(self):
        w=OperationalWorldRuntime(seed=12); r=w.crime_law_transition(); self.assertTrue(r['institution_knows']); self.assertLess(r['reputation'],0)
    def test_13_weather_environment(self):
        w=OperationalWorldRuntime(seed=13); a=w.weather_step('3',25); self.assertNotEqual(a['before'],a['after'])
    def test_14_narrative_reservation_info_delay(self):
        w=OperationalWorldRuntime(seed=14); a=w.reserve_event('A','3',50); b=w.reserve_event('B','3',80); self.assertEqual(b['winner'],'B'); w.propagate_information('3','7','rumor',10,False,60,True); self.assertNotIn('rumor',w.knowledge.get('7',{})); w.advance(10); w.deliver_information(); self.assertIn('rumor',w.knowledge['7'])
    def test_15_materialization_readiness_warmstart(self):
        w=OperationalWorldRuntime(seed=15); r=w.materialize('6',['semantic','collision','navigation','ai','interaction']); self.assertTrue(r.interactable()); warm=w.warm_start('6'); self.assertTrue(warm['deterministic'])
    def test_16_presentation_canonical_invariant_frame_view(self):
        w=OperationalWorldRuntime(seed=16); before=w.state_digest(); w.activate_presentation({'schema':PRESENTATION_SCHEMA,'version':'p/3','assets':{'a':'b'}}); self.assertEqual(before,w.state_digest()); v=w.frame_view(); self.assertIn('entities',v); w.rollback_presentation(); self.assertEqual(before,w.state_digest())
    def test_17_checkpoint_save_load(self):
        w=OperationalWorldRuntime(seed=17); w.economic_transition(); cp=w.checkpoint(); self.assertEqual(cp['state_digest'],w.state_digest());
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/'s.json'; w.save(p); r=OperationalWorldRuntime.load(p); self.assertEqual(w.state_digest(),r.state_digest()); self.assertEqual(w.ledger_head,r.ledger_head)
    def test_18_transition_conservation_migration(self):
        w=OperationalWorldRuntime(seed=18); r=w.transition_entity('3',2); self.assertTrue(r['conserved']); old={'version':1,'entity':'3','from':7,'to':2,'tick':1,'pos':[1,2,3],'inventory':{'x':1}}; m=w.migrate_transition(old); self.assertEqual(m['version'],3); self.assertEqual(m['conservation']['inventory'],{'x':1})
    def test_19_shell_traversal(self):
        w=OperationalWorldRuntime(seed=19); a=w.adaptive_shell(10000,speed=200,complexity=90,backlog=50,portal=True); self.assertTrue(a['budget_reserved']); p=w.plan_traversal('route:heart-east',100); self.assertTrue(p['bounded_speculation']); self.assertEqual(p['canonical_distance'],20000)
    def test_20_penteract_validation_reduce(self):
        w=OperationalWorldRuntime(seed=20); s=w.penteract_state('3'); self.assertTrue(w.validate_penteract(s)); self.assertAlmostEqual(w.deterministic_reduce([1e16,1,-1e16]),1.0)
    def test_21_well_budget_migrate_retire(self):
        w=OperationalWorldRuntime(seed=21); a=w.add_operational_well(1,0,0,80,100); b=w.add_operational_well(2,0,0,70,100); self.assertEqual(w.global_arbitrate([b,a]),a); w.authority_wells[a]['obligations']=['x']; self.assertFalse(w.retire_well(a)['retired']); self.assertEqual(w.migrate_well(a,'P2')['owner'],'P2'); self.assertTrue(w.retire_well(a,'P3')['retired'])
    def test_22_archive_rehydrate_provenance(self):
        w=OperationalWorldRuntime(seed=22); a=w.archive_region_operational('2'); self.assertTrue(a['archived']); r=w.rehydrate_region_operational('2'); self.assertEqual(r['provenance'],'archive/rehydration')
    def test_23_scheduler_resource_abi(self):
        w=OperationalWorldRuntime(seed=23); tr=w.scheduler_tick(); self.assertEqual([x['phase'] for x in tr],SCHEDULER_PHASES); a=w.resource_govern({'cpu':150}); self.assertTrue(a['canonical_protected']); self.assertEqual(w.runtime_abi_manifest()['abi_version'],3)
    def test_24_frontier_grammar_expansion_history_stability(self):
        w=OperationalWorldRuntime(seed=24); old=w.semantic_digest_for_regions(['2','3']); r=w.expand_frontier_validated(anchor_region='1'); self.assertTrue(r['admitted']); self.assertTrue(r['preexisting_unrelated_unchanged']); self.assertEqual(old,w.semantic_digest_for_regions(['2','3']))
    def test_25_generational_succession_identity(self):
        w=OperationalWorldRuntime(seed=25); old=w.roles['sheriff:eastvale']; r=w.generational_step(25); self.assertNotEqual(old,r['role']); self.assertEqual(w.entities[r['role']]['lineage']['parent'],old)
    def test_26_autonomous_long_age(self):
        w=OperationalWorldRuntime(seed=26); a=w.autonomous_step(400); self.assertGreater(a['to'],a['from']); self.assertTrue(a['era'].startswith('ERA_'))
    def test_27_damaged_pack_isolation(self):
        w=OperationalWorldRuntime(seed=27); d=w.state_digest(); x=w.validate_optional_content({'optional':True,'corrupt':True}); self.assertFalse(x['accepted']); self.assertEqual(d,w.state_digest())
    def test_28_frame_cycle_rejected(self):
        w=OperationalWorldRuntime(seed=28); w.typed_frame('a','vehicle','world',[0,0,0]); w.typed_frame('b','moving_platform','a',[0,0,0]);
        with self.assertRaises(WorldError): w.typed_frame('a','vehicle','b',[0,0,0])
    def test_29_transition_cancel(self):
        w=OperationalWorldRuntime(seed=29); old=w.lod_state['3']['lod']; r=w.transition_entity('3',1,cancel=True); self.assertTrue(r['cancelled']); self.assertEqual(w.lod_state['3']['lod'],old)
    def test_30_canonical_state_excludes_presentation(self):
        w=OperationalWorldRuntime(seed=30); s=w.canonical_state(); self.assertNotIn('presentation_package',s.get('operational',{})); before=w.state_digest(); w.presentation_budget['quality']=20; self.assertEqual(before,w.state_digest())

if __name__=='__main__': unittest.main(verbosity=2)
