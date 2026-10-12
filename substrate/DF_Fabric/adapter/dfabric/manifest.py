"""Inventory, hashing and integrity checks for DF containers.

Conventions (inherited from the PA21.2 packages):
* `SHA256SUMS.txt` binds every delivered file except itself
  (`sha256sum -c SHA256SUMS.txt` format);
* `MANIFEST.json.files[]` is the inventory {path, bytes, sha256}, excluding
  MANIFEST.json and SHA256SUMS.txt (both derived from the inventory) and the
  build/run artefact directories listed in `INVENTORY_EXCLUSIONS`;
* the embedded VM payload under `vm/<package>/` keeps its own sums file
  untouched, and `node/PAYLOAD_DIGEST.json` pins every payload file.
"""

from __future__ import annotations

import fnmatch
import hashlib
import json
import os
from typing import Dict, Iterable, List, Optional, Tuple

INVENTORY_EXCLUSIONS = ("__pycache__", "*.pyc", ".build", "_runs", "_scratch",
                        ".conformance.json", ".DS_Store", "Thumbs.db")
EXCLUSION_REASON = (
    "Python bytecode caches, the VM build directory (.build), fabric run "
    "outputs (_runs) and VERIFY scratch space (_scratch) are machine-specific "
    "artefacts, not release content. MANIFEST.json and SHA256SUMS.txt are "
    "excluded from their own inventory because they are derived from it.")


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def is_excluded(rel: str) -> bool:
    parts = rel.split("/")
    for p in parts:
        for pat in INVENTORY_EXCLUSIONS:
            if fnmatch.fnmatch(p, pat):
                return True
    return False


def walk(root: str, exclude_top: Iterable[str] = ("MANIFEST.json", "SHA256SUMS.txt")) -> List[str]:
    """Sorted relative paths of every inventoried file under root."""
    out: List[str] = []
    for dp, dns, fns in os.walk(root):
        dns[:] = sorted(d for d in dns if not is_excluded(d))
        for fn in sorted(fns):
            rel = os.path.relpath(os.path.join(dp, fn), root).replace(os.sep, "/")
            if is_excluded(rel):
                continue
            if rel in exclude_top:
                continue
            out.append(rel)
    return sorted(out)


def inventory(root: str) -> List[Dict[str, object]]:
    inv = []
    for rel in walk(root):
        p = os.path.join(root, rel)
        inv.append({"path": rel, "bytes": os.path.getsize(p), "sha256": sha256_file(p)})
    return inv


def write_sums(root: str, extra_files: Iterable[str] = ("MANIFEST.json",)) -> str:
    """Write SHA256SUMS.txt over every inventoried file plus MANIFEST.json."""
    rels = walk(root)
    for e in extra_files:
        if os.path.isfile(os.path.join(root, e)) and e not in rels:
            rels.append(e)
    rels = sorted(rels)
    lines = [f"{sha256_file(os.path.join(root, r))}  {r}" for r in rels]
    text = "\n".join(lines) + "\n"
    with open(os.path.join(root, "SHA256SUMS.txt"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def check_sums(root: str, sums_name: str = "SHA256SUMS.txt") -> Dict[str, object]:
    """Equivalent of `sha256sum -c`; also lists inventoried files not bound."""
    path = os.path.join(root, sums_name)
    ok, bad, missing = 0, [], []
    bound = set()
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            digest, rel = line[:64], line[66:] if line[64:66] in ("  ", " *") else line[65:]
            rel = rel.strip()
            bound.add(rel)
            p = os.path.join(root, rel)
            if not os.path.isfile(p):
                missing.append(rel)
                continue
            if sha256_file(p) == digest:
                ok += 1
            else:
                bad.append(rel)
    unbound = [r for r in walk(root, exclude_top=(sums_name,)) if r not in bound]
    return {"ok": ok, "bad": bad, "missing": missing, "unbound": unbound,
            "pass": not bad and not missing and not unbound}


def check_manifest_inventory(root: str) -> Dict[str, object]:
    m = json.load(open(os.path.join(root, "MANIFEST.json"), encoding="utf-8"))
    files = {f["path"]: f for f in m.get("files", [])}
    on_disk = walk(root)
    mismatched, missing = [], []
    for rel, f in files.items():
        p = os.path.join(root, rel)
        if not os.path.isfile(p):
            missing.append(rel)
            continue
        if os.path.getsize(p) != f["bytes"] or sha256_file(p) != f["sha256"]:
            mismatched.append(rel)
    extra = [r for r in on_disk if r not in files]
    return {"inventoried": len(files), "on_disk": len(on_disk), "mismatched": mismatched,
            "missing": missing, "extra": extra,
            "pass": not mismatched and not missing and not extra
                    and m.get("file_count") == len(files)}


def payload_digest(payload_root: str) -> Dict[str, object]:
    """Digest of an embedded VM package: every file, plus a tree digest."""
    files = []
    tree = hashlib.sha256()
    for dp, dns, fns in os.walk(payload_root):
        dns[:] = sorted(d for d in dns if d not in (".build", "__pycache__"))
        for fn in sorted(fns):
            if fn.endswith(".pyc"):
                continue
            p = os.path.join(dp, fn)
            rel = os.path.relpath(p, payload_root).replace(os.sep, "/")
            d = sha256_file(p)
            files.append({"path": rel, "bytes": os.path.getsize(p), "sha256": d})
            tree.update(f"{d}  {rel}\n".encode("utf-8"))
    return {"file_count": len(files), "total_bytes": sum(f["bytes"] for f in files),
            "tree_sha256": tree.hexdigest(), "files": files}


def check_payload(payload_root: str, digest_doc: Dict[str, object]) -> Dict[str, object]:
    now = payload_digest(payload_root)
    exp = {f["path"]: f["sha256"] for f in digest_doc["files"]}
    got = {f["path"]: f["sha256"] for f in now["files"]}
    changed = sorted(p for p in exp if p in got and got[p] != exp[p])
    missing = sorted(p for p in exp if p not in got)
    extra = sorted(p for p in got if p not in exp)
    return {"expected_files": len(exp), "found_files": len(got), "changed": changed,
            "missing": missing, "extra": extra,
            "tree_sha256_expected": digest_doc["tree_sha256"], "tree_sha256_found": now["tree_sha256"],
            "pass": not changed and not missing and not extra and now["tree_sha256"] == digest_doc["tree_sha256"]}


def dir_digest(root: str, skip=("__pycache__",)) -> Tuple[str, int]:
    """Deterministic digest of a directory tree (used to pin core/pacore)."""
    h = hashlib.sha256()
    n = 0
    for dp, dns, fns in os.walk(root):
        dns[:] = sorted(d for d in dns if d not in skip)
        for fn in sorted(fns):
            if fn.endswith(".pyc"):
                continue
            p = os.path.join(dp, fn)
            rel = os.path.relpath(p, root).replace(os.sep, "/")
            h.update(f"{sha256_file(p)}  {rel}\n".encode("utf-8"))
            n += 1
    return h.hexdigest(), n
