'use strict';

// Constant-density, fixed-geometry synthetic constitutive benchmark.
// Enthalpy is referenced to T=0 K. The solver stores changes from the
// initial state, so sensible and latent energy are never counted twice.
const ELEMENTARY_CHARGE = 1.602176634e-19;
const ELECTRON_MASS = 9.1093837139e-31;
const BOLTZMANN = 1.380649e-23;

function liquidFraction(T, p) {
  return Math.max(0, Math.min(1, (T - p.solidusTemperatureK) / (p.liquidusTemperatureK - p.solidusTemperatureK)));
}
function specificEnthalpy(T, p) {
  return p.materialHeatCapacityJPerKgK * T + p.latentHeatJPerKg * liquidFraction(T, p);
}
function temperatureFromEnthalpy(h, p) {
  const cp = p.materialHeatCapacityJPerKgK, Ts = p.solidusTemperatureK, Tl = p.liquidusTemperatureK;
  const hs = cp * Ts, hl = cp * Tl + p.latentHeatJPerKg;
  if (h <= hs) return h / cp;
  if (h >= hl) return (h - p.latentHeatJPerKg) / cp;
  return Ts + (h - hs) / (cp + p.latentHeatJPerKg / (Tl - Ts));
}
function stateFromIncrement(qPerKg, p) {
  const T0 = p.initialTemperatureK, cp = p.materialHeatCapacityJPerKgK;
  const h0 = specificEnthalpy(T0, p), hs = cp * p.solidusTemperatureK;
  const hl = cp * p.liquidusTemperatureK + p.latentHeatJPerKg;
  const low = hs - h0, high = hl - h0;
  // Form the increment directly within a phase. This preserves increments
  // too small to survive addition to a 293 K absolute temperature.
  let dT;
  if (T0 <= p.solidusTemperatureK && qPerKg <= low) dT = qPerKg / cp;
  else if (T0 >= p.liquidusTemperatureK && qPerKg >= high) dT = qPerKg / cp;
  else if (T0 >= p.solidusTemperatureK && T0 <= p.liquidusTemperatureK && qPerKg >= low && qPerKg <= high) dT = qPerKg / (cp + p.latentHeatJPerKg / (p.liquidusTemperatureK - p.solidusTemperatureK));
  else dT = temperatureFromEnthalpy(h0 + qPerKg, p) - T0;
  const temperatureK = T0 + dT;
  const initialFraction = liquidFraction(T0, p);
  let fraction = liquidFraction(temperatureK, p), fractionChange = fraction - initialFraction;
  if (qPerKg >= low && qPerKg <= high) {
    fraction = Math.max(0, Math.min(1, (qPerKg - low) / (hl - hs)));
    if (T0 >= p.solidusTemperatureK && T0 <= p.liquidusTemperatureK) fractionChange = dT / (p.liquidusTemperatureK - p.solidusTemperatureK);
    else fractionChange = fraction - initialFraction;
  }
  return { temperatureK, temperatureRiseK: dT, liquidFraction: fraction, liquidFractionChange: fractionChange, specificEnthalpyJPerKg: h0 + qPerKg };
}
function coverConductivity(T, fLiquid, p) {
  const base = (1 - fLiquid) * p.sigmaSPerM + fLiquid * p.sigmaLiquidSPerM;
  // Declared benchmark law, not a universal conductivity relation. The
  // below-reference branch stays at its reference value; sigma >= 0.
  return base / (1 + p.conductivityTemperatureCoefficientPerK * Math.max(0, T - p.conductivityReferenceTemperatureK));
}
function drudeMidpoint(Jold, Emid, alpha, nu, dt) {
  if (!(alpha > 0)) return { current: 0, currentMid: 0, heatDensity: 0 };
  const denominator = 1 + nu * dt / 2;
  const current = ((1 - nu * dt / 2) * Jold + dt * alpha * Emid) / denominator;
  const currentMid = (Jold + current) / 2;
  return { current, currentMid, heatDensity: dt * nu * currentMid * currentMid / alpha };
}

// Locally implicit contact. Delta is added to the cover and subtracted from
// plasma, in J/m^3 of the whole cell. Monotone enthalpy inversion brackets a
// temperature-equilibrating transfer, so arbitrarily large g cannot reverse
// the temperature ordering. There is no thermal flux outside this cell.
function contactTransfer({ plasmaEnergyDensity, coverEnergyDensity, plasmaCapacity, coverMassDensity, conductance, dt, plasmaInitialTemperatureK, parameters }) {
  if (!(plasmaCapacity > 0 && coverMassDensity > 0 && conductance > 0 && dt > 0)) return 0;
  const baseDifference = plasmaInitialTemperatureK - parameters.initialTemperatureK;
  const plasmaRise = plasmaEnergyDensity / plasmaCapacity;
  const coverRise = stateFromIncrement(coverEnergyDensity / coverMassDensity, parameters).temperatureRiseK;
  const difference = baseDifference + plasmaRise - coverRise;
  if (difference === 0) return 0;
  let lo = Math.min(0, plasmaCapacity * difference), hi = Math.max(0, plasmaCapacity * difference);
  for (let j = 0; j < 70; j++) {
    const transfer = (lo + hi) / 2;
    const coverRiseNext = stateFromIncrement((coverEnergyDensity + transfer) / coverMassDensity, parameters).temperatureRiseK;
    const differenceNext = baseDifference + plasmaRise - transfer / plasmaCapacity - coverRiseNext;
    const residual = transfer - dt * conductance * differenceNext;
    if (residual > 0) hi = transfer; else lo = transfer;
  }
  return (lo + hi) / 2;
}

module.exports = { ELEMENTARY_CHARGE, ELECTRON_MASS, BOLTZMANN, liquidFraction, specificEnthalpy, temperatureFromEnthalpy, stateFromIncrement, coverConductivity, drudeMidpoint, contactTransfer };
