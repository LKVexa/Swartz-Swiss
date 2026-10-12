from __future__ import annotations
import copy, secrets, time, os
from pathlib import Path
from . import __version__
from .common import (IntegrityError, PolicyError, atomic_json, confined, file_lock, read_json,
                     require_electron_id, require_sha256, sha256_bytes, sha256_file, sha256_json, utc_now)
from .ledger import append_event, verify as verify_ledger

ACCEPTED_VERDICT = 'CROSS_NODE_DIFFERENTIAL_AGREEMENT'
REQUIRED_NODES = ('N_SMALL', 'N_MEDIUM', 'N_LARGE', 'N_XLARGE')
IDENTITY_KEYS = ('electron_id', 'generation_id', 'parent_id', 'lineage', 'genesis_record')
VOLATILE_KEYS = ('updated_utc', 'hashes')


def _logical(obj):
    logical = dict(obj)
    for k in VOLATILE_KEYS:
        logical.pop(k, None)
    return logical


def _normalized(obj):
    x = copy.deepcopy(obj)
    for k in IDENTITY_KEYS + VOLATILE_KEYS:
        x.pop(k, None)
    return x


def _set_status(obj, status):
    obj['runtime']['execution_status'] = status
    obj['properties']['state'] = status


class ElectronStore:
    def __init__(self, root):
        self.root = Path(root).resolve()
        override = os.environ.get('JA21_VEC1_STATE_ROOT')
        self.state = Path(override).resolve() if override else self.root / 'runtime/state'
        self.snapshots = self.state / 'snapshots'
        self.electrons = self.state / 'electrons'
        self.receipts = self.state / 'evidence/executions'
        for p in (self.snapshots, self.electrons, self.receipts):
            p.mkdir(parents=True, exist_ok=True)
        self.lock_path = self.state / '.vec1.lock'
        self.config = read_json(self.root / 'config/vec1.json')
        self.quotas = self.config.get('resource_quotas', {})

    # ---- paths -------------------------------------------------------------------------------
    def _edir(self, eid):
        return confined(self.electrons, self.electrons / require_electron_id(eid))

    def _state_path(self, eid):
        return self._edir(eid) / 'state.json'

    def _ledger_path(self, eid):
        return self._edir(eid) / 'ledger.jsonl'

    def _snapshot_path(self, snapshot_hash):
        return confined(self.snapshots, self.snapshots / f'{require_sha256(snapshot_hash, "snapshot hash")}.json')

    def lock(self):
        return file_lock(self.lock_path)

    # ---- state -------------------------------------------------------------------------------
    def ids(self):
        out = []
        for p in self.electrons.iterdir():
            if p.is_dir() and (p / 'state.json').exists():
                try:
                    out.append(require_electron_id(p.name))
                except ValueError:
                    continue  # foreign directory: ignored, never loaded
        return sorted(out)

    def check_state(self, obj):
        """Recompute the sealed canonical hash; any out-of-band edit is detected."""
        want = (obj.get('hashes') or {}).get('canonical_state_sha256')
        got = sha256_json(_logical(obj))
        res = {'ok': want == got, 'recorded': want, 'computed': got,
               'configuration_current': (obj.get('hashes') or {}).get('configuration_sha256') == sha256_json(self.config)}
        return res

    def load(self, eid, verify=True):
        path = self._state_path(eid)
        if not path.is_file():
            raise FileNotFoundError(f'unknown electron {eid}')
        obj = read_json(path)
        if obj.get('electron_id') != eid:
            raise IntegrityError(f'state file for {eid} names {obj.get("electron_id")!r}')
        if verify and not self.check_state(obj)['ok']:
            raise IntegrityError(f'electron {eid} state hash mismatch; state was modified outside vecctl (restore from a sealed snapshot)')
        return obj

    def save(self, obj):
        obj = copy.deepcopy(obj)
        obj['updated_utc'] = utc_now()
        h = obj.setdefault('hashes', {})
        h['canonical_state_sha256'] = sha256_json(_logical(obj))
        h['genome_sha256'] = sha256_json(obj.get('genome', {}))
        h['capability_sha256'] = sha256_json((obj.get('genome') or {}).get('capabilities', []))
        h['configuration_sha256'] = sha256_json(self.config)
        atomic_json(self._state_path(obj['electron_id']), obj)
        return obj

    def _new_id(self, seed=None):
        # A seed makes the id reproducible in intent but ids are always salted with time so
        # repeated creates never collide.
        material = (str(seed) if seed is not None else secrets.token_hex(32)) + '|' + str(time.time_ns())
        return 'vec1-' + sha256_bytes(material.encode())[:24]

    def _event(self, eid, tick, kind, payload):
        return append_event(self._ledger_path(eid), tick, kind, payload)

    # ---- lifecycle ---------------------------------------------------------------------------
    def resolve_program(self, program_rel):
        program = (self.root / program_rel).resolve()
        try:
            program.relative_to(self.root)
        except ValueError:
            raise PolicyError('program path escapes package root')
        if not program.is_file():
            raise FileNotFoundError(f'program not found: {program_rel}')
        limit = int(self.quotas.get('max_program_bytes', 0) or 0)
        if limit and program.stat().st_size > limit:
            raise PolicyError(f'program exceeds max_program_bytes ({program.stat().st_size} > {limit})')
        return program

    def create(self, program_rel=None, seed=None):
        program_rel = (program_rel or self.config.get('default_program', 'programs/fabric_probe.pal')).replace('\\', '/')
        program = self.resolve_program(program_rel)
        with self.lock():
            if len(self.ids()) >= int(self.quotas.get('max_electrons', 128)):
                raise PolicyError('electron quota reached')
            eid = self._new_id(seed)
            now = utc_now()
            genome = {'schema': 'VEC/electron_genome/1', 'version': __version__, 'program': program_rel,
                      'program_sha256': sha256_file(program), 'targets': list(REQUIRED_NODES), 'network': 'deny',
                      'capabilities': ['fabric.execute', 'state.snapshot', 'state.clone', 'evidence.read']}
            genome_hash = sha256_json(genome)
            obj = {'schema': 'VEC/ELECTRON_STATE/1', 'electron_id': eid, 'generation_id': 0, 'parent_id': None, 'lineage': [eid],
                   'genesis_record': {'created_utc': now, 'genome_sha256': genome_hash}, 'genome': genome,
                   'properties': {'charge': -1, 'energy': 0, 'orbital': 'UNASSIGNED', 'state': 'READY', 'phase': 0, 'spin': 'UP',
                                  'momentum_vector': [0, 0, 0], 'position_node_vector': [], 'interaction_radius': 'DF0_LOCAL'},
                   'runtime': {'tick': 0, 'instruction_counter': 0, 'execution_status': 'READY', 'mailbox': [], 'outbound_queue': [],
                               'base_snapshot': None, 'last_receipt': None},
                   'security': {'network': 'deny', 'plugins': [], 'filesystem': 'package-runtime-only', 'host_calls': 'DF-only',
                                'suspended': False, 'retired': False},
                   'hashes': {}}
            obj = self.save(obj)
            self._event(eid, 0, 'GENESIS', {'genome_sha256': genome_hash, 'state_sha256': obj['hashes']['canonical_state_sha256']})
            return obj

    def assert_operable(self, obj):
        if obj['security'].get('retired'):
            raise PolicyError('electron is retired')
        if obj['security'].get('suspended'):
            raise PolicyError('electron is suspended')
        if obj['runtime'].get('execution_status') in ('FAULTED', 'BLOCKED'):
            raise PolicyError('electron is fail-closed; restore it from a sealed snapshot before execution')

    _assert_operable = assert_operable  # backward-compatible alias

    def _assert_not_retired(self, obj, action):
        if obj['security'].get('retired'):
            raise PolicyError(f'cannot {action}: electron is retired (terminal state)')

    def _snapshot_locked(self, eid):
        obj = self.load(eid)
        prior = obj['runtime']['execution_status']
        _set_status(obj, 'FROZEN')
        obj = self.save(obj)
        snap_core = copy.deepcopy(obj)
        snap_core.pop('updated_utc', None)
        snap_hash = sha256_json(snap_core)
        rec = {'schema': 'VEC/SNAPSHOT/1', 'snapshot_hash': snap_hash, 'electron_id': eid, 'generation_id': obj['generation_id'],
               'state': snap_core, 'created_utc': utc_now()}
        path = self._snapshot_path(snap_hash)
        if not path.exists():
            atomic_json(path, rec)
        self._event(eid, obj['runtime']['tick'], 'SNAPSHOT', {'snapshot_hash': snap_hash})
        obj['runtime']['base_snapshot'] = snap_hash
        _set_status(obj, prior if prior not in ('RUNNING', 'FROZEN') else 'READY')
        self.save(obj)
        return rec

    def snapshot(self, eid):
        with self.lock():
            return self._snapshot_locked(eid)

    def load_snapshot(self, snapshot_hash):
        sp = self._snapshot_path(snapshot_hash)
        if not sp.is_file():
            raise FileNotFoundError(f'unknown snapshot {snapshot_hash}')
        rec = read_json(sp)
        state = rec.get('state')
        if rec.get('snapshot_hash') != snapshot_hash or sha256_json(state) != snapshot_hash:
            raise IntegrityError('snapshot hash mismatch; snapshot refused')
        return rec

    def fork(self, eid):
        with self.lock():
            parent = self.load(eid)
            self._assert_not_retired(parent, 'fork')
            snap = self._snapshot_locked(eid)
            child = copy.deepcopy(snap['state'])
            cid = self._new_id(snap['snapshot_hash'])
            child['electron_id'] = cid
            child['parent_id'] = eid
            child['generation_id'] = int(parent['generation_id']) + 1
            child['lineage'] = list(parent['lineage']) + [cid]
            child['genesis_record'] = {'created_utc': utc_now(), 'forked_from': eid, 'snapshot_hash': snap['snapshot_hash'],
                                       'genome_sha256': child['genesis_record']['genome_sha256']}
            child['runtime']['base_snapshot'] = snap['snapshot_hash']
            child['security']['suspended'] = False
            _set_status(child, 'READY')
            child = self.save(child)
            self._event(cid, child['runtime']['tick'], 'CLONE_GENESIS', {'parent_id': eid, 'snapshot_hash': snap['snapshot_hash']})
            self._event(eid, parent['runtime']['tick'], 'FORK', {'child_id': cid, 'snapshot_hash': snap['snapshot_hash']})
            return child

    def diff(self, a, b):
        A = self.load(a)
        B = self.load(b)

        def walk(x, y, p=''):
            out = []
            if type(x) != type(y):
                return [{'path': p, 'a': x, 'b': y}]
            if isinstance(x, dict):
                for k in sorted(set(x) | set(y)):
                    if not p and k in VOLATILE_KEYS:
                        continue
                    if k not in x or k not in y:
                        out.append({'path': f'{p}/{k}', 'a': x.get(k), 'b': y.get(k)})
                    else:
                        out.extend(walk(x[k], y[k], f'{p}/{k}'))
            elif x != y:
                out.append({'path': p, 'a': x, 'b': y})
            return out

        differences = walk(A, B)
        return {'schema': 'VEC/STATE_DIFF/1', 'a': a, 'b': b, 'equal': not differences, 'differences': differences}

    def equivalence(self, a, b):
        A = self.load(a)
        B = self.load(b)
        na, nb = _normalized(A), _normalized(B)
        ha, hb = sha256_json(na), sha256_json(nb)
        out = {'schema': 'VEC/CLONE_EQUIVALENCE/1', 'a': a, 'b': b, 'a_sha256': ha, 'b_sha256': hb}
        ba = A['runtime'].get('base_snapshot')
        bb = B['runtime'].get('base_snapshot')
        if ba and ba == bb:
            try:
                snap = self.load_snapshot(ba)
            except (FileNotFoundError, IntegrityError) as e:
                out.update(equivalent=False, basis='shared_snapshot_unverifiable', snapshot_hash=ba, reason=str(e))
                return out
            # A shared base only proves equivalence while neither side has diverged from it.
            def cmp(n):
                m = copy.deepcopy(n)
                for k in ('execution_status', 'base_snapshot'):
                    m['runtime'].pop(k, None)
                m['properties'].pop('state', None)
                m['security'].pop('suspended', None)
                return sha256_json(m)
            ns = _normalized(snap['state'])
            same = cmp(na) == cmp(ns) == cmp(nb)
            out.update(equivalent=same, basis='shared_sealed_snapshot' if same else 'shared_snapshot_diverged', snapshot_hash=ba)
            return out
        out.update(equivalent=ha == hb, basis='normalized_state')
        return out

    def restore(self, eid, snapshot_hash):
        with self.lock():
            rec = self.load_snapshot(snapshot_hash)
            state = rec['state']
            try:
                cur = self.load(eid)
            except IntegrityError:
                cur = self.load(eid, verify=False)  # restoring is the recovery path for a tampered state
                tampered = True
            else:
                tampered = False
            self._assert_not_retired(cur, 'restore')
            related = state.get('electron_id') in cur.get('lineage', []) or eid in state.get('lineage', [])
            if not related:
                raise PolicyError('snapshot belongs to an unrelated lineage; restore refused')
            restored = copy.deepcopy(state)
            for k in IDENTITY_KEYS:
                restored[k] = copy.deepcopy(cur[k])
            restored['runtime']['base_snapshot'] = snapshot_hash
            # lifecycle controls are never rolled back by a restore
            restored['security']['retired'] = bool(cur['security'].get('retired'))
            restored['security']['suspended'] = bool(cur['security'].get('suspended'))
            _set_status(restored, 'SUSPENDED' if restored['security']['suspended'] else 'READY')
            restored = self.save(restored)
            self._event(eid, restored['runtime']['tick'], 'RESTORE', {'snapshot_hash': snapshot_hash, 'recovered_from_tamper': tampered})
            return restored

    def set_suspended(self, eid, value):
        with self.lock():
            obj = self.load(eid)
            self._assert_not_retired(obj, 'suspend' if value else 'resume')
            if bool(obj['security'].get('suspended')) == bool(value):
                raise PolicyError('electron is already ' + ('suspended' if value else 'not suspended'))
            obj['security']['suspended'] = bool(value)
            _set_status(obj, 'SUSPENDED' if value else 'READY')
            obj = self.save(obj)
            self._event(eid, obj['runtime']['tick'], 'SUSPEND' if value else 'RESUME', {})
            return obj

    def retire(self, eid):
        with self.lock():
            obj = self.load(eid)
            self._assert_not_retired(obj, 'retire')
            obj['security']['retired'] = True
            _set_status(obj, 'RETIRED')
            obj = self.save(obj)
            self._event(eid, obj['runtime']['tick'], 'RETIRE', {})
            return obj

    # ---- execution ---------------------------------------------------------------------------
    def _fault(self, eid, tick, kind, payload, message):
        obj = self.load(eid)
        _set_status(obj, 'FAULTED')
        self.save(obj)
        self._event(eid, tick, kind, payload)
        raise PolicyError(message)

    def record_execution(self, eid, result, program_path, strict=True):
        with self.lock():
            obj = self.load(eid)
            self.assert_operable(obj)
            limit = int(self.quotas.get('max_execution_receipts', 0) or 0)
            if limit and len(list(self.receipts.glob(f'{eid}-*.json'))) >= limit:
                raise PolicyError('max_execution_receipts quota reached for electron')
            obj['runtime']['tick'] += 1
            tick = obj['runtime']['tick']
            _set_status(obj, 'RUNNING')
            self.save(obj)
            try:
                result = result if isinstance(result, dict) else {}
                if result.get('verdict') != ACCEPTED_VERDICT:
                    self._fault(eid, tick, 'EXECUTION_REJECTED', {'verdict': result.get('verdict')},
                                'fabric did not reach cross-node differential agreement')
                bound = sorted(result.get('nodes_bound') or [])
                if strict and self.config.get('strict_four_node_execution', True) and bound != sorted(REQUIRED_NODES):
                    self._fault(eid, tick, 'EXECUTION_REJECTED', {'reason': 'unbound_required_node', 'nodes_bound': bound},
                                'strict policy requires all four nodes to be bound')
                replay = ((result.get('event_log') or {}).get('replay_self_check') or {})
                if not replay.get('ok'):
                    self._fault(eid, tick, 'REPLAY_REJECTED', replay, 'fabric replay self-check failed')
                receipt = {'schema': 'VEC/EXECUTION_RECEIPT/1', 'electron_id': eid, 'tick': tick,
                           'program': str(Path(program_path).resolve().relative_to(self.root)).replace('\\', '/'),
                           'program_sha256': sha256_file(program_path), 'fabric_verdict': result.get('verdict'),
                           'nodes_bound': result.get('nodes_bound', []), 'profile': result.get('profile'),
                           'event_log_hash': (result.get('event_log') or {}).get('hash'), 'replay': replay,
                           'fabric_result_sha256': sha256_json(result), 'strict': bool(strict), 'vecctl_version': __version__,
                           'created_utc': utc_now()}
                rp = self.receipts / f'{eid}-{tick:08d}.json'
                atomic_json(rp, receipt)
                obj = self.load(eid)
                _set_status(obj, 'VERIFIED')
                obj['properties']['orbital'] = 'DF0_FABRIC'
                obj['properties']['position_node_vector'] = list(result.get('nodes_bound', []))
                obj['properties']['phase'] = (int(obj['properties']['phase']) + 1) % 2
                obj['properties']['spin'] = 'DOWN' if obj['properties']['spin'] == 'UP' else 'UP'
                obj['runtime']['last_receipt'] = str(rp.relative_to(self.root)).replace('\\', '/')
                obj['runtime']['instruction_counter'] += int(result.get('rows', 0) or 0)
                self.save(obj)
                self._event(eid, tick, 'EXECUTION_VERIFIED', {'receipt': obj['runtime']['last_receipt'], 'receipt_sha256': sha256_file(rp),
                                                             'fabric_verdict': receipt['fabric_verdict'], 'event_log_hash': receipt['event_log_hash']})
                return receipt
            except PolicyError:
                raise
            except Exception as e:
                # never leave an electron stranded in RUNNING
                self._fault(eid, tick, 'EXECUTION_ERROR', {'error': type(e).__name__, 'message': str(e)}, f'execution recording failed: {e}')

    # ---- audit -------------------------------------------------------------------------------
    def verify_all_ledgers(self):
        return {eid: verify_ledger(self._ledger_path(eid)) for eid in self.ids()}

    def audit(self):
        out = {}
        for eid in self.ids():
            rec = {'ledger': verify_ledger(self._ledger_path(eid))}
            try:
                obj = self.load(eid, verify=False)
                rec['state'] = self.check_state(obj)
                base = obj['runtime'].get('base_snapshot')
                if base:
                    try:
                        self.load_snapshot(base)
                        rec['base_snapshot'] = {'ok': True, 'hash': base}
                    except Exception as e:
                        rec['base_snapshot'] = {'ok': False, 'hash': base, 'reason': str(e)}
                last = obj['runtime'].get('last_receipt')
                if last:
                    rec['last_receipt'] = {'ok': (self.root / last).is_file(), 'path': last}
            except Exception as e:
                rec['state'] = {'ok': False, 'reason': str(e)}
            rec['ok'] = all(v.get('ok') for k, v in rec.items() if isinstance(v, dict))
            out[eid] = rec
        return {'schema': 'VEC1/STATE_AUDIT/1', 'electrons': out, 'ok': all(r['ok'] for r in out.values())}
