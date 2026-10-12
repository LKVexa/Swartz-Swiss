from __future__ import annotations
import argparse, json, sys, traceback, webbrowser, os, shutil
from pathlib import Path
if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from vec1 import __version__, dfbridge, binding, presenter
    from vec1.core import ElectronStore
    from vec1.common import IntegrityError, PolicyError, atomic_json, atomic_text, read_json, utc_now
else:
    from . import __version__, dfbridge, binding, presenter
    from .core import ElectronStore
    from .common import IntegrityError, PolicyError, atomic_json, atomic_text, read_json, utc_now

ROOT = Path(__file__).resolve().parents[1]
STATE_ROOT = Path(os.environ.get('JA21_VEC1_STATE_ROOT', str(ROOT / 'runtime/state'))).resolve()
EVIDENCE_ROOT = STATE_ROOT / 'evidence'
PROFILES = ['single_process_deterministic', 'multi_thread_deterministic', 'multi_process_deterministic', 'multi_process_throughput']
FABRIC_PROGRAMS = {'replica', 'pipeline', 'bsp'}

# exit codes
EXIT_OK, EXIT_FAIL, EXIT_USAGE, EXIT_BLOCKED, EXIT_INTEGRITY, EXIT_POLICY = 0, 1, 2, 3, 4, 5

_STORE = None


def store():
    global _STORE
    if _STORE is None:
        _STORE = ElectronStore(ROOT)
    return _STORE


def emit(x, code=EXIT_OK):
    try:
        print(json.dumps(x, indent=2, sort_keys=True, default=str))
    except BrokenPipeError:
        pass
    return code


def component_map_check():
    d = read_json(ROOT / 'evidence/COMPONENT_APPLICATION_MATRIX.json')
    comps = d.get('components', [])
    ids = [x.get('component') for x in comps]
    return {'ok': len(comps) == 110 and ids == [f'{i:03d}' for i in range(1, 111)], 'count': len(comps), 'unique': len(set(ids))}


def security_policy_check():
    pol = read_json(ROOT / 'config/security_policy.json')
    cfg = store().config
    expect = {'network': 'deny', 'integrity_failure': 'fail-closed', 'node_disagreement': 'fail-closed',
              'unbound_required_node': 'fail-closed', 'cross_machine_federation': 'disabled'}
    problems = [f'{k}={pol.get(k)!r} (expected {v!r})' for k, v in expect.items() if pol.get(k) != v]
    if cfg.get('network_policy') != 'deny':
        problems.append('config network_policy is not deny')
    if cfg.get('plugin_allowlist'):
        problems.append('config plugin_allowlist is not empty')
    return {'ok': not problems, 'problems': problems, 'policy': pol}


