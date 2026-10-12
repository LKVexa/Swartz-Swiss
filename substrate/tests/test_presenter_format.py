"""Presenter-format conformance.

These tests hold the two contracts the C# presenter depends on:

1. The golden canonical-JSON vectors in evidence/presenter/CANONICAL_VECTORS.json really are
   what vec1.common.canonical_bytes produces. The presenter checks itself against the same
   file at startup and refuses to seal anything if it disagrees, so if this test fails the
   vectors are wrong and the presenter would be sealing wrong hashes in good faith.
2. A presenter-shaped electron written by hand round-trips through the real ElectronStore:
   the sealed hash verifies, the ledger chain verifies, and the presenter audit accepts it.

Run: python -B -m unittest discover -s tests
"""
from __future__ import annotations
import json, shutil, sys, tempfile, unittest
from pathlib import Path

PKG = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PKG))
from vec1.common import canonical_bytes, sha256_bytes, sha256_json  # noqa: E402
from vec1.core import ElectronStore  # noqa: E402
from vec1 import ledger, presenter, binding  # noqa: E402

VECTORS = PKG / 'evidence/presenter/CANONICAL_VECTORS.json'


class CanonicalVectors(unittest.TestCase):
    def test_vectors_match_the_control_plane(self):
        doc = json.loads(VECTORS.read_text(encoding='utf-8'))
        self.assertTrue(doc['vectors'], 'no vectors declared')
        for v in doc['vectors']:
            with self.subTest(v['name']):
                self.assertEqual(canonical_bytes(v['value']).decode('utf-8'), v['canonical'])
                self.assertEqual(sha256_json(v['value']), v['sha256'])

    def test_vectors_cover_the_hard_cases(self):
        names = {v['name'] for v in json.loads(VECTORS.read_text(encoding='utf-8'))['vectors']}
        for needed in ('escapes', 'unicode', 'key_order', 'nesting', 'electron_shape'):
            self.assertIn(needed, names)


class PresenterElectron(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix='vec1presenter-'))
        shutil.copytree(PKG / 'config', self.tmp / 'config')
        (self.tmp / 'programs').mkdir()
        (self.tmp / 'programs/fabric_probe.pal').write_text('# placeholder\n', encoding='utf-8')
        self.s = ElectronStore(self.tmp)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _write(self, eid, events):
        """Write an electron the way the C# presenter writes one."""
        obj = json.loads((PKG / 'evidence/presenter/CANONICAL_VECTORS.json').read_text(encoding='utf-8'))
        state = None
        for v in obj['vectors']:
            if v['name'] == 'electron_shape':
                state = json.loads(json.dumps(v['value']))
        state['electron_id'] = eid
        state['lineage'] = [eid]
        state['provenance']['session_id'] = eid
        saved = self.s.save(state)
        path = self.s._ledger_path(eid)
        for kind, payload in events:
            ledger.append_event(path, 0, kind, payload)
        return saved

    def test_sealed_state_and_chain_verify(self):
        eid = 'vec1-' + 'a' * 24
        saved = self._write(eid, [('GENESIS', {'role': 'session'}), ('PRESENTATION', {'host': 'example.com'})])
        self.assertTrue(self.s.check_state(saved)['ok'])
        self.assertTrue(self.s.check_state(self.s.load(eid))['ok'])
        self.assertTrue(ledger.verify(self.s._ledger_path(eid))['ok'])
        audit = presenter.audit(self.s)
        self.assertTrue(audit['ok'], audit)
        self.assertEqual(audit['count'], 1)

    def test_configuration_seal_matches_the_live_config(self):
        seal = json.loads((PKG / 'config/CONFIG_SEAL.json').read_text(encoding='utf-8'))
        cfg = json.loads((PKG / 'config/vec1.json').read_text(encoding='utf-8'))
        pol = json.loads((PKG / 'config/security_policy.json').read_text(encoding='utf-8'))
        self.assertEqual(seal['configuration_sha256'], sha256_json(cfg))
        self.assertEqual(seal['security_policy_sha256'], sha256_json(pol))

    def test_presenter_may_not_claim_a_fabric_verdict(self):
        eid = 'vec1-' + 'b' * 24
        self._write(eid, [('GENESIS', {}), ('EXECUTION_VERIFIED', {'fabric_verdict': 'CROSS_NODE_DIFFERENTIAL_AGREEMENT'})])
        audit = presenter.audit(self.s)
        self.assertFalse(audit['ok'])
        self.assertFalse(audit['electrons'][eid]['claims_ok']['ok'])

    def test_tampered_state_fails_closed(self):
        eid = 'vec1-' + 'c' * 24
        self._write(eid, [('GENESIS', {})])
        p = self.s._state_path(eid)
        obj = json.loads(p.read_text(encoding='utf-8'))
        obj['properties']['energy'] = 999
        p.write_text(json.dumps(obj, indent=2, sort_keys=True), encoding='utf-8')
        audit = presenter.audit(self.s)
        self.assertFalse(audit['ok'])
        self.assertFalse(audit['electrons'][eid]['state']['ok'])


class NodeBinding(unittest.TestCase):
    def test_every_required_node_is_reported(self):
        rep = binding.node_report()
        self.assertEqual(sorted(rep), sorted(binding.REQUIRED_NODES))
        for nid, rec in rep.items():
            if not rec['bound_container']:
                self.assertIn('reason', rec, nid)

    def test_unvendored_nodes_declare_how_to_supply_them(self):
        for nid, rec in binding.node_report().items():
            if rec.get('container') is None:
                self.assertTrue(rec.get('drop_in'), nid + ' gives no drop-in instruction')


if __name__ == '__main__':
    unittest.main()
