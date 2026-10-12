"""Shared fail-closed path and entry validation for package integrity tools."""
from pathlib import Path, PurePosixPath
import os
import re
import stat

from windows_archive_preflight import scan_relative_paths

HASH_RE = re.compile(r'[0-9a-f]{64}\Z')
IGNORED_DIRECTORIES = {'.git', '.hg', '.svn', '__pycache__', '.pytest_cache', 'logs'}


def contained_file(root, relative):
    root = Path(root).resolve()
    if not isinstance(relative, str) or not relative or '\\' in relative:
        raise ValueError('manifest paths must be nonempty canonical relative POSIX paths')
    parts = relative.split('/')
    if any(p in {'', '.', '..'} for p in parts) or PurePosixPath(relative).is_absolute():
        raise ValueError('manifest path is absolute, empty, or contains a relative component')
    if any(p.casefold() in {'.git', '.hg', '.svn'} for p in parts):
        raise ValueError('repository metadata cannot be a payload path')
    if scan_relative_paths([relative]):
        raise ValueError('manifest path is incompatible with Windows')
    target = root.joinpath(*parts)
    # Do not follow symlinks, Windows junctions, or other reparse points when sealing/verifying.
    current = root
    for part in parts:
        current = current / part
        try:
            info = current.lstat()
        except FileNotFoundError:
            break
        if stat.S_ISLNK(info.st_mode) or getattr(info, 'st_file_attributes', 0) & 0x400:
            raise ValueError('manifest path traverses a symlink or Windows reparse point')
    try:
        target.resolve().relative_to(root)
    except ValueError as exc:
        raise ValueError('manifest path escapes the package root') from exc
    return target


def manifest_entries(root, manifest):
    if not isinstance(manifest, dict):
        raise ValueError('manifest must be a JSON object')
    files = manifest.get('files')
    if not isinstance(files, list) or not files:
        raise ValueError('manifest requires a nonempty files list')
    seen = set()
    result = []
    for entry in files:
        if not isinstance(entry, dict):
            raise ValueError('each manifest entry must be an object')
        relative = entry.get('path')
        target = contained_file(root, relative)
        key = relative.casefold()
        if key in seen:
            raise ValueError('duplicate manifest path: ' + relative)
        seen.add(key)
        size = entry.get('bytes')
        if isinstance(size, bool) or not isinstance(size, int) or size < 0:
            raise ValueError('manifest byte count must be a nonnegative integer: ' + relative)
        digest = entry.get('sha256')
        if not isinstance(digest, str) or not HASH_RE.fullmatch(digest):
            raise ValueError('manifest SHA-256 must contain 64 lowercase hex characters: ' + relative)
        result.append((entry, target))
    collisions = scan_relative_paths([entry['path'] for entry, _ in result])
    if collisions:
        raise ValueError('manifest contains colliding Windows paths: ' + str(collisions))
    return result


def package_files(root):
    """Walk immutable shipped files, pruning mutable state and version-control metadata."""
    root = Path(root).resolve()
    if not root.is_dir():
        raise ValueError('package root is not a directory')
    result = []
    for directory, dirs, files in os.walk(root, followlinks=False):
        parent = Path(directory)
        rel_parent = parent.relative_to(root).as_posix()
        dirs[:] = sorted(name for name in dirs if name not in IGNORED_DIRECTORIES
                         and not (rel_parent == '.' and name in {'workspace', 'runtime', 'work'})
                         and not (rel_parent == 'substrate' and name == 'runtime'))
        for name in dirs:
            contained_file(root, (parent/name).relative_to(root).as_posix())
        for name in sorted(files):
            path = parent/name
            relative = path.relative_to(root).as_posix()
            if relative in {'package.integrity.json', 'console.json'}:
                continue
            if name.endswith(('.pyc', '.tmp')) or name == '.vec1.lock' or name.lower().endswith(('.log', '_log.json')) or '.log.' in name.lower():
                continue
            contained_file(root, relative)
            if not path.is_file():
                raise ValueError('non-regular package file: ' + relative)
            result.append(path)
    return sorted(result)
