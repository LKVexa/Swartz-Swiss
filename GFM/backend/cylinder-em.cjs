'use strict';

// Axisymmetric TE-phi Maxwell equations in SI units. E_phi is at annular
// cell centres; H_r and H_z occupy the axial and radial dual faces. The two
// curls are negative weighted adjoints. Implicit midpoint then satisfies the
// physical quadratic energy balance, including Ohmic and impressed work.
const EPS0 = 8.8541878128e-12;
const MU0 = 1.25663706212e-6;
const C0 = 1 / Math.sqrt(EPS0 * MU0);
const TWO_PI = 2 * Math.PI;
const { ELEMENTARY_CHARGE, ELECTRON_MASS, BOLTZMANN, stateFromIncrement, coverConductivity, drudeMidpoint, contactTransfer } = require('./material-physics.cjs');
const { createPhaseHistory } = require('./phase-history.cjs');
const DEFAULTS = Object.freeze({
  resolutionR: 32, resolutionZ: 64, radiusM: 0.06, lengthM: 0.32,
  cylinderStartM: 0.10, cylinderLengthM: 0.16, cylinderRadiusM: 0.045,
  wallThicknessM: 0.006, bottomThicknessM: 0.008, coverFraction: 0,
  sigmaSPerM: 0.02, materialDensityKgPerM3: 1000,
  materialHeatCapacityJPerKgK: 1000, initialTemperatureK: 293.15,
  sigmaLiquidSPerM: null, solidusTemperatureK: 600, liquidusTemperatureK: 650,
  latentHeatJPerKg: 2e5, conductivityTemperatureCoefficientPerK: 0,
  conductivityReferenceTemperatureK: 293.15,
  plasmaElectronDensityPerM3: 0, plasmaFillFraction: 1, plasmaRegion: 'cavity',
  plasmaCollisionFrequencyPerSecond: 2e9, plasmaIonChargeNumber: 1,
  plasmaInitialTemperatureK: 293.15, thermalContactConductanceWPerM3K: 0,
  sourceEnabled: true, sourceCurrentAmplitudeAPerM2: 30,
  pulseFrequencyHz: 6e9, pulseWidthSeconds: 1e-10,
  pulsePeriodSeconds: 8.5e-10, sourceStartSeconds: 1.5e-10,
  sourceCenterZM: 0.035, sourceCenterRM: 0.028,
  sourceWidthZM: 0.005, sourceWidthRM: 0.012,
  spongeRatePerSecond: 8e9, spongeFraction: 0.12,
  phaseWindowCycles: 2, phaseSamplesPerCycle: 32, phaseAmplitudeFloorVPerM: 0.05,
  phaseReferenceRM: 0.028, phaseReferenceZM: 0.065, displayAmplitudeScaleVPerM: 100,
  initialCondition: null,
});

const ASSUMPTIONS = Object.freeze([
  'Axisymmetric TE-phi Maxwell model: E_phi, H_r, H_z depend on radius and axial position; azimuthal variation and the other polarization are absent.',
  'The displayed 3D cylinder is a rotational reconstruction of this computed r-z solution, not a general volumetric 3D solver.',
  'Fixed vacuum background permittivity/permeability; isotropic cover current and causal cold unmagnetized electron current carry the material response. The hollow shell, bottom and cover have fixed geometry. Cover fraction C leaves opening radius (R-wallThickness) sqrt(1-C). Exact geometric volume fractions homogenize partial cells; they are not conformal interfaces.',
  'Plasma: fixed intrinsic electron density and fixed plasma volume fraction; stationary ions; Jdot+nu J=alpha E, alpha=fp ne e^2/me. Drift J^2/(2 alpha) is reversible storage; nu J^2/alpha is collision heat. A declared single-temperature ideal heat capacity assumes local electron/ion thermal equilibration. No density evolution, pressure, flow, ionization, kinetic resonances or imposed magnetic bias.',
  'Cover: constant density/specific heat and equal solid/liquid density; sensible and latent heat share an enthalpy variable. A specified nonnegative solid/liquid conductivity mixture feeds back into Maxwell. Constitutive values are synthetic benchmarks, not measured aggie or black-hole material properties. Melting does not remove mass or open the fixed cover.',
  'Thermal conduction to neighbouring cells, radiation and thermal boundary flux are zero. Optional local contact g0 fp fc (Tp-Tc) transfers equal/opposite heat only where both media occupy a partial cell. Contact conductance is a declared homogenized coefficient, not a resolved interface calibration.',
  'Outer radial and both axial boundaries are PEC; E_phi is regular and vanishes on the axis. No physical escaped-energy term exists for these closed boundaries.',
  'An optional artificial electric damping layer near the outer boundaries is counted separately as sponge loss. It is not a perfectly matched layer and can reflect waves.',
  'The localized source is defined by Fphi=-Jext,phi, with Fphi=J0 G times Gaussian carrier bursts. The compatibility amplitude parameter is the forcing-current magnitude. Source work is -integral E Jext; it can be negative.',
  'Weighted-adjoint cylindrical curls and implicit midpoint are second order for frozen linear Maxwell/Drude coefficients. Conductivity is frozen per substep and implicit local contact is first order; nonlinear thermal-feedback/contact convergence must be checked independently. Energy consistency is not experimental validation.',
  'Envelope/phase uses uniformly sampled real E history and a causal Hann demodulation window. Relative phase is referenced to a computed upstream total-field probe including reflections, not a separated incident wave. Warm-up and low-amplitude masks apply; timestamps include the finite-window group delay.',
]);

