'use strict';

// Pure display diagnostics of an existing Maxwell/Drude/enthalpy snapshot.
// Nothing here advances a field, alters material geometry, or closes the
// numerical energy balance with interpolated display samples.
const EPS0 = 8.8541878128e-12;
const MU0 = 1.25663706212e-6;
const DENSITY_BASIS = 'Per full computational-cell volume: alpha and conductivity already include their plasma/cover volume fractions. Do not apply fp or fc again.';
const CHARACTERISTIC_CAVEAT = 'Instantaneous +z/-z vacuum characteristic channels of collocated Ephi and Hr; not separated incident/scattered waves, a reflection coefficient, or a global reflected-energy measurement. Oblique/modal fields and Hz can give both channels without a separate reflected wave. This port is only a sampled vacuum annulus, not an open boundary. Display H is adjacent-face averaged; its flux is not the exact discrete face flux.';

function number(value, name, lower = -Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < lower) throw new TypeError(`${name} must be finite${lower > -Infinity ? ` and >= ${lower}` : ''}`);
  return value;
}
function array(value, length, name, lower = -Infinity) {
  if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== length) throw new TypeError(`${name} requires ${length} values`);
  for (const x of value) number(x, name, lower);
  return value;
}
function integrate(values, volumes) {
  let result = 0;
  for (let i = 0; i < values.length; i++) result += values[i] * volumes[i];
  return result;
}

/** Axial vacuum characteristics, an algebraic directional diagnostic only. */
function vacuumCharacteristics(electricVPerM, radialHAPerM, impedanceOhm = Math.sqrt(MU0 / EPS0)) {
  const E = number(electricVPerM, 'electricVPerM'), H = number(radialHAPerM, 'radialHAPerM'), Z = number(impedanceOhm, 'impedanceOhm', Number.MIN_VALUE);
  const plusElectricVPerM = (E - Z * H) / 2;
  const minusElectricVPerM = (E + Z * H) / 2;
  const forwardCharacteristicFluxWPerM2 = plusElectricVPerM ** 2 / Z;
  const backwardCharacteristicFluxWPerM2 = minusElectricVPerM ** 2 / Z;
  const netAxialFluxWPerM2 = -E * H;
  return { plusElectricVPerM, minusElectricVPerM, forwardCharacteristicFluxWPerM2, backwardCharacteristicFluxWPerM2, netAxialFluxWPerM2,
    identityResidualWPerM2: forwardCharacteristicFluxWPerM2 - backwardCharacteristicFluxWPerM2 - netAxialFluxWPerM2 };
}

