"""Audit saved refinement cases and prove the independent checker rejects corruption.

This script imports only the project's independent stdlib Python checker, not
the production solver. Run after generate-relativity-cases.cjs and the checker.
"""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
CHECKER_PATH = HERE / 'independent-kerr-check.py'
spec = importlib.util.spec_from_file_location('independent_kerr_check', CHECKER_PATH)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def main():
    case_path = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'independent-relativity-cases.json'
    document = json.loads(case_path.read_text(encoding='utf-8-sig'))
    source_path = HERE.parent / document['source']['path']
    source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
    checker.require(document['source']['sha256'] == source_hash, 'Case source hash differs')
    cases = document['cases']
    refinement = sorted((case for case in cases if case['name'].startswith('refine-b6-')),
                        key=lambda case: -case['input']['tolerance'])
    checker.require(len(refinement) >= 3, 'Need at least three refinement cases')
    exact = checker.schwarzschild_bending(1, 6)
    rows = []
    previous = None
    for case in refinement:
        ray = case['output']
        checker.check_case(case, 1e-6)
        row = {'tolerance': ray['parameters']['tolerance'], 'internalTolerance': ray['diagnostics']['internalTolerance'],
               'outcome': ray['outcome'], 'acceptedSteps': ray['diagnostics']['acceptedSteps'],
               'rejectedSteps': ray['diagnostics']['rejectedSteps'], 'deflectionRadians': ray['deflectionRadians'],
               'absoluteIndependentAngleError': abs(ray['deflectionRadians'] - exact),
               'previousRefinementAngleDifference': None if previous is None else abs(ray['deflectionRadians'] - previous),
               'endpointRadius': ray['points'][-1]['r'], 'endpointPhi': ray['points'][-1]['phi']}
        checker.require(row['outcome'] == 'escaped', 'Refinement changed the off-critical scattering outcome')
        checker.require(row['absoluteIndependentAngleError'] <= 1e-6, 'Refinement exceeds angle target')
        rows.append(row)
        previous = ray['deflectionRadians']
    checker.require(rows[-1]['absoluteIndependentAngleError'] <= rows[0]['absoluteIndependentAngleError'],
                    'Tightest refinement did not improve on the loosest reference comparison')
    rejection_results = []
    normal = next(case for case in refinement if case['input']['tolerance'] == 1e-9)
    critical = next(case for case in cases if case['name'] == 'exact-separatrix-1-tol1e-9')

    def reject(name, original, mutation):
        bad = copy.deepcopy(original)
        mutation(bad)
        try:
            checker.check_case(bad, 1e-6)
        except (ValueError, KeyError, TypeError) as error:
            rejection_results.append({'name': name, 'rejected': True, 'reason': str(error)})
        else:
            raise ValueError('Corrupted evidence was accepted: ' + name)

    reject('altered-coordinate', normal, lambda c: c['output']['points'][1].__setitem__('x', c['output']['points'][1]['x'] + .01))
    reject('altered-radial-velocity', normal, lambda c: c['output']['points'][1].__setitem__('duDmino', c['output']['points'][1]['duDmino'] * 1.01))
    reject('false-capture-on-separatrix', critical, lambda c: c['output'].__setitem__('outcome', 'captured'))
    reject('deleted-integration-limit', normal, lambda c: c['output']['parameters'].pop('maxMino'))
    reject('wrong-explicit-input', normal, lambda c: c['input'].__setitem__('maxMino', .001))
    reject('falsified-deflection', normal, lambda c: c['output'].__setitem__('deflectionRadians', c['output']['deflectionRadians'] + .01))
    reject('nonfinite-coordinate', normal, lambda c: c['output']['points'][1].__setitem__('phi', float('nan')))
    tampered_source = {'schema': document['schema'], 'source': {'sha256': '0' * 64}, 'cases': [normal]}
    result = subprocess.run([sys.executable, '-B', str(CHECKER_PATH), '-'],
                            input=json.dumps(tampered_source).encode('utf-8'), stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, check=False)
    checker.require(result.returncode != 0 and b'Output source hash differs' in result.stderr,
                    'Wrong source identity was not rejected by the actual checker entry point')
    rejection_results.append({'name': 'wrong-source-hash', 'rejected': True,
                              'reason': json.loads(result.stderr)['error']})
    report = {'schema': 'GFM-Kerr-evidence-audit/1', 'passed': True,
              'source': {'path': document['source']['path'], 'sha256': source_hash},
              'inputs': {'path': str(case_path), 'sha256': hashlib.sha256(case_path.read_bytes()).hexdigest()},
              'checkerSha256': hashlib.sha256(CHECKER_PATH.read_bytes()).hexdigest(),
              'auditSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'convergence': {'observable': 'Tail-corrected complete equatorial Schwarzschild b=6 scattering angle',
                              'independentQuadratureRadians': exact, 'angleTargetRadians': 1e-6,
                              'rows': rows, 'passed': True,
                              'scope': 'This observable and case only. Plateau at loose tolerances follows the internal-tolerance cap; no global trajectory error bound is claimed.'},
              'negativeChecks': rejection_results, 'negativeChecksPassed': len(rejection_results),
              'scope': 'Checker credibility and case-specific numerical refinement, not empirical validation.'}
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, UnicodeError) as error:
        print(json.dumps({'passed': False, 'error': str(error)}), file=sys.stderr)
        sys.exit(1)
