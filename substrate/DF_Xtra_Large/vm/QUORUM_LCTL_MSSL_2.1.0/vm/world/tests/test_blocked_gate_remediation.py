#!/usr/bin/env python3
from __future__ import annotations
import copy, sys, tempfile, unittest
from pathlib import Path

WORLD=Path(__file__).resolve().parents[1]
VM=WORLD.parent
sys.path.insert(0,str(VM))
from world.world_runtime import WorldRuntime, WorldError
from world.remediation.blocked_gate_support import (
    AuthorityWellArbiter, PresentationRegistry, PressureSnapshot, ResourceGovernor,
    fold_scaling_benchmark, habitat_fold_isolation, history_archive, load_history_archive,
    ledger_semantic_digest, lod_multiworker, materialize_dense, migrate_transition,
    parallel_fold, penteract_mapping_evidence, vertical_reference_evidence,
    visual_regression_trace, deterministic_parallel_mutation
)

class BlockedGateRemediationTests(unittest.TestCase):
    def test_01_coordinate_and_vertical_authority(self):
        v=vertical_reference_evidence()
        self.assertTrue(v["all_z_preserved"])
        self.assertEqual(v["gravity_vector"],[0,0,-1])

    def test_02_narrative_gravity_distance_independent(self):
        w=WorldRuntime(seed=1)
        s=w.set_narrative_profile("3",{"mission":90,"causal":70})
        w.move_reference(10**8,0,0)
        self.assertEqual(s,w.entities["3"]["narrative_gravity"])

    def test_03_visual_trace_repeatable(self):
        self.assertTrue(visual_regression_trace()["repeatable"])

    def test_04_habitat_isolation(self):
        self.assertTrue(habitat_fold_isolation()["pass"])

    def test_05_resource_governor_replay(self):
        g=ResourceGovernor(); xs=[PressureSnapshot(cpu=90),PressureSnapshot(),PressureSnapshot(memory=99)]
        self.assertEqual(g.replay(xs),g.replay(xs))

    def test_06_authority_well_arbitration_order_independent(self):
        wells=[{"id":"W2","priority":90,"created_tick":1},{"id":"W1","priority":90,"created_tick":1},{"id":"W3","priority":10,"created_tick":0}]
        winners=AuthorityWellArbiter().choose_permutations(wells)
        self.assertEqual(set(winners),{"W1"})

    def test_07_penteract_version_independent(self):
        self.assertTrue(penteract_mapping_evidence()["canonical_spatial_semantics_equal"])

    def test_08_fold_scaling_active_set(self):
        self.assertTrue(fold_scaling_benchmark()["bounded_by_active_set"])

    def test_09_parallel_fold_equivalence(self):
        w=WorldRuntime(seed=9)
        for i in range(50): w.spawn_entity("bg",[i*1000,0,0],"1")
        self.assertEqual(parallel_fold(w,1)["digest"],parallel_fold(w,2)["digest"])

    def test_10_multiworker_lod_equivalence(self):
        w=WorldRuntime(seed=10)
        for i in range(50): w.spawn_entity("bg",[i*1000,0,0],"1")
        self.assertEqual(lod_multiworker(w,1)["decision_digest"],lod_multiworker(w,2)["decision_digest"])

    def test_11_presentation_hot_reload_canonical_invariant(self):
        w=WorldRuntime(seed=11); before=w.state_digest(); r=PresentationRegistry(); old=r.digest()
        r.activate({"schema":r.SCHEMA,"version":"presentation/2","assets":{"entity":"x"}},before,w.state_digest())
        self.assertEqual(r.rollback(),old)
        self.assertEqual(w.state_digest(),before)

    def test_12_materialization_readiness(self):
        x=materialize_dense(WorldRuntime(seed=12),2,30)
        self.assertTrue(x["all_interaction_ready"])
        self.assertFalse(x["duplicate_tasks"])

    def test_13_transition_migration(self):
        r=migrate_transition({"version":1,"entity":"3","from":"A","to":"B","tick":1,"pos":[1,2,3],"obligations":["x"]})
        self.assertEqual(r["version"],2)
        self.assertEqual(r["conservation"]["canonical_pos"],[1,2,3])

    def test_14_history_archive_corruption(self):
        w=WorldRuntime(seed=14); w.advance(100); a=history_archive(w.ledger)
        self.assertEqual(ledger_semantic_digest(load_history_archive(a)),a["semantic_sha256"])
        bad=copy.deepcopy(a); bad["payload_hex"]="00"+bad["payload_hex"][2:]
        with self.assertRaises(Exception): load_history_archive(bad)

    def test_15_multiworker_canonical_conformance(self):
        a=deterministic_parallel_mutation(15,1); b=deterministic_parallel_mutation(15,2)
        self.assertEqual(a["state_digest"],b["state_digest"])
        self.assertEqual(a["semantic_ledger_digest"],b["semantic_ledger_digest"])
        self.assertTrue(a["save_reload_equal"] and b["save_reload_equal"])

if __name__=="__main__":
    unittest.main(verbosity=2)
