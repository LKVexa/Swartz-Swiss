"""Hermetic tests for the VEC1 control plane (no native toolchain required).

Run:  python -B -m unittest discover -s tests -v
Set VEC1_INTEGRATION=1 to also run the strict four-node fabric path against the real package."""
from __future__ import annotations
import json, os, shutil, subprocess, sys, tempfile, threading, unittest
from pathlib import Path

PKG = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PKG))
from vec1.core import ElectronStore, REQUIRED_NODES  # noqa: E402
from vec1.common import IntegrityError, PolicyError, sha256_json  # noqa: E402
from vec1 import ledger  # noqa: E402

GOOD = {'verdict': 'CROSS_NODE_DIFFERENTIAL_AGREEMENT', 'nodes_bound': list(REQUIRED_NODES), 'rows': 7,
        'profile': 'single_process_deterministic', 'event_log': {'hash': 'ab' * 32, 'replay_self_check': {'ok': True}}}


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix='vec1test-'))
        for rel in ('config', 'programs'):
            shutil.copytree(PKG / rel, self.tmp / rel)
        self.s = ElectronStore(self.tmp)
        self.program = self.tmp / 'programs/fabric_probe.pal'

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_ok(self, eid, result=None):
        return self.s.record_execution(eid, dict(result or GOOD), self.program)


class Lifecycle(Base):
    def test_create_run_snapshot_fork_equivalent(self):
        e = self.s.create(seed='t')
        r = self.run_ok(e['electron_id'])
        self.assertEqual(r['tick'], 1)
        self.assertEqual(self.s.load(e['electron_id'])['runtime']['execution_status'], 'VERIFIED')
        child = self.s.fork(e['electron_id'])
        eq = self.s.equivalence(e['electron_id'], child['electron_id'])
        self.assertTrue(eq['equivalent'], eq)
        self.assertEqual(eq['basis'], 'shared_sealed_snapshot')
        self.assertTrue(self.s.audit()['ok'])

    def test_equivalence_detects_divergence_after_fork(self):
        e = self.s.create()
        child = self.s.fork(e['electron_id'])
        self.run_ok(child['electron_id'])
        eq = self.s.equivalence(e['electron_id'], child['electron_id'])
        self.assertFalse(eq['equivalent'], eq)
        self.assertEqual(eq['basis'], 'shared_snapshot_diverged')

    def test_restore_rolls_back_state_but_not_retirement(self):
        e = self.s.create(); eid = e['electron_id']
        snap = self.s.snapshot(eid)['snapshot_hash']
        self.run_ok(eid)
        restored = self.s.restore(eid, snap)
        self.assertEqual(restored['runtime']['tick'], 0)
        self.s.retire(eid)
        with self.assertRaises(PolicyError):
            self.s.restore(eid, snap)
        self.assertTrue(self.s.load(eid)['security']['retired'])

    def test_restore_keeps_suspension(self):
        e = self.s.create(); eid = e['electron_id']
        snap = self.s.snapshot(eid)['snapshot_hash']
        self.s.set_suspended(eid, True)
        r = self.s.restore(eid, snap)
        self.assertTrue(r['security']['suspended'])
        self.assertEqual(r['runtime']['execution_status'], 'SUSPENDED')

    def test_restore_refuses_unrelated_lineage(self):
        a = self.s.create(); b = self.s.create()
        snap = self.s.snapshot(a['electron_id'])['snapshot_hash']
        with self.assertRaises(PolicyError):
            self.s.restore(b['electron_id'], snap)

    def test_retired_electron_cannot_resume_fork_or_run(self):
        eid = self.s.create()['electron_id']
        self.s.retire(eid)
        for fn in (lambda: self.s.set_suspended(eid, False), lambda: self.s.set_suspended(eid, True),
                   lambda: self.s.fork(eid), lambda: self.run_ok(eid), lambda: self.s.retire(eid)):
            with self.assertRaises(PolicyError):
                fn()

    def test_resume_requires_suspended(self):
        eid = self.s.create()['electron_id']
        with self.assertRaises(PolicyError):
            self.s.set_suspended(eid, False)

    def test_quota(self):
        self.s.quotas['max_electrons'] = 2
        self.s.create(); self.s.create()
        with self.assertRaises(PolicyError):
            self.s.create()

    def test_program_size_quota_and_escape(self):
        self.s.quotas['max_program_bytes'] = 1
        with self.assertRaises(PolicyError):
            self.s.create()
        with self.assertRaises(PolicyError):
            self.s.resolve_program('../outside.pal')


