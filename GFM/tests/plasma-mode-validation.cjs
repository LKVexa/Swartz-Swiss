'use strict';

// Independent analytic continuum references, not engine ledger replicas.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createModel, EPS0, MU0, C0 } = require('../backend/cylinder-em.cjs');
const { drudeMidpoint, ELEMENTARY_CHARGE, ELECTRON_MASS } = require('../backend/material-physics.cjs');
const { createPhaseHistory } = require('../backend/phase-history.cjs');

function bessel(order, x) {
  // Independent convergent series on the first J1 radial cavity mode.
  let term = order === 0 ? 1 : x / 2, sum = term;
  for (let k = 1; k < 100; k++) { term *= -x * x / (4 * k * (k + order)); sum += term; }
  return sum;
}
function relativeL2(values, exact, volumes) {
  let difference = 0, norm = 0;
  for (let i = 0; i < values.length; i++) { difference += (values[i] - exact[i]) ** 2 * volumes[i]; norm += exact[i] ** 2 * volumes[i]; }
  return Math.sqrt(difference / norm);
}

test('independent lossless uniform-plasma cylindrical continuum mode converges for E, H and current', t => {
  const errors = [];
  const ne = 1e17, alpha = ne * ELEMENTARY_CHARGE ** 2 / ELECTRON_MASS;
  for (const nr of [16, 32, 64]) {
    const model = createModel({ resolutionR: nr, resolutionZ: 2 * nr,
      pulseFrequencyHz: 2e9, sourceEnabled: false, spongeRatePerSecond: 0,
      sigmaSPerM: 0, sigmaLiquidSPerM: 0, cylinderRadiusM: 0,
      wallThicknessM: 0, bottomThicknessM: 0, plasmaRegion: 'outside-cover',
      plasmaElectronDensityPerM3: ne, plasmaCollisionFrequencyPerSecond: 0,
      initialCondition: { type: 'pec-eigenmode', amplitudeVPerM: 1 } });
    const initial = model.snapshot();
    const R = initial.parameters.radiusM, L = initial.parameters.lengthM;
    const kr = 3.8317059702075125 / R, kz = Math.PI / L;
    // The independent continuum dispersion includes both cavity k and
    // frozen-density plasma frequency. No discrete engine eigenvalue is used.
    const omega = Math.sqrt(C0 ** 2 * (kr ** 2 + kz ** 2) + alpha / EPS0);
    const T = 0.17 * 2 * Math.PI / omega;
    model.step(T);
    const snapshot = model.snapshot({ includeStaggered: true });
    const g = snapshot.grid, s = snapshot.staggered;
    const exactE = [], exactJ = [], exactHr = [], exactHz = [];
    for (let k = 0; k < g.nz; k++) for (let i = 0; i < g.nr; i++) {
      const shape = bessel(1, kr * g.rM[i]) * Math.sin(kz * g.zM[k]);
      exactE.push(shape * Math.cos(omega * T));
      exactJ.push(alpha * shape * Math.sin(omega * T) / omega);
    }
    for (let k = 0; k <= g.nz; k++) for (let i = 0; i < g.nr; i++) exactHr.push(kz * bessel(1, kr * g.rM[i]) * Math.cos(kz * k * g.dzM) * Math.sin(omega * T) / (MU0 * omega));
    for (let k = 0; k < g.nz; k++) for (let i = 0; i <= g.nr; i++) exactHz.push(-kr * bessel(0, kr * i * g.drM) * Math.sin(kz * g.zM[k]) * Math.sin(omega * T) / (MU0 * omega));
    errors.push({ E: relativeL2(s.EphiVPerM, exactE, s.volumesE),
      J: relativeL2(s.JpPhiAPerM2, exactJ, s.volumesE),
      Hr: relativeL2(s.HrAPerM, exactHr, s.volumesHr),
      Hz: relativeL2(s.HzAPerM, exactHz, s.volumesHz) });
    assert.ok(snapshot.diagnostics.relativeEnergyBalanceResidual < 1e-11);
    assert.ok(snapshot.diagnostics.plasmaDriftEnergyJ > 0);
    assert.equal(snapshot.diagnostics.plasmaCollisionHeatJ, 0);
    assert.equal(snapshot.diagnostics.coverOhmicHeatJ, 0);
  }
  for (const component of ['E', 'J', 'Hr', 'Hz']) {
    assert.ok(errors[0][component] / errors[1][component] > 3, `${component}: ${JSON.stringify(errors)}`);
    assert.ok(errors[1][component] / errors[2][component] > 3, `${component}: ${JSON.stringify(errors)}`);
    assert.ok(errors[2][component] < 1e-3, `${component} final error ${errors[2][component]}`);
  }
  t.diagnostic(`INDEPENDENT_PLASMA_MODE ${JSON.stringify(errors)}`);
});

