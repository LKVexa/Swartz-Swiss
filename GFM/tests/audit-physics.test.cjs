'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createModel, EPS0, MU0, C0 } = require('../backend/cylinder-em.cjs');
const { ELEMENTARY_CHARGE: eCharge, ELECTRON_MASS: me, BOLTZMANN: kB, specificEnthalpy, temperatureFromEnthalpy, stateFromIncrement, drudeMidpoint, contactTransfer } = require('../backend/material-physics.cjs');
const { createPhaseHistory } = require('../backend/phase-history.cjs');
const sum = a => a.reduce((s, x) => s + x, 0);
const integrate = (a, w) => a.reduce((s, x, i) => s + x * w[i], 0);
function close(a, b, relative = 1e-10, absolute = 1e-28) { assert.ok(Math.abs(a - b) <= absolute + relative * Math.max(Math.abs(a), Math.abs(b)), `${a} != ${b}`); }
function bessel(order, x) {
  let t = order ? x / 2 : 1, s = t;
  for (let k = 1; k < 100; k++) { t *= -x * x / (4 * k * (k + order)); s += t; if (Math.abs(t) < 1e-18) break; }
  return s;
}
const quiet = { resolutionR: 16, resolutionZ: 32, pulseFrequencyHz: 1e9, sourceEnabled: false, spongeRatePerSecond: 0, sigmaSPerM: 0, sigmaLiquidSPerM: 0 };
const uniformPlasma = { ...quiet, plasmaRegion: 'outside-cover', cylinderRadiusM: 0, wallThicknessM: 0, bottomThicknessM: 0, cylinderLengthM: 0, plasmaElectronDensityPerM3: 1e17, plasmaCollisionFrequencyPerSecond: 0, initialCondition: { type: 'pec-eigenmode', amplitudeVPerM: 1000 } };

test('new material, plasma and waveform controls reject invalid physical inputs', () => {
  for (const p of [{ plasmaElectronDensityPerM3: -1 }, { plasmaCollisionFrequencyPerSecond: -1 }, { plasmaFillFraction: 1.01 }, { plasmaIonChargeNumber: 0 }, { plasmaRegion: 'hall' }, { sigmaLiquidSPerM: -1 }, { solidusTemperatureK: 650, liquidusTemperatureK: 650 }, { latentHeatJPerKg: -1 }, { thermalContactConductanceWPerM3K: -1 }, { conductivityTemperatureCoefficientPerK: -1 }, { phaseWindowCycles: 0 }, { phaseSamplesPerCycle: 1 }, { phaseAmplitudeFloorVPerM: NaN }]) assert.throws(() => createModel(p));
});

test('zero density is the exact Maxwell vacuum limit and forbids unsupported initial plasma current', () => {
  const a = createModel(quiet), b = createModel({ ...quiet, plasmaElectronDensityPerM3: 0, plasmaCollisionFrequencyPerSecond: 1e14 });
  a.step(1e-10); b.step(1e-10);
  assert.deepEqual(a.snapshot().fields.EphiVPerM, b.snapshot().fields.EphiVPerM);
  const s = b.snapshot(); assert.equal(s.diagnostics.plasmaDriftEnergyJ, 0); assert.equal(s.diagnostics.plasmaCollisionHeatJ, 0);
  assert.ok(s.fields.plasmaJphiAPerM2.every(x => x === 0));
  assert.throws(() => b.setFields({ JpPhiAPerM2: new Array(512).fill(1) }), /must vanish/);
});

test('cavity plasma and cover fill are disjoint geometrically and use full-cell normalization', () => {
  const m = createModel({ ...quiet, plasmaElectronDensityPerM3: 1e17, plasmaFillFraction: .4, coverFraction: .3 }), s = m.snapshot();
  const fp = s.fields.plasmaFillFraction, fc = s.fields.materialFillFraction, p = s.parameters, V = s.grid.cellVolumesM3;
  for (let i = 0; i < fp.length; i++) {
    assert.ok(fp[i] + fc[i] <= 1 + 1e-15);
    close(s.fields.plasmaAlphaSI[i], fp[i] * p.plasmaElectronDensityPerM3 * eCharge ** 2 / me);
    close(s.fields.plasmaHeatCapacityJPerM3K[i], 1.5 * fp[i] * p.plasmaElectronDensityPerM3 * (1 + 1 / p.plasmaIonChargeNumber) * kB);
  }
  const innerR = p.cylinderRadiusM - p.wallThicknessM;
  const expected = p.plasmaFillFraction * Math.PI * innerR ** 2 * (p.cylinderLengthM - p.bottomThicknessM * (1 + p.coverFraction));
  close(integrate(fp, V), expected, 2e-14);
});

