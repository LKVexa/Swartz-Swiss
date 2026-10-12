from __future__ import annotations
import contextlib, hashlib, json, os, re, tempfile, time
from pathlib import Path
from datetime import datetime, timezone

ELECTRON_ID_RE = re.compile(r'^vec1-[0-9a-f]{24}$')
SHA256_RE = re.compile(r'^[0-9a-f]{64}$')


class IntegrityError(RuntimeError):
    """Raised when sealed state, a snapshot or a ledger fails verification (fail-closed)."""


class PolicyError(RuntimeError):
    """Raised when an operation is refused by the VEC security/lifecycle policy."""


def utc_now():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def canonical_bytes(obj):
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha256_json(obj):
    return sha256_bytes(canonical_bytes(obj))


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def read_json(path):
    path = Path(path)
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        raise IntegrityError(f'malformed JSON in {path.name}: {e}') from e


def atomic_json(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.name + '.', suffix='.tmp', dir=str(path.parent))
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(obj, f, indent=2, sort_keys=True, ensure_ascii=False)
            f.write('\n')
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def atomic_text(path, text):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=path.name + '.', suffix='.tmp', dir=str(path.parent))
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def confined(root, path):
    root = Path(root).resolve()
    p = Path(path).resolve()
    try:
        p.relative_to(root)
    except ValueError:
        raise PermissionError(f'path escapes VEC runtime root: {p}')
    return p


def require_electron_id(eid):
    if not isinstance(eid, str) or not ELECTRON_ID_RE.match(eid):
        raise ValueError(f'invalid electron id {eid!r}; expected vec1-<24 hex>')
    return eid


def require_sha256(value, what='hash'):
    if not isinstance(value, str) or not SHA256_RE.match(value):
        raise ValueError(f'invalid {what} {value!r}; expected 64 lowercase hex characters')
    return value


@contextlib.contextmanager
def file_lock(path, timeout=30.0, poll=0.05):
    """Exclusive inter-process lock (fcntl on POSIX, msvcrt on Windows).

    Serialises every state/ledger mutation so concurrent vecctl invocations cannot
    fork a ledger hash chain or lose a state write."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fh = open(path, 'a+b')
    deadline = time.monotonic() + timeout
    try:
        if os.name == 'nt':
            import msvcrt
            fh.seek(0)
            while True:
                try:
                    msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
                    break
                except OSError:
                    if time.monotonic() > deadline:
                        raise TimeoutError(f'could not acquire VEC lock {path.name} within {timeout}s')
                    time.sleep(poll)
        else:
            import fcntl
            while True:
                try:
                    fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except OSError:
                    if time.monotonic() > deadline:
                        raise TimeoutError(f'could not acquire VEC lock {path.name} within {timeout}s')
                    time.sleep(poll)
        yield
    finally:
        try:
            if os.name == 'nt':
                import msvcrt
                fh.seek(0)
                try:
                    msvcrt.locking(fh.fileno(), msvcrt.LK_UNLCK, 1)
                except OSError:
                    pass
            else:
                import fcntl
                fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        finally:
            fh.close()