function finite(name, value, min, max, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new RangeError(`${name} must be ${integer ? 'an integer' : 'a finite number'} in [${min}, ${max}]`);
  }
}
function parameters(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Parameters must be an object');
  for (const key of Object.keys(options)) if (!(key in DEFAULTS)) throw new TypeError(`Unknown parameter: ${key}`);
  const p = { ...DEFAULTS, ...options };
  finite('resolutionR', p.resolutionR, 8, 96, true);
  finite('resolutionZ', p.resolutionZ, 8, 192, true);
  finite('radiusM', p.radiusM, 0.001, 10);
  finite('lengthM', p.lengthM, 0.002, 100);
  finite('cylinderStartM', p.cylinderStartM, 0, p.lengthM);
  finite('cylinderLengthM', p.cylinderLengthM, 0, p.lengthM);
  finite('cylinderRadiusM', p.cylinderRadiusM, 0, p.radiusM);
  if (p.cylinderStartM + p.cylinderLengthM > p.lengthM) throw new RangeError('The cylinder must lie inside the domain');
  finite('wallThicknessM', p.wallThicknessM, 0, p.cylinderRadiusM);
  finite('bottomThicknessM', p.bottomThicknessM, 0, p.cylinderLengthM / 2);
  finite('coverFraction', p.coverFraction, 0, 1);
  finite('sigmaSPerM', p.sigmaSPerM, 0, 1e6);
  finite('materialDensityKgPerM3', p.materialDensityKgPerM3, 1e-3, 1e6);
  finite('materialHeatCapacityJPerKgK', p.materialHeatCapacityJPerKgK, 1e-3, 1e7);
  finite('initialTemperatureK', p.initialTemperatureK, 0, 1e8);
  if (p.sigmaLiquidSPerM === null) p.sigmaLiquidSPerM = p.sigmaSPerM;
  finite('sigmaLiquidSPerM', p.sigmaLiquidSPerM, 0, 1e6);
  finite('solidusTemperatureK', p.solidusTemperatureK, 0, 1e8);
  finite('liquidusTemperatureK', p.liquidusTemperatureK, p.solidusTemperatureK, 1e8);
  if (!(p.liquidusTemperatureK > p.solidusTemperatureK)) throw new RangeError('liquidusTemperatureK must exceed solidusTemperatureK');
  finite('latentHeatJPerKg', p.latentHeatJPerKg, 0, 1e10);
  finite('conductivityTemperatureCoefficientPerK', p.conductivityTemperatureCoefficientPerK, 0, 1);
  finite('conductivityReferenceTemperatureK', p.conductivityReferenceTemperatureK, 0, 1e8);
  finite('plasmaElectronDensityPerM3', p.plasmaElectronDensityPerM3, 0, 1e22);
  finite('plasmaFillFraction', p.plasmaFillFraction, 0, 1);
  if (!['cavity', 'outside-cover'].includes(p.plasmaRegion)) throw new RangeError('plasmaRegion must be cavity or outside-cover');
  finite('plasmaCollisionFrequencyPerSecond', p.plasmaCollisionFrequencyPerSecond, 0, 1e14);
  finite('plasmaIonChargeNumber', p.plasmaIonChargeNumber, 1, 100, true);
  finite('plasmaInitialTemperatureK', p.plasmaInitialTemperatureK, 0, 1e8);
  finite('thermalContactConductanceWPerM3K', p.thermalContactConductanceWPerM3K, 0, 1e20);
  if (typeof p.sourceEnabled !== 'boolean') throw new TypeError('sourceEnabled must be boolean');
  finite('sourceCurrentAmplitudeAPerM2', p.sourceCurrentAmplitudeAPerM2, 0, 1e8);
  finite('pulseFrequencyHz', p.pulseFrequencyHz, 1, 1e14);
  finite('pulseWidthSeconds', p.pulseWidthSeconds, 1e-16, 1);
  finite('pulsePeriodSeconds', p.pulsePeriodSeconds, 1e-16, 10);
  if (p.pulsePeriodSeconds < 2 * p.pulseWidthSeconds) throw new RangeError('pulsePeriodSeconds must be at least twice pulseWidthSeconds');
  finite('sourceStartSeconds', p.sourceStartSeconds, 0, 10);
  finite('sourceCenterZM', p.sourceCenterZM, 0, p.lengthM);
  finite('sourceCenterRM', p.sourceCenterRM, 0, p.radiusM);
  finite('sourceWidthZM', p.sourceWidthZM, 1e-6, p.lengthM);
  finite('sourceWidthRM', p.sourceWidthRM, 1e-6, p.radiusM);
  finite('spongeRatePerSecond', p.spongeRatePerSecond, 0, 1e15);
  finite('spongeFraction', p.spongeFraction, 0, 0.45);
  if (p.spongeRatePerSecond > 0 && p.spongeFraction === 0) throw new RangeError('A nonzero sponge requires a positive spongeFraction');
  finite('phaseWindowCycles', p.phaseWindowCycles, 1, 8, true);
  finite('phaseSamplesPerCycle', p.phaseSamplesPerCycle, 16, 128, true);
  finite('phaseAmplitudeFloorVPerM', p.phaseAmplitudeFloorVPerM, 0, 1e10);
  finite('phaseReferenceRM', p.phaseReferenceRM, 0, p.radiusM);
  finite('phaseReferenceZM', p.phaseReferenceZM, 0, p.lengthM);
  finite('displayAmplitudeScaleVPerM', p.displayAmplitudeScaleVPerM, 1e-12, 1e12);
  if (p.initialCondition !== null) {
    if (typeof p.initialCondition !== 'object' || p.initialCondition.type !== 'pec-eigenmode') throw new TypeError('initialCondition must be null or {type:"pec-eigenmode", amplitudeVPerM:number}');
    finite('initialCondition.amplitudeVPerM', p.initialCondition.amplitudeVPerM, -1e8, 1e8);
    p.initialCondition = Object.freeze({ type: 'pec-eigenmode', amplitudeVPerM: p.initialCondition.amplitudeVPerM });
  }
  const dr = p.radiusM / p.resolutionR, dz = p.lengthM / p.resolutionZ;
  // A wavelength must have at least eight cells in either propagation direction.
  if (C0 / p.pulseFrequencyHz < 8 * Math.max(dr, dz)) throw new RangeError('Carrier wavelength requires at least eight cells in both spatial directions; lower frequency or refine the grid');
  return Object.freeze(p);
}

function besselJ(order, x) {
  if (order !== 0 && order !== 1) throw new RangeError('Only J0 and J1 are implemented');
  let term = order === 0 ? 1 : x / 2, sum = term;
  for (let k = 1; k < 80; k++) {
    term *= -(x * x / 4) / (k * (k + order));
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 2e-16) break;
  }
  return sum;
}
function dot(a, b) { let sum = 0; for (let i = 0; i < a.length; i++) sum += a[i] * b[i]; return sum; }
function maxAbs(a) { let m = 0; for (const x of a) m = Math.max(m, Math.abs(x)); return m; }