function vacuumPort(snapshot, impedanceOhm, requestedPlaneZM) {
  const {grid: g, fields: f, parameters: p} = snapshot;
  const spongeActive = p.spongeRatePerSecond > 0 && p.spongeFraction > 0;
  const axialSpongeEndM = spongeActive ? p.lengthM * p.spongeFraction : 0;
  const axialSpongeStartM = spongeActive ? p.lengthM * (1 - p.spongeFraction) : p.lengthM;
  const radialSpongeStartM = spongeActive ? p.radiusM * (1 - p.spongeFraction) : p.radiusM;
  const sourceTailLimitZM = p.sourceCenterZM + 8 * p.sourceWidthZM;
  const lowerZM = Math.max(sourceTailLimitZM, axialSpongeEndM);
  const upperZM = Math.min(p.cylinderStartM, axialSpongeStartM);
  const target = requestedPlaneZM === undefined ? (lowerZM + upperZM) / 2 : number(requestedPlaneZM, 'vacuumPlaneZM');
  const unavailable = {status: 'unavailable', planeZM: null, axialIndex: null, cellIndices: [], cells: [], sampledAreaM2: 0,
    forwardCharacteristicPowerW: null, backwardCharacteristicPowerW: null, netAxialPowerW: null, characteristicIdentityResidualW: null,
    sourceTailLimitZM, axialGaussianTailFactorUpperBound: Math.exp(-32), impedanceOhm,
    characteristicDefinition: 'E+=(Ephi-Z0 Hr)/2; E-=(Ephi+Z0 Hr)/2; I+=E+^2/Z0; I-=E-^2/Z0; I+-I-=-Ephi Hr.',
    caveat: CHARACTERISTIC_CAVEAT, unavailableReason: 'No source-tail-suppressed, undamped vacuum row exists before the cover. No characteristic power is invented.'};
  if (!(upperZM > lowerZM)) return unavailable;
  let best = null;
  for (let k = 0; k < g.nz; k++) {
    const z = g.zM[k];
    // Suppress the axial source Gaussian at its sample centre. Whole annuli
    // must also avoid the sponge, cover, and any nonzero plasma occupancy.
    if (!(z > lowerZM && z < upperZM && z - g.dzM / 2 >= axialSpongeEndM && z + g.dzM / 2 <= axialSpongeStartM)) continue;
    const cellIndices = [];
    for (let i = 0; i < g.nr; i++) {
      const index = k * g.nr + i;
      if (g.rM[i] + g.drM / 2 <= radialSpongeStartM && f.materialFillFraction[index] === 0 && f.plasmaFillFraction[index] === 0 && f.plasmaAlphaSI[index] === 0 && f.conductivitySPerM[index] === 0) cellIndices.push(index);
    }
    if (cellIndices.length && (!best || Math.abs(z - target) < Math.abs(best.planeZM - target))) best = {planeZM: z, axialIndex: k, cellIndices};
  }
  if (!best) return unavailable;
  let sampledAreaM2 = 0, forwardCharacteristicPowerW = 0, backwardCharacteristicPowerW = 0, netAxialPowerW = 0;
  const cells = best.cellIndices.map(index => {
    const i = index % g.nr, areaM2 = g.cellVolumesM3[index] / g.dzM;
    const channels = vacuumCharacteristics(f.EphiVPerM[index], f.HrAPerM[index], impedanceOhm);
    sampledAreaM2 += areaM2;
    forwardCharacteristicPowerW += channels.forwardCharacteristicFluxWPerM2 * areaM2;
    backwardCharacteristicPowerW += channels.backwardCharacteristicFluxWPerM2 * areaM2;
    netAxialPowerW += channels.netAxialFluxWPerM2 * areaM2;
    return {index, rM: g.rM[i], areaM2, ...channels};
  });
  return {...unavailable, ...best, status: 'ready', unavailableReason: null, cells, sampledAreaM2, forwardCharacteristicPowerW, backwardCharacteristicPowerW, netAxialPowerW,
    axialGaussianTailFactorUpperBound: Math.exp(-.5 * ((best.planeZM - p.sourceCenterZM) / p.sourceWidthZM) ** 2),
    characteristicIdentityResidualW: forwardCharacteristicPowerW - backwardCharacteristicPowerW - netAxialPowerW};
}

