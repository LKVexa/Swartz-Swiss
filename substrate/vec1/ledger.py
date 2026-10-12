from __future__ import annotations
import json, os
from pathlib import Path
from .common import IntegrityError, canonical_bytes, sha256_bytes, utc_now

GENESIS_PREV = '0' * 64


def _records(path):
    """Parse a ledger, distinguishing a torn trailing write from mid-file corruption."""
    raw = Path(path).read_bytes()
    text = raw.decode('utf-8')
    lines = text.split('\n')
    torn_tail = bool(lines) and lines[-1].strip() != ''
    out = []
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            if torn_tail and i == len(lines) - 1:
                return out, {'torn_tail': True, 'line': i + 1}
            raise IntegrityError(f'ledger {Path(path).name}: malformed record at line {i + 1}')
    return out, ({'torn_tail': True, 'line': len(lines)} if torn_tail else None)


def verify(path):
    path = Path(path)
    prev = GENESIS_PREV
    count = 0
    if not path.exists():
        return {'ok': True, 'events': 0, 'head': prev}
    try:
        recs, tail = _records(path)
    except (IntegrityError, UnicodeDecodeError) as e:
        return {'ok': False, 'events': 0, 'reason': str(e)}
    for rec in recs:
        if not isinstance(rec, dict):
            return {'ok': False, 'events': count, 'reason': 'record is not an object'}
        got = rec.get('hash')
        test = dict(rec)
        test.pop('hash', None)
        if rec.get('seq') != count:
            return {'ok': False, 'events': count, 'reason': 'sequence gap or reorder', 'seq': rec.get('seq')}
        if rec.get('prev_hash') != prev:
            return {'ok': False, 'events': count, 'reason': 'prev_hash mismatch', 'seq': rec.get('seq')}
        if sha256_bytes(canonical_bytes(test)) != got:
            return {'ok': False, 'events': count, 'reason': 'event hash mismatch', 'seq': rec.get('seq')}
        prev = got
        count += 1
    if tail:
        return {'ok': False, 'events': count, 'head': prev, 'reason': 'torn trailing write (interrupted append)', **tail}
    return {'ok': True, 'events': count, 'head': prev}


def head(path):
    v = verify(path)
    if not v['ok']:
        raise IntegrityError(f'ledger {Path(path).name} failed verification: {v.get("reason")}')
    return v


def append_event(path, tick, kind, payload):
    """Append one hash-chained event. Refuses to extend a chain that no longer verifies."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    v = head(path)
    base = {'schema': 'VEC/LEDGER_EVENT/1', 'seq': v['events'], 'tick': int(tick), 'utc': utc_now(),
            'kind': kind, 'payload': payload, 'prev_hash': v['head']}
    base['hash'] = sha256_bytes(canonical_bytes(base))
    with path.open('a', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(base, sort_keys=True, separators=(',', ':')) + '\n')
        f.flush()
        os.fsync(f.fileno())
    return base
