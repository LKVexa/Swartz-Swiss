#!/usr/bin/env python3
"""Refresh the integrated package ledger without creating a release archive.

Keep its metadata and declared files, reject missing immutable payloads, and add
new immutable files. Run only after intentional source and runtime-seal changes
have finished; this script never changes the runtime seal itself.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from package_paths import contained_file, manifest_entries


IGNORED_DIRECTORIES = {".git", ".hg", ".svn", "__pycache__", ".pytest_cache", "logs"}
ROOT_MUTABLE_DIRECTORIES = {"work", "workspace", "outputs"}
EXCLUDED_FILES = {"package.integrity.json", "GFM/validation/desktop-publish.json"}


def immutable_files(root):
    """Match integrated release coverage, including console.json and runtime/."""
    result = {}
    for directory, directories, names in os.walk(root, followlinks=False):
        parent = Path(directory)
        directories[:] = sorted(
            name for name in directories
            if name not in IGNORED_DIRECTORIES
            and not (parent == root and name in ROOT_MUTABLE_DIRECTORIES)
        )
        for name in directories:
            contained_file(root, (parent / name).relative_to(root).as_posix())
        for name in sorted(names):
            relative = (parent / name).relative_to(root).as_posix()
            lower_name = name.lower()
            if (relative in EXCLUDED_FILES or lower_name.endswith((".pyc", ".tmp"))
                    or name == ".vec1.lock" or lower_name.endswith((".log", "_log.json"))
                    or ".log." in lower_name):
                continue
            path = contained_file(root, relative)
            if not stat.S_ISREG(path.lstat().st_mode):
                raise ValueError("Nonregular immutable package file: " + relative)
            result[relative] = path
    return result


def file_record(relative, path, original=None):
    before = path.stat()
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns, before.st_ino) != (
            after.st_size, after.st_mtime_ns, after.st_ino):
        raise ValueError("Package file changed while sealing: " + relative)
    record = dict(original or {})
    record.update(path=relative, bytes=after.st_size, sha256=digest.hexdigest())
    return record


def atomic_json(path, value, newline="\n"):
    descriptor, temporary = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline=newline) as stream:
            json.dump(value, stream, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def refresh_package(root):
    root = Path(root).absolute()
    info = root.lstat()
    if (not stat.S_ISDIR(info.st_mode) or stat.S_ISLNK(info.st_mode)
            or getattr(info, "st_file_attributes", 0) & 0x400):
        raise ValueError("Package root must be an ordinary directory")
    root = root.resolve()
    ledger = contained_file(root, "package.integrity.json")
    raw_manifest = ledger.read_bytes()
    newline = "\r\n" if b"\r\n" in raw_manifest else "\n"
    manifest = json.loads(raw_manifest.decode("utf-8"))
    if not isinstance(manifest, dict) or manifest.get("format") != "vb-ja21-package/5":
        raise ValueError("Unexpected integrated package manifest format")
    declared = manifest_entries(root, manifest)
    actual = immutable_files(root)
    declared_paths = {entry["path"] for entry, _ in declared}
    absent = sorted(declared_paths - actual.keys())
    if absent:
        raise ValueError("Declared immutable files are missing or excluded: " + ", ".join(absent))
    added = sorted(actual.keys() - declared_paths)
    # Preserve existing entry order and any per-entry metadata; append new files
    # deterministically rather than replacing the integrated manifest schema.
    files = [file_record(entry["path"], actual[entry["path"]], entry) for entry, _ in declared]
    files += [file_record(relative, actual[relative]) for relative in added]
    updated = dict(manifest)
    updated["files"] = files
    # Validate all newly discovered paths together before replacing the ledger,
    # including Windows case and Unicode collisions.
    manifest_entries(root, updated)
    atomic_json(ledger, updated, newline=newline)
    return len(files), added


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT, help="Package directory (defaults to this release)")
    args = parser.parse_args()
    count, added = refresh_package(args.root)
    print("Refreshed", count, "immutable package files; added", len(added), "new files.")


if __name__ == "__main__":
    main()
