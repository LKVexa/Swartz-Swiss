'use strict';

// Real, uniformly sampled waveform -> a finite-window complex envelope.
// E=Re{calE exp(-i omega t)}, so down-conversion multiplies by exp(+i omega t).
// This is a band/window-dependent diagnostic, not instantaneous real-E phase.
function createPhaseHistory({ size, carrierFrequencyHz, samplesPerCycle, windowCycles, referenceIndex, amplitudeFloorVPerM, fixedAmplitudeScaleVPerM }) {
  const sampleIntervalSeconds = 1 / (carrierFrequencyHz * samplesPerCycle);
  const intervals = windowCycles * samplesPerCycle;
  const windowSeconds = intervals * sampleIntervalSeconds;
  const omega = 2 * Math.PI * carrierFrequencyHz;
  const samples = [];
  let previousTime = null, previousValues = null, nextSample = 0;
  function record(timeSeconds, values) {
    if (!(Number.isFinite(timeSeconds) && values && values.length === size)) throw new RangeError('Invalid phase-history sample');
    if (previousTime === null) {
      previousTime = timeSeconds; previousValues = Float64Array.from(values);
      samples.push({ timeSeconds, values: Float64Array.from(values) }); nextSample = 1;
      return;
    }
    if (timeSeconds < previousTime) throw new RangeError('Phase history must be ordered in physical time');
    if (timeSeconds === previousTime) { previousValues = Float64Array.from(values); samples[samples.length - 1] = { timeSeconds, values: Float64Array.from(values) }; return; }
    const dt = timeSeconds - previousTime;
    // The engine resolves the carrier at >=40 steps/cycle; these samples
    // interpolate between actual solver outputs, never between animations.
    while (nextSample * sampleIntervalSeconds <= timeSeconds + sampleIntervalSeconds * 1e-9) {
      const t = nextSample * sampleIntervalSeconds;
      const fraction = Math.max(0, Math.min(1, (t - previousTime) / dt));
      const interpolated = new Float64Array(size);
      for (let i = 0; i < size; i++) interpolated[i] = previousValues[i] + fraction * (values[i] - previousValues[i]);
      samples.push({ timeSeconds: t, values: interpolated });
      if (samples.length > intervals + 1) samples.shift();
      nextSample++;
    }
    previousTime = timeSeconds; previousValues = Float64Array.from(values);
  }
  function snapshot(timeSeconds) {
    const real = new Float64Array(size), imag = new Float64Array(size), amplitude = new Float64Array(size), phase = new Array(size).fill(null), valid = new Uint8Array(size);
    const warmed = samples.length === intervals + 1;
    const latest = samples.length ? samples[samples.length - 1].timeSeconds : 0;
    if (warmed) {
      let weightSum = 0;
      for (let k = 0; k <= intervals; k++) {
        const weight = 0.5 * (1 - Math.cos(2 * Math.PI * k / intervals));
        const a = weight * Math.cos(omega * samples[k].timeSeconds), b = weight * Math.sin(omega * samples[k].timeSeconds);
        weightSum += weight;
        for (let i = 0; i < size; i++) { real[i] += a * samples[k].values[i]; imag[i] += b * samples[k].values[i]; }
      }
      for (let i = 0; i < size; i++) { real[i] *= 2 / weightSum; imag[i] *= 2 / weightSum; amplitude[i] = Math.hypot(real[i], imag[i]); }
    }
    const refAmplitude = amplitude[referenceIndex];
    const refReady = warmed && refAmplitude >= amplitudeFloorVPerM && refAmplitude > 0;
    if (refReady) for (let i = 0; i < size; i++) if (amplitude[i] >= amplitudeFloorVPerM && amplitude[i] > 0) {
      phase[i] = Math.atan2(imag[i] * real[referenceIndex] - real[i] * imag[referenceIndex], real[i] * real[referenceIndex] + imag[i] * imag[referenceIndex]); valid[i] = 1;
    }
    return {
      fields: { envelopeAmplitudeVPerM: Array.from(amplitude), envelopeRealVPerM: Array.from(real), envelopeImagVPerM: Array.from(imag), relativeCarrierPhaseRad: phase, carrierPhaseValidMask: Array.from(valid) },
      phaseAnalysis: {
        status: !warmed ? 'warming-up' : !refReady ? 'reference-below-floor' : 'ready',
        warmupRemainingSeconds: Math.max(0, windowSeconds - timeSeconds),
        carrierFrequencyHz, convention: 'Ephi=Re{calEphi exp(-i omega0 t)}; calEphi=2 normalized Hann LPF[Ephi exp(+i omega0 t)]',
        filter: 'Finite causal normalized Hann demodulation on uniformly sampled real solver fields',
        windowCycles, windowSeconds, samplesPerCarrierCycle: samplesPerCycle, sampleIntervalSeconds,
        groupDelaySeconds: windowSeconds / 2, analysisTimeSeconds: warmed ? latest - windowSeconds / 2 : null,
        latestSampleTimeSeconds: latest, amplitudeFloorVPerM, fixedAmplitudeScaleVPerM,
        analysisBandwidthApproxHz: 0.72 / windowSeconds, analysisHalfWidth3dBApproxHz: 0.72 / windowSeconds, analysisFullWidth3dBApproxHz: 1.44 / windowSeconds,
        bandwidthDefinition: 'The 0.72/window value is the approximate one-sided 3 dB half-width of the Hann low-pass response; full 3 dB width is 1.44/window.',
        samplesAvailable: samples.length, samplesRequired: intervals + 1,
        reference: { kind: 'computed-total-field-probe', gridIndex: referenceIndex, amplitudeVPerM: refAmplitude, envelopeRealVPerM: real[referenceIndex], envelopeImagVPerM: imag[referenceIndex] },
        sampledReferenceHistory: samples.map(s => ({ timeSeconds: s.timeSeconds, EphiVPerM: s.values[referenceIndex] })),
        limitations: 'Reference includes source and reflected fields; incident/reflected waves are not separated. Few-cycle or broadband pulse phase is analysis-band dependent. Output is timestamped at the window centre; it does not describe the latest instantaneous field.',
      },
    };
  }
  return { record, snapshot };
}

module.exports = { createPhaseHistory };
