'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const G = require('../src/gfm-matrix.js');
const H = require('../src/horizon-scenario.js');

function close(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}
const zeros = () => Array.from({ length: 4 }, () => Array(4).fill(0));

test('scenario module has identical CommonJS and browser entry points', () => {
  assert.equal(globalThis.RusslHorizonScenario, H);
  assert.equal(Object.isFrozen(H), true);
  assert.equal(Object.isFrozen(H.defaults), true);
  const context = vm.createContext({});
  for (const name of ['engine.js', 'gfm-matrix.js', 'horizon-scenario.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), context, { filename: name });
  }
  assert.equal(typeof context.RusslHorizonScenario.scenario, 'function');
  assert.equal(context.RusslHorizonScenario.scenario().observations.comparison.identical, true);
});

test('aperture critical equality is closed and opening is restricted to the upper side', () => {
  const critical = .8, r0 = 2;
  assert.equal(H.aperture(0, critical, r0), 0);
  assert.equal(H.aperture(critical - 1e-12, critical, r0), 0);
  assert.equal(H.aperture(critical, critical, r0), 0);
  assert.ok(H.aperture(critical + 1e-12, critical, r0) > 0);
  close(H.aperture(1, critical, r0), 1.2);
  assert.equal(H.aperture(0, 0, r0), 0);
  assert.equal(H.aperture(.5, 0, r0), r0);
  const closed = H.scenario({ epsilonSpin: .2, alphaCritical: critical });
  assert.equal(closed.alpha, critical);
  assert.equal(closed.branches.gaseous.geometricOpen, false);
  assert.equal(closed.branches.gaseous.passage, 0);
  assert.match(closed.thresholdConventions.aperture, /equality is closed/);
});

test('integrated cover mass uses density times area rather than the density alone', () => {
  const patches = [{ density: 3, area: 2 }, { density: 5, area: 4 }];
  const copy = structuredClone(patches);
  const load = H.coverLoad(patches);
  assert.equal(load.integratedMass, 26);
  assert.equal(load.totalArea, 6);
  close(load.meanSurfaceDensity, 26 / 6);
  assert.match(load.scope, /mass\/area/);
  assert.match(load.scope, /units of mass/);
  assert.match(load.scope, /threshold must use the same units/);
  assert.deepEqual(patches, copy);
  assert.equal(H.coverLoad([{ density: 0, area: 2 }]).integratedMass, 0);
});

test('spin/critical control round trip closes at complementary decimal equality without a broad tolerance', () => {
  const result = H.scenario({ epsilonSpin: .7, alphaCritical: .3 });
  assert.equal(result.alpha, .3);
  assert.equal(result.exterior.a, .3);
  assert.equal(result.branches.gaseous.geometricOpen, false);
  assert.equal(result.branches.gaseous.apertureRadius, 0);
  assert.ok(H.aperture(.3 + Number.EPSILON, .3, 1) > 0);
  assert.equal(H.aperture(.3 - Number.EPSILON, .3, 1), 0);
  assert.ok(H.scenario({ epsilonSpin: .7 - Number.EPSILON, alphaCritical: .3 }).branches.gaseous.geometricOpen);
  assert.equal(H.scenario({ epsilonSpin: .7 + Number.EPSILON, alphaCritical: .3 }).branches.gaseous.geometricOpen, false);
  assert.equal(H.scenario({ aggieLoad: .9 - Number.EPSILON, sealThreshold: .9 }).branches.aggie.cover, 0);
  assert.equal(H.scenario({ aggieLoad: .9, sealThreshold: .9 }).branches.aggie.cover, 1);
});

test('seal threshold equality seals the Aggie branch while the lower side stays unsealed', () => {
  for (const [load, cover] of [[.999999999999, 0], [1, 1], [1.000000000001, 1]]) {
    const result = H.scenario({ epsilonSpin: .01, alphaCritical: .8, aggieLoad: load, sealThreshold: 1 });
    assert.equal(result.branches.aggie.cover, cover);
    assert.equal(result.branches.aggie.passage, 1 - cover);
    assert.equal(result.branches.gaseous.passage, 1);
  }
  const load = H.coverLoad([{ density: .5, area: 2 }]).integratedMass;
  assert.equal(H.scenario({ aggieLoad: load }).branches.aggie.cover, 1);
  assert.match(H.scenario().thresholdConventions.cover, /equality is sealed/);
});

test('equal shared exterior observations leave every prior unchanged', () => {
  for (const prior of [0, .1, .5, .8, 1]) {
    const comparison = H.compare([2, .5, -.3], [2, .5, -.3], prior);
    assert.equal(comparison.identical, true);
    assert.equal(comparison.posteriorGaseous, prior);
    assert.equal(comparison.optimalAccuracy, Math.max(prior, 1 - prior));
    const result = H.scenario({ priorGaseous: prior });
    assert.deepEqual(result.observations.gaseous, result.observations.aggie);
    assert.deepEqual(result.observations.labels, ['M', 'a', 'Q']);
    assert.equal(result.observations.comparison.posteriorGaseous, prior);
    assert.match(comparison.scope, /Hidden formation\/cover labels are excluded/);
  }
});

test('a Fourier basis change cannot distinguish two identical observable encodings', () => {
  const exterior = H.scenario().observations;
  const gas = G.sampleTransform('gf3', exterior.gaseous);
  const aggie = G.sampleTransform('gf3', exterior.aggie);
  assert.deepEqual(gas.transformedState, aggie.transformedState);
  const real = H.compare(gas.transformedState.map(x => x.re), aggie.transformedState.map(x => x.re), .3);
  const imaginary = H.compare(gas.transformedState.map(x => x.im), aggie.transformedState.map(x => x.im), .3);
  assert.equal(real.identical, true);
  assert.equal(imaginary.identical, true);
  assert.equal(real.posteriorGaseous, .3);
  assert.equal(imaginary.posteriorGaseous, .3);
  assert.deepEqual(E.probabilities(gas.transformedState), E.probabilities(aggie.transformedState));
});

test('optional passage probe distinguishes only a declared branch difference and relaxes the all-tests premise', () => {
  const open = H.scenario({ epsilonSpin: .01, aggieLoad: 2, priorGaseous: .7 });
  assert.equal(open.observations.comparison.identical, true);
  assert.deepEqual(open.optionalPassageProbe.gaseous, [1]);
  assert.deepEqual(open.optionalPassageProbe.aggie, [0]);
  assert.equal(open.optionalPassageProbe.comparison.identical, false);
  assert.equal(open.optionalPassageProbe.comparison.posteriorGaseous, null);
  assert.equal(open.optionalPassageProbe.comparison.optimalAccuracy, 1);
  assert.match(open.optionalPassageProbe.comparison.conclusion, /relaxes any premise/);
  assert.match(open.optionalPassageProbe.physicalStatus, /contradicts the all-tests-indistinguishable premise/);
  for (const input of [{ aggieLoad: 0 }, { epsilonSpin: .2 }, { epsilonSpin: 1 }]) {
    const result = H.scenario(input);
    assert.equal(result.optionalPassageProbe.comparison.identical, true);
    assert.equal(result.optionalPassageProbe.comparison.posteriorGaseous, .5);
  }
});

test('sealed zero-signal profile has a zero transform but no normalized state', () => {
  for (const id of ['gf3', 'gf4', 'gf8', 'gf9', 'gf16']) {
    const f = E.field(id), result = H.samples(id), profile = result.profiles.aggiePassage;
    assert.equal(profile.encoding, 'zero-signal-no-state');
    assert.deepEqual(profile.values, Array(f.q).fill(0));
    assert.equal(profile.scale, 0);
    assert.equal(profile.preparedState, null);
    assert.equal(profile.transform, undefined);
    assert.match(profile.scope, /cannot prepare a normalized state/);
    const rawZero = profile.values.map(re => ({ re, im: 0 }));
    assert.deepEqual(E.fourier(f, rawZero), rawZero);
    assert.equal(result.passed, true);
    for (const name of ['aperture', 'gaseousPassage']) {
      const encoded = result.profiles[name];
      assert.equal(encoded.encoding, 'normalized-signal');
      assert.ok(encoded.scale > 0);
      close(E.norm(encoded.preparedState), 1);
      assert.equal(encoded.transform.passed, true);
    }
  }
});

test('unsealed passage profiles match and coordinate order is an explicit real sample grid', () => {
  const result = H.samples(E.fields.gf9, { aggieLoad: 0 });
  assert.equal(result.cover, 0);
  assert.deepEqual(result.profiles.aggiePassage.values, result.profiles.gaseousPassage.values);
  assert.deepEqual(result.profiles.aggiePassage.preparedState, result.profiles.gaseousPassage.preparedState);
  assert.deepEqual(result.nodes, Array.from({ length: 9 }, (_, i) => i / 8));
  assert.deepEqual(result.profiles.gaseousPassage.values, [0, 0, 0, 0, 0, 0, 0, 1, 1]);
  assert.match(result.coordinate, /uniform \[0,1\] grid/);
  assert.match(result.scope, /not finite-field ordering/);
});

test('logical equivalence identity is GF4 bookkeeping with spin epsilon kept separate', () => {
  const state = E.basisState(4, 2), copy = structuredClone(state);
  const mapped = H.map(0, zeros(), state);
  assert.equal(mapped.epsilonMap, 0);
  assert.deepEqual(mapped.families, ['Schwarzschild', 'Reissner–Nordström', 'Kerr', 'Kerr–Newman']);
  assert.equal(mapped.reapplication.field, 'gf4');
  assert.equal(mapped.reapplication.unitarity.isUnitary, true);
  assert.equal(mapped.reapplication.outputNormalized, true);
  assert.ok(E.compare(mapped.reapplication.output, state) < 1e-12);
  assert.deepEqual(state, copy);
  assert.equal(mapped.statePreserved, true);
  assert.match(mapped.parameterScope, /independent of epsilonSpin/);
  assert.match(mapped.scope, /not a rank-\(1,1\) spacetime tensor/);
});

test('nonunitary I+epsilonMap*K retains the calculated output norm without renormalization', () => {
  const K = zeros(); K[0][0] = 1;
  const state = E.basisState(4, 0), copy = structuredClone(state), kcopy = structuredClone(K);
  const mapped = H.map(1, K, state);
  assert.equal(mapped.reapplication.unitarity.isUnitary, false);
  assert.equal(mapped.reapplication.outputNormalized, false);
  close(mapped.reapplication.norms.input, 1);
  close(mapped.reapplication.norms.directOutput, 2);
  close(mapped.reapplication.norms.transformedOutput, 2);
  close(mapped.reapplication.norms.output, 2);
  close(mapped.reapplication.output[0].re, 2);
  assert.equal(mapped.passed, true, 'Basis covariance can pass for a nonunitary operator');
  assert.match(mapped.scope, /no implicit renormalization/);
  assert.deepEqual(state, copy);
  assert.deepEqual(K, kcopy);
  const complex = zeros(); complex[0][1] = { re: 0, im: 1 };
  const imaginaryMap = H.map(.5, complex, E.basisState(4, 1));
  close(imaginaryMap.reapplication.output[0].im, .5);
  close(imaginaryMap.reapplication.norms.output, Math.sqrt(1.25));
});

test('malformed scalar parameters, exterior violations and direct aperture arguments are rejected', () => {
  for (const input of [null, [], new Date(), { unknown: 1 }, { M: 0 }, { Q: 2 }, { epsilonSpin: -1 },
    { epsilonSpin: 1.1 }, { alphaCritical: 1 }, { r0: 0 }, { aggieLoad: -1 }, { sealThreshold: 0 },
    { priorGaseous: 1.1 }, { M: NaN }, { r0: Infinity }, { Q: '0' }]) {
    assert.throws(() => H.parameters(input));
  }
  for (const args of [[-1, .8, 1], [1.1, .8, 1], [NaN, .8, 1], ['1', .8, 1],
    [1, -1, 1], [1, 1, 1], [1, Infinity, 1], [1, .8, 0], [1, .8, Infinity]]) {
    assert.throws(() => H.aperture(...args), /must be finite/);
  }
  for (const value of [null, {}, { ...E.field('gf4') }, 4]) assert.throws(() => H.samples(value), /registered field/);
  assert.throws(() => H.samples('gf999'), /Unknown field/);
});

test('dense-array limits, patch schemas and logical map dimensions are enforced', () => {
  for (const patches of [[], Array(257).fill({ density: 1, area: 1 }), [{ density: 1, area: 0 }],
    [{ density: -1, area: 1 }], [{ density: 1, area: 1, extra: 0 }], new Array(1)]) {
    assert.throws(() => H.coverLoad(patches));
  }
  assert.throws(() => H.coverLoad([{ density: 1e6, area: 1e6 }, { density: 1, area: 1 }]), /Integrated load too large/);
  for (const [gas, aggie, prior] of [[[], [], .5], [[1], [1, 2], .5], [new Array(1), [1], .5],
    [[Infinity], [1], .5], [[1], ['1'], .5], [[1], [1], -1]]) assert.throws(() => H.compare(gas, aggie, prior));
  for (const K of [null, [], Array(3).fill([1, 0, 0, 0]), new Array(4), [[1], [1], [1], [1]]]) {
    assert.throws(() => H.map(.1, K));
  }
  assert.throws(() => H.map(-.1, zeros()), /epsilonMap/);
  assert.throws(() => H.map(.1, zeros(), [2, 0, 0, 0]), /normalized input/);
  assert.throws(() => H.map(.1, zeros(), [1, 0, 0]), /dimension|length/i);
});

test('accessor-backed parameters, observations, patches, K, and state reject without reads or mutation', () => {
  let reads = 0;
  const input = {}; Object.defineProperty(input, 'M', { enumerable: true, get() { reads += 1; return 1; } });
  assert.throws(() => H.scenario(input), /data properties/);
  const patch = { area: 1 }; Object.defineProperty(patch, 'density', { enumerable: true, get() { reads += 1; return 1; } });
  assert.throws(() => H.coverLoad([patch]), /data properties/);
  const observations = [1]; Object.defineProperty(observations, '0', { enumerable: true, get() { reads += 1; return 1; } });
  assert.throws(() => H.compare(observations, [1]), /data entries/);
  const K = zeros(); Object.defineProperty(K[0], '0', { enumerable: true, get() { reads += 1; return 1; } });
  const state = E.basisState(4, 0), copy = structuredClone(state);
  assert.throws(() => H.map(.1, K, state), /data entries/);
  assert.deepEqual(state, copy);
  const accessorState = E.basisState(4, 0); Object.defineProperty(accessorState, '0', { enumerable: true, get() { reads += 1; return { re: 1, im: 0 }; } });
  assert.throws(() => H.map(.1, zeros(), accessorState), /data entries/);
  assert.equal(reads, 0);
  const good = { M: 1, Q: 0, epsilonSpin: .01 };
  const before = structuredClone(good); H.scenario(good); H.samples('gf9', good);
  assert.deepEqual(good, before);
});

test('hypothetical passage, formation, electromagnetism and timelessness remain qualified assumptions', () => {
  const result = H.scenario();
  assert.equal(result.branches.gaseous.status, 'toy-assumption');
  assert.equal(result.branches.aggie.status, 'toy-assumption');
  assert.equal(result.electromagneticClaim.status, 'unresolved');
  assert.match(result.electromagneticClaim.reason, /No charge\/current distribution/);
  assert.match(result.scope, /No gaseous\/solid distinction is inferred/);
  assert.match(result.scope, /spin is not a model of timelessness/);
  assert.match(result.optionalPassageProbe.physicalStatus, /No travel experiment or traversable metric/);
});
