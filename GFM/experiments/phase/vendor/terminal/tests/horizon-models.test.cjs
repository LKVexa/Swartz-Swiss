'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const R = require('../src/horizon-gr.js');
const S = require('../src/horizon-scenario.js');
const H = require('../src/horizon-models.js');
const c = (re, im = 0) => ({ re, im });
const mod3 = n => (n % 3 + 3) % 3;
const mul9 = (a, b) => mod3(a % 3 * (b % 3) - Math.floor(a / 3) * Math.floor(b / 3))
  + 3 * mod3(a % 3 * Math.floor(b / 3) + Math.floor(a / 3) * (b % 3));
const sub9 = (a, b) => mod3(a % 3 - b % 3) + 3 * mod3(Math.floor(a / 3) - Math.floor(b / 3));
const add9 = (a, b) => mod3(a % 3 + b % 3) + 3 * mod3(Math.floor(a / 3) + Math.floor(b / 3));
const chi9 = x => c(Math.cos(2 * Math.PI * mod3(2 * (x % 3)) / 3), Math.sin(2 * Math.PI * mod3(2 * (x % 3)) / 3));
const times = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Number.isFinite(actual));
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}
function vectorClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, x) => { close(value.re, expected[x].re); close(value.im, expected[x].im); });
}
function norm(values) { return Math.sqrt(values.reduce((sum, value) => sum + value.re ** 2 + value.im ** 2, 0)); }
function fourier9(values, inverse = false) {
  return Array.from({ length: 9 }, (_, k) => values.reduce((sum, value, x) => {
    const phase = chi9(mul9(k, x));
    if (inverse) phase.im = -phase.im;
    const product = times(phase, value); return c(sum.re + product.re / 3, sum.im + product.im / 3);
  }, c(0)));
}
function expectedValue(component, M, a, Q, r, theta) {
  const sigma = r ** 2 + a ** 2 * Math.cos(theta) ** 2;
  if (component === 'gtt') return -(r ** 2 - 2 * M * r + Q ** 2 + a ** 2 * Math.cos(theta) ** 2) / sigma;
  return a * (2 * M * r - Q ** 2) / ((r ** 2 + a ** 2) * sigma + a ** 2 * (2 * M * r - Q ** 2) * Math.sin(theta) ** 2);
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test('universal horizon adapter loads without browser or package dependencies', () => {
  assert.equal(globalThis.RusslHorizonModels, H);
  const context = vm.createContext({});
  for (const file of ['engine.js', 'refined-field.js', 'refined-scalar.js', 'gfm-matrix.js', 'gfm-exact.js', 'gfm-models.js', 'horizon-gr.js', 'horizon-scenario.js', 'horizon-models.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);
  }
  assert.equal(context.RusslHorizonModels.profile('gf9', 'gtt', 1, .6, .3, 2, 8, 1).passed, true);
  assert.equal(context.RusslHorizonModels.toyProfile('gf9', 'aggiePassage').preparedState, null);
});

for (const component of ['gtt', 'frameOmega']) {
  test(`radial ${component} profile retains independently calculated exterior samples, scale and units`, () => {
    const M = 2, a = .4, Q = .3, rMin = 5, rMax = 9, theta = .7;
    const result = H.profile(E.field('gf9'), component, M, a, Q, rMin, rMax, theta);
    const nodes = Array.from({ length: 9 }, (_, x) => 5 + x / 2);
    const values = nodes.map(r => c(expectedValue(component, M, a, Q, r, theta)));
    result.samples.forEach((sample, x) => { assert.equal(sample.label, x); close(sample.r, nodes[x]); close(sample.theta, theta); close(sample.value, values[x].re); });
    const scale = norm(values), normalized = values.map(value => c(value.re / scale));
    close(result.transform.scale, scale); close(result.preparation.originalL2Scale, scale);
    vectorClose(result.transform.originalValues, values);
    vectorClose(result.preparedState, fourier9(normalized));
    vectorClose(result.transform.restoredValues, values);
    vectorClose(fourier9(result.preparedState, true).map(value => c(value.re * scale, value.im * scale)), values);
    assert.equal(result.codec.kind, 'horizon-radial-grid'); assert.equal(result.codec.component, component);
    assert.equal(result.codec.units, component === 'gtt' ? 'dimensionless' : 'inverse geometrized length');
    assert.deepEqual(result.codec.nodes, nodes); assert.deepEqual(result.codec.referenceParameters, { M, a, Q });
    assert.deepEqual(result.codec.range, [rMin, rMax]); assert.equal(result.preparation.field, 'gf9');
    assert.equal(result.passed, true); assert.equal(result.reference.passed, true); close(norm(result.preparedState), 1);
    assert.match(result.scope, /No Lorentzian metric isometry/);
    assert.match(result.preparation.scope, /not a spacetime coordinate change/);
    assert.equal(Object.hasOwn(result, 'transformedMetric'), false);
  });
}

test('profile dimensional scaling preserves gtt but changes frameOmega and its retained scale inversely', () => {
  const scale = 10, theta = 1.1;
  for (const component of ['gtt', 'frameOmega']) {
    const base = H.profile('gf9', component, 1, .6, .3, 2, 8, theta);
    const scaled = H.profile('gf9', component, 10, 6, 3, 20, 80, theta);
    const factor = component === 'gtt' ? 1 : 1 / scale;
    scaled.samples.forEach((value, x) => close(value.value, base.samples[x].value * factor));
    close(scaled.preparation.originalL2Scale, base.preparation.originalL2Scale * factor);
    vectorClose(scaled.preparedState, base.preparedState);
    assert.deepEqual(scaled.codec.nodes, base.codec.nodes.map(r => r * scale));
    assert.deepEqual(scaled.codec.referenceParameters, { M: 10, a: 6, Q: 3 });
  }
});

test('signed rotation reverses the frame signal rather than converting spin to a finite-field coefficient', () => {
  const positive = H.profile('gf9', 'frameOmega', 1, .6, .3, 2, 8, 1);
  const negative = H.profile('gf9', 'frameOmega', 1, -.6, .3, 2, 8, 1);
  negative.samples.forEach((sample, x) => close(sample.value, -positive.samples[x].value));
  close(negative.transform.scale, positive.transform.scale);
  vectorClose(negative.preparedState, positive.preparedState.map(value => c(-value.re, -value.im)));
  assert.equal(negative.codec.referenceParameters.a, -.6);
});

test('zero frame-dragging data retains an explicit zero signal without inventing a normalized state', () => {
  for (const id of Object.keys(E.fields)) {
    const result = H.profile(id, 'frameOmega', 1, 0, .3, 3, 8, 1);
    assert.equal(result.encoding, 'zero-signal-no-state'); assert.equal(result.preparedState, null);
    assert.equal(result.transform, undefined); assert.equal(result.preparation, undefined);
    assert.ok(result.samples.every(sample => sample.value === 0));
    assert.equal(result.codec.units, 'inverse geometrized length');
    assert.equal(result.passed, true); assert.match(result.scope, /no normalized amplitude preparation/);
  }
});

test('all registered fields transport real component samples without changing their ordinary Lorentzian domain', () => {
  for (const id of Object.keys(E.fields)) {
    const f = E.field(id), result = H.profile(E.fields[id], 'gtt', 1, .6, .3, 2, 8, 1);
    assert.equal(result.samples.length, f.q); assert.equal(result.preparation.field, id);
    close(norm(result.preparedState), 1);
    result.samples.forEach(sample => {
      const g = R.metric(1, .6, .3, sample.r, sample.theta);
      assert.equal(g.signature, '-+++'); assert.equal(g.checks.lorentzianSignature.passed, true);
      close(sample.value, g.matrix[0][0]);
    });
    assert.equal(result.passed, true);
  }
});

test('hypothetical profiles retain toy-status codecs and distinguish zero passage data from a prepared amplitude', () => {
  const aperture = H.toyProfile('gf9', 'aperture');
  const gas = H.toyProfile('gf9', 'gaseousPassage');
  const aggie = H.toyProfile('gf9', 'aggiePassage');
  assert.equal(aperture.codec.kind, 'hypothetical-spin-grid'); assert.equal(aperture.codec.sourceStatus, 'toy-assumption');
  assert.equal(aperture.codec.coordinate, 'alpha=a/M'); assert.equal(aperture.codec.units, 'toy length');
  assert.deepEqual(aperture.codec.nodes, Array.from({ length: 9 }, (_, x) => x / 8));
  const radii = aperture.codec.nodes.map(alpha => alpha > .8 ? Math.sqrt(1 - (.8 / alpha) ** 2) : 0);
  vectorClose(aperture.transform.originalValues, radii.map(value => c(value)));
  vectorClose(aperture.preparedState, fourier9(radii.map(value => c(value / Math.sqrt(radii.reduce((sum, r) => sum + r * r, 0))))));
  vectorClose(gas.transform.originalValues, aperture.codec.nodes.map(alpha => c(alpha > .8 ? 1 : 0)));
  assert.equal(gas.codec.units, 'binary passage bit'); assert.equal(gas.preparation.family, 'hypothetical-gaseousPassage');
  assert.equal(aggie.encoding, 'zero-signal-no-state'); assert.equal(aggie.preparedState, null);
  assert.equal(aggie.preparation, null); assert.equal(aggie.transform, null); assert.equal(aggie.passed, true);
  assert.match(aperture.preparation.scope, /does not establish a traversable wormhole/);
});

test('zero-cover toy branch has identical passage signals and Fourier encodings, with assumption metadata retained', () => {
  const input = { aggieLoad: 0 }, before = plain(input);
  const gas = H.toyProfile('gf9', 'gaseousPassage', input), aggie = H.toyProfile('gf9', 'aggiePassage', input);
  vectorClose(gas.transform.originalValues, aggie.transform.originalValues);
  vectorClose(gas.preparedState, aggie.preparedState);
  assert.equal(gas.preparation.originalL2Scale, aggie.preparation.originalL2Scale);
  assert.equal(gas.codec.sourceStatus, 'toy-assumption'); assert.equal(aggie.codec.sourceStatus, 'toy-assumption');
  assert.deepEqual(input, before);
});

test('profile rejects nonphysical coordinates, unknown components, substituted fields and unbounded signal preparation', () => {
  const bad = [
    () => H.profile('gf9', 'matrix', 1, .6, .3, 2, 8, 1),
    () => H.profile('gf9', 'gtt', 1, .6, .3, 8, 2, 1),
    () => H.profile('gf9', 'gtt', 1, .6, .3, 2, 2, 1),
    () => H.profile('gf9', 'gtt', 1, .6, .3, NaN, 8, 1),
    () => H.profile('gf9', 'gtt', 1, .6, .3, 2, Infinity, 1),
    () => H.profile('gf9', 'gtt', 1, .6, .3, 2, 8, 0),
    () => H.profile('gf9', 'gtt', 1, .6, .3, 2, 8, Math.PI),
    () => H.profile('gf9', 'gtt', 1, .6, .3, 1, 8, 1),
    () => H.profile('gf9', 'gtt', 1, .6, .8, 2, 8, 1),
    () => H.profile('gf9', 'frameOmega', 1e-12, .6e-12, .3e-12, 2e-12, 8e-12, 1),
    () => H.profile({ ...E.field('gf9') }, 'gtt', 1, .6, .3, 2, 8, 1),
    () => H.toyProfile('gf9', 'unsupported'), () => H.toyProfile('gf9', 'aperture', { inventedLaw: 1 }),
    () => H.toyProfile('gf9', 'aperture', { epsilonSpin: .4, Q: .8 }),
    () => H.toyProfile('gf9', 'aperture', { epsilonSpin: 0, Q: Number.MIN_VALUE })
  ];
  bad.forEach(run => assert.throws(run));
  const input = { aggieLoad: 0 }, before = plain(input);
  assert.throws(() => H.toyProfile('gf9', 'aperture', { ...input, epsilonSpin: -.1 }));
  assert.deepEqual(input, before);
});

test('finite Fourier transport cannot classify the hidden branch of identical declared exterior observations', () => {
  const first = H.profile('gf9', 'gtt', 1, .99, 0, 2, 8, Math.PI / 2);
  const second = H.profile('gf9', 'gtt', 1, .99, 0, 2, 8, Math.PI / 2);
  const rawA = first.samples.map(sample => sample.value), rawB = second.samples.map(sample => sample.value);
  const comparison = S.compare(rawA, rawB, .7);
  assert.equal(comparison.identical, true); assert.equal(comparison.posteriorGaseous, .7);
  assert.equal(comparison.optimalAccuracy, .7);
  vectorClose(first.preparedState, second.preparedState);
  assert.equal(first.preparation.originalL2Scale, second.preparation.originalL2Scale);
  const psi = first.preparedState;
  assert.deepEqual(first.codec.referenceParameters, second.codec.referenceParameters);
  assert.equal(psi.length, 9);
});

test('full reapplication saves complete source coverage and keeps metric tensors separate from finite amplitude operators', () => {
  const registry = JSON.parse(fs.readFileSync(path.join(__dirname, '../horizon-equations.json'), 'utf8'));
  const previous = JSON.parse(fs.readFileSync(path.join(__dirname, '../equation-audit.json'), 'utf8'));
  const originalRegistry = JSON.stringify(registry), originalPrevious = JSON.stringify(previous);
  const report = H.all(registry, previous), saved = plain(report);
  assert.deepEqual(saved.entries.map(entry => entry.id), registry.entries.map(entry => entry.id));
  assert.equal(new Set(saved.entries.map(entry => entry.id)).size, registry.entries.length);
  assert.equal(saved.coverage.newFindings, registry.entries.length);
  assert.equal(saved.coverage.pdfNumberedEquations, 23);
  assert.equal(saved.coverage.previousFindings, 20); assert.equal(saved.coverage.previousImageFamilies, 3);
  const findings = Object.fromEntries(saved.entries.map(entry => [entry.id, entry]));
  for (const id of ['pdf-01', 'pdf-02', 'pdf-04', 'pdf-05', 'pdf-08', 'pdf-09', 'pdf-14', 'pdf-15', 'pdf-16', 'pdf-17', 'pdf-18', 'pdf-19', 'pdf-20', 'image-etm-schwarzschild', 'image-etm-rn', 'image-event-functions', 'image-event-frame-dragging']) {
    assert.equal(findings[id].outcome, 'reference-calculated', id);
    assert.equal(findings[id].resultLocation, 'standard', id);
    assert.equal(findings[id].applied, false, id);
    assert.match(findings[id].scope, /does not execute a theorem, mode equation or formation process/, id);
  }
  for (const id of ['pdf-03', 'pdf-07', 'pdf-21', 'pdf-22', 'pdf-23', 'narrative-third-law', 'image-etm-kerr-fragment', 'image-etm-kn-fragment', 'image-event-metric-fragment']) {
    assert.equal(findings[id].outcome, 'reference-only', id);
    assert.equal(findings[id].applied, false, id);
    assert.match(findings[id].scope, /No executable physical law or PDE solver/, id);
  }
  assert.equal(findings['image-tensor-map'].outcome, 'logical-map-transformed');
  assert.equal(findings['image-tensor-map'].resultLocation, 'logicalMap');
  assert.equal(findings['image-aperture-radius'].outcome, 'hypothetical-rule-evaluated');
  assert.equal(findings['image-aperture-radius'].status, 'toy-assumption');
  assert.equal(saved.standard.schwarzschild.a, 0); assert.equal(saved.standard.schwarzschild.Q, 0);
  assert.equal(saved.standard.neutralRotating.Q, 0);
  assert.equal(saved.standard.reissnerNordstrom.a, 0); assert.equal(saved.standard.reissnerNordstrom.Q, .3);
  close(saved.standard.reissnerNordstrom.rPlus, 1 + Math.sqrt(.91));
  close(saved.standard.reissnerNordstrom.rMinus, 1 - Math.sqrt(.91));
  assert.equal(saved.standard.reissnerNordstrom.smarr.passed, true);
  assert.equal(saved.standard.reissnerNordstrom.massRelation.passed, true);
  assert.equal(saved.standard.chargedMetric.signature, '-+++');
  assert.equal(saved.standard.chargedMetric.domain, R.metric(1, .6, .3, 3, Math.PI / 3).domain);
  const expectedMetric = R.metric(1, .6, .3, 3, Math.PI / 3).matrix;
  saved.standard.chargedMetric.matrix.forEach((row, i) => row.forEach((value, j) => close(value, expectedMetric[i][j])));
  const rn = saved.standard.reissnerNordstromMetric;
  assert.deepEqual(rn.parameters, { M: 1, a: 0, Q: .3, r: 3, theta: Math.PI / 2 });
  close(rn.matrix[0][0], -(1 - 2 / 3 + .09 / 9));
  close(rn.matrix[1][1], 1 / (1 - 2 / 3 + .09 / 9));
  assert.ok(Math.abs(rn.matrix[0][3]) === 0);
  assert.equal(rn.passed, true);
  const metrics = Object.values(saved.standard).filter(value => value.matrix);
  assert.equal(metrics.length, 4);
  assert.equal(saved.checks.metric.passed, metrics.every(value => value.passed));
  assert.equal(saved.checks.metric.residual, Math.max(...metrics.map(value => value.checks.determinant.residual)));
  assert.equal(Object.hasOwn(saved.standard.chargedMetric, 'transformedOperator'), false);
  assert.match(saved.logicalMap.scope, /not a rank-\(1,1\) spacetime tensor/);
  assert.equal(saved.logicalMap.reapplication.dimension, 4); assert.equal(saved.logicalMap.reapplication.field, 'gf4');
  assert.equal(saved.observerResult.comparison.identical, true);
  assert.equal(saved.observerResult.comparison.posteriorGaseous, .5);
  close(saved.observerResult.transformedDifference, 0);
  assert.deepEqual(saved.observerResult.observations.gaseous, saved.observerResult.observations.aggie);
  assert.equal(saved.toyProfiles.aggiePassage.preparedState, null);
  assert.equal(saved.toyProfiles.aggiePassage.preparation, null);
  assert.equal(saved.finalState.field, 'gf9'); close(norm(saved.finalState.vector), 1);
  const samples = Array.from({ length: 9 }, (_, x) => c(-1 + 2 / (2 + .75 * x)));
  const scale = norm(samples), psi = fourier9(samples.map(value => c(value.re / scale)));
  const expected = psi.map((_, x) => times(chi9(add9(mul9(4, x), 5)), psi[sub9(3, x)]));
  vectorClose(saved.radialProfile.transform.originalValues, samples);
  vectorClose(saved.finalState.vector, expected);
  assert.deepEqual(saved.finalState.preparation.subsequentOperations, ['gf.displace 3 4', 'gf.reflect 3 4']);
  assert.deepEqual(saved.finalState.preparation.codec.referenceParameters, { M: 1, a: .99, Q: 0 });
  assert.equal(saved.finalState.audit.passed, true); assert.equal(saved.finalState.wigner.passed, true);
  assert.equal(saved.passed, true);
  assert.equal(JSON.stringify(registry), originalRegistry); assert.equal(JSON.stringify(previous), originalPrevious);
});