function createModel(options = {}) {
  let p, nr, nz, n, dr, dz, e, hr, hz, weightsE, weightsR, weightsZ;
  let sqrtE, sqrtR, sqrtZ, sigma, material, materialFraction, kappa, sourceShape, sponge;
  let plasmaFraction, alphaPlasma, plasmaCapacity, jp, plasmaDeposited, plasmaThermal, coverThermal, stepKappa, phaseHistory, referenceIndex;
  let rCoordinates, zCoordinates, linksR, linksZ, diagCurl, deposited;
  let time = 0, stepCount = 0, frameCount = 0, sourceWork = 0, materialHeat = 0, spongeLoss = 0, initialEnergy = 0;
  let maximumSolverRelativeResidual = 0, maximumSolverIterations = 0, dtMax;
  let plasmaCollisionHeat = 0, contactToCover = 0, initialDriftEnergy = 0, mouthIntake = 0, maxDriftSpeed = 0;
  let scratchR, scratchZ, scratchN, rhs, oldCurl, residual, direction, preconditioned, product, newE;

  function build(nextParameters) {
    p = parameters(nextParameters);
    nr = p.resolutionR; nz = p.resolutionZ; n = nr * nz;
    dr = p.radiusM / nr; dz = p.lengthM / nz;
    e = new Float64Array(n); hr = new Float64Array(nr * (nz + 1)); hz = new Float64Array((nr + 1) * nz);
    weightsE = new Float64Array(n); weightsR = new Float64Array(hr.length); weightsZ = new Float64Array(hz.length);
    sqrtE = new Float64Array(n); sqrtR = new Float64Array(hr.length); sqrtZ = new Float64Array(hz.length);
    sigma = new Float64Array(n); material = new Uint8Array(n); materialFraction = new Float64Array(n); kappa = new Float64Array(n); sourceShape = new Float64Array(n); sponge = new Float64Array(n);
    diagCurl = new Float64Array(n); deposited = new Float64Array(n);
    plasmaFraction = new Float64Array(n); alphaPlasma = new Float64Array(n); plasmaCapacity = new Float64Array(n); jp = new Float64Array(n);
    plasmaDeposited = new Float64Array(n); plasmaThermal = new Float64Array(n); coverThermal = new Float64Array(n); stepKappa = new Float64Array(n);
    rCoordinates = Array.from({ length: nr }, (_, i) => (i + 0.5) * dr);
    zCoordinates = Array.from({ length: nz }, (_, k) => (k + 0.5) * dz);
    for (let k = 0; k < nz; k++) for (let i = 0; i < nr; i++) {
      const index = k * nr + i, r = rCoordinates[i], z = zCoordinates[k];
      const volume = Math.PI * ((i + 1) ** 2 - i ** 2) * dr * dr * dz;
      weightsE[index] = volume; sqrtE[index] = Math.sqrt(EPS0 * volume);
      const radialFraction = lower => {
        const lo = Math.max(i * dr, lower), hi = Math.min((i + 1) * dr, p.cylinderRadiusM);
        return hi > lo ? (hi * hi - lo * lo) / (((i + 1) ** 2 - i ** 2) * dr * dr) : 0;
      };
      const axialFraction = (lower, upper) => Math.max(0, Math.min((k + 1) * dz, upper) - Math.max(k * dz, lower)) / dz;
      const shellR = radialFraction(p.cylinderRadiusM - p.wallThicknessM), diskR = radialFraction(0);
      const coverR = radialFraction((p.cylinderRadiusM - p.wallThicknessM) * Math.sqrt(1 - p.coverFraction));
      const end = p.cylinderStartM + p.cylinderLengthM;
      const shellZ = axialFraction(p.cylinderStartM, end), bottomZ = axialFraction(end - p.bottomThicknessM, end), coverZ = axialFraction(p.cylinderStartM, p.cylinderStartM + p.bottomThicknessM);
      const fill = shellR * shellZ + (diskR - shellR) * bottomZ + (Math.max(shellR, coverR) - shellR) * coverZ;
      materialFraction[index] = Math.min(1, Math.max(0, fill));
      material[index] = fill > 0 ? 1 : 0;
      const cavity = (diskR - shellR) * (shellZ - bottomZ) - Math.max(0, coverR - shellR) * coverZ;
      const plasmaRegionFill = p.plasmaRegion === 'outside-cover' ? 1 - materialFraction[index] : Math.max(0, cavity);
      plasmaFraction[index] = p.plasmaFillFraction * Math.min(1 - materialFraction[index], plasmaRegionFill);
      alphaPlasma[index] = plasmaFraction[index] * p.plasmaElectronDensityPerM3 * ELEMENTARY_CHARGE ** 2 / ELECTRON_MASS;
      plasmaCapacity[index] = 1.5 * plasmaFraction[index] * p.plasmaElectronDensityPerM3 * (1 + 1 / p.plasmaIonChargeNumber) * BOLTZMANN;
      const initialCover = stateFromIncrement(0, p);
      sigma[index] = coverConductivity(initialCover.temperatureK, initialCover.liquidFraction, p) * materialFraction[index];
      const radialDepth = p.spongeFraction ? Math.max(0, (r / p.radiusM - (1 - p.spongeFraction)) / p.spongeFraction) : 0;
      const axialDepth = p.spongeFraction ? Math.max(0, (p.spongeFraction - z / p.lengthM) / p.spongeFraction, (z / p.lengthM - (1 - p.spongeFraction)) / p.spongeFraction) : 0;
      sponge[index] = p.spongeRatePerSecond * Math.max(radialDepth, axialDepth) ** 3;
      kappa[index] = sigma[index] / EPS0 + sponge[index];
      // Mirrored radial Gaussians make the scalar multiplying r even at the
      // axis: J_phi has an odd radial Taylor series and a smooth Cartesian
      // azimuthal vector. Normalize the radial profile at the specified ring.
      const ring = Math.exp(-0.5 * ((r - p.sourceCenterRM) / p.sourceWidthRM) ** 2) + Math.exp(-0.5 * ((r + p.sourceCenterRM) / p.sourceWidthRM) ** 2);
      const ringNormalization = 1 + Math.exp(-2 * (p.sourceCenterRM / p.sourceWidthRM) ** 2);
      sourceShape[index] = (r / Math.max(p.sourceCenterRM, dr)) * ring / ringNormalization * Math.exp(-0.5 * ((z - p.sourceCenterZM) / p.sourceWidthZM) ** 2);
    }
    for (let k = 0; k <= nz; k++) for (let i = 0; i < nr; i++) {
      const v = Math.PI * ((i + 1) ** 2 - i ** 2) * dr * dr * dz * (k === 0 || k === nz ? 0.5 : 1);
      const j = k * nr + i; weightsR[j] = v; sqrtR[j] = Math.sqrt(MU0 * v);
    }
    for (let k = 0; k < nz; k++) for (let i = 0; i <= nr; i++) {
      const lower = Math.max(0, (i - 0.5) * dr), upper = Math.min(p.radiusM, (i + 0.5) * dr);
      const j = k * (nr + 1) + i, v = Math.PI * (upper * upper - lower * lower) * dz;
      weightsZ[j] = v; sqrtZ[j] = Math.sqrt(MU0 * v);
    }
    // Each link is one incidence coefficient in the physical Faraday curl.
    linksR = []; linksZ = [];
    function link(target, fieldIndex, electricIndex, derivative, volumes) {
      const rate = C0 * derivative * Math.sqrt(volumes[fieldIndex] / weightsE[electricIndex]);
      target.push([fieldIndex, electricIndex, rate]); diagCurl[electricIndex] += rate * rate;
    }
    for (let k = 0; k <= nz; k++) for (let i = 0; i < nr; i++) {
      const fieldIndex = k * nr + i;
      if (k < nz) link(linksR, fieldIndex, k * nr + i, (k === 0 ? 2 : 1) / dz, weightsR);
      if (k > 0) link(linksR, fieldIndex, (k - 1) * nr + i, -(k === nz ? 2 : 1) / dz, weightsR);
    }
    for (let k = 0; k < nz; k++) for (let i = 0; i <= nr; i++) {
      const fieldIndex = k * (nr + 1) + i, area = weightsZ[fieldIndex] / dz;
      if (i < nr) link(linksZ, fieldIndex, k * nr + i, -TWO_PI * rCoordinates[i] / area, weightsZ);
      if (i > 0) link(linksZ, fieldIndex, k * nr + i - 1, TWO_PI * rCoordinates[i - 1] / area, weightsZ);
    }
    scratchR = new Float64Array(hr.length); scratchZ = new Float64Array(hz.length);
    scratchN = new Float64Array(n); rhs = new Float64Array(n); oldCurl = new Float64Array(n);
    residual = new Float64Array(n); direction = new Float64Array(n); preconditioned = new Float64Array(n); product = new Float64Array(n); newE = new Float64Array(n);
    const maxDamping = Math.max(p.sigmaSPerM, p.sigmaLiquidSPerM) / EPS0 + maxAbs(sponge);
    const maxPlasmaFrequency = Math.sqrt(maxAbs(alphaPlasma) / EPS0);
    // Midpoint is A-stable, but must resolve Ohmic relaxation to avoid its
    // non-L-stable alternating decay in a stiff conductive material.
    dtMax = Math.min(0.45 / (C0 * Math.hypot(1 / dr, 1 / dz)), 1 / (Math.max(40, p.phaseSamplesPerCycle) * p.pulseFrequencyHz), p.pulseWidthSeconds / 12, maxDamping > 0 ? 0.2 / maxDamping : Infinity, maxPlasmaFrequency > 0 ? 0.1 / maxPlasmaFrequency : Infinity, maxPlasmaFrequency > 0 && p.plasmaCollisionFrequencyPerSecond > 0 ? 0.2 / p.plasmaCollisionFrequencyPerSecond : Infinity);
    time = 0; stepCount = 0; frameCount = 0; sourceWork = 0; materialHeat = 0; spongeLoss = 0;
    maximumSolverRelativeResidual = 0; maximumSolverIterations = 0;
    plasmaCollisionHeat = 0; contactToCover = 0; initialDriftEnergy = 0; mouthIntake = 0; maxDriftSpeed = 0;
    if (p.initialCondition) {
      const kr = 3.8317059702075125 / p.radiusM, kz = Math.PI / p.lengthM;
      for (let k = 0; k < nz; k++) for (let i = 0; i < nr; i++) {
        const j = k * nr + i;
        e[j] = sqrtE[j] * p.initialCondition.amplitudeVPerM * besselJ(1, kr * rCoordinates[i]) * Math.sin(kz * zCoordinates[k]);
      }
    }
    initialEnergy = fieldEnergy();
    initializePhaseHistory();
  }
  function initializePhaseHistory() {
    referenceIndex = Math.min(nz - 1, Math.floor(p.phaseReferenceZM / dz)) * nr + Math.min(nr - 1, Math.floor(p.phaseReferenceRM / dr));
    phaseHistory = createPhaseHistory({ size: n, carrierFrequencyHz: p.pulseFrequencyHz, samplesPerCycle: p.phaseSamplesPerCycle, windowCycles: p.phaseWindowCycles, referenceIndex, amplitudeFloorVPerM: p.phaseAmplitudeFloorVPerM, fixedAmplitudeScaleVPerM: p.displayAmplitudeScaleVPerM });
    phaseHistory.record(time, Float64Array.from(e, (x, i) => x / sqrtE[i]));
  }
  function updateConductivity() {
    for (let i = 0; i < n; i++) {
      const state = materialFraction[i] > 0 ? stateFromIncrement(coverThermal[i] / (materialFraction[i] * p.materialDensityKgPerM3), p) : stateFromIncrement(0, p);
      sigma[i] = materialFraction[i] * coverConductivity(state.temperatureK, state.liquidFraction, p);
      kappa[i] = sigma[i] / EPS0 + sponge[i];
    }
  }
  function curl(input, outR, outZ) {
    outR.fill(0); outZ.fill(0);
    for (const [j, i, rate] of linksR) outR[j] += rate * input[i];
    for (const [j, i, rate] of linksZ) outZ[j] += rate * input[i];
  }
  function adjoint(inputR, inputZ, output) {
    output.fill(0);
    for (const [j, i, rate] of linksR) output[i] += rate * inputR[j];
    for (const [j, i, rate] of linksZ) output[i] += rate * inputZ[j];
  }
  function curlSquared(input, output) { curl(input, scratchR, scratchZ); adjoint(scratchR, scratchZ, output); }
  function applyMatrix(input, output, dt) {
    curlSquared(input, output);
    const factor = dt * dt / 4;
    for (let i = 0; i < n; i++) output[i] = (1 + dt * stepKappa[i] / 2) * input[i] + factor * output[i];
  }
  function pulseAt(t) {
    if (!p.sourceEnabled || p.sourceCurrentAmplitudeAPerM2 === 0) return 0;
    let value = 0;
    const first = Math.max(0, Math.ceil((t - p.sourceStartSeconds - 8 * p.pulseWidthSeconds) / p.pulsePeriodSeconds));
    const last = Math.floor((t - p.sourceStartSeconds + 8 * p.pulseWidthSeconds) / p.pulsePeriodSeconds);
    for (let q = first; q <= last; q++) {
      const elapsed = t - p.sourceStartSeconds - q * p.pulsePeriodSeconds;
      value += Math.exp(-0.5 * (elapsed / p.pulseWidthSeconds) ** 2) * Math.cos(TWO_PI * p.pulseFrequencyHz * elapsed);
    }
    return p.sourceCurrentAmplitudeAPerM2 * value;
  }
  function solve(dt) {
    updateConductivity();
    const drudeDenominator = 1 + p.plasmaCollisionFrequencyPerSecond * dt / 2;
    for (let i = 0; i < n; i++) stepKappa[i] = kappa[i] + dt * alphaPlasma[i] / (2 * EPS0 * drudeDenominator);
    adjoint(hr, hz, oldCurl); curlSquared(e, scratchN);
    const source = pulseAt(time + dt / 2), factor = dt * dt / 4;
    for (let i = 0; i < n; i++) {
      rhs[i] = (1 - dt * stepKappa[i] / 2) * e[i] - dt * oldCurl[i] - factor * scratchN[i] + dt * (source * sourceShape[i] - jp[i] / drudeDenominator) * Math.sqrt(weightsE[i] / EPS0);
      newE[i] = e[i];
    }
    applyMatrix(newE, product, dt);
    const rhsNorm = Math.sqrt(dot(rhs, rhs));
    for (let i = 0; i < n; i++) {
      residual[i] = rhs[i] - product[i];
      preconditioned[i] = residual[i] / (1 + dt * stepKappa[i] / 2 + factor * diagCurl[i]);
      direction[i] = preconditioned[i];
    }
    let rz = dot(residual, preconditioned), iterations = 0;
    const threshold = Math.max(rhsNorm * 2e-13, 1e-28);
    let norm = Math.sqrt(dot(residual, residual));
    while (norm > threshold && iterations < 120) {
      applyMatrix(direction, product, dt);
      const denominator = dot(direction, product);
      if (!(denominator > 0) || !Number.isFinite(denominator)) throw new Error('Midpoint SPD solve failed');
      const alpha = rz / denominator;
      for (let i = 0; i < n; i++) { newE[i] += alpha * direction[i]; residual[i] -= alpha * product[i]; }
      norm = Math.sqrt(dot(residual, residual)); iterations++;
      if (norm <= threshold) break;
      for (let i = 0; i < n; i++) preconditioned[i] = residual[i] / (1 + dt * stepKappa[i] / 2 + factor * diagCurl[i]);
      const next = dot(residual, preconditioned), beta = next / rz;
      for (let i = 0; i < n; i++) direction[i] = preconditioned[i] + beta * direction[i];
      rz = next;
    }
    if (norm > threshold || !Number.isFinite(norm)) throw new Error(`Midpoint solver did not converge (${iterations} iterations)`);
    maximumSolverRelativeResidual = Math.max(maximumSolverRelativeResidual, norm / Math.max(rhsNorm, 1e-28));
    maximumSolverIterations = Math.max(maximumSolverIterations, iterations);
    for (let i = 0; i < n; i++) scratchN[i] = (e[i] + newE[i]) / 2;
    curl(scratchN, scratchR, scratchZ);
    // Sample the signed net flux at the mouth using the same midpoint
    // fields. This internal measurement is not another global ledger sink.
    for (let i = 0; i < hr.length; i++) scratchR[i] = hr[i] + dt * scratchR[i] / 2;
    mouthIntake += dt * mouthPower(scratchN, scratchR);
    curl(scratchN, scratchR, scratchZ);
    for (let i = 0; i < hr.length; i++) hr[i] += dt * scratchR[i];
    for (let i = 0; i < hz.length; i++) hz[i] += dt * scratchZ[i];
    for (let i = 0; i < n; i++) {
      const electricMid = scratchN[i] / sqrtE[i];
      const heat = dt * sigma[i] * electricMid * electricMid * weightsE[i];
      deposited[i] += heat / weightsE[i]; materialHeat += heat;
      coverThermal[i] += heat / weightsE[i];
      const plasma = drudeMidpoint(jp[i], electricMid, alphaPlasma[i], p.plasmaCollisionFrequencyPerSecond, dt);
      jp[i] = plasma.current;
      plasmaDeposited[i] += plasma.heatDensity;
      plasmaThermal[i] += plasma.heatDensity;
      plasmaCollisionHeat += plasma.heatDensity * weightsE[i];
      if (p.thermalContactConductanceWPerM3K > 0 && plasmaCapacity[i] > 0 && materialFraction[i] > 0) {
        const transfer = contactTransfer({ plasmaEnergyDensity: plasmaThermal[i], coverEnergyDensity: coverThermal[i], plasmaCapacity: plasmaCapacity[i], coverMassDensity: materialFraction[i] * p.materialDensityKgPerM3, conductance: p.thermalContactConductanceWPerM3K * plasmaFraction[i] * materialFraction[i], dt, plasmaInitialTemperatureK: p.plasmaInitialTemperatureK, parameters: p });
        plasmaThermal[i] -= transfer; coverThermal[i] += transfer; contactToCover += transfer * weightsE[i];
      }
      if (alphaPlasma[i] > 0) maxDriftSpeed = Math.max(maxDriftSpeed, Math.abs(jp[i]) / (plasmaFraction[i] * p.plasmaElectronDensityPerM3 * ELEMENTARY_CHARGE));
      spongeLoss += dt * EPS0 * sponge[i] * electricMid * electricMid * weightsE[i];
      sourceWork += dt * source * sourceShape[i] * electricMid * weightsE[i];
      e[i] = newE[i];
    }
    time += dt; stepCount++;
    phaseHistory.record(time, Float64Array.from(e, (x, i) => x / sqrtE[i]));
  }
  function fieldEnergy() { return 0.5 * (dot(e, e) + dot(hr, hr) + dot(hz, hz)); }
  function driftEnergy() {
    let energy = 0;
    for (let i = 0; i < n; i++) if (alphaPlasma[i] > 0) energy += jp[i] * jp[i] / (2 * alphaPlasma[i]) * weightsE[i];
    return energy;
  }
  function mouthPower(electricCanonical, radialCanonical) {
    const inner = p.cylinderRadiusM - p.wallThicknessM;
    if (!(inner > 0 && p.cylinderLengthM > 0)) return 0;
    const z = p.cylinderStartM;
    const face = Math.min(nz - 1, Math.floor(z / dz)), faceFraction = z / dz - face;
    const centre = Math.floor(z / dz - .5), centreFraction = z / dz - .5 - centre;
    let power = 0;
    for (let i = 0; i < nr; i++) {
      const lower = i * dr, upper = Math.min(inner, (i + 1) * dr);
      if (upper <= lower) continue;
      const atCentre = k => k < 0 || k >= nz ? 0 : electricCanonical[k * nr + i] / sqrtE[k * nr + i];
      const E = (1 - centreFraction) * atCentre(centre) + centreFraction * atCentre(centre + 1);
      const H = (1 - faceFraction) * radialCanonical[face * nr + i] / sqrtR[face * nr + i] + faceFraction * radialCanonical[(face + 1) * nr + i] / sqrtR[(face + 1) * nr + i];
      power += -E * H * Math.PI * (upper * upper - lower * lower);
    }
    return power;
  }
  function step(dtSeconds) {
    finite('dtSeconds', dtSeconds, 0, 1e-6);
    if (dtSeconds === 0) return { timeSeconds: time, substeps: 0 };
    const substeps = Math.ceil(dtSeconds / dtMax);
    if (substeps > 5000) throw new RangeError(`Requested interval needs ${substeps} substeps; request a smaller interval`);
    const dt = dtSeconds / substeps;
    for (let j = 0; j < substeps; j++) solve(dt);
    frameCount++;
    return { timeSeconds: time, substeps };
  }
  function snapshot({ includeStaggered = false } = {}) {
    updateConductivity();
    const Ephi = new Float64Array(n), Hr = new Float64Array(n), Hz = new Float64Array(n), Br = new Float64Array(n), Bz = new Float64Array(n), J = new Float64Array(n), T = new Float64Array(n), deltaT = new Float64Array(n), joulePower = new Float64Array(n), Sr = new Float64Array(n), Sz = new Float64Array(n), sourceJ = new Float64Array(n);
    const plasmaT = new Float64Array(n), plasmaDT = new Float64Array(n), driftDensity = new Float64Array(n), collisionPower = new Float64Array(n), coverEnthalpy = new Float64Array(n), coverLiquid = new Float64Array(n), plasmaWork = new Float64Array(n), totalJ = new Float64Array(n);
    let maxB = 0, maxT = p.initialTemperatureK, maxTemperatureRise = 0;
    let maxPlasmaT = p.plasmaInitialTemperatureK, maxPlasmaRise = 0, maxLiquid = 0, maxPlasmaCurrent = 0;
    const source = pulseAt(time);
    for (let k = 0; k < nz; k++) for (let i = 0; i < nr; i++) {
      const j = k * nr + i, jz = k * (nr + 1) + i;
      Ephi[j] = e[j] / sqrtE[j];
      Hr[j] = (hr[j] / sqrtR[j] + hr[j + nr] / sqrtR[j + nr]) / 2;
      Hz[j] = (hz[jz] / sqrtZ[jz] + hz[jz + 1] / sqrtZ[jz + 1]) / 2;
      Br[j] = MU0 * Hr[j]; Bz[j] = MU0 * Hz[j]; J[j] = sigma[j] * Ephi[j];
      const cover = stateFromIncrement(materialFraction[j] > 0 ? coverThermal[j] / (materialFraction[j] * p.materialDensityKgPerM3) : 0, p);
      T[j] = cover.temperatureK; deltaT[j] = cover.temperatureRiseK;
      if (materialFraction[j] > 0) { coverEnthalpy[j] = cover.specificEnthalpyJPerKg; coverLiquid[j] = cover.liquidFraction; maxLiquid = Math.max(maxLiquid, coverLiquid[j]); }
      plasmaDT[j] = plasmaCapacity[j] > 0 ? plasmaThermal[j] / plasmaCapacity[j] : 0;
      plasmaT[j] = p.plasmaInitialTemperatureK + plasmaDT[j];
      driftDensity[j] = alphaPlasma[j] > 0 ? jp[j] * jp[j] / (2 * alphaPlasma[j]) : 0;
      collisionPower[j] = 2 * p.plasmaCollisionFrequencyPerSecond * driftDensity[j];
      plasmaWork[j] = jp[j] * Ephi[j]; totalJ[j] = jp[j] + J[j];
      joulePower[j] = sigma[j] * Ephi[j] * Ephi[j];
      Sr[j] = Ephi[j] * Hz[j]; Sz[j] = -Ephi[j] * Hr[j];
      sourceJ[j] = -source * sourceShape[j];
      maxB = Math.max(maxB, Math.hypot(Br[j], Bz[j])); maxT = Math.max(maxT, T[j]); maxTemperatureRise = Math.max(maxTemperatureRise, deltaT[j]);
      maxPlasmaT = Math.max(maxPlasmaT, plasmaT[j]); maxPlasmaRise = Math.max(maxPlasmaRise, plasmaDT[j]); maxPlasmaCurrent = Math.max(maxPlasmaCurrent, Math.abs(jp[j]));
    }
    const electric = dot(e, e) / 2, magnetic = (dot(hr, hr) + dot(hz, hz)) / 2;
    // Compatible divergence on the magnetic dual mesh; its curl cancellation
    // includes the axis disk and half-cell PEC end volumes.
    let maxDivB = 0;
    for (let k = 0; k <= nz; k++) for (let i = 0; i <= nr; i++) {
      const area = weightsZ[i] / dz;
      let radialFlux = 0, axialDerivative = 0;
      if (i < nr) { const j = k * nr + i; radialFlux += TWO_PI * rCoordinates[i] * hr[j] / sqrtR[j]; }
      if (i > 0) { const j = k * nr + i - 1; radialFlux -= TWO_PI * rCoordinates[i - 1] * hr[j] / sqrtR[j]; }
      if (k < nz) { const j = k * (nr + 1) + i; axialDerivative += (k === 0 ? 2 : 1) * hz[j] / sqrtZ[j] / dz; }
      if (k > 0) { const j = (k - 1) * (nr + 1) + i; axialDerivative -= (k === nz ? 2 : 1) * hz[j] / sqrtZ[j] / dz; }
      maxDivB = Math.max(maxDivB, Math.abs(MU0 * (radialFlux / area + axialDerivative)));
    }
    const maxRawB = MU0 * Math.max(maxAbs(Float64Array.from(hr, (x, i) => x / sqrtR[i])), maxAbs(Float64Array.from(hz, (x, i) => x / sqrtZ[i])));
    const drift = driftEnergy(), plasmaStored = dot(plasmaThermal, weightsE), coverStored = dot(coverThermal, weightsE);
    const stored = electric + magnetic + drift + plasmaStored + coverStored;
    const balance = stored + spongeLoss - initialEnergy - sourceWork;
    const heatLedgerBalance = electric + magnetic + drift + materialHeat + plasmaCollisionHeat + spongeLoss - initialEnergy - sourceWork;
    const scale = Math.max(electric + magnetic + drift + Math.abs(plasmaStored) + Math.abs(coverStored) + spongeLoss, initialEnergy, Math.abs(sourceWork), 1e-30);
    const phase = phaseHistory.snapshot(time);
    phase.phaseAnalysis.reference.rM = rCoordinates[referenceIndex % nr];
    phase.phaseAnalysis.reference.zM = zCoordinates[Math.floor(referenceIndex / nr)];
    const omega = TWO_PI * p.pulseFrequencyHz, spectralHighHz = p.pulseFrequencyHz + 3 / (TWO_PI * p.pulseWidthSeconds);
    const maxSigma = Math.max(p.sigmaSPerM, p.sigmaLiquidSPerM);
    const conductivitySkinDepthM = maxSigma > 0 ? Math.sqrt(2 / (MU0 * maxSigma * omega)) : null;
    const result = {
      model: 'axisymmetric-maxwell-drude-enthalpy-v2', timeSeconds: time, stepCount, frameCount,
      parameters: { ...p }, constants: { epsilon0FPerM: EPS0, mu0HPerM: MU0, c0MPerS: C0, elementaryChargeC: ELEMENTARY_CHARGE, electronMassKg: ELECTRON_MASS, boltzmannJPerK: BOLTZMANN },
      grid: { nr, nz, drM: dr, dzM: dz, rM: [...rCoordinates], zM: [...zCoordinates], ordering: 'z-major: index=k*nr+i', cellVolumesM3: Array.from(weightsE) },
      fields: { EphiVPerM: Array.from(Ephi), HrAPerM: Array.from(Hr), HzAPerM: Array.from(Hz), BrTesla: Array.from(Br), BzTesla: Array.from(Bz), JphiAPerM2: Array.from(J), impressedJphiAPerM2: Array.from(sourceJ), conductivitySPerM: Array.from(sigma), materialMask: Array.from(material), materialFillFraction: Array.from(materialFraction), temperatureK: Array.from(T), temperatureRiseK: Array.from(deltaT), joulePowerDensityWPerM3: Array.from(joulePower), depositedEnergyDensityJPerM3: Array.from(deposited), poyntingRadialWPerM2: Array.from(Sr), poyntingAxialWPerM2: Array.from(Sz),
        coverJphiAPerM2: Array.from(J), plasmaJphiAPerM2: Array.from(jp), totalMaterialJphiAPerM2: Array.from(totalJ), plasmaFillFraction: Array.from(plasmaFraction), plasmaAlphaSI: Array.from(alphaPlasma), plasmaHeatCapacityJPerM3K: Array.from(plasmaCapacity), plasmaTemperatureK: Array.from(plasmaT), plasmaTemperatureRiseK: Array.from(plasmaDT), plasmaDriftEnergyDensityJPerM3: Array.from(driftDensity), plasmaCollisionPowerDensityWPerM3: Array.from(collisionPower), plasmaCurrentWorkDensityWPerM3: Array.from(plasmaWork), plasmaCollisionDepositedEnergyDensityJPerM3: Array.from(plasmaDeposited), plasmaThermalEnergyDensityJPerM3: Array.from(plasmaThermal), coverThermalEnergyDensityJPerM3: Array.from(coverThermal), coverSpecificEnthalpyJPerKg: Array.from(coverEnthalpy), coverLiquidFraction: Array.from(coverLiquid), ...phase.fields },
      diagnostics: { electricEnergyJ: electric, magneticEnergyJ: magnetic, fieldEnergyJ: electric + magnetic, plasmaDriftEnergyJ: drift, initialPlasmaDriftEnergyJ: initialDriftEnergy, plasmaThermalEnergyJ: plasmaStored, coverThermalEnergyJ: coverStored, totalStoredEnergyJ: stored, plasmaCollisionHeatJ: plasmaCollisionHeat, coverOhmicHeatJ: materialHeat, materialHeatJ: materialHeat, contactTransferToCoverJ: contactToCover, spongeLossJ: spongeLoss, sourceWorkJ: sourceWork, initialEnergyJ: initialEnergy, energyBalanceResidualJ: balance, relativeEnergyBalanceResidual: Math.abs(balance) / scale, cumulativeHeatLedgerResidualJ: heatLedgerBalance, thermalStorageConsistencyResidualJ: plasmaStored + coverStored - plasmaCollisionHeat - materialHeat, maxEphiVPerM: maxAbs(Ephi), maxBTesla: maxB, maxTemperatureK: maxT, maxTemperatureRiseK: maxTemperatureRise, maxPlasmaTemperatureK: maxPlasmaT, maxPlasmaTemperatureRiseK: maxPlasmaRise, maxPlasmaJphiAPerM2: maxPlasmaCurrent, maxCoverLiquidFraction: maxLiquid, maxElectronDriftSpeedMPerS: maxDriftSpeed, maxElectronDriftSpeedFractionOfC: maxDriftSpeed / C0, maxDiscreteDivBTeslaPerM: maxDivB, relativeDiscreteDivB: maxRawB > 0 ? maxDivB * Math.min(dr, dz) / maxRawB : 0, dtMaxSeconds: dtMax, maxDampingStepRatio: maxAbs(kappa) * dtMax, maxCollisionStepRatio: maxAbs(alphaPlasma) > 0 ? p.plasmaCollisionFrequencyPerSecond * dtMax : 0, maxPlasmaFrequencyStepRatio: Math.sqrt(maxAbs(alphaPlasma) / EPS0) * dtMax, maximumSolverRelativeResidual, maximumSolverIterations, sourceCurrentAtCenterAPerM2: -source, sourceForcingAtCenterAPerM2: source, boundaryEnergyFluxJ: 0, thermalBoundaryEnergyFluxJ: 0, mouthNetPowerW: mouthPower(e, hr), mouthNetIntakeJ: mouthIntake, geometricClearAreaM2: Math.PI * (p.cylinderRadiusM - p.wallThicknessM) ** 2 * (1 - p.coverFraction), coverMouthMeanArealMassKgPerM2: p.materialDensityKgPerM3 * p.bottomThicknessM * p.coverFraction },
      phaseAnalysis: phase.phaseAnalysis,
      resolutionDiagnostics: { cellsPerCarrierVacuumWavelength: C0 / (p.pulseFrequencyHz * Math.max(dr, dz)), gaussianThreeSigmaUpperFrequencyHz: spectralHighHz, cellsPerGaussianThreeSigmaUpperVacuumWavelength: C0 / (spectralHighHz * Math.max(dr, dz)), conductivitySkinDepthEstimateM: conductivitySkinDepthM, skinDepthCellsRadial: conductivitySkinDepthM === null ? null : conductivitySkinDepthM / dr, skinDepthCellsAxial: conductivitySkinDepthM === null ? null : conductivitySkinDepthM / dz, caveat: 'Gaussian spectral tails have no finite cutoff. Eight carrier cells alone do not certify pulse-bandwidth, plasma/interface or skin-depth convergence; the Ohmic skin estimate is approximate and excludes dispersive plasma.' },
      assumptions: [...ASSUMPTIONS], validationScope: 'Numerical Maxwell/Drude/thermal conservation and analytic benchmark checks; synthetic material properties, no black-hole or observational validation.',
      displayInterpolation: 'E is sampled at cell centres; H, B and Poynting vectors in fields use adjacent-face arithmetic averages for visualization. Energy uses the raw staggered fields and dual volumes.',
      heatingDensityBasis: 'All energy/power densities and Jp are per full computational-cell volume. alpha=fp ne e^2/me; plasma heat capacity=1.5 fp ne(1+1/Z)kB; cover mass density=fc rho. Thermal energy fields are changes from initial thermal states; specific cover enthalpy is referenced to 0 K. Cumulative collision/Ohmic deposition is reported separately and not added again to stored thermal energy. Tiny temperature increments are preserved separately.',
      sourceDefinition: 'Fphi=+J0 G sum Gaussian*cos(omega*(t-tk)); physical Jext,phi=-Fphi. sourceCurrentAtCenterAPerM2 is Jext; sourceForcingAtCenterAPerM2 is F. Signed Wsource=-integral Ephi Jext,phi dV dt.',
      thermalConstitutiveDefinition: 'sigma_c=[(1-fl)*sigmaSolidRef+fl*sigmaLiquidRef]/[1+beta*max(0,Tc-Tref)]; fixed density and cp; fl=clip((Tc-Ts)/(Tl-Ts),0,1); h=cp*Tc+L*fl. Optional g=g0*fp*fc. Coefficients are declared synthetic controls, not experimental calibration.',
    };
    if (includeStaggered) result.staggered = { EphiVPerM: Array.from(e, (x, i) => x / sqrtE[i]), HrAPerM: Array.from(hr, (x, i) => x / sqrtR[i]), HzAPerM: Array.from(hz, (x, i) => x / sqrtZ[i]), JpPhiAPerM2: Array.from(jp), volumesE: Array.from(weightsE), volumesHr: Array.from(weightsR), volumesHz: Array.from(weightsZ) };
    return result;
  }
  function setFields(fields) {
    if (!fields || typeof fields !== 'object') throw new TypeError('setFields requires an object of staggered field arrays');
    for (const key of Object.keys(fields)) if (!['EphiVPerM', 'HrAPerM', 'HzAPerM', 'JpPhiAPerM2'].includes(key)) throw new TypeError(`Unknown field: ${key}`);
    function validateField(key, dst) {
      if (!(key in fields)) return;
      const values = fields[key];
      if (!values || values.length !== dst.length) throw new RangeError(`${key} requires ${dst.length} staggered values`);
      for (const value of values) if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e12) throw new RangeError(`${key} contains an invalid value`);
    }
    function assign(key, dst, norm) {
      if (!(key in fields)) return;
      const values = fields[key];
      for (let i = 0; i < dst.length; i++) dst[i] = values[i] * norm[i];
    }
    validateField('EphiVPerM', e); validateField('HrAPerM', hr); validateField('HzAPerM', hz); validateField('JpPhiAPerM2', jp);
    if (fields.JpPhiAPerM2) for (let i = 0; i < n; i++) if (alphaPlasma[i] === 0 && fields.JpPhiAPerM2[i] !== 0) throw new RangeError('Initial plasma current must vanish where plasma density/fraction is zero');
    assign('EphiVPerM', e, sqrtE); assign('HrAPerM', hr, sqrtR); assign('HzAPerM', hz, sqrtZ);
    jp.fill(0);
    if (fields.JpPhiAPerM2) jp.set(fields.JpPhiAPerM2);
    time = 0; stepCount = 0; frameCount = 0; sourceWork = 0; materialHeat = 0; spongeLoss = 0; deposited.fill(0);
    plasmaDeposited.fill(0); plasmaThermal.fill(0); coverThermal.fill(0);
    plasmaCollisionHeat = 0; contactToCover = 0; mouthIntake = 0; maxDriftSpeed = 0;
    for (let i = 0; i < n; i++) if (alphaPlasma[i] > 0) maxDriftSpeed = Math.max(maxDriftSpeed, Math.abs(jp[i]) / (plasmaFraction[i] * p.plasmaElectronDensityPerM3 * ELEMENTARY_CHARGE));
    maximumSolverRelativeResidual = 0; maximumSolverIterations = 0; initialDriftEnergy = driftEnergy(); initialEnergy = fieldEnergy() + initialDriftEnergy;
    updateConductivity(); initializePhaseHistory();
  }
  function physicalCurl(values) {
    if (!values || values.length !== n || Array.from(values).some(x => !Number.isFinite(x))) throw new RangeError(`Curl requires ${n} finite E_phi values`);
    const canonical = Float64Array.from(values, (x, i) => x * sqrtE[i]);
    const outR = new Float64Array(hr.length), outZ = new Float64Array(hz.length); curl(canonical, outR, outZ);
    return { dHrDt: Array.from(outR, (x, i) => x / sqrtR[i]), dHzDt: Array.from(outZ, (x, i) => x / sqrtZ[i]) };
  }
  function reset(overrides = {}) { build({ ...p, ...overrides }); return snapshot(); }
  build(options);
  return { step, snapshot, reset, setFields, physicalCurl, get parameters() { return { ...p }; }, get dtMaxSeconds() { return dtMax; } };
}

module.exports = { createModel, DEFAULTS, ASSUMPTIONS, EPS0, MU0, C0, besselJ };
