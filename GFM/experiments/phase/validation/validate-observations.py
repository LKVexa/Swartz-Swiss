"""Independent stdlib observation audit. No production module is imported.

Reparse publisher text, evaluate J0 by periodic angular quadrature, independently
repeat the training-only grid fit, and verify every untouched holdout residual.
Calculation verification can pass while the brightness surrogate fails data.
"""
import copy
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data/observations'
MICROAS = math.pi / (180 * 3600 * 1e6)
ANGLES = [math.cos(2 * math.pi * k / 32) for k in range(32)]
CHECK_ANGLES = [math.cos(2 * math.pi * k / 128) for k in range(128)]


def require(ok, message):
    if not ok:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    require(path.stat().st_size <= 4 * 1024 * 1024, 'JSON file exceeds 4 MiB')
    return json.loads(path.read_text(encoding='utf-8-sig'),
                      parse_constant=lambda value: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))


def close(value, expected, name, tolerance=2e-9):
    require(type(value) in (float, int) and math.isfinite(value), name + ' is not finite numeric data')
    require(abs(value - expected) <= tolerance * max(1, abs(expected)), name + ' differs from independent reference')


def source_rows(manifest):
    rows = []
    for source in manifest['files']:
        path = DATA / source['path']
        require(sha(path) == source['sha256'], 'Preserved raw source hash differs')
        if not path.name.endswith('_amp.dat'):
            continue
        year = int(path.name.split('_')[2])
        for line_number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            if not line.startswith('|'):
                continue
            cells = [cell.strip() for cell in line.strip('|').split('|')]
            if cells[0] == 'time':
                continue
            require(len(cells) == 7, 'Invalid raw row')
            time, station1, station2, u, v, amplitude, sigma = cells
            row = {'year': year, 'sourceFile': source['path'], 'sourceLine': line_number,
                   'timeHoursFromCampaignDate': float(time), 'station1': station1, 'station2': station2,
                   'uWavelengths': float(u), 'vWavelengths': float(v), 'amplitudeJy': float(amplitude), 'sigmaJy': float(sigma)}
            require(all(math.isfinite(row[key]) for key in ('timeHoursFromCampaignDate', 'uWavelengths', 'vWavelengths', 'amplitudeJy', 'sigmaJy')),
                    'Nonfinite raw observation')
            require(row['sigmaJy'] > 0 and row['amplitudeJy'] >= 0, 'Invalid raw uncertainty/amplitude')
            row['baselineWavelengths'] = math.hypot(row['uWavelengths'], row['vWavelengths'])
            rows.append(row)
    return rows


def shape(model, scale, baseline, dense=False):
    x = math.pi * scale * MICROAS * baseline
    if model == 'gaussian':
        return math.exp(-x * x / (4 * math.log(2)))
    require(model == 'thin-ring', 'Unknown geometric surrogate')
    # DLMF 10.9.1 integral, evaluated over a periodic full angular domain.
    # This differs from the production alternating power series.
    angles = CHECK_ANGLES if dense else ANGLES
    return abs(math.fsum(math.cos(x * cosine) for cosine in angles) / len(angles))


def fit_profile(rows, definition, protocol):
    grid = definition.get('diameterGridMicroarcseconds', definition.get('fwhmGridMicroarcseconds'))
    count = round((grid['maximum'] - grid['minimum']) / grid['step'])
    model = definition['id']
    profile = []
    for index in range(count + 1):
        scale = grid['minimum'] + index * grid['step']
        bases = [shape(model, scale, row['baselineWavelengths']) for row in rows]
        numerator = math.fsum(row['amplitudeJy'] * basis / row['sigmaJy'] ** 2 for row, basis in zip(rows, bases))
        denominator = math.fsum(basis * basis / row['sigmaJy'] ** 2 for row, basis in zip(rows, bases))
        flux = min(protocol['fluxBoundsJy'][1], max(protocol['fluxBoundsJy'][0], numerator / denominator))
        chi = math.fsum(((row['amplitudeJy'] - flux * basis) / row['sigmaJy']) ** 2 for row, basis in zip(rows, bases))
        profile.append({'scaleMicroas': scale, 'fluxJy': flux, 'chiSquare': chi})
    return min(profile, key=lambda point: point['chiSquare']), profile


