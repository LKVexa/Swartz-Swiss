"""Package-relative node binding for the VEC1 substrate hosted inside the browser.

The browser package already ships the DF_Small helper capsule and the DF_Medium
web-engine node baseline. Rather than vendoring second copies, ``substrate/NODES.json``
points each VEC node at the container that already exists in the package, and this
module turns that map into the ``DF_<NODE>_ROOT`` environment overrides that the
DF_Fabric adapter (``dfabric.gates.locate_nodes``) honours.

A node with ``container: null`` is not vendored. It is reported unbound and BLOCKED --
never silently emulated -- which is the VEC1 fail-closed rule applied to packaging.
"""
from __future__ import annotations
import json
from pathlib import Path

SUBSTRATE_ROOT = Path(__file__).resolve().parents[1]
PACKAGE_ROOT = SUBSTRATE_ROOT.parent
BINDING_PATH = SUBSTRATE_ROOT / 'NODES.json'
REQUIRED_NODES = ('N_SMALL', 'N_MEDIUM', 'N_LARGE', 'N_XLARGE')


def load_binding():
    if not BINDING_PATH.is_file():
        return {}
    return json.loads(BINDING_PATH.read_text(encoding='utf-8')).get('nodes', {})


def _resolve(container):
    """Resolve a package-relative container path, refusing anything outside the package."""
    p = (PACKAGE_ROOT / container).resolve()
    try:
        p.relative_to(PACKAGE_ROOT)
    except ValueError:
        raise PermissionError(f'node container escapes the package root: {p}')
    return p


def node_roots():
    """Map node_id -> resolved VM root directory, for nodes whose container is present."""
    out = {}
    for nid, rec in load_binding().items():
        container = rec.get('container')
        if not container:
            continue
        try:
            cdir = _resolve(container)
        except PermissionError:
            continue
        root = cdir / 'vm' / rec['vm_dirname']
        if root.is_dir():
            out[nid] = root
    return out


def node_report():
    """Per-node binding status, including honest reasons for every unbound node."""
    binding = load_binding()
    roots = node_roots()
    report = {}
    for nid in REQUIRED_NODES:
        rec = binding.get(nid, {})
        container = rec.get('container')
        if nid in roots:
            report[nid] = {'bound_container': True, 'root': str(roots[nid]),
                           'container': container, 'vendored': bool(rec.get('vendored'))}
        elif not container:
            report[nid] = {'bound_container': False, 'container': None, 'vendored': False,
                           'reason': 'node container is not vendored in this package',
                           'drop_in': rec.get('drop_in')}
        else:
            report[nid] = {'bound_container': False, 'container': container, 'vendored': bool(rec.get('vendored')),
                           'reason': f'declared container {container!r} has no vm/{rec.get("vm_dirname")} directory'}
    return report


def apply_env(env):
    """Write DF_<NODE>_ROOT overrides into ``env`` (a dict) for every locatable node."""
    binding = load_binding()
    for nid, root in node_roots().items():
        key = binding.get(nid, {}).get('env') or ('DF_' + nid[2:] + '_ROOT')
        env[key] = str(root)
    return env
