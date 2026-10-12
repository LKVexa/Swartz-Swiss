"""Independent stdlib Kerr-output verification, not empirical validation.

Reads a null ray, bundle, physics recording, a list, or
{schema:'GFM-Kerr-independent-cases/1', cases:[{name,output}], source:{sha256}}.
Reconstructs the metric from exported Mino velocities and performs an
independent regularized Schwarzschild bending quadrature. It imports no
production code. Example: python independent-kerr-check.py --self-test cases.json
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

MAX_BYTES = 64 * 1024 * 1024


def require(ok, message):
    if not ok:
        raise ValueError(message)


def number(value, name):
    require(type(value) in (int, float) and math.isfinite(value), name + ' must be finite numeric data')
    return float(value)


def close(value, expected, name, tolerance=1e-10):
    value = number(value, name)
    require(abs(value - expected) <= tolerance * max(1, abs(expected)), name + ' differs from independent reference')


def simpson(function, low, high, tolerance=1e-12):
    """Adaptive Simpson with a bounded recursion depth; no production quadrature."""
    def recurse(a, b, fa, fm, fb, whole, budget, depth):
        mid = (a + b) / 2
        left_mid, right_mid = (a + mid) / 2, (mid + b) / 2
        fl, fr = function(left_mid), function(right_mid)
        left = (mid - a) * (fa + 4 * fl + fm) / 6
        right = (b - mid) * (fm + 4 * fr + fb) / 6
        error = left + right - whole
        if abs(error) <= 15 * budget:
            return left + right + error / 15
        require(depth > 0, 'Independent quadrature recursion exhausted')
        return recurse(a, mid, fa, fl, fm, left, budget / 2, depth - 1) + recurse(mid, b, fm, fr, fb, right, budget / 2, depth - 1)
    mid = (low + high) / 2
    fa, fm, fb = function(low), function(mid), function(high)
    whole = (high - low) * (fa + 4 * fm + fb) / 6
    return recurse(low, high, fa, fm, fb, whole, tolerance, 25)


def schwarzschild_bending(M, b):
    """Full infinity-to-infinity angle; turning-point square root is removed."""
    b = abs(b)
    require(M >= 0 and b > 3 * math.sqrt(3) * M, 'Scattering quadrature needs supercritical impact')
    if M == 0:
        turning_u = 1 / b
    else:
        low, high = 0.0, 1 / (3 * M)
        for _ in range(90):
            mid = (low + high) / 2
            if 1 - b * b * mid * mid + 2 * M * b * b * mid ** 3 > 0:
                low = mid
            else:
                high = mid
        turning_u = (low + high) / 2
    def integrand(t):
        u = turning_u * (1 - t * t)
        bracket = turning_u + u - 2 * M * (turning_u ** 2 + turning_u * u + u ** 2)
        require(bracket > 0, 'Invalid regularized scattering integrand')
        return 1 / math.sqrt(bracket)
    # Near the unstable double root the angle is ill-conditioned. Do not force
    # recursive local budgets below floating-point resolution in that case;
    # this reference budget remains much tighter than the 1e-6 comparison.
    near_separatrix = M > 0 and b / (3 * math.sqrt(3) * M) - 1 < 1e-6
    quadrature_budget = 1e-9 if near_separatrix else 1e-12
    return 4 * math.sqrt(turning_u) * simpson(integrand, 0, 1, quadrature_budget) - math.pi


def analytic_reference(value):
    M = number(value['M'], 'M')
    spin = number(value['spin'], 'spin')
    require(M > 0 and 0 <= spin <= 1, 'Invalid analytic Kerr parameters')
    a = spin * M
    root = math.sqrt(max(0, M * M - a * a))
    close(value['a'], a, 'a')
    close(value['rPlus'], M + root, 'Outer horizon')
    close(value['rMinus'], M - root, 'Inner horizon')
    close(value['omegaH'], a / ((M + root) ** 2 + a * a), 'Horizon angular velocity')
    for key, expected in [('horizon', 2 * M), ('photonSphere', 3 * M), ('criticalImpact', 3 * math.sqrt(3) * M), ('weakDeflectionCoefficient', 4 * M)]:
        close(value['schwarzschild'][key], expected, 'Schwarzschild ' + key)
    radii = {}
    for name, sign in [('prograde', -1), ('retrograde', 1)]:
        r = 2 * M * (1 + math.cos((2 / 3) * math.acos(sign * spin)))
        close(value['equatorialPhotonRadii'][name], r, 'Equatorial orbit ' + name)
        radii[name] = r
        if spin < 1 or name == 'retrograde':
            L = a + (1 if name == 'prograde' else -1) * math.sqrt(r ** 3 / M)
            radial = (r * r + a * a - a * L) ** 2 - (r * r - 2 * M * r + a * a) * (L - a) ** 2
            derivative = 4 * r * (r * r + a * a - a * L) - (2 * r - 2 * M) * (L - a) ** 2
            require(abs(radial) <= 1e-10 * max(M ** 4, r ** 4), 'Photon orbit R=0 fails')
            require(abs(derivative) <= 1e-10 * max(M ** 3, r ** 3), 'Photon orbit derivative fails')
        if 'equatorialCriticalImpact' in value:
            expected = a + (1 if name == 'prograde' else -1) * math.sqrt(r ** 3 / M)
            close(value['equatorialCriticalImpact'][name], expected, 'Equatorial critical impact ' + name)
    return {'kind': 'analytic-reference', 'M': M, 'spin': spin, 'photonRadii': radii, 'passed': True}


def point_reference(point, parameters, constants):
    M, a = parameters['M'], parameters['M'] * parameters['spin']
    r = number(point['r'], 'r')
    mu = number(point['mu'], 'mu')
    u = number(point['u'], 'u')
    ur = number(point['duDmino'], 'duDmino')
    mur = number(point['dmuDmino'], 'dmuDmino')
    phi = number(point['phi'], 'phi')
    L, Q = constants['Lz'], constants['carterQ']
    sin2 = 1 - mu * mu
    sigma, delta = r * r + a * a * mu * mu, r * r - 2 * M * r + a * a
    require(r > M + math.sqrt(max(0, M * M - a * a)) and sin2 > 0 and delta > 0, 'Point left regular Kerr exterior')
    close(u, 1 / r, 'Inverse radius')
    close(point['theta'], math.acos(mu), 'Polar angle')
    transverse = math.sqrt((r * r + a * a) * sin2)
    for key, expected in [('x', transverse * math.cos(phi)), ('y', r * mu), ('z', transverse * math.sin(phi))]:
        close(point[key], expected, 'Display coordinate ' + key)
    P = r * r + a * a - a * L
    R = P * P - delta * (Q + (L - a) ** 2)
    Theta = Q + a * a * mu * mu - L * L * mu * mu / sin2
    V, U = u ** 4 * R, sin2 * Theta
    radial_raw, polar_raw = ur * ur - V, mur * mur - U
    radial = abs(radial_raw) / max(1, abs(V), ur * ur)
    polar = abs(polar_raw) / max(1, abs(U), mur * mur)
    close(point['radialConstraintResidual'], radial_raw, 'Reported radial residual', 2e-9)
    close(point['polarConstraintResidual'], polar_raw, 'Reported polar residual', 2e-9)
    # Reconstruct affine momentum in r form, independently of the production u RHS.
    tprime = (r * r + a * a) * P / delta + a * (L - a * sin2)
    phiprime = a * P / delta + L / sin2 - a
    pt, pp = tprime / sigma, phiprime / sigma
    pr, ptheta = -ur / (u * u * sigma), -mur / (math.sqrt(sin2) * sigma)
    gtt, gtp = -1 + 2 * M * r / sigma, -2 * M * a * r * sin2 / sigma
    gpp = ((r * r + a * a) ** 2 - delta * a * a * sin2) * sin2 / sigma
    E = -(gtt * pt + gtp * pp)
    momentum_L = gtp * pt + gpp * pp
    momentum_Q = (sigma * ptheta) ** 2 - mu * mu * (a * a * E * E - momentum_L ** 2 / sin2)
    terms = [gtt * pt * pt, 2 * gtp * pt * pp, gpp * pp * pp, sigma * pr * pr / delta, sigma * ptheta * ptheta]
    null_raw = math.fsum(terms)
    null = abs(null_raw) / max(1, *(abs(term) for term in terms))
    reconstruction = point['reconstruction']
    # Near the BL horizon large signed terms cancel. Compare the raw reported
    # residual on its arithmetic conditioning scale, and constrain nullness
    # separately with the normalized independent residual below.
    cancellation_budget = 64 * sys.float_info.epsilon * math.fsum(abs(term) for term in terms) + 2e-9
    require(abs(number(reconstruction['nullResidual'], 'Reported raw null residual') - null_raw) <= cancellation_budget,
            'Reported raw null residual exceeds its floating-point cancellation budget')
    for key, expected in [('E', E), ('Lz', momentum_L), ('carterQ', momentum_Q), ('nullNormalizedResidual', null)]:
        close(reconstruction[key], expected, 'Reported momentum ' + key, 2e-9)
    return {'radial': radial, 'polar': polar, 'null': null,
            'energy': abs(E - 1), 'Lz': abs(momentum_L - L) / max(1, abs(L)),
            'carter': abs(momentum_Q - Q) / max(1, abs(Q))}


def critical_reference(ray):
    """Recompute the stationary radial potential in dimensionless x=M/r."""
    p, constants = ray['parameters'], ray['constants']
    M, spin = p['M'], p['spin']
    ell, eta = constants['Lz'] / M, constants['carterQ'] / (M * M)
    A, K = spin * spin - ell * ell - eta, (ell - spin) ** 2 + eta
    quadratic, linear, constant = -4 * spin * spin * eta, 6 * K, 2 * A
    if quadratic == 0:
        roots = [-constant / linear] if linear else []
    else:
        discriminant = linear * linear - 4 * quadratic * constant
        roots = [] if discriminant < 0 else [(-linear - math.sqrt(discriminant)) / (2 * quadratic),
                                             (-linear + math.sqrt(discriminant)) / (2 * quadratic)]
    horizon = M * (1 + math.sqrt(max(0, 1 - spin * spin)))
    inward = p['radialDirection'] == 'inward'
    low, high = (M / p['observerRadius'], M / horizon) if inward else (M / p['escapeRadius'], M / p['observerRadius'])
    range_roundoff = 128 * sys.float_info.epsilon * max(1, abs(low), abs(high))
    normalized_band = max(64 * sys.float_info.epsilon, 100 * min(p['tolerance'] * .02, 2e-9))
    roots = sorted(x for x in roots if x > 0 and low - range_roundoff <= x <= high + range_roundoff)
    reported = ray['diagnostics']['criticality']
    close(reported['normalizedBand'], normalized_band, 'Critical normalized band', 1e-14)
    close(reported['rangeRoundoff'], range_roundoff / M, 'Critical root-range roundoff', 1e-14)
    require(len(reported['stationaryPoints']) == len(roots), 'Stationary root list differs from independent quadratic')
    candidates = []
    for x, point in zip(roots, reported['stationaryPoints']):
        terms = [1, A * x * x, 2 * K * x ** 3, -spin * spin * eta * x ** 4]
        potential, scale = math.fsum(terms), max(1, math.fsum(abs(term) for term in terms))
        second = M * M * (2 * A + 12 * K * x - 12 * spin * spin * eta * x * x)
        absolute_band = normalized_band * scale
        distance = math.sqrt(2 * absolute_band / max(abs(second), 1e-20 * M * M))
        near = abs(potential) <= absolute_band
        for key, expected in [('u', x / M), ('r', M / x), ('potential', potential),
                              ('potentialScale', scale), ('normalizedPotential', potential / scale),
                              ('secondDerivative', second), ('absoluteBand', absolute_band), ('guardDistance', distance)]:
            close(point[key], expected, 'Critical stationary ' + key, 2e-10)
        require(point['nearCritical'] is near, 'Near-critical classification differs from independent potential')
        if near:
            candidates.append({'u': x / M, 'distance': distance, 'normalizedGap': abs(potential) / scale})
    if not inward:
        candidates.reverse()
    require(reported['isNearCritical'] is bool(candidates), 'Criticality flag differs from independent roots')
    if candidates:
        require(ray['outcome'] not in ('captured', 'escaped', 'horizon-limit'), 'Ambiguous separatrix was labeled resolved')
        selected = candidates[0]
        close(reported['selected']['u'], selected['u'], 'Selected critical root')
        boundary = selected['u'] + (-1 if inward else 1) * selected['distance']
        initial = ray['points'][0]['u']
        if inward and initial < boundary:
            require(all(point['u'] <= boundary + 2e-10 / M for point in ray['points']), 'Critical inward ray crossed its ambiguity guard')
        if not inward and initial > boundary:
            require(all(point['u'] >= boundary - 2e-10 / M for point in ray['points']), 'Critical outward ray crossed its ambiguity guard')
    else:
        require(ray['outcome'] != 'critical-limit', 'Critical-limit lacks an independently near-critical root')
    return {'isNearCritical': bool(candidates), 'normalizedBand': normalized_band,
            'candidateNormalizedGaps': [point['normalizedGap'] for point in candidates]}


def check_ray(ray, limit):
    require(ray.get('schema') == 'GFM-Kerr-null-ray/1', 'Ray schema differs')
    parameters, constants = ray['parameters'], ray['constants']
    for key in ('M', 'spin', 'observerRadius', 'escapeRadius', 'inclination', 'phi0', 'tolerance', 'horizonGuard',
                'maxStep', 'maxMino', 'maxSteps', 'maxPoints'):
        number(parameters[key], 'Parameter ' + key)
    for key in ('E', 'Lz', 'carterQ'):
        number(constants[key], 'Constant ' + key)
    require(constants['E'] == 1, 'Energy normalization differs')
    require(parameters['M'] > 0 and 0 <= parameters['spin'] <= 1, 'Invalid ray mass/spin')
    points = ray['points']
    require(isinstance(points, list) and 1 <= len(points) <= 5000, 'Invalid bounded point list')
    require(type(parameters['maxSteps']) is int and type(parameters['maxPoints']) is int,
            'Exported step/point budgets must be integers')
    require(10 <= parameters['maxSteps'] <= 50000 and 4 <= parameters['maxPoints'] <= 5000,
            'Exported step/point budgets lie outside implementation bounds')
    require(len(points) <= parameters['maxPoints'], 'Exported point budget was exceeded')
    maxima = dict.fromkeys(('radial', 'polar', 'null', 'energy', 'Lz', 'carter'), 0.0)
    last = {'mino': -1, 'affine': -1, 't': -1}
    for index, point in enumerate(points):
        for key in ('mino', 'affine', 't'):
            value = number(point[key], key)
            require(value >= last[key] - 1e-12, key + ' is not monotonic')
            last[key] = value
        try:
            reference = point_reference(point, parameters, constants)
        except ValueError as error:
            raise ValueError(str(ray.get('id')) + ' point ' + str(index) + ': ' + str(error)) from error
        for key, value in reference.items():
            maxima[key] = max(maxima[key], value)
    require(all(value <= limit for value in maxima.values()), 'Ray exceeds independent constraint criterion: ' + json.dumps(maxima))
    close(points[0]['r'], parameters['observerRadius'], 'Initial radius')
    close(points[0]['theta'], parameters['inclination'], 'Initial inclination')
    close(points[0]['phi'], parameters['phi0'], 'Initial azimuth')
    outcome = ray['outcome']
    require(outcome in ('captured', 'escaped', 'critical-limit', 'horizon-limit', 'polar-axis-limit', 'integration-limit', 'step-limit'), 'Unknown ray outcome')
    criticality = critical_reference(ray)
    if outcome == 'escaped':
        close(points[-1]['r'], parameters['escapeRadius'], 'Escaped endpoint radius', 1e-9)
        require(points[-1]['duDmino'] < 0, 'Escape endpoint is not outward')
    if outcome in ('captured', 'horizon-limit'):
        M, a = parameters['M'], parameters['spin'] * parameters['M']
        horizon = M + math.sqrt(max(0, M * M - a * a))
        close(points[-1]['r'], horizon + parameters['horizonGuard'], 'Horizon guard endpoint', 1e-9)
        require(points[-1]['duDmino'] > 0, 'Horizon endpoint is not inward')
        if outcome == 'captured':
            require(horizon * horizon + a * a - a * constants['Lz'] > 0, 'Future-horizon condition fails')
    bending_error, bending_reference = None, None
    complete_scattering = (outcome == 'escaped' and parameters['radialDirection'] == 'inward' and
                           ray['diagnostics']['radialTurns'] > 0 and abs(points[0]['mu']) < 1e-14 and
                           constants['carterQ'] == 0 and constants['Lz'] != 0)
    if not complete_scattering:
        require(ray['deflectionRadians'] is None, 'Incomplete/non-equatorial path reports a scattering angle')
    elif parameters['spin'] == 0:
        expected = schwarzschild_bending(parameters['M'], constants['Lz'])
        bending_reference = expected
        observed = number(ray['deflectionRadians'], 'Deflection')
        bending_error = abs(observed - expected)
        require(bending_error <= limit * max(1, abs(expected)), 'Schwarzschild bending differs from independent full quadrature')
    diagnostics = ray['diagnostics']
    require(diagnostics['acceptedSteps'] + diagnostics['rejectedSteps'] == diagnostics['totalSteps'],
            'Step counts do not add up')
    require(diagnostics['totalSteps'] <= parameters['maxSteps'], 'Exported step budget was exceeded')
    require(points[-1]['mino'] <= parameters['maxMino'] + 1e-10 / parameters['M'],
            'Exported Mino interval was exceeded')
    diagnostic_keys = {'radial': 'maxRadialResidual', 'polar': 'maxPolarResidual', 'null': 'maxNormalizedNullResidual',
                       'energy': 'maxEnergyReconstructionError', 'Lz': 'maxLzReconstructionError', 'carter': 'maxCarterReconstructionError'}
    for key, reported_key in diagnostic_keys.items():
        reported = number(diagnostics[reported_key], reported_key)
        require(reported >= -1e-16 and reported + 2e-9 >= maxima[key], 'Reported maximum omits a sampled error: ' + reported_key)
        require(reported <= limit, 'Reported accepted-state error exceeds independent criterion: ' + reported_key)
    require(diagnostics.get('passed') is True, 'Production numerical constraint checks did not pass')
    return {'kind': 'null-ray', 'id': ray['id'], 'outcome': outcome, 'pointsChecked': len(points),
            'maxErrors': maxima, 'independentBendingError': bending_error,
            'independentBendingReference': bending_reference,
            'normalizedIndependentBendingError': None if bending_error is None else bending_error / max(1, abs(bending_reference)),
            'initialErrors': point_reference(points[0], parameters, constants),
            'criticality': criticality, 'reportedGlobalCriterion': diagnostics['criterion'], 'passed': True}


def check_output(value, limit):
    require(isinstance(value, dict), 'Expected an output object')
    if value.get('schema') == 'GFM-Kerr-null-ray/1':
        return [check_ray(value, limit)]
    if value.get('schema') == 'GFM-Kerr-physics-recording/1':
        require(value.get('fullSolverResult') is not None, 'Recording has no completed solver result')
        return check_output(value['fullSolverResult'], limit)
    if value.get('schema') == 'GFM-Kerr-null-bundle/1':
        rays = value['trajectories']
        require(isinstance(rays, list) and 4 <= len(rays) <= 64, 'Invalid bounded bundle')
        checked = [check_ray(ray, limit) for ray in rays]
        summary = value['diagnostics']
        for name, count in [('captured', sum(ray['outcome'] == 'captured' for ray in rays)),
                            ('escaped', sum(ray['outcome'] == 'escaped' for ray in rays)),
                            ('unresolved', sum(ray['outcome'] not in ('captured', 'escaped') for ray in rays))]:
            require(summary[name] == count, 'Bundle classification counts differ')
        for ray in rays:
            require(ray['parameters']['spin'] == value['parameters']['spin'], 'Bundle spin differs from a ray')
            impact = ray['impactCoordinates']
            angle = ray['parameters']['inclination']
            alpha, beta, a = impact['alpha'], impact['beta'], ray['parameters']['M'] * ray['parameters']['spin']
            close(ray['constants']['Lz'], -alpha * math.sin(angle), 'Impact Lz')
            close(ray['constants']['carterQ'], beta * beta + (alpha * alpha - a * a) * math.cos(angle) ** 2, 'Impact Carter constant')
            require(abs(beta) <= 1e-12 or ray['points'][0]['dmuDmino'] * beta <= 0, 'Impact beta momentum sign differs')
        return [analytic_reference(value['benchmarks'])] + checked
    if 'schwarzschild' in value and 'equatorialPhotonRadii' in value:
        return [analytic_reference(value)]
    raise ValueError('Unsupported Kerr output schema')


def self_test():
    require(abs(schwarzschild_bending(0, 6)) < 1e-12, 'Flat-space bending must vanish')
    weak = schwarzschild_bending(1, 100)
    require(0.04 < weak < 0.0413, 'Weak-field bending reference is outside its analytic limit')
    moderate = schwarzschild_bending(1, 6)
    require(1.7 < moderate < 1.8, 'Independent Schwarzschild quadrature reference differs')
    return {'kind': 'independent-self-test', 'passed': True, 'flatDeflection': schwarzschild_bending(0, 6),
            'weakDeflectionAtB100': weak, 'deflectionAtB6': moderate}


def check_case(case, limit):
    checked = check_output(case['output'], limit)
    if case['output'].get('schema') == 'GFM-Kerr-null-ray/1' and 'input' in case:
        for key, requested in case['input'].items():
            if key in ('Lz', 'carterQ'):
                observed = case['output']['constants'][key]
            elif key == 'id':
                observed, requested = case['output']['id'], str(requested)
            else:
                observed = case['output']['parameters'][key]
            require(observed == requested, 'Exported input differs for ' + key)
    if 'expectedOutcome' in case:
        require(case['output'].get('schema') == 'GFM-Kerr-null-ray/1', 'Expected outcome applies only to a ray')
        require(case['output']['outcome'] == case['expectedOutcome'],
                'Expected ' + case['expectedOutcome'] + ', observed ' + case['output']['outcome'])
    return checked


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('files', nargs='*', help='JSON outputs; - reads standard input')
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--constraint-limit', type=float, default=1e-6, help='Project normalized residual/angle criterion, default 1e-6')
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parent.parent / 'backend/relativity.cjs')
    args = parser.parse_args()
    require(args.self_test or args.files, 'Supply outputs or --self-test')
    require(math.isfinite(args.constraint_limit) and 1e-12 <= args.constraint_limit <= 1e-2, 'Invalid independent criterion')
    results = [self_test()] if args.self_test else []
    input_evidence = []
    source_hash = hashlib.sha256(args.source.read_bytes()).hexdigest() if args.files else None
    for filename in args.files:
        if filename == '-':
            data = sys.stdin.buffer.read(MAX_BYTES + 1)
        else:
            require(Path(filename).stat().st_size <= MAX_BYTES, 'Input exceeds 64 MiB')
            data = Path(filename).read_bytes()
        require(len(data) <= MAX_BYTES, 'Input exceeds 64 MiB')
        input_evidence.append({'path': filename, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
        document = json.loads(data.decode('utf-8-sig'), parse_constant=lambda value: (_ for _ in ()).throw(ValueError('Nonfinite JSON constant ' + value)))
        if isinstance(document, dict) and document.get('schema') == 'GFM-Kerr-independent-cases/1':
            require(document['source']['sha256'] == source_hash, 'Output source hash differs from current solver')
            cases = document['cases']
        else:
            cases = [{'name': filename + '[' + str(i) + ']', 'output': output} for i, output in enumerate(document if isinstance(document, list) else [document])]
        require(isinstance(cases, list) and 1 <= len(cases) <= 256, 'Invalid bounded case list')
        for case in cases:
            try:
                checked = check_case(case, args.constraint_limit)
            except ValueError as error:
                raise ValueError(str(case['name']) + ': ' + str(error)) from error
            results.append({'name': case['name'], 'passed': True, 'checks': checked})
    rays = [check for result in results for check in result.get('checks', []) if check['kind'] == 'null-ray']
    report = {'schema': 'GFM-Kerr-independent-verification/1', 'passed': True,
              'source': {'path': str(args.source), 'sha256': source_hash}, 'criterion': args.constraint_limit,
              'checker': {'path': str(Path(__file__).resolve()), 'sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
              'inputEvidence': input_evidence,
              'casesChecked': sum('checks' in result for result in results), 'raysChecked': len(rays),
              'pointsChecked': sum(ray['pointsChecked'] for ray in rays),
              'maximumErrors': {key: max((ray['maxErrors'][key] for ray in rays), default=0) for key in ('radial', 'polar', 'null', 'energy', 'Lz', 'carter')},
              'maximumInitialErrors': {key: max((ray['initialErrors'][key] for ray in rays), default=0) for key in ('radial', 'polar', 'null', 'energy', 'Lz', 'carter')},
              'criticalLimitRays': sum(ray['outcome'] == 'critical-limit' for ray in rays),
              'maximumIndependentBendingError': max((ray['independentBendingError'] or 0 for ray in rays), default=0),
              'maximumNormalizedIndependentBendingError': max((ray['normalizedIndependentBendingError'] or 0 for ray in rays), default=0),
              'results': results, 'scope': 'Independent code/analytic verification of sampled exterior null trajectories. Not empirical validation or NASA certification.'}
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, UnicodeError) as error:
        print(json.dumps({'passed': False, 'error': str(error)}), file=sys.stderr)
        sys.exit(1)
