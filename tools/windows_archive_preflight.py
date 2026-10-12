#!/usr/bin/env python3
"""Windows filesystem compatibility preflight for the JA21 payload.

The build host may be case-sensitive while the target Windows volume is normally case-insensitive.
Reject package trees that cannot be materialized losslessly on Windows before they are archived.
"""
from __future__ import annotations
from pathlib import Path
import argparse
import json
import re
import unicodedata

_RESERVED = {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}
_FORBIDDEN = set('<>:"|?*')


def _utf16_units(s: str) -> int:
    return len(s.encode("utf-16-le")) // 2


def _canonical_rel(rel: str) -> str:
    # Windows default filesystems compare paths case-insensitively. NFC prevents a package from
    # relying on canonically equivalent Unicode spellings being distinct.
    return unicodedata.normalize("NFC", rel.replace("/", "\\")).casefold()


def _component_errors(component: str) -> list[str]:
    errs: list[str] = []
    if not component or component in {".", ".."}:
        errs.append("empty-or-relative-component")
        return errs
    if component.endswith(" ") or component.endswith("."):
        errs.append("trailing-dot-or-space")
    if any(c in _FORBIDDEN or ord(c) < 32 for c in component):
        errs.append("forbidden-windows-character")
    stem = component.split(".", 1)[0].rstrip(" .").upper()
    if stem in _RESERVED:
        errs.append("reserved-windows-device-name")
    if _utf16_units(component) > 255:
        errs.append("path-component-over-255-utf16-units")
    return errs


def scan_relative_paths(relative_paths: list[str]) -> list[dict[str, object]]:
    failures: list[dict[str, object]] = []
    by_key: dict[str, str] = {}
    for raw in sorted(set(relative_paths)):
        rel = raw.replace("\\", "/").strip("/")
        if not rel:
            continue
        key = _canonical_rel(rel)
        previous = by_key.get(key)
        if previous is not None and previous != rel:
            failures.append({"kind": "case-or-unicode-collision", "path": rel, "collides_with": previous})
        else:
            by_key[key] = rel
        for component in rel.split("/"):
            for err in _component_errors(component):
                failures.append({"kind": err, "path": rel, "component": component})
    return failures


def scan_tree(root: Path) -> list[dict[str, object]]:
    root = root.resolve()
    paths = [p.relative_to(root).as_posix() for p in root.rglob("*")]
    return scan_relative_paths(paths)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", nargs="?", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    root = Path(a.root)
    failures = scan_tree(root)
    result = {
        "schema": "VB-JA21/WINDOWS_PATH_PREFLIGHT/2",
        "root": str(root),
        "verdict": "PASS" if not failures else "FAIL",
        "failures": failures,
    }
    if a.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif failures:
        print("WINDOWS PATH PREFLIGHT FAIL")
        for f in failures:
            print("-", json.dumps(f, ensure_ascii=False, sort_keys=True))
    else:
        print("Windows path preflight PASS: no case/Unicode collisions or incompatible path components")
    return 0 if not failures else 2


if __name__ == "__main__":
    raise SystemExit(main())