def doctor(verbose=False):
    required = ['DF_Fabric', 'Technical_Institute', 'governance', 'config', 'evidence', 'NODES.json']
    paths = {x: (ROOT / x).exists() for x in required}
    node_binding = binding.node_report()
    paths.update({f'node:{n}': bool(r.get('bound_container')) for n, r in node_binding.items()})
    cmap = component_map_check()
    out = {'schema': 'VEC1/DOCTOR/1', 'version': __version__, 'paths': paths, 'component_map': cmap,
           'security_policy': {k: v for k, v in security_policy_check().items() if k != 'policy'},
           'python': sys.version.split()[0], 'python_ok': sys.version_info >= (3, 8), 'platform': sys.platform,
           'make': dfbridge.find_make(), 'sh': dfbridge.find_sh(), 'network_policy': 'deny'}
    tmp = EVIDENCE_ROOT / 'doctor_attest.json'
    r, a = dfbridge.attest(tmp)
    out['fabric_attest_exit'] = r['returncode']
    if r['returncode'] != 0 or not isinstance(a, dict) or 'nodes' not in a:
        out['fabric_attest_error'] = (r.get('stderr') or '')[-2000:] or 'fabric attest produced no node table'
    out['nodes'] = (a or {}).get('nodes', {}) if isinstance(a, dict) else {}
    out['bound_nodes'] = sorted(k for k, v in out['nodes'].items() if isinstance(v, dict) and v.get('bound'))
    out['unbound_nodes'] = sorted(set(['N_SMALL', 'N_MEDIUM', 'N_LARGE', 'N_XLARGE']) - set(out['bound_nodes']))
    out['node_binding'] = node_binding
    out['unvendored_nodes'] = sorted(n for n, r in node_binding.items() if not r.get('container'))
    # Packaging presence is not part of substrate health: the control plane, the fabric and
    # the in-package nodes must be sound. Unvendored nodes surface as BLOCKED at execution.
    structural = {k: v for k, v in paths.items() if not k.startswith('node:')}
    out['ok'] = all(structural.values()) and cmap['ok'] and out['security_policy']['ok'] and out['python_ok']
    out['ready_for_strict_execution'] = out['ok'] and not out['unbound_nodes']
    if verbose:
        hints = []
        for n in out['unvendored_nodes']:
            rec = node_binding.get(n, {})
            hints.append(f'{n} is not vendored in this browser package. ' + (rec.get('drop_in') or ''))
        if out['unbound_nodes']:
            hints.append('Unbound nodes: ' + ', '.join(out['unbound_nodes']) +
                         '. Vendored-but-unbuilt nodes bind after Build VEC1 Substrate.cmd.')
            if not out['make']:
                hints.append('No GNU make found: install MSYS2/MinGW (C11 + make + OpenSSL) or set DF_MAKE.')
        if not out['security_policy']['ok']:
            hints.append('Security policy drift: ' + '; '.join(out['security_policy']['problems']))
        out['hints'] = hints
    return out


def cmd_doctor(a):
    d = doctor(a.verbose)
    return emit(d, EXIT_OK if d['ok'] else EXIT_FAIL)


def cmd_build(a):
    pre = doctor(True)
    rec = dfbridge.build_required()
    out = {'schema': 'VEC1/BUILD/1', 'preflight': pre, 'build': rec}
    r, att = dfbridge.attest(EVIDENCE_ROOT / 'build_attest.json')
    out['post_attest'] = att
    out['post_attest_exit'] = r['returncode']
    bound = [1 for v in ((att or {}).get('nodes', {}) if isinstance(att, dict) else {}).values() if isinstance(v, dict) and v.get('bound')]
    out['ok'] = bool(rec.get('ok')) and len(bound) == 4
    atomic_json(EVIDENCE_ROOT / 'build_result.json', out)
    if not a.verbose_output:
        for n in (out['build'].get('nodes') or {}).values():
            if isinstance(n, dict):
                for k in ('stdout', 'stderr'):
                    if k in n and len(n[k]) > 4000:
                        n[k] = '…' + n[k][-4000:]
    return emit(out, EXIT_OK if out['ok'] else EXIT_BLOCKED)


def cmd_verify(a):
    d = doctor(True)
    audit = store().audit()
    out = {'schema': 'VEC1/VERIFY/1', 'version': __version__, 'doctor': d, 'state_audit': audit,
           'ledger_checks': {k: v['ledger'] for k, v in audit['electrons'].items()}, 'component_map': d['component_map'],
           'security_policy': security_policy_check()}
    out['static_ok'] = d['ok'] and audit['ok'] and out['security_policy']['ok']
    if not d['ready_for_strict_execution']:
        out['verdict'] = 'BLOCKED'
        out['reason'] = ('strict four-node execution requires all four adapters to bind; unbound: '
                         + ', '.join(d['unbound_nodes'])
                         + ('; not vendored in this package: ' + ', '.join(d['unvendored_nodes']) if d['unvendored_nodes'] else ''))
        out['presenter_audit'] = presenter.audit(store())
        atomic_json(EVIDENCE_ROOT / 'verify_result.json', out)
        return emit(out, EXIT_BLOCKED)
    prog = ROOT / store().config.get('default_program', 'programs/fabric_probe.pal')
    rr, res = dfbridge.fabric_run(prog, EVIDENCE_ROOT / 'verify_fabric_run.json', EVIDENCE_ROOT / 'verify_fabric_event_log.json',
                                  strict=True, programs=('replica,pipeline,bsp' if a.full else 'replica'))
    res = res if isinstance(res, dict) else {}
    out['fabric_exit'] = rr['returncode']
    out['fabric_verdict'] = res.get('verdict')
    out['replay_ok'] = bool((res.get('event_log') or {}).get('replay_self_check', {}).get('ok'))
    out['verdict'] = 'PASS' if out['static_ok'] and rr['returncode'] == 0 and out['fabric_verdict'] == 'CROSS_NODE_DIFFERENTIAL_AGREEMENT' and out['replay_ok'] else 'FAIL'
    if out['verdict'] == 'FAIL':
        out['failed_checks'] = [k for k, ok in (('static', out['static_ok']), ('fabric_exit', rr['returncode'] == 0),
                                                ('fabric_verdict', out['fabric_verdict'] == 'CROSS_NODE_DIFFERENTIAL_AGREEMENT'),
                                                ('replay', out['replay_ok'])) if not ok]
    atomic_json(EVIDENCE_ROOT / 'verify_result.json', out)
    return emit(out, EXIT_OK if out['verdict'] == 'PASS' else EXIT_FAIL)