test('independent collisional Drude transient has second-order temporal convergence and exact midpoint work partition', t => {
  const alpha = 4, nu = 0.7, omega = 1.3, T = 5;
  // E(t)=cos(omega t), J(0)=0, from solving Jdot+nu J=alpha E.
  const exact = alpha * (nu * Math.cos(omega * T) + omega * Math.sin(omega * T) - nu * Math.exp(-nu * T)) / (nu ** 2 + omega ** 2);
  const errors = [];
  for (const N of [100, 200, 400]) {
    const dt = T / N;
    let J = 0, collisionalHeat = 0, electricalWork = 0;
    for (let n = 0; n < N; n++) {
      const Emid = Math.cos(omega * (n + 0.5) * dt);
      const next = drudeMidpoint(J, Emid, alpha, nu, dt);
      electricalWork += dt * next.currentMid * Emid;
      collisionalHeat += next.heatDensity;
      J = next.current;
    }
    errors.push(Math.abs(J - exact));
    assert.ok(Math.abs(J * J / (2 * alpha) + collisionalHeat - electricalWork) < 1e-12);
    assert.ok(collisionalHeat > 0);
  }
  assert.ok(errors[0] / errors[1] > 3.9);
  assert.ok(errors[1] / errors[2] > 3.9);
  t.diagnostic(`INDEPENDENT_DRUDE_TRANSIENT ${JSON.stringify(errors)}`);
});

test('finite-window peak envelope recovers the declared carrier phase, group delay and node mask', () => {
  const frequency = 2e9, omega = 2 * Math.PI * frequency;
  const history = createPhaseHistory({ size: 3, carrierFrequencyHz: frequency,
    samplesPerCycle: 64, windowCycles: 2, referenceIndex: 0,
    amplitudeFloorVPerM: 0.01, fixedAmplitudeScaleVPerM: 10 });
  history.record(0, [2, 3 * Math.cos(0.4), 0]);
  assert.equal(history.snapshot(0).phaseAnalysis.status, 'warming-up');
  for (let n = 1; n <= 256; n++) {
    const t = n / (frequency * 64);
    // cos(omega t-0.4)=Re{3 exp(+0.4i) exp(-i omega t)}.
    history.record(t, [2 * Math.cos(omega * t), 3 * Math.cos(omega * t - 0.4), 0]);
  }
  const result = history.snapshot(2e-9);
  assert.equal(result.phaseAnalysis.status, 'ready');
  assert.ok(Math.abs(result.fields.envelopeAmplitudeVPerM[1] - 3) < 1e-12);
  assert.ok(Math.abs(result.fields.relativeCarrierPhaseRad[1] - 0.4) < 1e-12);
  assert.equal(result.fields.relativeCarrierPhaseRad[2], null);
  assert.equal(result.fields.carrierPhaseValidMask[2], 0);
  assert.equal(result.phaseAnalysis.groupDelaySeconds, 5e-10);
  assert.ok(Math.abs(result.phaseAnalysis.analysisTimeSeconds - 1.5e-9) < 1e-24);
});