/** Reconstruct SI transport/absorption diagnostics without changing a snapshot. */
function computePulseDiagnostics(snapshot, options = {}) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.grid || !snapshot.fields || !snapshot.parameters || !snapshot.diagnostics) throw new TypeError('A complete Maxwell/Drude/enthalpy snapshot is required');
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Diagnostic options must be an object');
  for (const key of Object.keys(options)) if (key !== 'vacuumPlaneZM') throw new TypeError(`Unknown diagnostic option: ${key}`);
  const {grid: g, fields: f, diagnostics: d, parameters: p} = snapshot;
  if (!Number.isInteger(g.nr) || !Number.isInteger(g.nz) || g.nr < 1 || g.nz < 1) throw new TypeError('A positive r-z grid is required');
  const n = g.nr * g.nz;
  const E = array(f.EphiVPerM, n, 'EphiVPerM'), Hr = array(f.HrAPerM, n, 'HrAPerM'), Hz = array(f.HzAPerM, n, 'HzAPerM');
  const Jp = array(f.plasmaJphiAPerM2, n, 'plasmaJphiAPerM2'), alpha = array(f.plasmaAlphaSI, n, 'plasmaAlphaSI', 0), sigma = array(f.conductivitySPerM, n, 'conductivitySPerM', 0);
  const V = array(g.cellVolumesM3, n, 'cellVolumesM3', Number.MIN_VALUE);
  array(g.rM, g.nr, 'rM', 0); array(g.zM, g.nz, 'zM', 0); number(g.drM, 'drM', Number.MIN_VALUE); number(g.dzM, 'dzM', Number.MIN_VALUE);
  for (const key of ['materialFillFraction', 'plasmaFillFraction']) { const values = array(f[key], n, key, 0); if (values.some(x => x > 1)) throw new TypeError(`${key} must not exceed 1`); }
  const nu = number(p.plasmaCollisionFrequencyPerSecond, 'plasmaCollisionFrequencyPerSecond', 0);
  for (const key of ['lengthM', 'radiusM', 'cylinderStartM', 'sourceCenterZM', 'spongeRatePerSecond', 'spongeFraction']) number(p[key], key, 0);
  number(p.sourceWidthZM, 'sourceWidthZM', Number.MIN_VALUE);
  const epsilon0 = number(snapshot.constants?.epsilon0FPerM ?? EPS0, 'epsilon0FPerM', Number.MIN_VALUE);
  const mu0 = number(snapshot.constants?.mu0HPerM ?? MU0, 'mu0HPerM', Number.MIN_VALUE);
  const radialFluxWPerM2 = new Array(n), axialFluxWPerM2 = new Array(n), fluxMagnitudeWPerM2 = new Array(n);
  const plasmaCollisionPowerDensityWPerM3 = new Array(n), coverOhmicPowerDensityWPerM3 = new Array(n), plasmaCurrentWorkDensityWPerM3 = new Array(n);
  for (let i = 0; i < n; i++) {
    if (alpha[i] === 0 && Jp[i] !== 0) throw new TypeError('Plasma current cannot be nonzero where alpha is zero');
    radialFluxWPerM2[i] = E[i] * Hz[i]; axialFluxWPerM2[i] = -E[i] * Hr[i];
    fluxMagnitudeWPerM2[i] = Math.hypot(radialFluxWPerM2[i], axialFluxWPerM2[i]);
    plasmaCollisionPowerDensityWPerM3[i] = alpha[i] > 0 ? nu * Jp[i] ** 2 / alpha[i] : 0;
    coverOhmicPowerDensityWPerM3[i] = sigma[i] * E[i] ** 2;
    plasmaCurrentWorkDensityWPerM3[i] = E[i] * Jp[i];
  }
  const fields = {radialFluxWPerM2, axialFluxWPerM2, fluxMagnitudeWPerM2, plasmaCollisionPowerDensityWPerM3, coverOhmicPowerDensityWPerM3, plasmaCurrentWorkDensityWPerM3};
  const copies = {plasmaCollisionDepositedEnergyDensityJPerM3: 'plasmaCollisionDepositedEnergyDensityJPerM3', coverOhmicDepositedEnergyDensityJPerM3: 'depositedEnergyDensityJPerM3', plasmaDriftEnergyDensityJPerM3: 'plasmaDriftEnergyDensityJPerM3', plasmaThermalEnergyDensityJPerM3: 'plasmaThermalEnergyDensityJPerM3', coverThermalEnergyDensityJPerM3: 'coverThermalEnergyDensityJPerM3'};
  for (const [key, source] of Object.entries(copies)) fields[key] = Array.from(array(f[source], n, source, key.includes('Deposited') || key.includes('Drift') ? 0 : -Infinity));
  const energy = {};
  for (const key of ['sourceWorkJ', 'initialEnergyJ', 'fieldEnergyJ', 'plasmaDriftEnergyJ', 'plasmaThermalEnergyJ', 'coverThermalEnergyJ', 'contactTransferToCoverJ', 'spongeLossJ', 'boundaryEnergyFluxJ', 'thermalBoundaryEnergyFluxJ', 'mouthNetPowerW', 'mouthNetIntakeJ']) energy[key] = number(d[key], key);
  energy.plasmaCollisionDepositedJ = integrate(fields.plasmaCollisionDepositedEnergyDensityJPerM3, V);
  energy.coverOhmicDepositedJ = integrate(fields.coverOhmicDepositedEnergyDensityJPerM3, V);
  energy.plasmaCollisionPowerW = integrate(plasmaCollisionPowerDensityWPerM3, V);
  energy.coverOhmicPowerW = integrate(coverOhmicPowerDensityWPerM3, V);
  energy.plasmaCurrentWorkW = integrate(plasmaCurrentWorkDensityWPerM3, V);
  energy.instantaneousPhysicalAbsorptionPowerW = energy.plasmaCollisionPowerW + energy.coverOhmicPowerW;
  energy.availableEnergyJ = energy.initialEnergyJ + energy.sourceWorkJ;
  energy.accountedEnergyJ = energy.fieldEnergyJ + energy.plasmaDriftEnergyJ + energy.plasmaThermalEnergyJ + energy.coverThermalEnergyJ + energy.spongeLossJ;
  energy.balanceResidualJ = energy.accountedEnergyJ - energy.initialEnergyJ - energy.sourceWorkJ;
  energy.thermalDepositionConsistencyResidualJ = energy.plasmaThermalEnergyJ + energy.coverThermalEnergyJ - energy.plasmaCollisionDepositedJ - energy.coverOhmicDepositedJ;
  energy.plasmaContactConsistencyResidualJ = energy.plasmaThermalEnergyJ - (energy.plasmaCollisionDepositedJ - energy.contactTransferToCoverJ);
  energy.coverContactConsistencyResidualJ = energy.coverThermalEnergyJ - (energy.coverOhmicDepositedJ + energy.contactTransferToCoverJ);
  energy.sourceWorkCanBeNegative = true;
  energy.normalization = 'Signed SI energies; no percentages, clipping, or rescaling by source work. Field, drift, thermal changes, and artificial sponge loss close the ledger. Cumulative deposition and contact are explanatory transfers, not additional destinations.';
  return {timeSeconds: number(snapshot.timeSeconds, 'timeSeconds', 0), stepCount: snapshot.stepCount, fields, energy, vacuumPort: vacuumPort(snapshot, Math.sqrt(mu0 / epsilon0), options.vacuumPlaneZM),
    definitions: {densityBasis: DENSITY_BASIS, transport: 'S=E cross H: Sr=Ephi Hz; Sz=-Ephi Hr. Net signed energy flow can reverse locally; reversal is not by itself a globally separated reflected pulse.',
      collisionHeating: 'qp=nu Jp^2/alpha, alpha=fp ne e^2/me; zero for alpha=0 and Jp=0. EJp includes reversible drift work and is not all heat.', coverHeating: 'qc=sigma_full_cell Ephi^2. Cumulative cover Ohmic deposition is distinct from current cover thermal storage after contact transfer.',
      timeBasis: 'Flux and absorption power use instantaneous snapshot fields. Cumulative deposits are the existing solver midpoint-integrated values; phase demodulation has its separately declared causal-window delay.',
      ledgerBasis: 'Authoritative stored field energy uses raw staggered fields and dual volumes, not collocated display H. Closed PEC boundaries have zero physical escaped-energy term; artificial sponge loss is distinct from plasma/cover absorption.',
      characteristics: CHARACTERISTIC_CAVEAT,
      scope: 'Local flat-space axisymmetric Maxwell/Drude/enthalpy diagnostics. A wormhole-shaped display does not change metric, propagation, causal structure, or demonstrate a traversable wormhole.'}};
}

module.exports = {computePulseDiagnostics, vacuumCharacteristics};