test('one live Drude step matches an independent midpoint current and collision-heat calculation', () => {
  const m = createModel({ ...uniformPlasma, plasmaCollisionFrequencyPerSecond: 2e9 }), raw = m.snapshot();
  const Jold = raw.fields.EphiVPerM.map((E, i) => raw.fields.plasmaAlphaSI[i] * E / 2e10);
  m.setFields({ JpPhiAPerM2: Jold }); const before = m.snapshot();
  assert.ok(before.diagnostics.maxElectronDriftSpeedMPerS > 0);
  const dt = m.dtMaxSeconds / 2; m.step(dt); const after = m.snapshot();
  for (let i = 0; i < Jold.length; i++) {
    const Emid = (before.fields.EphiVPerM[i] + after.fields.EphiVPerM[i]) / 2, alpha = before.fields.plasmaAlphaSI[i], nu = before.parameters.plasmaCollisionFrequencyPerSecond;
    const Jnew = ((1 - nu * dt / 2) * Jold[i] + dt * alpha * Emid) / (1 + nu * dt / 2);
    const Jmid = (Jold[i] + Jnew) / 2, heat = dt * nu * Jmid ** 2 / alpha;
    close(after.fields.plasmaJphiAPerM2[i], Jnew, 1e-12);
    close(after.fields.plasmaCollisionDepositedEnergyDensityJPerM3[i], heat, 1e-12);
    close(after.fields.plasmaDriftEnergyDensityJPerM3[i], Jnew ** 2 / (2 * alpha), 1e-12);
  }
  assert.ok(after.diagnostics.relativeEnergyBalanceResidual < 2e-10);
});

test('collisionless current returns energy without creating heat and conserves field plus drift', () => {
  const m = createModel(uniformPlasma), initial = m.snapshot().diagnostics.initialEnergyJ;
  let minimumWork = Infinity, maximumWork = -Infinity;
  for (let j = 0; j < 30; j++) {
    m.step(1e-11); const s = m.snapshot();
    const work = integrate(s.fields.plasmaCurrentWorkDensityWPerM3, s.grid.cellVolumesM3);
    minimumWork = Math.min(minimumWork, work); maximumWork = Math.max(maximumWork, work);
    close(s.diagnostics.fieldEnergyJ + s.diagnostics.plasmaDriftEnergyJ, initial, 2e-10);
    assert.equal(s.diagnostics.plasmaCollisionHeatJ, 0); assert.equal(s.diagnostics.plasmaThermalEnergyJ, 0);
  }
  assert.ok(minimumWork < 0 && maximumWork > 0, `${minimumWork}, ${maximumWork}`);
});

function modeCoefficients(omegaVac, alpha, nu, time) {
  // Independent high-resolution RK4 of the continuum modal ODE.
  let x = [1, 0, 0, 0]; const dt = time / 3000;
  const rhs = a => [-(omegaVac ** 2) * a[1] - a[2] / EPS0, a[0], alpha * a[0] - nu * a[2], nu * a[2] ** 2 / alpha];
  for (let j = 0; j < 3000; j++) {
    const a = rhs(x), b = rhs(x.map((v, i) => v + dt * a[i] / 2)), c = rhs(x.map((v, i) => v + dt * b[i] / 2)), d = rhs(x.map((v, i) => v + dt * c[i]));
    x = x.map((v, i) => v + dt * (a[i] + 2 * b[i] + 2 * c[i] + d[i]) / 6);
  }
  return x;
}
function plasmaModalError(nr, nu) {
  const m = createModel({ ...uniformPlasma, resolutionR: nr, resolutionZ: nr * 2, plasmaCollisionFrequencyPerSecond: nu }), initial = m.snapshot();
  const kr = 3.8317059702075125 / initial.parameters.radiusM, kz = Math.PI / initial.parameters.lengthM;
  const omegaVac = C0 * Math.hypot(kr, kz), alpha = 1e17 * eCharge ** 2 / me;
  const t = .9 / Math.sqrt(omegaVac ** 2 + alpha / EPS0), [electric, integralE, current] = modeCoefficients(omegaVac, alpha, nu, t);
  m.step(t); const s = m.snapshot({ includeStaggered: true });
  let error = 0, norm = 0;
  const add = (actual, exact, weight) => { error += weight * (actual - exact) ** 2; norm += weight * exact ** 2; };
  const dr = s.grid.drM, dz = s.grid.dzM;
  for (let k = 0; k < s.grid.nz; k++) for (let i = 0; i < s.grid.nr; i++) {
    const j = k * nr + i, shape = 1000 * bessel(1, kr * (i + .5) * dr) * Math.sin(kz * (k + .5) * dz);
    add(s.staggered.EphiVPerM[j], shape * electric, EPS0 * s.staggered.volumesE[j]);
    add(s.staggered.JpPhiAPerM2[j], shape * current, s.staggered.volumesE[j] / alpha);
  }
  for (let k = 0; k <= s.grid.nz; k++) for (let i = 0; i < nr; i++) {
    const j = k * nr + i, exact = 1000 * kz / MU0 * bessel(1, kr * (i + .5) * dr) * Math.cos(kz * k * dz) * integralE;
    add(s.staggered.HrAPerM[j], exact, MU0 * s.staggered.volumesHr[j]);
  }
  for (let k = 0; k < s.grid.nz; k++) for (let i = 0; i <= nr; i++) {
    const j = k * (nr + 1) + i, exact = -1000 * kr / MU0 * bessel(0, kr * i * dr) * Math.sin(kz * (k + .5) * dz) * integralE;
    add(s.staggered.HzAPerM[j], exact, MU0 * s.staggered.volumesHz[j]);
  }
  return Math.sqrt(error / norm);
}
test('cold-plasma dispersion and collision damping approach continuum modes under grid/time refinement', () => {
  for (const nu of [0, 2e9]) {
    const errors = [16, 32, 64].map(n => plasmaModalError(n, nu));
    assert.ok(errors[1] < errors[0] / 3 && errors[2] < errors[1] / 3, JSON.stringify({ nu, errors }));
    assert.ok(errors[2] < .001, JSON.stringify({ nu, errors }));
    process.stdout.write(`DRUDE_REFINEMENT ${JSON.stringify({ nu, errors })}\n`);
  }
});