class FailClosed(Base):
    def test_disagreement_faults(self):
        eid = self.s.create()['electron_id']
        with self.assertRaises(PolicyError):
            self.run_ok(eid, dict(GOOD, verdict='CROSS_NODE_DIFFERENTIAL_DISAGREEMENT'))
        self.assertEqual(self.s.load(eid)['runtime']['execution_status'], 'FAULTED')
        with self.assertRaises(PolicyError):
            self.run_ok(eid)

    def test_replay_failure_faults(self):
        eid = self.s.create()['electron_id']
        with self.assertRaises(PolicyError):
            self.run_ok(eid, dict(GOOD, event_log={'replay_self_check': {'ok': False}}))
        self.assertEqual(self.s.load(eid)['runtime']['execution_status'], 'FAULTED')

    def test_strict_requires_four_bound_nodes(self):
        eid = self.s.create()['electron_id']
        with self.assertRaises(PolicyError):
            self.run_ok(eid, dict(GOOD, nodes_bound=['N_XLARGE']))

    def test_malformed_result_never_strands_running(self):
        eid = self.s.create()['electron_id']
        with self.assertRaises(PolicyError):
            self.s.record_execution(eid, None, self.program)
        self.assertEqual(self.s.load(eid)['runtime']['execution_status'], 'FAULTED')

    def test_fault_recovered_by_restore(self):
        eid = self.s.create()['electron_id']
        snap = self.s.snapshot(eid)['snapshot_hash']
        with self.assertRaises(PolicyError):
            self.run_ok(eid, dict(GOOD, verdict='NOPE'))
        self.s.restore(eid, snap)
        self.run_ok(eid)


class Integrity(Base):
    def test_tampered_state_is_refused_and_restorable(self):
        eid = self.s.create()['electron_id']
        snap = self.s.snapshot(eid)['snapshot_hash']
        p = self.s._state_path(eid)
        d = json.loads(p.read_text()); d['security']['network'] = 'allow'; p.write_text(json.dumps(d))
        with self.assertRaises(IntegrityError):
            self.s.load(eid)
        self.assertFalse(self.s.audit()['ok'])
        self.s.restore(eid, snap)
        self.assertEqual(self.s.load(eid)['security']['network'], 'deny')

    def test_tampered_snapshot_refused(self):
        eid = self.s.create()['electron_id']
        h = self.s.snapshot(eid)['snapshot_hash']
        sp = self.s._snapshot_path(h)
        d = json.loads(sp.read_text()); d['state']['runtime']['tick'] = 99; sp.write_text(json.dumps(d))
        with self.assertRaises(IntegrityError):
            self.s.restore(eid, h)

    def test_ledger_tamper_detected_and_append_refused(self):
        eid = self.s.create()['electron_id']
        self.s.snapshot(eid)
        lp = self.s._ledger_path(eid)
        lines = lp.read_text().splitlines()
        rec = json.loads(lines[0]); rec['payload']['x'] = 1; lines[0] = json.dumps(rec)
        lp.write_text('\n'.join(lines) + '\n')
        self.assertFalse(ledger.verify(lp)['ok'])
        with self.assertRaises(IntegrityError):
            self.s.snapshot(eid)

    def test_ledger_torn_tail_and_deleted_event(self):
        eid = self.s.create()['electron_id']
        self.s.snapshot(eid); self.s.snapshot(eid)
        lp = self.s._ledger_path(eid)
        good = lp.read_text()
        lp.write_text(good + '{"seq": 9')
        v = ledger.verify(lp)
        self.assertFalse(v['ok']); self.assertIn('torn', v['reason'])
        lines = good.splitlines(); del lines[1]
        lp.write_text('\n'.join(lines) + '\n')
        self.assertFalse(ledger.verify(lp)['ok'])

    def test_bad_ids_rejected(self):
        for bad in ('..', '../x', '', 'vec1-XYZ', 'vec1-' + 'a' * 23):
            with self.assertRaises(ValueError):
                self.s.load(bad)
        eid = self.s.create()['electron_id']
        with self.assertRaises(ValueError):
            self.s.restore(eid, '../../config/vec1')

    def test_concurrent_mutations_keep_chain(self):
        eid = self.s.create()['electron_id']
        errs = []
        def work():
            try:
                ElectronStore(self.tmp).snapshot(eid)
            except Exception as e:  # pragma: no cover
                errs.append(e)
        ts = [threading.Thread(target=work) for _ in range(8)]
        [t.start() for t in ts]; [t.join() for t in ts]
        self.assertEqual(errs, [])
        v = ledger.verify(self.s._ledger_path(eid))
        self.assertTrue(v['ok'], v); self.assertEqual(v['events'], 9)


class Cli(unittest.TestCase):
    def vecctl(self, *args):
        return subprocess.run([sys.executable, '-B', str(PKG / 'vec1/vecctl.py'), *args], capture_output=True, text=True, timeout=120)

    def test_version_and_usage_errors(self):
        self.assertEqual(self.vecctl('--version').returncode, 0)
        self.assertEqual(self.vecctl('show', '../../etc').returncode, 2)
        self.assertNotEqual(self.vecctl('run', 'vec1-' + '0' * 24, '--fabric-programs', 'evil').returncode, 0)


@unittest.skipUnless(os.environ.get('VEC1_INTEGRATION') == '1', 'set VEC1_INTEGRATION=1 after BUILD_VEC1')
class Integration(unittest.TestCase):
    def test_strict_verify_full(self):
        r = subprocess.run([sys.executable, '-B', str(PKG / 'vec1/vecctl.py'), 'verify', '--full'], capture_output=True, text=True, timeout=1800)
        self.assertEqual(r.returncode, 0, r.stdout[-3000:])


if __name__ == '__main__':
    unittest.main()