def cmd_create(a): return emit(store().create(a.program, a.seed))
def cmd_list(a):
    s = store()
    if not a.long:
        return emit({'electrons': s.ids()})
    rows = []
    for eid in s.ids():
        try:
            o = s.load(eid, verify=False)
            rows.append({'electron_id': eid, 'generation_id': o['generation_id'], 'parent_id': o['parent_id'], 'status': o['runtime']['execution_status'],
                         'tick': o['runtime']['tick'], 'state_ok': s.check_state(o)['ok']})
        except Exception as e:
            rows.append({'electron_id': eid, 'error': str(e)})
    return emit({'electrons': rows})
def cmd_show(a): return emit(store().load(a.id))
def cmd_snapshot(a): return emit(store().snapshot(a.id))
def cmd_fork(a): return emit(store().fork(a.id))
def cmd_diff(a): return emit(store().diff(a.a, a.b))
def cmd_suspend(a): return emit(store().set_suspended(a.id, True))
def cmd_resume(a): return emit(store().set_suspended(a.id, False))
def cmd_retire(a): return emit(store().retire(a.id))
def cmd_restore(a): return emit(store().restore(a.id, a.snapshot_hash))
def cmd_equivalence(a):
    r = store().equivalence(a.a, a.b)
    return emit(r, EXIT_OK if r['equivalent'] else EXIT_FAIL)
def cmd_audit(a):
    r = store().audit()
    return emit(r, EXIT_OK if r['ok'] else EXIT_INTEGRITY)


def cmd_presenter_audit(a):
    r = presenter.audit(store())
    return emit(r, EXIT_OK if r['ok'] else EXIT_INTEGRITY)


def cmd_presenter_gc(a):
    return emit(presenter.retire_stale(store(), a.keep_session))


def cmd_nodes(a):
    rep = binding.node_report()
    out = {'schema': 'VEC1/NODE_BINDING/1', 'package_root': str(binding.PACKAGE_ROOT), 'nodes': rep,
           'bound_containers': sorted(n for n, r in rep.items() if r.get('bound_container')),
           'unvendored': sorted(n for n, r in rep.items() if not r.get('container'))}
    return emit(out, EXIT_OK if not out['unvendored'] else EXIT_BLOCKED)


def _parse_fabric_programs(text):
    items = [x.strip() for x in (text or '').split(',') if x.strip()]
    bad = [x for x in items if x not in FABRIC_PROGRAMS]
    if not items or bad:
        raise argparse.ArgumentTypeError(f'--fabric-programs must be a comma list of {sorted(FABRIC_PROGRAMS)}; got {text!r}')
    return ','.join(dict.fromkeys(items))


