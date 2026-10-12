#!/usr/bin/env python3
"""Reseal the VEC1 substrate configuration.

The presenter cannot canonicalise substrate/config/vec1.json itself without embedding a JSON
canonicaliser for arbitrary input, so the canonical hash is computed here and stamped into
substrate/config/CONFIG_SEAL.json. The presenter reads that value and writes it into every
electron it seals; the Python control plane recomputes it live. If the two disagree, vecctl
reports configuration_current false -- run this after any edit to the substrate config.
"""
from pathlib import Path
import hashlib, json, sys

ROOT = Path(__file__).resolve().parents[1]
SUB = ROOT / 'substrate'


def canonical_sha256(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')).hexdigest()


def main():
    cfg = json.loads((SUB / 'config/vec1.json').read_text(encoding='utf-8'))
    pol = json.loads((SUB / 'config/security_policy.json').read_text(encoding='utf-8'))
    seal = {
        'schema': 'VB-JA21/VEC1_CONFIG_SEAL/1',
        'comment': ('Canonical (sorted-key, compact-separator, UTF-8) SHA-256 of config/vec1.json and '
                    'config/security_policy.json. The presenter stamps configuration_sha256 into every '
                    'electron it seals; vecctl recomputes it live. A mismatch means config was edited '
                    'without resealing -- run tools/vec_seal.py.'),
        'configuration_sha256': canonical_sha256(cfg),
        'security_policy_sha256': canonical_sha256(pol),
    }
    out = SUB / 'config/CONFIG_SEAL.json'
    previous = json.loads(out.read_text(encoding='utf-8')) if out.is_file() else {}
    out.write_text(json.dumps(seal, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    changed = previous.get('configuration_sha256') != seal['configuration_sha256']
    print('configuration_sha256   ', seal['configuration_sha256'], '(changed)' if changed else '(unchanged)')
    print('security_policy_sha256 ', seal['security_policy_sha256'])
    if changed:
        print('\nThe substrate config changed. Run tools/reseal.py so the package manifest matches,')
        print('and note that electrons sealed before this point will report configuration_current false.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