test('prescribed harmonic Drude forcing has the negative-carrier complex response and second-order convergence', () => {
  const alpha = 2.3, nu = .7, omega = 2.1, period = 2 * Math.PI / omega;
  const exact = t => alpha * (nu * Math.cos(omega * t) + omega * Math.sin(omega * t)) / (nu ** 2 + omega ** 2);
  const errors = [32, 64, 128].map(n => {
    let J = exact(0), heat = 0, work = 0; const dt = period / n, initial = J ** 2 / (2 * alpha);
    for (let j = 0; j < n; j++) {
      const E = Math.cos(omega * (j + .5) * dt), step = drudeMidpoint(J, E, alpha, nu, dt);
      work += dt * step.currentMid * E; heat += step.heatDensity; J = step.current;
    }
    close(work, J ** 2 / (2 * alpha) - initial + heat, 2e-13, 1e-15);
    return Math.abs(J - exact(period));
  });
  assert.ok(errors[1] < errors[0] / 3.8 && errors[2] < errors[1] / 3.8, `${errors}`);
});

test('cover enthalpy inverts sensible and latent heat and preserves tiny increments at both phase boundaries', () => {
  const p = createModel().parameters;
  for (const T of [0, 293.15, 599, 600, 620, 650, 700]) close(temperatureFromEnthalpy(specificEnthalpy(T, p), p), T, 1e-14, 1e-13);
  for (const [T0, q] of [[p.solidusTemperatureK, 1e-20], [p.liquidusTemperatureK, -1e-20]]) {
    const state = stateFromIncrement(q, { ...p, initialTemperatureK: T0 });
    close(state.temperatureRiseK, q / (p.materialHeatCapacityJPerKgK + p.latentHeatJPerKg / (p.liquidusTemperatureK - p.solidusTemperatureK)), 1e-14, 1e-40);
    close(p.materialHeatCapacityJPerKgK * state.temperatureRiseK + p.latentHeatJPerKg * state.liquidFractionChange, q, 1e-14, 1e-40);
  }
});