def _execute(eid, program_rel, profile, placement, strict, programs):
    s = store()
    obj = s.load(eid)
    s.assert_operable(obj)
    if not strict and s.config.get('strict_four_node_execution', True):
        raise PolicyError('non-strict execution is disabled by config strict_four_node_execution=true')
    program = s.resolve_program(program_rel or obj['genome']['program'])
    want = obj['genome'].get('program_sha256')
    if want and not program_rel and want != __import__('hashlib').sha256(program.read_bytes()).hexdigest():
        raise IntegrityError('genome program changed since electron creation (program_sha256 mismatch)')
    outdir = EVIDENCE_ROOT / 'fabric'
    tick = int(obj['runtime']['tick']) + 1
    rout = outdir / f'{eid}-{tick:08d}.json'
    elog = outdir / f'{eid}-{tick:08d}.eventlog.json'
    rr, res = dfbridge.fabric_run(program, rout, elog, profile=profile, placement=placement, strict=strict, programs=programs)
    if rr['returncode'] != 0:
        return None, {'exit': rr['returncode'], 'fabric': res, 'stderr': (rr.get('stderr') or '')[-4000:]}
    return s.record_execution(eid, res, program, strict=strict), None


def cmd_run(a):
    receipt, err = _execute(a.id, a.program, a.profile, a.placement, not a.non_strict, a.fabric_programs)
    if err:
        return emit({'schema': 'VEC1/RUN/1', **err}, EXIT_FAIL)
    return emit({'schema': 'VEC1/RUN/1', 'receipt': receipt, 'state': store().load(a.id)})


def dashboard_data(doc=None):
    s = store()
    comps = read_json(ROOT / 'evidence/COMPONENT_APPLICATION_MATRIX.json')['components']
    els = []
    for x in s.ids():
        try:
            els.append(s.load(x, verify=False))
        except Exception:
            continue
    return {'generated_utc': utc_now(), 'version': __version__, 'doctor': doc or doctor(False), 'electrons': els,
            'components': comps, 'state_audit': s.audit()}


def write_dashboard(doc=None):
    data = dashboard_data(doc)
    # The sealed substrate UI is copied into portable state before generating mutable data.
    dashboard = STATE_ROOT / 'dashboard'
    dashboard.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'ui', dashboard, dirs_exist_ok=True)
    payload = json.dumps(data, sort_keys=True).replace('</', '<\\/')
    atomic_text(dashboard / 'generated_state.js', 'window.VEC1_STATE=' + payload + ';\n')
    return data

def cmd_dashboard(a):
    data = write_dashboard()
    if a.open:
        try:
            webbrowser.open((STATE_ROOT / 'dashboard/index.html').as_uri())
        except Exception:
            pass
    return emit({'written': str(STATE_ROOT / 'dashboard/generated_state.js'), 'electrons': len(data['electrons']),
                 'ready_for_strict_execution': data['doctor']['ready_for_strict_execution']})


def cmd_demo(a):
    d = doctor(False)
    if not d['ready_for_strict_execution']:
        return emit({'verdict': 'BLOCKED', 'reason': 'Run BUILD_VEC1 first so all four node adapters bind.', 'unbound_nodes': d['unbound_nodes']}, EXIT_BLOCKED)
    s = store()
    obj = s.create(seed='vec1-demo')
    eid = obj['electron_id']
    receipt, err = _execute(eid, None, 'single_process_deterministic', 'static', True, 'replica')
    if err:
        return emit({'schema': 'VEC1/DEMO/1', 'verdict': 'FAIL', 'electron_id': eid, **err}, EXIT_FAIL)
    snap = s.snapshot(eid)
    child = s.fork(eid)
    eq = s.equivalence(eid, child['electron_id'])
    audit = s.audit()
    write_dashboard(d)
    ok = eq['equivalent'] and audit['ok']
    return emit({'schema': 'VEC1/DEMO/1', 'verdict': 'PASS' if ok else 'FAIL', 'electron_id': eid, 'receipt': receipt,
                 'snapshot_hash': snap['snapshot_hash'], 'child_id': child['electron_id'], 'clone_equivalence': eq,
                 'state_audit_ok': audit['ok'], 'dashboard': 'ui/index.html'}, EXIT_OK if ok else EXIT_FAIL)


