"""Presenter-owned electrons.

The JA21 Omni Bin presenter binds one VEC electron to the browser session and one to
each tab. It writes those electrons in exactly the sealed on-disk format defined by
``vec1.core`` (canonical JSON state + hash-chained JSONL ledger) so this control plane
can audit them without the presenter having to embed Python.

Ownership rule (enforced both ways):

* ``origin: "presenter"`` electrons are written by the presenter and are read-only here.
  ``vecctl`` audits, shows, diffs and retires them but never mutates their runtime.
* ``origin: "vecctl"`` electrons (the default) are never touched by the presenter.

A presenter electron never carries an EXECUTION_VERIFIED event: presentation is not a
fabric proof. Presentation is recorded as ``PRESENTATION`` / ``PRESENTATION_FAILED``
events, which is an evidence trail, not a claim of cross-node differential agreement.
"""
from __future__ import annotations
from pathlib import Path
from .common import IntegrityError
from .ledger import verify as verify_ledger

PRESENTER_ORIGIN = 'presenter'
PRESENTER_EVENTS = {'GENESIS', 'CLONE_GENESIS', 'FORK', 'SNAPSHOT', 'PRESENTATION',
                    'PRESENTATION_FAILED', 'SUSPEND', 'RESUME', 'RETIRE', 'RESTORE'}
FORBIDDEN_PRESENTER_EVENTS = {'EXECUTION_VERIFIED'}


def is_presenter(obj):
    return (obj.get('provenance') or {}).get('origin') == PRESENTER_ORIGIN


def audit(store):
    """Audit only the presenter-owned electrons, plus the presenter-specific invariants."""
    rows = {}
    for eid in store.ids():
        try:
            obj = store.load(eid, verify=False)
        except Exception as e:
            rows[eid] = {'ok': False, 'reason': str(e)}
            continue
        if not is_presenter(obj):
            continue
        rec = {'state': store.check_state(obj), 'ledger': verify_ledger(store._ledger_path(eid))}
        rec['claims_ok'] = _claims_ok(store, eid, rec)
        rec['role'] = (obj.get('provenance') or {}).get('role')
        rec['status'] = obj['runtime']['execution_status']
        rec['ok'] = bool(rec['state']['ok'] and rec['ledger']['ok'] and rec['claims_ok']['ok'])
        rows[eid] = rec
    return {'schema': 'VEC1/PRESENTER_AUDIT/1', 'electrons': rows,
            'count': len(rows), 'ok': all(r.get('ok') for r in rows.values())}


def _claims_ok(store, eid, rec):
    """A presenter electron must never assert a fabric verdict it did not earn."""
    path = store._ledger_path(eid)
    if not Path(path).exists():
        return {'ok': True, 'events': 0}
    import json
    bad = []
    seen = 0
    for line in Path(path).read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
        except Exception:
            continue
        seen += 1
        kind = r.get('kind')
        if kind in FORBIDDEN_PRESENTER_EVENTS:
            bad.append({'seq': r.get('seq'), 'kind': kind,
                        'reason': 'presenter electrons may not record a fabric execution verdict'})
        elif kind not in PRESENTER_EVENTS:
            bad.append({'seq': r.get('seq'), 'kind': kind, 'reason': 'event kind is not in the presenter vocabulary'})
    return {'ok': not bad, 'events': seen, 'violations': bad}


def retire_stale(store, keep_session=None):
    """Retire presenter electrons left behind by a presenter that did not shut down cleanly.

    Terminal and monotonic, exactly like ``vecctl retire``: nothing is deleted."""
    retired = []
    for eid in store.ids():
        try:
            obj = store.load(eid, verify=False)
        except Exception:
            continue
        if not is_presenter(obj) or obj['security'].get('retired'):
            continue
        if keep_session and (obj.get('provenance') or {}).get('session_id') == keep_session:
            continue
        try:
            store.retire(eid)
            retired.append(eid)
        except Exception as e:
            raise IntegrityError(f'could not retire stale presenter electron {eid}: {e}')
    return {'schema': 'VEC1/PRESENTER_GC/1', 'retired': retired, 'count': len(retired)}