test('a synthetic low-capacity material melts, changes conductivity, and retains fixed cover geometry', () => {
  const m = createModel({ ...quiet, sigmaSPerM: .02, sigmaLiquidSPerM: .005, conductivityTemperatureCoefficientPerK: .01, conductivityReferenceTemperatureK: 299.5, materialDensityKgPerM3: .001, materialHeatCapacityJPerKgK: .001, initialTemperatureK: 299.5, solidusTemperatureK: 299.75, liquidusTemperatureK: 300, latentHeatJPerKg: .0001, coverFraction: .6, initialCondition: { type: 'pec-eigenmode', amplitudeVPerM: 1000 } });
  const original = m.snapshot(); m.step(5e-10); const s = m.snapshot(), p = s.parameters;
  assert.ok(s.diagnostics.maxCoverLiquidFraction > 0, `${s.diagnostics.maxCoverLiquidFraction}`);
  assert.equal(s.diagnostics.geometricClearAreaM2, original.diagnostics.geometricClearAreaM2);
  assert.deepEqual(s.fields.materialFillFraction, original.fields.materialFillFraction);
  for (let i = 0; i < s.fields.materialFillFraction.length; i++) if (s.fields.materialFillFraction[i] > 0) {
    const fc = s.fields.materialFillFraction[i], f = s.fields.coverLiquidFraction[i], T = s.fields.temperatureK[i];
    const sigma = fc * ((1 - f) * p.sigmaSPerM + f * p.sigmaLiquidSPerM) / (1 + p.conductivityTemperatureCoefficientPerK * Math.max(0, T - p.conductivityReferenceTemperatureK));
    close(s.fields.conductivitySPerM[i], sigma, 1e-13);
    const stored = fc * p.materialDensityKgPerM3 * (p.materialHeatCapacityJPerKgK * s.fields.temperatureRiseK[i] + p.latentHeatJPerKg * f);
    close(s.fields.coverThermalEnergyDensityJPerM3[i], stored, 2e-10);
  }
  assert.ok(s.diagnostics.relativeEnergyBalanceResidual < 1e-9);
});

test('local thermal contact matches an independent backward-Euler transfer and cannot overshoot equilibrium', () => {
  const p = { ...createModel().parameters, materialHeatCapacityJPerKgK: 2, initialTemperatureK: 290 };
  const input = { plasmaEnergyDensity: 0, coverEnergyDensity: 0, plasmaCapacity: 2, coverMassDensity: 1.5, conductance: 4, dt: .5, plasmaInitialTemperatureK: 310, parameters: p };
  const q = contactTransfer(input), exact = input.dt * input.conductance * 20 / (1 + input.dt * input.conductance * (1 / 2 + 1 / 3));
  close(q, exact, 1e-13);
  for (const conductance of [1e-6, 4, 1e12]) {
    const transfer = contactTransfer({ ...input, conductance });
    assert.ok(transfer >= 0 && transfer <= 2 * 20);
    assert.ok(310 - transfer / 2 >= 290 + transfer / 3 - 1e-12);
  }
});

test('live partial-cell thermal contact conserves both stores without electromagnetic heating', () => {
  const m = createModel({ ...quiet, plasmaElectronDensityPerM3: 1e17, plasmaInitialTemperatureK: 450, thermalContactConductanceWPerM3K: 1e8, coverFraction: .4 });
  m.step(1e-11); const s = m.snapshot();
  assert.equal(s.diagnostics.fieldEnergyJ, 0); assert.equal(s.diagnostics.coverOhmicHeatJ, 0); assert.equal(s.diagnostics.plasmaCollisionHeatJ, 0);
  assert.ok(s.diagnostics.contactTransferToCoverJ > 0);
  close(s.diagnostics.coverThermalEnergyJ, s.diagnostics.contactTransferToCoverJ, 1e-13);
  close(s.diagnostics.plasmaThermalEnergyJ, -s.diagnostics.contactTransferToCoverJ, 1e-13);
  assert.ok(s.diagnostics.relativeEnergyBalanceResidual < 1e-12);
});

test('contact resolves unequal tiny temperature increments above equal large base temperatures', () => {
  const p = { ...createModel().parameters, materialHeatCapacityJPerKgK: 2 };
  const transfer = contactTransfer({ plasmaEnergyDensity: 2e-20, coverEnergyDensity: 0, plasmaCapacity: 2, coverMassDensity: 1.5, conductance: 4, dt: .5, plasmaInitialTemperatureK: p.initialTemperatureK, parameters: p });
  const exact = .5 * 4 * 1e-20 / (1 + .5 * 4 * (1 / 2 + 1 / 3));
  close(transfer, exact, 1e-13, 1e-35);
});

test('live source/plasma/cover/sponge ledger counts thermal storage exactly once', () => {
  const m = createModel({ plasmaElectronDensityPerM3: 1e17, sigmaLiquidSPerM: .01 }); m.step(8e-10); const s = m.snapshot(), d = s.diagnostics, V = s.grid.cellVolumesM3;
  assert.ok(d.plasmaDriftEnergyJ > 0 && d.plasmaCollisionHeatJ > 0 && d.coverOhmicHeatJ > 0 && d.spongeLossJ > 0);
  close(d.plasmaDriftEnergyJ, integrate(s.fields.plasmaDriftEnergyDensityJPerM3, V), 1e-13);
  close(d.plasmaThermalEnergyJ, integrate(s.fields.plasmaThermalEnergyDensityJPerM3, V), 1e-13);
  close(d.coverThermalEnergyJ, integrate(s.fields.coverThermalEnergyDensityJPerM3, V), 1e-13);
  close(d.totalStoredEnergyJ + d.spongeLossJ - d.initialEnergyJ, d.sourceWorkJ, 2e-10);
  assert.ok(Math.abs(d.cumulativeHeatLedgerResidualJ) < Math.abs(d.sourceWorkJ) * 2e-10);
  assert.ok(d.maxElectronDriftSpeedFractionOfC < .001);
});