def build_parser():
    ap = argparse.ArgumentParser(prog='vecctl', description='VEC1 virtual-electron substrate control plane',
                                 epilog='exit codes: 0 ok, 1 fail, 2 usage, 3 blocked, 4 integrity failure, 5 policy refusal')
    ap.add_argument('--version', action='version', version=f'vecctl {__version__}')
    sp = ap.add_subparsers(dest='cmd', required=True)
    p = sp.add_parser('doctor', help='preflight: paths, component map, policy, node binding'); p.add_argument('--verbose', action='store_true'); p.set_defaults(fn=cmd_doctor)
    p = sp.add_parser('build', help='build native node products and re-attest'); p.add_argument('--verbose-output', action='store_true', help='do not truncate compiler output'); p.set_defaults(fn=cmd_build)
    p = sp.add_parser('verify', help='static checks + strict fabric run'); p.add_argument('--full', action='store_true', help='exercise replica, pipeline and BSP'); p.set_defaults(fn=cmd_verify)
    p = sp.add_parser('audit', help='verify every electron state hash, ledger chain, base snapshot and receipt'); p.set_defaults(fn=cmd_audit)
    p = sp.add_parser('create'); p.add_argument('--program'); p.add_argument('--seed'); p.set_defaults(fn=cmd_create)
    p = sp.add_parser('list'); p.add_argument('--long', '-l', action='store_true'); p.set_defaults(fn=cmd_list)
    p = sp.add_parser('show'); p.add_argument('id'); p.set_defaults(fn=cmd_show)
    p = sp.add_parser('run'); p.add_argument('id'); p.add_argument('--program'); p.add_argument('--profile', default='single_process_deterministic', choices=PROFILES)
    p.add_argument('--placement', default='static', choices=['static', 'dynamic']); p.add_argument('--non-strict', action='store_true', help='refused while config strict_four_node_execution is true')
    p.add_argument('--fabric-programs', default='replica', type=_parse_fabric_programs, help='comma list of replica,pipeline,bsp'); p.set_defaults(fn=cmd_run)
    for name, fn in (('snapshot', cmd_snapshot), ('fork', cmd_fork), ('suspend', cmd_suspend), ('resume', cmd_resume), ('retire', cmd_retire)):
        p = sp.add_parser(name); p.add_argument('id'); p.set_defaults(fn=fn)
    p = sp.add_parser('diff'); p.add_argument('a'); p.add_argument('b'); p.set_defaults(fn=cmd_diff)
    p = sp.add_parser('restore'); p.add_argument('id'); p.add_argument('snapshot_hash'); p.set_defaults(fn=cmd_restore)
    p = sp.add_parser('equivalence'); p.add_argument('a'); p.add_argument('b'); p.set_defaults(fn=cmd_equivalence)
    p = sp.add_parser('presenter-audit', help='audit only the electrons written by the JA21 Omni Bin presenter'); p.set_defaults(fn=cmd_presenter_audit)
    p = sp.add_parser('presenter-gc', help='retire presenter electrons left by an unclean presenter shutdown'); p.add_argument('--keep-session'); p.set_defaults(fn=cmd_presenter_gc)
    p = sp.add_parser('nodes', help='show how each VEC node is bound to a container in this package'); p.set_defaults(fn=cmd_nodes)
    p = sp.add_parser('dashboard'); p.add_argument('--open', action='store_true'); p.set_defaults(fn=cmd_dashboard)
    p = sp.add_parser('demo'); p.set_defaults(fn=cmd_demo)
    return ap


def main(argv=None):
    a = build_parser().parse_args(argv)
    try:
        return a.fn(a)
    except IntegrityError as e:
        return emit({'error': 'IntegrityError', 'message': str(e), 'verdict': 'BLOCKED'}, EXIT_INTEGRITY)
    except (PolicyError, PermissionError) as e:
        return emit({'error': type(e).__name__, 'message': str(e)}, EXIT_POLICY)
    except (ValueError, FileNotFoundError) as e:
        return emit({'error': type(e).__name__, 'message': str(e)}, EXIT_USAGE)
    except Exception as e:
        return emit({'error': type(e).__name__, 'message': str(e), 'trace': traceback.format_exc().splitlines()[-8:]}, EXIT_FAIL)


if __name__ == '__main__':
    raise SystemExit(main())
