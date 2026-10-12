#!/usr/bin/env python3
"""Verify every static package file against PACKAGE_MANIFEST.json.

Exit 0 PASS, 2 FAIL. Files present on disk but absent from the manifest are reported as
`unmanifested` (warning; use --strict to fail on them). Mutable and build-artifact
exclusions from the manifest are honoured."""
from pathlib import Path, PurePosixPath
import argparse, fnmatch, hashlib, json, sys
ROOT = Path(__file__).resolve().parent
MAN = ROOT / 'PACKAGE_MANIFEST.json'


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def excluded(rel, patterns):
    for pat in patterns:
        if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(rel, pat.replace('**/', '')) or PurePosixPath(rel).match(pat):
            return True
        if pat.endswith('/**') and rel.startswith(pat[:-3] + '/'):
            return True
    return False


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--strict', action='store_true', help='fail when unmanifested files are present')
    a = ap.parse_args(argv)
    data = json.loads(MAN.read_text(encoding='utf-8'))
    bad = []
    listed = set()
    for item in data['files']:
        listed.add(item['path'])
        p = ROOT / item['path']
        if not p.is_file():
            bad.append({'path': item['path'], 'error': 'missing'})
            continue
        got = sha256(p)
        if got != item['sha256'] or p.stat().st_size != item['bytes']:
            bad.append({'path': item['path'], 'error': 'mismatch', 'expected_sha256': item['sha256'], 'actual_sha256': got,
                        'expected_bytes': item['bytes'], 'actual_bytes': p.stat().st_size})
    patterns = list(data.get('mutable_exclusions', [])) + list(data.get('build_artifact_exclusions', [])) + ['PACKAGE_MANIFEST.json', 'SHA256SUMS.txt']
    extras = []
    for p in ROOT.rglob('*'):
        if p.is_file():
            rel = p.relative_to(ROOT).as_posix()
            if rel not in listed and not excluded(rel, patterns):
                extras.append(rel)
    verdict = 'PASS' if not bad and not (a.strict and extras) else 'FAIL'
    out = {'schema': 'VEC1/PACKAGE_VERIFY/1', 'version': data.get('version'), 'verdict': verdict, 'checked': len(data['files']),
           'mutable_exclusions': data.get('mutable_exclusions', []), 'failures': bad,
           'unmanifested_count': len(extras), 'unmanifested_sample': sorted(extras)[:50],
           'note': 'unmanifested files are usually native build products (make targets); run with --strict to treat them as failures'}
    try:
        print(json.dumps(out, indent=2))
    except BrokenPipeError:
        pass
    return 0 if verdict == 'PASS' else 2


if __name__ == '__main__':
    raise SystemExit(main())
