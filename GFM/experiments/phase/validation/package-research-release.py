"""Verify and package research v2.0.0 only after final root readiness.

This script never reruns mathematical generators or alters originals, renderer,
provenance or documentation. --check-only is read-only. A packaging run preserves
the canonical v1 summary/manifest before writing the research summary/manifest.
The ZIP is created exclusively; existing releases are never replaced.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT.parent / 'outputs/GFM_Research_Simulator_v2.0.0.zip'
ARCHIVE_ROOT = 'GFM_Research_Simulator'
VERSION = '2.0.0'
HISTORICAL_SUMMARY = 'validation/verification-summary-v1.0.0.json'
HISTORICAL_MANIFEST = 'validation/SHA256SUMS-v1.0.0.txt'
HISTORICAL_SUMMARY_SHA256 = '4b6a88952df9d0db0fedcdc8b9bde64cb255ddaad38e7b3788fbc316b92cde1a'
HISTORICAL_MANIFEST_SHA256 = '39f5ba6f8791c70be31e646aaec28627967c54bb4e51931b4a400ed6431bd4f7'
FRONTEND = {'public/index.html', 'public/style.css', 'public/app.js', 'public/renderer.js'}
BACKEND = {'server.cjs', 'backend/simulation.cjs', 'backend/relativity.cjs',
           'backend/physics-service.cjs', 'backend/physics-worker.cjs'}
SHA_PATTERN = re.compile(r'[0-9a-f]{64}')


def require(condition, reason):
    if not condition:
        raise RuntimeError(reason)


def sha(file):
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def read(file):
    require(file.is_file(), 'Required evidence is missing: ' + str(file))
    return json.loads(file.read_text(encoding='utf-8-sig'),
                      parse_constant=lambda value: (_ for _ in ()).throw(
                          ValueError('Nonfinite JSON constant: ' + value)))


def inside(relative):
    require(isinstance(relative, str) and relative, 'Invalid evidence path')
    path = Path(relative)
    require('..' not in path.parts, 'Evidence path contains parent traversal: ' + relative)
    resolved = (path if path.is_absolute() else ROOT / path).resolve()
    require(resolved.is_relative_to(ROOT.resolve()), 'Evidence path escapes this project: ' + relative)
    require(resolved.is_file(), 'Required evidence is missing: ' + relative)
    return resolved


def identity(relative):
    file = inside(relative)
    return {'sha256': sha(file), 'bytes': file.stat().st_size}


def finite(value, name, low=0, high=None):
    require(type(value) in (int, float) and math.isfinite(value) and value >= low
            and (high is None or value <= high), 'Invalid or out-of-range ' + name)
    return value


def verify_identity(item, expected_path=None):
    require(isinstance(item, dict), 'Invalid source/input identity')
    file = inside(item.get('path', ''))
    if expected_path is not None:
        require(file == inside(expected_path), 'Evidence refers to the wrong source/input path')
    checksum = item.get('sha256')
    require(isinstance(checksum, str) and SHA_PATTERN.fullmatch(checksum), 'Invalid SHA256 evidence')
    require(sha(file) == checksum, 'Evidence binds a different revision: ' + str(file.relative_to(ROOT)))
    if 'bytes' in item:
        require(type(item['bytes']) is int and item['bytes'] == file.stat().st_size,
                'Evidence byte count differs: ' + str(file.relative_to(ROOT)))
    return file


def historical_evidence():
    summary = ROOT / HISTORICAL_SUMMARY
    manifest = ROOT / HISTORICAL_MANIFEST
    summary_source = summary if summary.exists() else ROOT / 'validation/verification-summary.json'
    manifest_source = manifest if manifest.exists() else ROOT / 'SHA256SUMS.txt'
    require(sha(summary_source) == HISTORICAL_SUMMARY_SHA256, 'Canonical historical v1 summary changed')
    require(sha(manifest_source) == HISTORICAL_MANIFEST_SHA256, 'Canonical historical v1 manifest changed')
    previous = read(summary_source)
    require(previous.get('version') == '1.0.0', 'Historical summary is not the declared v1 release')
    entries = {}
    for line in manifest_source.read_text(encoding='utf-8-sig').splitlines():
        checksum, relative = line.split('  ', 1)
        require(relative not in entries and SHA_PATTERN.fullmatch(checksum), 'Malformed historical manifest')
        entries[relative] = checksum
    require(entries.get('validation/verification-summary.json') == HISTORICAL_SUMMARY_SHA256,
            'Historical manifest does not identify the historical summary')
    require(entries.get('validation/tests.txt') == sha(ROOT / 'validation/tests.txt'),
            'Historical v1 test transcript changed')
    return previous, [(summary_source, summary), (manifest_source, manifest)]


def verify_provenance():
    provenance = read(ROOT / 'SOURCE_PROVENANCE.json')
    require(provenance.get('schema') == 'GFM-Aperture-Aggie-source-provenance/1', 'Unsupported provenance schema')
    modules, terminal = provenance.get('modules'), provenance.get('terminalFiles')
    require(isinstance(modules, list) and len(modules) == 9, 'Expected nine preserved GFM modules')
    require(isinstance(terminal, list) and len(terminal) == 141, 'Expected 141 preserved terminal files')
    module_paths, terminal_paths = set(), set()
    for module in modules:
        path = module.get('copied', '')
        require(path.startswith('backend/gfm/') and path not in module_paths, 'Invalid/duplicate GFM module path')
        module_paths.add(path)
        verify_identity({'path': path, 'sha256': module.get('sha256'), 'bytes': module.get('bytes')})
        original = inside('vendor/terminal/' + module.get('original', ''))
        require(sha(original) == module['sha256'], 'Preserved backend module differs from its vendored original')
    actual_modules = {p.relative_to(ROOT).as_posix() for p in (ROOT / 'backend/gfm').rglob('*') if p.is_file()}
    require(actual_modules == module_paths, 'Preserved GFM module membership changed')
    for item in terminal:
        path = item.get('path', '')
        require(path.startswith('vendor/terminal/') and path not in terminal_paths, 'Invalid/duplicate terminal path')
        terminal_paths.add(path)
        verify_identity(item)
    actual_terminal = {p.relative_to(ROOT).as_posix() for p in (ROOT / 'vendor/terminal').rglob('*') if p.is_file()}
    require(actual_terminal == terminal_paths, 'Preserved terminal membership changed')
    return {'modulesUnchanged': 9, 'terminalFilesUnchanged': 141,
            'provenance': 'SOURCE_PROVENANCE.json', **identity('SOURCE_PROVENANCE.json'),
            'scope': 'Nine original module identities and 141 original terminal identities match provenance exactly; the provenance model-scope metadata describes research v2.'}


def verify_tests():
    relative = 'validation/research-tests.txt'
    text = inside(relative).read_text(encoding='utf-8-sig')
    def stat(name):
        values = re.findall(r'^# ' + name + r' (\d+)\s*$', text, re.M)
        require(len(values) == 1, 'Final TAP must contain one ' + name + ' count')
        return int(values[0])
    count = stat('tests')
    require(count >= 29, 'Final research suite is smaller than the established 29-test suite')
    require(stat('pass') == count and all(stat(k) == 0 for k in ['fail', 'skipped', 'cancelled', 'todo']),
            'Final research tests contain failures, skips, cancellations or unfinished work')
    plans = re.findall(r'^1\.\.(\d+)\s*$', text, re.M)
    require(plans and int(plans[-1]) == count and not re.search(r'^not ok\b', text, re.M), 'Final TAP is incomplete')
    require(len(re.findall(r'^ok \d+\b', text, re.M)) == count, 'Final TAP result count differs')
    return {'passed': count, 'failed': 0, 'skipped': 0, 'cancelled': 0, 'todo': 0,
            'transcript': relative, **identity(relative),
            'command': 'node --test --test-reporter=tap tests/*.cjs',
            'scope': 'Final production code, HTTP/SSE, physics worker/settings/export, numerical domains, isolated DOM controls and finite/cached renderer geometry. Mocked graphics checks do not establish GPU appearance.'}


def verify_relativity():
    relative = 'validation/independent-relativity-results.json'
    report = read(inside(relative))
    require(report.get('schema') == 'GFM-Kerr-independent-verification/1' and report.get('passed') is True,
            'Independent relativistic verification has not passed')
    verify_identity(report.get('source'), 'backend/relativity.cjs')
    verify_identity(report.get('checker'), 'validation/independent-kerr-check.py')
    inputs = report.get('inputEvidence')
    require(isinstance(inputs, list) and inputs, 'Independent verification lacks input identities')
    paths = {verify_identity(item).relative_to(ROOT).as_posix() for item in inputs}
    require('validation/independent-relativity-cases.json' in paths, 'Independent case evidence is absent')
    criterion = finite(report.get('criterion'), 'independent criterion', 1e-12, 1e-6)
    results = report.get('results')
    require(isinstance(results, list) and results and all(r.get('passed') is True for r in results),
            'Independent verification has incomplete cases')
    cases = [r for r in results if 'checks' in r]
    rays = [c for r in cases for c in r['checks'] if c.get('kind') == 'null-ray']
    require(report.get('casesChecked') == len(cases) >= 115 and report.get('raysChecked') == len(rays) >= 205,
            'Independent case/ray totals differ or are incomplete')
    require(report.get('pointsChecked') == sum(r['pointsChecked'] for r in rays) >= 29245,
            'Independent point total differs or is incomplete')
    require(report.get('criticalLimitRays') == sum(r['outcome'] == 'critical-limit' for r in rays) >= 37,
            'Critical unresolved cases are missing')
    for name in ['maximumErrors', 'maximumInitialErrors']:
        require(set(report.get(name, {})) == {'radial', 'polar', 'null', 'energy', 'Lz', 'carter'},
                'Incomplete independent constraint errors')
        for key, value in report[name].items():
            finite(value, name + '.' + key, high=criterion)
    finite(report.get('maximumIndependentBendingError'), 'absolute independent bending error')
    finite(report.get('maximumNormalizedIndependentBendingError'), 'normalized independent bending error', high=criterion)
    document = read(inside('validation/independent-relativity-cases.json'))
    verify_identity(document.get('source'), 'backend/relativity.cjs')
    require(len(document.get('cases', [])) == len(cases), 'Independent input case membership differs')
    return {'passed': True, 'evidence': relative, **identity(relative),
            **{key: report[key] for key in ['criterion', 'casesChecked', 'raysChecked', 'pointsChecked',
               'criticalLimitRays', 'maximumErrors', 'maximumInitialErrors',
               'maximumIndependentBendingError', 'maximumNormalizedIndependentBendingError', 'scope']},
            'bendingCriterion': 'abs(error)/max(1,abs(independent reference angle)) <= criterion; the absolute and normalized maxima are recorded separately.',
            'source': report['source'], 'checker': report['checker'], 'inputEvidence': inputs}


def verify_audit():
    relative = 'validation/kerr-convergence-and-negative-checks.json'
    report = read(inside(relative))
    require(report.get('schema') == 'GFM-Kerr-evidence-audit/1' and report.get('passed') is True,
            'Convergence/negative evidence audit has not passed')
    verify_identity(report.get('source'), 'backend/relativity.cjs')
    verify_identity(report.get('inputs'), 'validation/independent-relativity-cases.json')
    require(report.get('checkerSha256') == sha(inside('validation/independent-kerr-check.py')),
            'Convergence/negative evidence binds an old checker')
    require(report.get('auditSha256') == sha(inside('validation/kerr-evidence-audit.py')),
            'Convergence/negative evidence binds an old audit')
    convergence = report.get('convergence', {})
    require(convergence.get('passed') is True, 'Case-specific refinement has not passed')
    target = finite(convergence.get('angleTargetRadians'), 'refinement angle target', 1e-12, 1e-6)
    rows = convergence.get('rows')
    require(isinstance(rows, list) and len(rows) >= 4, 'Refinement rows are incomplete')
    for row in rows:
        require(row.get('outcome') == 'escaped', 'Refinement did not retain the completed scattering case')
        finite(row.get('absoluteIndependentAngleError'), 'refinement absolute angle error', high=target)
    require(rows[-1]['absoluteIndependentAngleError'] <= rows[0]['absoluteIndependentAngleError'], 'Tightest refinement did not improve')
    negatives = report.get('negativeChecks')
    require(isinstance(negatives, list) and len(negatives) >= 8 and report.get('negativeChecksPassed') == len(negatives)
            and all(r.get('rejected') is True for r in negatives), 'Corrupted-evidence rejection checks are incomplete')
    return {'passed': True, 'evidence': relative, **identity(relative),
            'convergence': convergence, 'negativeChecksPassed': len(negatives),
            'negativeChecks': negatives, 'scope': report.get('scope')}


def verify_hypothesis():
    relative = 'validation/research-hypothesis-independent.json'
    report = read(inside(relative))
    require(report.get('passed') is True, 'Independent hypothesis/GFM report has not passed')
    results = report.get('results')
    require(isinstance(results, list) and results, 'Hypothesis/GFM checks are absent')
    basis = [r for r in results if r.get('selfTest') == 'passed']
    cases = [r for r in results if 'snapshots' in r]
    require(len(basis) == 1 and basis[0].get('basisRoundTrips') == 9, 'GF9 reference self-test is incomplete')
    require(cases and all(r.get('passed') is True and type(r.get('snapshots')) is int and r['snapshots'] > 0 for r in cases),
            'Hypothesis snapshot checks are incomplete')
    inputs = {r['file']: identity(r['file']) for r in cases}
    require('validation/current-hypothesis-frame.json' in inputs and sum(r['snapshots'] for r in cases) >= 236,
            'Fresh current-backend hypothesis data are absent')
    for result in cases:
        finite(result.get('maxCoefficientError'), 'GF9 coefficient error', high=1e-10)
        finite(result.get('maxRecoveredError'), 'GF9 recovered error', high=1e-10)
    return {'passed': True, 'evidence': relative, **identity(relative),
            'snapshotsChecked': sum(r['snapshots'] for r in cases), 'gf9BasisRoundTrips': 9,
            'maximumCoefficientError': max(r['maxCoefficientError'] for r in cases),
            'maximumRecoveredError': max(r['maxRecoveredError'] for r in cases),
            'inputsAtPackaging': inputs, 'checkerAtPackaging': identity('validation/independent-check.py'),
            'identityScope': 'This report has no embedded source/input hashes. Packaging records the current report, referenced input files and checker separately; it does not imply identities were embedded in the independent report.',
            'scope': report.get('scope')}


def browser_hash(value):
    checksum = value.get('sha256') if isinstance(value, dict) else value
    require(isinstance(checksum, str) and SHA_PATTERN.fullmatch(checksum), 'Invalid browser source hash')
    return checksum


def verify_live_replay():
    relative = 'validation/browser/live-export-replay.json'
    export_relative = 'validation/browser/live-kerr-export.json'
    report, export = read(inside(relative)), read(inside(export_relative))
    require(report.get('schema') == 'GFM-Live-export-replay/1' and report.get('passed') is True,
            'Downloaded live-result replay has not passed')
    require(report.get('sourceSha256') == sha(inside('backend/relativity.cjs')),
            'Downloaded live-result replay binds an old solver')
    require(export.get('schema') == 'GFM-Kerr-physics-recording/1', 'Live export is not a physics recording')
    bundle = export.get('fullSolverResult', {})
    require(bundle.get('schema') == 'GFM-Kerr-null-bundle/1'
            and bundle.get('diagnostics', {}).get('passed') is True, 'Live export lacks the completed checked bundle')
    require(report.get('parameters') == bundle.get('parameters') == export.get('inputs')
            == export.get('reproducibility', {}).get('integrationInputs'), 'Live replay/export inputs differ')
    rays = bundle.get('trajectories')
    require(isinstance(rays, list) and len(rays) >= 8
            and report.get('rayCount') == len(rays)
            and report.get('pointCount') == sum(len(r['points']) for r in rays), 'Live replay ray/point counts differ')
    return {'passed': True, 'evidence': relative, **identity(relative),
            'downloadedRecording': {'path': export_relative, **identity(export_relative)},
            'sourceSha256': report['sourceSha256'], 'rayCount': report['rayCount'],
            'pointCount': report['pointCount'], 'parameters': report['parameters'],
            'comparison': report.get('comparison'), 'scope': report.get('scope')}


def verify_browser():
    relative = 'validation/browser/research-browser-qa.json'
    report = read(ROOT / relative)
    require(report.get('schema') == 'GFM-Research-browser-QA/1' and report.get('passed') is True,
            'Research browser QA has not passed')
    pending = report.get('restartPending')
    require(type(pending) is bool and report.get('status') == ('partial' if pending else 'verified'),
            'Browser verification status must disclose any pending backend restart')
    hashes = report.get('sourceHashes')
    require(isinstance(hashes, dict) and FRONTEND | BACKEND <= set(hashes), 'Browser QA lacks the nine application/source identities')
    for relative_path in FRONTEND | BACKEND:
        require(browser_hash(hashes[relative_path]) == sha(inside(relative_path)), 'Browser QA identifies an old file: ' + relative_path)
    loaded = report.get('loadedBackendSha256')
    if not pending:
        require(isinstance(loaded, dict) and BACKEND <= set(loaded), 'Final live backend source identities are missing')
        for relative_path in BACKEND:
            require(browser_hash(loaded[relative_path]) == sha(inside(relative_path)), 'Loaded live backend differs: ' + relative_path)
    elif loaded is not None:
        require(isinstance(loaded, dict), 'Invalid pre-restart backend identities')
        for value in loaded.values():
            browser_hash(value)
    checks = report.get('checks')
    require(isinstance(checks, list) and checks and all(isinstance(c, dict) and isinstance(c.get('name'), str)
            and type(c.get('passed')) is bool and 'details' in c for c in checks), 'Browser QA checks are missing or malformed')
    if not pending:
        require(all(c['passed'] for c in checks), 'Final verified browser QA contains an unsuccessful check')
    require(report.get('consoleErrors') == [], 'Browser QA contains application console errors')
    screenshots = report.get('screenshots')
    require(isinstance(screenshots, list) and screenshots, 'Browser QA contains no screenshots')
    screenshot_ids = {}
    for name in screenshots:
        require(isinstance(name, str) and name.startswith('validation/browser/'), 'Screenshot must be a project-relative browser artifact')
        screenshot_ids[name] = identity(name)
    for name in ['url', 'title', 'checkedAt', 'scope']:
        require(isinstance(report.get(name), str) and report[name], 'Browser QA is missing ' + name)
    return {'passed': True, 'status': report['status'], 'restartPending': pending,
            'liveFinalBackendSourceVerified': not pending, 'evidence': relative, **identity(relative),
            'url': report['url'], 'title': report['title'], 'checkedAt': report['checkedAt'],
            'sourceHashes': hashes, 'loadedBackendSha256': loaded, 'checks': checks,
            'screenshots': screenshot_ids, 'consoleErrors': [], 'scope': report['scope'],
            'qualification': 'Current frontend/browser checks passed as scoped below, and the live downloaded result is separately replayed with the final solver. Whole running-backend module fingerprints remain pending restart.' if pending else 'Browser checks identify the final frontend and loaded backend revision; numerical certification remains limited to the separate scientific reports.'}


def preflight():
    require(not ARCHIVE.exists(), 'Research release already exists; preserve it instead of replacing it')
    require(ARCHIVE.parent.resolve() == (ROOT.parent / 'outputs').resolve(), 'Archive is outside the authorized output directory')
    require(not any(p.is_symlink() for p in ROOT.rglob('*')), 'Do not package symbolic links')
    require(not any(p.is_dir() and p.name in ['__pycache__', 'node_modules', '.git', 'outputs'] for p in ROOT.rglob('*')),
            'Unexpected generated/repository/output directories; remove or relocate them before packaging')
    require(read(ROOT / 'package.json').get('version') == VERSION, 'Package metadata is not the final research version')
    previous, historical = historical_evidence()
    preserved = verify_provenance()
    tests = verify_tests()
    relativity = verify_relativity()
    audit = verify_audit()
    hypothesis = verify_hypothesis()
    browser = verify_browser()
    live_replay = verify_live_replay()
    example = read(inside('examples/kerr-default.json'))
    require(example.get('schema') == 'GFM-Kerr-reproducible-example/1'
            and example.get('software', {}).get('backend/relativity.cjs') == sha(inside('backend/relativity.cjs')),
            'Saved Kerr example binds an old solver')
    require(example.get('result', {}).get('diagnostics', {}).get('passed') is True, 'Saved Kerr example diagnostics failed')
    sources = {path: identity(path) for path in sorted(FRONTEND | BACKEND | {'launch.cjs', 'SOURCE_PROVENANCE.json',
        'validation/independent-kerr-check.py', 'validation/kerr-evidence-audit.py', 'validation/independent-check.py',
        'validation/generate-relativity-cases.cjs', 'validation/export-research-example.cjs',
        'validation/package-research-release.py'})}
    summary = {'schema': 'GFM-Research-verification/1', 'version': VERSION, 'prepared': '2026-10-11',
        'release': 'GFM Research Simulator', 'localOnly': True, 'tests': tests,
        'independentRelativity': relativity, 'convergenceAndNegativeChecks': audit,
        'independentHypothesisAndGFM': hypothesis, 'browserVerification': browser,
        'liveExportReplay': live_replay,
        'sourceFiles': sources, 'preservedOriginals': preserved,
        'documentationFiles': {p.relative_to(ROOT).as_posix(): identity(p.relative_to(ROOT).as_posix())
            for p in sorted((ROOT / 'docs').rglob('*')) if p.is_file()},
        'example': {'path': 'examples/kerr-default.json', **identity('examples/kerr-default.json'),
            'scope': example.get('scopes'), 'inputs': example.get('inputs')},
        'historicalV1': {'summary': HISTORICAL_SUMMARY, 'summarySha256': HISTORICAL_SUMMARY_SHA256,
            'manifest': HISTORICAL_MANIFEST, 'manifestSha256': HISTORICAL_MANIFEST_SHA256,
            'version': previous['version'], 'testsPassedThen': previous['tests']['passed'],
            'scope': 'Original v1 evidence retained verbatim. Its old blocked browser status and old no-trajectory scope describe v1, not this research release.'},
        'scientificFidelityLimits': [
            'Neutral stationary vacuum Kerr exterior test-light trajectories, in geometrized M units; no evolving spacetime, matter/plasma/EM dynamics or radiation transfer.',
            'The finite-radius asymptotic impact-coordinate bundle is not a local observer tetrad or an optical camera/shadow image.',
            'Boyer-Lindquist oblate surfaces and ray coordinates are a display embedding; 0.2 display units per M is a uniform presentation scale, not proper distance.',
            'Disk emission, particles and stars are illustrative. Hypothesis mouths/covers are schematic and do not alter the Kerr trajectory metric.',
            'Aperture, cover and passage rules remain explicit hypotheses without observational validation or a traversable spacetime model.',
            'GFM preserves raw sampled-signal scale and zeros in a separate finite-field trace transform; it does not replace the ordinary real-valued relativistic integrator.',
            'Capture is a guarded near-horizon numerical classification. Critical, integration-limited and other unresolved paths are retained as unresolved.',
            'Independent residual checks and case-specific refinement are numerical/code verification, not empirical validation or a global trajectory error bound.',
            'No NASA affiliation, endorsement, certification or mission-grade validation is claimed.'
        ]}
    return summary, historical


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true', help='Read and validate evidence without changing any file')
    args = parser.parse_args()
    summary, historical = preflight()
    if args.check_only:
        print(json.dumps({'ready': True, 'readOnly': True, 'projectTestsPassed': summary['tests']['passed'],
            'independentRays': summary['independentRelativity']['raysChecked'],
            'browserStatus': summary['browserVerification']['status'], 'archive': str(ARCHIVE)}, indent=2))
        return
    # Every source/evidence check above completes before the first write.
    for source, destination in historical:
        if source != destination:
            require(not destination.exists(), 'Do not replace historical validation files')
            shutil.copy2(source, destination)
    (ROOT / 'validation/verification-summary.json').write_text(
        json.dumps(summary, indent=2, ensure_ascii=False, allow_nan=False) + '\n', encoding='utf-8')
    files = sorted(p for p in ROOT.rglob('*') if p.is_file() and p != ROOT / 'SHA256SUMS.txt')
    expected = {p.relative_to(ROOT).as_posix(): sha(p) for p in files}
    manifest = ''.join(checksum + '  ' + relative + '\n' for relative, checksum in expected.items())
    (ROOT / 'SHA256SUMS.txt').write_text(manifest, encoding='utf-8')
    expected['SHA256SUMS.txt'] = sha(ROOT / 'SHA256SUMS.txt')
    ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ARCHIVE, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for relative in sorted(expected):
            archive.write(ROOT / relative, ARCHIVE_ROOT + '/' + relative)
    with zipfile.ZipFile(ARCHIVE) as archive:
        require(archive.testzip() is None, 'Release ZIP failed CRC verification')
        names = {ARCHIVE_ROOT + '/' + relative for relative in expected}
        require(len(archive.namelist()) == len(names) and set(archive.namelist()) == names, 'Release ZIP membership differs')
        for relative, checksum in expected.items():
            require(hashlib.sha256(archive.read(ARCHIVE_ROOT + '/' + relative)).hexdigest() == checksum,
                    'Release ZIP content differs: ' + relative)
    require({p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file()} == set(expected),
            'Project membership changed while packaging')
    for relative, checksum in expected.items():
        require(sha(ROOT / relative) == checksum, 'Project file changed while packaging: ' + relative)
    require(sha(ROOT / HISTORICAL_SUMMARY) == HISTORICAL_SUMMARY_SHA256
            and sha(ROOT / HISTORICAL_MANIFEST) == HISTORICAL_MANIFEST_SHA256, 'Historical files changed while packaging')
    print(json.dumps({'archive': str(ARCHIVE), 'bytes': ARCHIVE.stat().st_size, 'sha256': sha(ARCHIVE),
        'files': len(expected), 'zipCRCVerified': True, 'zipMembershipAndContentVerified': True,
        'projectTestsPassed': summary['tests']['passed'],
        'independentCases': summary['independentRelativity']['casesChecked'],
        'independentRays': summary['independentRelativity']['raysChecked'],
        'independentPoints': summary['independentRelativity']['pointsChecked'],
        'hypothesisSnapshots': summary['independentHypothesisAndGFM']['snapshotsChecked'],
        'browserStatus': summary['browserVerification']['status'],
        'liveFinalBackendSourceVerified': summary['browserVerification']['liveFinalBackendSourceVerified'],
        'preservedGFMModules': 9, 'preservedTerminalFiles': 141, 'historicalV1Preserved': True}, indent=2))


if __name__ == '__main__':
    main()