test('finite sampled-history demodulation returns peak envelope and correct relative negative-carrier phase', () => {
  const carrier = 4e9, samples = 32, cycles = 2, floor = .01;
  const history = createPhaseHistory({ size: 3, carrierFrequencyHz: carrier, samplesPerCycle: samples, windowCycles: cycles, referenceIndex: 0, amplitudeFloorVPerM: floor, fixedAmplitudeScaleVPerM: 100 });
  for (let j = 0; j <= samples * cycles; j++) {
    const t = j / (carrier * samples);
    history.record(t, [3 * Math.cos(2 * Math.PI * carrier * t + .2), 2.5 * Math.cos(2 * Math.PI * carrier * t - .6), .001 * Math.cos(2 * Math.PI * carrier * t)]);
    if (j < samples * cycles) assert.ok(history.snapshot(t).fields.relativeCarrierPhaseRad.every(x => x === null));
  }
  const s = history.snapshot(cycles / carrier);
  close(s.fields.envelopeAmplitudeVPerM[0], 3, 1e-14); close(s.fields.envelopeAmplitudeVPerM[1], 2.5, 1e-14);
  close(s.fields.relativeCarrierPhaseRad[1], .8, 1e-13);
  assert.equal(s.fields.relativeCarrierPhaseRad[2], null); assert.equal(s.fields.carrierPhaseValidMask[2], 0);
  assert.equal(s.phaseAnalysis.status, 'ready'); close(s.phaseAnalysis.analysisTimeSeconds, cycles / (2 * carrier), 1e-14);
});

test('a weak reference masks phase even for a strong measured carrier', () => {
  const f = 1e9, history = createPhaseHistory({ size: 2, carrierFrequencyHz: f, samplesPerCycle: 32, windowCycles: 1, referenceIndex: 0, amplitudeFloorVPerM: .1, fixedAmplitudeScaleVPerM: 20 });
  for (let k = 0; k <= 32; k++) history.record(k / (32 * f), [0, 10 * Math.cos(2 * Math.PI * k / 32)]);
  const s = history.snapshot(1 / f); assert.equal(s.phaseAnalysis.status, 'reference-below-floor'); assert.deepEqual(s.fields.relativeCarrierPhaseRad, [null, null]);
  close(s.fields.envelopeAmplitudeVPerM[1], 10, 1e-14);
});

test('live phase history warms up, exposes its total-field reference and resets reproducibly with plasma', () => {
  const p = { plasmaElectronDensityPerM3: 1e17, phaseAmplitudeFloorVPerM: .05 };
  const m = createModel(p); assert.equal(m.snapshot().phaseAnalysis.status, 'warming-up'); m.step(8e-10);
  const s = m.snapshot(); assert.equal(s.phaseAnalysis.status, 'ready');
  assert.equal(s.phaseAnalysis.reference.kind, 'computed-total-field-probe');
  assert.equal(s.phaseAnalysis.sampledReferenceHistory.length, 65);
  const index = s.phaseAnalysis.reference.gridIndex; close(s.fields.relativeCarrierPhaseRad[index], 0, 0, 1e-15);
  assert.ok(s.phaseAnalysis.analysisTimeSeconds < s.timeSeconds);
  const before = JSON.stringify(s); m.reset(); m.step(8e-10); assert.equal(JSON.stringify(m.snapshot()), before);
});

test('plasma frequency, collisions and cover conductivity bound the accuracy timestep', () => {
  const m = createModel({ ...uniformPlasma, plasmaElectronDensityPerM3: 1e19, plasmaCollisionFrequencyPerSecond: 1e12 }), s = m.snapshot();
  assert.ok(s.diagnostics.maxCollisionStepRatio <= .2 + 1e-15);
  assert.ok(s.diagnostics.maxPlasmaFrequencyStepRatio <= .1 + 1e-15);
  const hot = createModel({ ...quiet, sigmaSPerM: .01, sigmaLiquidSPerM: 1, initialTemperatureK: 700 });
  assert.ok(hot.dtMaxSeconds <= .2 * EPS0);
});