def check_statistics(rows, reported, fit, model, criteria):
    require(reported['rows'] == len(rows) and len(reported['predictions']) == len(rows), 'Prediction count differs')
    normalized, residuals, maximum_prediction_difference = [], [], 0
    for row, prediction in zip(rows, reported['predictions']):
        require((prediction['year'], prediction['sourceFile'], prediction['sourceLine']) ==
                (row['year'], row['sourceFile'], row['sourceLine']), 'Prediction row identity differs')
        for key in ('station1', 'station2'):
            require(prediction[key] == row[key], 'Prediction station differs')
        for key in ('uWavelengths', 'vWavelengths', 'amplitudeJy', 'sigmaJy', 'baselineWavelengths'):
            close(prediction[key], row[key], 'Observed ' + key)
        expected = fit['fluxJy'] * shape(model, fit['scaleMicroas'], row['baselineWavelengths'], dense=True)
        close(prediction['predictedJy'], expected, 'Visibility prediction')
        maximum_prediction_difference = max(maximum_prediction_difference, abs(prediction['predictedJy'] - expected))
        residual = row['amplitudeJy'] - expected
        normalized_residual = residual / row['sigmaJy']
        close(prediction['residualJy'], residual, 'Amplitude residual')
        close(prediction['normalizedResidual'], normalized_residual, 'Normalized residual')
        normalized.append(normalized_residual)
        residuals.append(residual)
    chi = math.fsum(value * value for value in normalized)
    rms = math.sqrt(chi / len(rows))
    fraction = sum(abs(value) <= 3 for value in normalized) / len(rows)
    for key, expected in [('chiSquare', chi), ('chiSquarePerRow', chi / len(rows)),
                          ('normalizedResidualRms', rms), ('fractionWithin3Sigma', fraction),
                          ('rmsResidualJy', math.sqrt(math.fsum(value * value for value in residuals) / len(rows))),
                          ('maxAbsoluteNormalizedResidual', max(abs(value) for value in normalized))]:
        close(reported[key], expected, 'Residual metric ' + key)
    passed = rms <= criteria['normalizedResidualRmsMaximum'] and fraction >= criteria['fractionWithin3SigmaMinimum']
    require(reported['diagnosticPassed'] is passed, 'Diagnostic pass label differs')
    return {'rows': len(rows), 'normalizedResidualRms': rms, 'fractionWithin3Sigma': fraction,
            'diagnosticPassed': passed, 'maximumPredictionDifferenceJy': maximum_prediction_difference}


