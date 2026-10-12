'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const O = require('../backend/observations.cjs');
const ROOT = path.resolve(__dirname, '..');
test('visibility kernels preserve zero-spacing flux and the independent first J0 zero', () => {
  assert.equal(O.predictAmplitude('thin-ring', 40, .8, 0, 0), .8);
  assert.equal(O.predictAmplitude('gaussian', 40, .8, 0, 0), .8);
  const firstRoot = 2.4048255576957728;
  const baseline = firstRoot / (Math.PI * 40 * Math.PI / (180 * 3600 * 1e6));
  assert.ok(O.predictAmplitude('thin-ring', 40, .8, baseline, 0) < 1e-12);
  assert.ok(O.predictAmplitude('gaussian', 40, .8, baseline, 0) > .05);
  assert.equal(O.predictAmplitude('thin-ring', 40, 0, baseline, 0), 0);
});
test('visibility API rejects unknown models and nonfinite/unbounded physical inputs', () => {
  assert.throws(() => O.predictAmplitude('phase-law', 40, .8, 1e9, 0), /Unknown/);
  assert.throws(() => O.predictAmplitude('thin-ring', NaN, .8, 1e9, 0), /domain/);
  assert.throws(() => O.predictAmplitude('gaussian', 40, -1, 1e9, 0), /domain/);
  assert.throws(() => O.predictAmplitude('thin-ring', 121, .8, 1e9, 0), /domain/);
});
test('actual EHT source fit retains the fixed year holdout and reports its failure', () => {
  const report = O.buildReport();
  assert.equal(report.verificationPassed, true);
  assert.equal(report.comparisonPassed, false);
  assert.deepEqual(report.protocol.trainingYears, [2011, 2012]);
  assert.deepEqual(report.protocol.holdoutYears, [2013]);
  assert.deepEqual([report.data.totalRows, report.data.trainingRows, report.data.holdoutRows, report.data.excludedRows], [486, 173, 146, 167]);
  for (const model of report.models) {
    assert.equal(model.training.diagnosticPassed, true);
    assert.equal(model.holdout.diagnosticPassed, false);
    assert.equal(model.comparisonPassed, false);
    assert.ok(model.training.predictions.every(row => [2011, 2012].includes(row.year)));
    assert.ok(model.holdout.predictions.every(row => row.year === 2013));
    assert.ok(model.holdout.normalizedResidualRms > 10);
    assert.ok(model.holdout.fractionWithin3Sigma < .1);
    const fitInput = model.training.predictions.map(row => ({...row}));
    const fitted = O.fitModel(fitInput, model.fit.model, report.protocol);
    assert.equal(fitted.scaleMicroas, model.fit.scaleMicroas);
    assert.equal(fitted.fluxJy, model.fit.fluxJy);
  }
  assert.deepEqual(report, O.getReport());
  assert.equal(fs.readFileSync(path.join(ROOT, 'public/observation-report.json'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'validation/observation-fit-report.json'), 'utf8'));
});
