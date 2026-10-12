'use strict';
// Geometric visibility surrogates only. The proposed matter/phase engine does
// not enter this fit. Independent Python uses a different Bessel evaluation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data/observations');
const MICROAS_TO_RADIANS = Math.PI / (180 * 3600 * 1e6);
function hash(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function requireTrue(ok, message) { if (!ok) throw new RangeError(message); }
function finite(value, name, low, high) {
  requireTrue(typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high, name + ' outside numeric domain.');
  return value;
}
function readJson(relative) {
  const file = path.join(DATA, relative), bytes = fs.readFileSync(file);
  requireTrue(bytes.length <= 4 * 1024 * 1024, 'Observation file exceeds 4 MiB.');
  return {value: JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')), sha256: hash(bytes)};
}
function besselJ0(x) {
  finite(x, 'Bessel argument', -20, 20);
  let term = 1, sum = 1;
  for (let k = 1; k <= 120; k++) {
    term *= -(x * x / 4) / (k * k); sum += term;
    if (Math.abs(term) < 1e-16) return sum;
  }
  throw new RangeError('Bessel series did not converge.');
}
function shapeAmplitude(model, scaleMicroas, baseline) {
  finite(scaleMicroas, 'Angular scale', 0, 120);
  finite(baseline, 'Baseline wavelengths', 0, 1e10);
  const x = Math.PI * scaleMicroas * MICROAS_TO_RADIANS * baseline;
  if (model === 'thin-ring') return Math.abs(besselJ0(x));
  if (model === 'gaussian') return Math.exp(-x * x / (4 * Math.log(2)));
  throw new RangeError('Unknown visibility model.');
}
function predictAmplitude(model, scaleMicroas, fluxJy, u, v) {
  finite(fluxJy, 'Compact flux Jy', 0, 10);
  finite(u, 'u wavelengths', -1e10, 1e10); finite(v, 'v wavelengths', -1e10, 1e10);
  return fluxJy * shapeAmplitude(model, scaleMicroas, Math.hypot(u, v));
}
function loadInputs() {
  const dataset = readJson('observations.json'), manifest = readJson('source-manifest.json'), protocol = readJson('protocol.json');
  requireTrue(dataset.value.schema === 'GFM-EHT-calibrated-amplitudes/1' && protocol.value.schema === 'GFM-EHT-holdout-protocol/1', 'Observation schema differs.');
  const rows = dataset.value.rows;
  requireTrue(Array.isArray(rows) && rows.length > 0 && rows.length <= 20000 && rows.length === dataset.value.rowCount, 'Invalid bounded observations.');
  for (const row of rows) {
    requireTrue([2011, 2012, 2013].includes(row.year), 'Unexpected observation year.');
    finite(row.uWavelengths, 'u', -1e10, 1e10); finite(row.vWavelengths, 'v', -1e10, 1e10);
    finite(row.amplitudeJy, 'Debiased amplitude Jy', 0, 10); finite(row.sigmaJy, 'Publisher RMS Jy', Number.MIN_VALUE, 10);
    requireTrue(Math.abs(row.baselineWavelengths - Math.hypot(row.uWavelengths, row.vWavelengths)) <= 1e-6, 'Baseline metadata differs.');
  }
  for (const source of manifest.value.files) {
    requireTrue(/^source\/(?:dat\/)?[A-Za-z0-9_.-]+$/.test(source.path), 'Unexpected source path.');
    requireTrue(hash(fs.readFileSync(path.join(DATA, source.path))) === source.sha256, 'Preserved source hash differs: ' + source.path);
  }
  return {dataset, manifest, protocol};
}
function statistics(rows, fit, criteria) {
  const predictions = rows.map(row => {
    const predictedJy = predictAmplitude(fit.model, fit.scaleMicroas, fit.fluxJy, row.uWavelengths, row.vWavelengths);
    return {year: row.year, sourceFile: row.sourceFile, sourceLine: row.sourceLine, utc: row.utc,
      station1: row.station1, station2: row.station2, uWavelengths: row.uWavelengths, vWavelengths: row.vWavelengths,
      baselineWavelengths: row.baselineWavelengths, amplitudeJy: row.amplitudeJy, sigmaJy: row.sigmaJy,
      predictedJy, residualJy: row.amplitudeJy - predictedJy, normalizedResidual: (row.amplitudeJy - predictedJy) / row.sigmaJy};
  });
  const n = predictions.length, chiSquare = predictions.reduce((sum, row) => sum + row.normalizedResidual ** 2, 0);
  const normalizedResidualRms = Math.sqrt(chiSquare / n), fractionWithin3Sigma = predictions.filter(row => Math.abs(row.normalizedResidual) <= 3).length / n;
  return {rows: n, chiSquare, chiSquarePerRow: chiSquare / n, normalizedResidualRms, fractionWithin3Sigma,
    rmsResidualJy: Math.sqrt(predictions.reduce((sum, row) => sum + row.residualJy ** 2, 0) / n),
    maxAbsoluteNormalizedResidual: Math.max(...predictions.map(row => Math.abs(row.normalizedResidual))),
    diagnosticPassed: normalizedResidualRms <= criteria.normalizedResidualRmsMaximum && fractionWithin3Sigma >= criteria.fractionWithin3SigmaMinimum,
    predictions};
}
function fitModel(rows, model, protocol) {
  const definition = protocol.models.find(value => value.id === model), grid = definition.diameterGridMicroarcseconds ?? definition.fwhmGridMicroarcseconds;
  const count = Math.round((grid.maximum - grid.minimum) / grid.step), profile = [];
  let best = null;
  for (let i = 0; i <= count; i++) {
    const scaleMicroas = grid.minimum + i * grid.step;
    let numerator = 0, denominator = 0;
    const bases = rows.map(row => shapeAmplitude(model, scaleMicroas, row.baselineWavelengths));
    rows.forEach((row, j) => { const weight = 1 / row.sigmaJy ** 2; numerator += weight * row.amplitudeJy * bases[j]; denominator += weight * bases[j] ** 2; });
    const fluxJy = Math.min(protocol.fluxBoundsJy[1], Math.max(protocol.fluxBoundsJy[0], numerator / denominator));
    const chiSquare = rows.reduce((sum, row, j) => sum + ((row.amplitudeJy - fluxJy * bases[j]) / row.sigmaJy) ** 2, 0);
    const point = {scaleMicroas, fluxJy, chiSquare}; profile.push(point);
    if (!best || point.chiSquare < best.chiSquare) best = point;
  }
  const acceptedProfile = profile.filter(point => point.chiSquare <= best.chiSquare + 1);
  return {model, ...best, scaleMeaning: model === 'thin-ring' ? 'angular emission-ring diameter' : 'angular Gaussian FWHM',
    numberFittedParameters: 2, fluxPolicy: 'One compact flux shared across training years; unchanged on holdout',
    grid, formalDeltaChiSquare1GridInterval: [acceptedProfile[0].scaleMicroas, acceptedProfile.at(-1).scaleMicroas],
    intervalScope: 'Conditional diagonal-error grid profile only; not an accepted physical confidence interval when model/calibration assumptions fail.', profile};
}
function buildReport() {
  const {dataset, manifest, protocol} = loadInputs(), p = protocol.value;
  const minimum = p.rowSelection.minimumBaselineWavelengths;
  const selected = dataset.value.rows.filter(row => row.baselineWavelengths >= minimum);
  const training = selected.filter(row => p.trainingYears.includes(row.year));
  const holdout = selected.filter(row => p.holdoutYears.includes(row.year));
  requireTrue(training.length > 2 && holdout.length > 2, 'Insufficient training/holdout observations.');
  const models = p.models.map(definition => {
    const fit = fitModel(training, definition.id, p);
    const trainingResult = statistics(training, fit, p.diagnosticCriteria), holdoutResult = statistics(holdout, fit, p.diagnosticCriteria);
    return {fit, training: trainingResult, holdout: holdoutResult,
      comparisonPassed: trainingResult.diagnosticPassed && holdoutResult.diagnosticPassed};
  });
  return {schema: 'GFM-EHT-observation-comparison/1', prepared: '2026-10-11', verificationPassed: true,
    comparisonPassed: models.some(model => model.comparisonPassed),
    data: {publisher: dataset.value.publisher, release: dataset.value.release, commit: dataset.value.commit,
      sourceDoi: manifest.value.doi, primaryPaper: manifest.value.primaryPaper, license: dataset.value.license,
      totalRows: dataset.value.rowCount, selectedRows: selected.length, trainingRows: training.length, holdoutRows: holdout.length,
      excludedRows: dataset.value.rowCount - selected.length, datasets: dataset.value.datasets, units: dataset.value.units},
    provenance: {datasetSha256: dataset.sha256, sourceManifestSha256: manifest.sha256, protocolSha256: protocol.sha256,
      modelImplementationSha256: hash(fs.readFileSync(__filename))},
    protocol: p, models,
    limitations: ['Publisher RMS treated as independent Gaussian amplitude errors; gain correlations and low-SNR amplitude likelihood are omitted.',
      'Stationary circular geometry and shared flux omit source variability, brightness asymmetry and extended emission.',
      'Held-out failures remain reported; no 2013 refitting or post-hoc error floor is used.',
      'These intensity amplitudes contain no order-parameter phase, vorticity, polarimetric or separate density/temperature/magnetic measurements.',
      'Geometric emission ring is not identified with the Kerr geometric shadow. No GR radiative-transfer or MHD/phase-law validation follows.'],
    scope: p.scientificScope};
}
function getReport() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'public/observation-report.json'), 'utf8')); }
module.exports = {buildReport, getReport, predictAmplitude, shapeAmplitude, besselJ0, fitModel};
if (require.main === module) {
  const report = buildReport(), text = JSON.stringify(report, null, 2) + '\n';
  fs.writeFileSync(path.join(ROOT, 'public/observation-report.json'), text);
  fs.writeFileSync(path.join(ROOT, 'validation/observation-fit-report.json'), text);
  process.stdout.write(JSON.stringify({verificationPassed: report.verificationPassed, comparisonPassed: report.comparisonPassed,
    data: report.data, models: report.models.map(model => ({id: model.fit.model, scaleMicroas: model.fit.scaleMicroas,
      fluxJy: model.fit.fluxJy, trainingRms: model.training.normalizedResidualRms,
      holdoutRms: model.holdout.normalizedResidualRms, holdoutWithin3Sigma: model.holdout.fractionWithin3Sigma}))}) + '\n');
}
