'use strict';

// Controlled local-frame demonstrations. Coefficients are declared synthetic
// examples, not a composition model for an astrophysical object.
const RESEARCH_PRESETS = Object.freeze({
  'plasma-pulse': Object.freeze({
    title: 'Cold collisional plasma / open mouth',
    description: 'Fixed cavity plasma at 1e17 electrons/m^3 with causal current memory; repeatable local electromagnetic experiment.',
    parameters: Object.freeze({resolutionR:32, resolutionZ:96, plasmaElectronDensityPerM3: 1e17,
      plasmaFillFraction: 1, plasmaCollisionFrequencyPerSecond: 2e9,
      plasmaIonChargeNumber: 1, plasmaInitialTemperatureK: 8000,
      plasmaRegion: 'cavity', thermalContactConductanceWPerM3K: 0,
      coverFraction: 0, initialTemperatureK: 293.15, sigmaSPerM: 0.02,
      sigmaLiquidSPerM: 0.04, solidusTemperatureK: 1600,
      liquidusTemperatureK: 1800, latentHeatJPerKg: 2e5,
      conductivityTemperatureCoefficientPerK: 0,
      conductivityReferenceTemperatureK: 293.15,
      sourceEnabled: true, sourceCurrentAmplitudeAPerM2: 30,
      pulseFrequencyHz: 6e9, pulseWidthSeconds: 2e-10,
      sourceStartSeconds: 8e-10, pulsePeriodSeconds: 1.2e-9, spongeRatePerSecond: 8e9,
      initialCondition: null})
  }),
  'covered-plasma': Object.freeze({
    title: 'Matched plasma pulse / full cover',
    description: 'Same incident forcing and plasma coefficients as the open example. Only the geometric cover fraction changes.',
    parameters: Object.freeze({coverFraction: 1})
  }),
  'hot-cover': Object.freeze({
    title: 'Warm-start material phase benchmark',
    description: 'The cover starts at 1700 K, midway through a declared synthetic mushy interval. Its initial liquid fraction is prescribed by enthalpy, not caused by the incoming pulse. Melting leaves the geometry intact.',
    parameters: Object.freeze({coverFraction: 1, initialTemperatureK: 1700})
  }),
  vacuum: Object.freeze({
    title: 'Vacuum reference / open mouth',
    description: 'Identical forcing and absorber, with the plasma density set to zero. A separate controlled comparison, not an incident/reflected mode decomposition.',
    parameters: Object.freeze({plasmaElectronDensityPerM3: 0, coverFraction: 0})
  })
});
function presetParameters(id) {
  if (!Object.hasOwn(RESEARCH_PRESETS,id)) throw new RangeError('Unknown research preset');
  return {...RESEARCH_PRESETS['plasma-pulse'].parameters,...RESEARCH_PRESETS[id].parameters};
}
module.exports={RESEARCH_PRESETS,presetParameters};
