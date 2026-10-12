#!/usr/bin/env python3
from pathlib import Path
import copy, importlib.util, json, sys, tempfile, unittest

VM = Path(__file__).resolve().parents[2]
WORLD_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(VM))
from world.world_runtime import WorldRuntime, WorldError, DEFAULT_FOLD_HORIZON

spec = importlib.util.spec_from_file_location("qvm_world_test", VM / "toolchain/quorum_vm.py")
qvm = importlib.util.module_from_spec(spec); sys.modules[spec.name] = qvm; spec.loader.exec_module(qvm)


class WorldRuntimeTests(unittest.TestCase):
    def test_01_demo_world_deterministic(self):
        a = WorldRuntime(seed=42); b = WorldRuntime(seed=42)
        self.assertEqual(a.state_digest(), b.state_digest())
        self.assertEqual(a.ledger_head, b.ledger_head)
        self.assertEqual(a.invariants(), [])

    def test_02_fold_near_identity(self):
        w = WorldRuntime(seed=1)
        v = w.fold_point([100, 10, 0])
        self.assertEqual(v["folded"], [100, 10, 0])
        self.assertEqual(v["canonical_distance"], v["folded_distance"])

    def test_03_fold_far_bounded(self):
        w = WorldRuntime(seed=1)
        v = w.fold_point([10**12, 0, 0])
        self.assertLess(v["folded_distance"], DEFAULT_FOLD_HORIZON)
        self.assertGreater(v["canonical_distance"], v["folded_distance"])

    def test_04_no_unload_identity(self):
        w = WorldRuntime(seed=1)
        before = copy.deepcopy(w.entities["4"])
        w.move_reference(10**8, 0, 0)
        view = w.entity_view("4")
        self.assertTrue(view["exists"])
        self.assertEqual(w.entities["4"]["id"], before["id"])
        self.assertEqual(w.entities["4"]["health"], before["health"])

    def test_05_lod_reduces_with_distance(self):
        w = WorldRuntime(seed=1)
        near = w.entity_view("2")["lod"]
        far = w.entity_view("4")["lod"]
        self.assertGreater(near, far)

    def test_06_tick_replay_determinism(self):
        a = WorldRuntime(seed=9); b = WorldRuntime(seed=9)
        a.advance(200); b.advance(200)
        self.assertEqual(a.state_digest(), b.state_digest())
        self.assertEqual(a.ecology, b.ecology)
        self.assertEqual(a.settlements, b.settlements)

    def test_07_ledger_chain(self):
        w = WorldRuntime(seed=2); w.advance(20); w.move_reference(100, 0, 0)
        self.assertTrue(w.verify_ledger())
        w.ledger[-1]["payload"]["pos"] = [999, 0, 0]
        self.assertFalse(w.verify_ledger())

    def test_08_frontier_expansion_is_deterministic(self):
        a = WorldRuntime(seed=44); b = WorldRuntime(seed=44)
        ra = a.expand_frontier(anchor_region="1"); rb = b.expand_frontier(anchor_region="1")
        self.assertEqual(ra, rb)
        self.assertEqual(a.regions[ra], b.regions[rb])

    def test_09_expansion_preserves_unaffected_regions(self):
        w = WorldRuntime(seed=44)
        before = w.semantic_digest_for_regions(["2", "3"])
        w.expand_frontier(anchor_region="1")
        after = w.semantic_digest_for_regions(["2", "3"])
        self.assertEqual(before, after)

    def test_10_archive_rehydrate_preserves_region_entities(self):
        w = WorldRuntime(seed=7)
        before = {e: copy.deepcopy(v) for e, v in w.entities.items() if v["region"] == "2"}
        w.archive_region("2")
        self.assertEqual(w.regions["2"]["archive_state"], "ARCHIVED")
        w.rehydrate_region("2")
        after = {e: copy.deepcopy(v) for e, v in w.entities.items() if v["region"] == "2"}
        self.assertEqual(before, after)
        self.assertEqual(w.regions["2"]["archive_state"], "ACTIVE")

    def test_11_archive_protected_obligation_rejected(self):
        w = WorldRuntime(seed=7); w.entities["4"]["narrative_gravity"] = 100
        with self.assertRaises(WorldError): w.archive_region("2")

    def test_12_knowledge_is_observer_local(self):
        w = WorldRuntime(seed=3)
        w.tell("3", "bridge.closed", True, confidence=80, source="rumor")
        self.assertIn("bridge.closed", w.knowledge["3"])
        self.assertNotIn("4", w.knowledge)

    def test_13_role_succession_preserves_distinct_identity(self):
        w = WorldRuntime(seed=3)
        old = w.roles["sheriff:eastvale"]
        new = w.spawn_entity("sheriff", [20100, 80, 0], "3")
        w.succession("sheriff:eastvale", new)
        self.assertNotEqual(old, new)
        self.assertIn(old, w.entities)
        self.assertEqual(w.roles["sheriff:eastvale"], new)

    def test_14_transaction_idempotence(self):
        w = WorldRuntime(seed=5)
        before_src = w.entities["3"]["inventory"]["food"]
        self.assertTrue(w.transfer_inventory("100", "3", "1", "food", 2))
        self.assertFalse(w.transfer_inventory("100", "3", "1", "food", 2))
        self.assertEqual(w.entities["3"]["inventory"]["food"], before_src - 2)
        self.assertEqual(w.entities["1"]["inventory"]["food"], 2)

    def test_15_partition_migration_preserves_entity_state(self):
        w = WorldRuntime(seed=5)
        ents = copy.deepcopy(w.entities)
        w.migrate_region("3", "P9")
        self.assertEqual(w.partition_owner["3"], "P9")
        self.assertEqual(ents, w.entities)

    def test_16_save_load_roundtrip(self):
        w = WorldRuntime(seed=8); w.advance(40); w.expand_frontier(); w.tell("3", "market.shortage", True)
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "world.json"; w.save(p); r = WorldRuntime.load(p)
            self.assertEqual(w.state_digest(), r.state_digest())
            self.assertEqual(w.ledger_head, r.ledger_head)
            self.assertEqual(r.invariants(), [])

    def test_17_save_tamper_rejected(self):
        w = WorldRuntime(seed=8)
        obj = w.export(); obj["state"]["tick"] = 999
        with self.assertRaises(WorldError): WorldRuntime.from_export(obj)

    def test_18_command_replay(self):
        w = WorldRuntime(seed=11); w.advance(20); w.move_reference(1000, 200, 0); w.expand_frontier(); w.add_authority_well(5000,0,0,75,3000)
        r = WorldRuntime.replay_commands(11, w.commands)
        self.assertEqual(w.state_digest(), r.state_digest())
        self.assertEqual(w.ledger_head, r.ledger_head)

    def test_19_authority_well_determinism(self):
        a = WorldRuntime(seed=1); b = WorldRuntime(seed=1)
        self.assertEqual(a.add_authority_well(1,2,3,80,4000), b.add_authority_well(1,2,3,80,4000))
        self.assertEqual(a.authority_wells, b.authority_wells)

    def test_20_world_lctl_program_verifies_and_runs(self):
        c = qvm.compile_source(VM / "src/WORLD_DEMO.lctlc", VM, True)
        v = qvm.VM(c["payload"]); snap = v.run()
        self.assertEqual(snap["status"], "HALTED")
        self.assertIn("world", snap)
        self.assertEqual(snap["world"]["invariant_errors"], [])
        self.assertEqual(v.regs[0], 0)

    def test_21_world_service_capability(self):
        c = qvm.compile_source(VM / "src/WORLD_DEMO.lctlc", VM, True)
        p = copy.deepcopy(c["payload"]); p["capabilities"]["services"] = [0,1,2,3]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p).run()
        self.assertEqual(cm.exception.name, "TRAP_CAPABILITY")

    def test_22_world_service_requires_init(self):
        c = qvm.compile_source(VM / "src/CORE.lctlc", VM, True)
        p = copy.deepcopy(c["payload"]); p["instructions"] = [{"op":"MOVI","dst":0,"imm":1},{"op":"SVC","svc":17},{"op":"HALT"}]
        with self.assertRaises(qvm.VMTrap) as cm: qvm.VM(p).run()
        self.assertEqual(cm.exception.name, "TRAP_BAD_SERVICE")

    def test_23_world_vm_state_hash_changes_with_canonical_world(self):
        c = qvm.compile_source(VM / "src/CORE.lctlc", VM, True)
        p = copy.deepcopy(c["payload"]); p["instructions"] = [{"op":"MOVI","dst":0,"imm":1},{"op":"SVC","svc":16},{"op":"SVC","svc":25},{"op":"HALT"}]
        a=qvm.VM(copy.deepcopy(p)); b=qvm.VM(copy.deepcopy(p)); sa=a.run(); sb=b.run()
        self.assertEqual(sa["state_sha256"], sb["state_sha256"])
        self.assertEqual(sa["world"]["state_sha256"], sb["world"]["state_sha256"])

    def test_24_ecology_and_economy_evolve_offscreen(self):
        w = WorldRuntime(seed=15)
        e0=copy.deepcopy(w.ecology); s0=copy.deepcopy(w.settlements)
        w.move_reference(10**7,0,0); w.advance(200)
        self.assertNotEqual(w.ecology,e0)
        self.assertNotEqual(w.settlements,s0)
        self.assertEqual(w.invariants(),[])

    def test_25_fold_monotonic_samples(self):
        w=WorldRuntime(seed=1)
        ds=[w.fold_point([x,0,0])["folded_distance"] for x in [1024,2048,4096,8192,16384,65536,10**6]]
        self.assertEqual(ds,sorted(ds))
        self.assertLess(ds[-1],w.fold_horizon)


if __name__ == "__main__":
    unittest.main(verbosity=2)