def main():
    manifest = read(DATA / 'source-manifest.json')
    dataset = read(DATA / 'observations.json')
    protocol = read(DATA / 'protocol.json')
    report_path = ROOT / 'public/observation-report.json'
    report = read(report_path)
    require(report == read(ROOT / 'validation/observation-fit-report.json'), 'UI and archived report differ')
    require(report['schema'] == 'GFM-EHT-observation-comparison/1' and report['verificationPassed'] is True, 'Comparison schema/status differs')
    require(report['protocol'] == protocol, 'Report protocol differs')
    for name, path in [('datasetSha256', DATA / 'observations.json'), ('sourceManifestSha256', DATA / 'source-manifest.json'),
                       ('protocolSha256', DATA / 'protocol.json'), ('modelImplementationSha256', ROOT / 'backend/observations.cjs')]:
        require(report['provenance'][name] == sha(path), 'Report provenance hash differs: ' + name)
    rows = source_rows(manifest)
    require(dataset['rowCount'] == len(rows) == len(dataset['rows']), 'Raw/parsed row count differs')
    for raw, parsed in zip(rows, dataset['rows']):
        for key, value in raw.items():
            require(parsed[key] == value, 'Parsed raw data differs: ' + key)
    selected = [row for row in rows if row['baselineWavelengths'] >= protocol['rowSelection']['minimumBaselineWavelengths']]
    training = [row for row in selected if row['year'] in protocol['trainingYears']]
    holdout = [row for row in selected if row['year'] in protocol['holdoutYears']]
    require(set(protocol['trainingYears']).isdisjoint(protocol['holdoutYears']), 'Training and holdout overlap')
    require(report['data']['trainingRows'] == len(training) and report['data']['holdoutRows'] == len(holdout), 'Split count differs')
    checks = []
    for definition, recorded in zip(protocol['models'], report['models']):
        model = definition['id']
        independent_fit, independent_profile = fit_profile(training, definition, protocol)
        require(recorded['fit']['model'] == model, 'Model identity differs')
        for key, value in independent_fit.items():
            close(recorded['fit'][key], value, 'Training-only fit ' + key)
        require(len(recorded['fit']['profile']) == len(independent_profile), 'Fit grid count differs')
        for observed, expected in zip(recorded['fit']['profile'], independent_profile):
            for key, value in expected.items():
                close(observed[key], value, 'Full training profile ' + key, 2e-8)
        train_result = check_statistics(training, recorded['training'], independent_fit, model, protocol['diagnosticCriteria'])
        hold_result = check_statistics(holdout, recorded['holdout'], independent_fit, model, protocol['diagnosticCriteria'])
        passed = train_result['diagnosticPassed'] and hold_result['diagnosticPassed']
        require(recorded['comparisonPassed'] is passed, 'Model adequacy label differs')
        checks.append({'model': model, 'independentFit': independent_fit,
                       'gridPointsChecked': len(independent_profile), 'training': train_result, 'holdout': hold_result,
                       'comparisonPassed': passed})
    comparison_passed = any(check['comparisonPassed'] for check in checks)
    require(report['comparisonPassed'] is comparison_passed, 'Failed observation comparison was relabeled accepted')
    negative_checks = []
    tampered = copy.deepcopy(report['models'][0]['holdout'])
    tampered['predictions'][0]['predictedJy'] += .1
    try:
        check_statistics(holdout, tampered, checks[0]['independentFit'], checks[0]['model'], protocol['diagnosticCriteria'])
    except ValueError as error:
        negative_checks.append({'case': 'changed-held-out-prediction', 'rejected': True, 'reason': str(error)})
    else:
        raise ValueError('Changed holdout prediction was accepted')
    tampered = copy.deepcopy(report['models'][0]['holdout'])
    tampered['diagnosticPassed'] = not tampered['diagnosticPassed']
    try:
        check_statistics(holdout, tampered, checks[0]['independentFit'], checks[0]['model'], protocol['diagnosticCriteria'])
    except ValueError as error:
        negative_checks.append({'case': 'false-holdout-acceptance', 'rejected': True, 'reason': str(error)})
    else:
        raise ValueError('False held-out pass label was accepted')
    output = {'schema': 'GFM-EHT-independent-check/1', 'verificationPassed': True,
              'observationComparisonPassed': comparison_passed, 'rawRowsChecked': len(rows),
              'trainingRows': len(training), 'holdoutRows': len(holdout), 'models': checks, 'negativeChecks': negative_checks,
              'hashes': {'checker': sha(Path(__file__)), 'observations': sha(DATA / 'observations.json'),
                         'protocol': sha(DATA / 'protocol.json'), 'publicReport': sha(report_path),
                         'productionModel': sha(ROOT / 'backend/observations.cjs')},
              'scope': 'Independent parsing, full training-grid fit and untouched held-out residual verification. Surrogate failures remain failures; no empirical phase/matter/MHD validation follows.'}
    (ROOT / 'validation/observation-independent-results.json').write_text(json.dumps(output, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps(output, indent=2, allow_nan=False))


if __name__ == '__main__':
    main()
