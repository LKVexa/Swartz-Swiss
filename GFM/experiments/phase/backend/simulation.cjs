'use strict';
const { randomUUID } = require('node:crypto');
const GM = require('./gfm/gfm-mechanics.js');
const R = require('./gfm/horizon-gr.js');
const S = require('./gfm/horizon-scenario.js');

const DEFAULTS = Object.freeze({ spin: .99, coverLoad: 2, alphaCritical: .8, r0: 1, sealThreshold: 1 });
const RANGES = Object.freeze({ spin: [0, 1], coverLoad: [0, 1e6], alphaCritical: [0, 1 - 1e-12], r0: [1e-9, 1e6], sealThreshold: [1e-9, 1e6] });
const SCOPES = Object.freeze({
  model: 'Declared hypothetical aperture and cover rules. The gaseous and aggie branches share M=1, Q=0 and a/M=spin; hidden cover labels are not inferred from exterior observations.',
  geometry: 'Illustrative 3D geometry, animation and particle motion; no spacetime geodesic, plasma, formation, Maxwell or traversability solver.',
  gfm: 'Raw GF9 trace-character transform of nine aperture-law samples over a/M in [0,1], in polynomial integer-label order. This is a spin-parameter sweep, not a spatial grid or time trajectory. No dataset normalization.',
  clock: 'Elapsed seconds are an illustration clock. Demo changes are a scripted parameter experiment, not inferred physical dynamics.',
  units: 'M=1 and Q=0 in geometrized exterior reference units; apertureRadius and r0 use toy length; coverLoad and sealThreshold share an assumed mass unit.',
});
const clone = value => structuredClone(value);
function validatePatch(patch, current = DEFAULTS) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || ![Object.prototype, null].includes(Object.getPrototypeOf(patch))) throw new TypeError('Parameters must be a plain object.');
  if (Reflect.ownKeys(patch).some(k => typeof k !== 'string' || !Object.hasOwn(DEFAULTS, k))) throw new RangeError('Unknown parameter. Allowed: ' + Object.keys(DEFAULTS).join(', ') + '.');
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(patch))) {
    if (!Object.hasOwn(descriptor, 'value')) throw new TypeError('Parameters must contain data properties.');
    const value = descriptor.value, [min, max] = RANGES[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new RangeError(key + ' must be finite in ' + min + '..' + max + '.');
  }
  return { ...current, ...patch };
}
function calculate(parameters) {
  const scenarioParameters = { M: 1, Q: 0, epsilonSpin: 1 - parameters.spin, alphaCritical: parameters.alphaCritical, r0: parameters.r0, aggieLoad: parameters.coverLoad, sealThreshold: parameters.sealThreshold };
  const scenario = S.scenario(scenarioParameters), exterior = R.kerrNewman(1, parameters.spin, 0);
  const raw = GM.profile('gf9', 'aperture', scenarioParameters), forward = GM.traceTransform(raw), inverse = GM.traceTransform(forward.dataset, true);
  return { exterior, branches: scenario.branches, observation: scenario.observations.comparison,
    gfm: { field: 'gf9', nodes: raw.codec.nodes, raw: raw.values, coefficients: forward.dataset.values, recovered: inverse.dataset.values, checks: forward.checks, passed: forward.passed && inverse.passed,
      maxRecoveryError: forward.checks.inverseRecovery.absoluteResidual, kernel: forward.kernel, coordinate: raw.codec.coordinate, units: raw.codec.units, scope: SCOPES.gfm },
    equations: { aperture: 'r_A=r0*sqrt(1-(alphaCritical/spin)^2) for spin>alphaCritical; otherwise 0', cover: 'C=1 when coverLoad>=sealThreshold; otherwise 0', passage: 'P=(1-C)*(r_A>0 ? 1 : 0)', exterior: 'Kerr-Newman reference with M=1, a=spin, Q=0' },
    thresholdConventions: scenario.thresholdConventions };
}
function createSimulation(options = {}) {
  const maxFrames = options.maxFrames ?? 1800;
  if (!Number.isInteger(maxFrames) || maxFrames < 2 || maxFrames > 10000) throw new RangeError('maxFrames must be an integer in 2..10000.');
  let parameters = validatePatch(options.parameters ?? {}), computed = calculate(parameters), runId = randomUUID(), sequence = 0, elapsed = 0, running = false, demo = null, frames = [], droppedFrames = 0;
  const listeners = new Set();
  function record() {
    const frame = { schema: 'GFM-Aperture-Aggie-frame/1', runId, sequence, elapsed, running, parameters: { ...parameters }, ...computed,
      motion: { phase: (elapsed * (.3 + parameters.spin * 1.6)) % (2 * Math.PI), scope: SCOPES.geometry },
      experiment: demo ? { name: 'Scripted spin and cover experiment', elapsed: demo.elapsed, stage: demo.stage, physicalDynamics: false } : null,
      scopes: SCOPES };
    frames.push(frame);
    if (frames.length > maxFrames) { frames.shift(); droppedFrames++; }
    return frame;
  }
  record();
  function snapshot() {
    const result = clone(frames.at(-1));
    result.history = frames.map(f => ({ time: f.elapsed, spin: f.parameters.spin, coverLoad: f.parameters.coverLoad,
      apertureRadius: f.branches.gaseous.apertureRadius, gaseousPassage: f.branches.gaseous.passage, aggiePassage: f.branches.aggie.passage }));
    result.recording = { retainedFrames: frames.length, droppedFrames, maximumFrames: maxFrames };
    return result;
  }
  function publish() { sequence++; record(); const state = snapshot(); for (const listener of listeners) listener(state); return state; }
  function setParameters(patch) {
    const next = validatePatch(patch, parameters), nextComputed = calculate(next);
    parameters = next; computed = nextComputed; demo = null;
    return publish();
  }
  function applyDemo() {
    const t = demo.elapsed;
    const next = { ...DEFAULTS };
    if (t < 4) { demo.stage = 'Shared spin; gaseous open, aggie sealed'; }
    else if (t < 8) { next.coverLoad = 2 * Math.max(0, 1 - (t - 4) / 2); demo.stage = 'Reducing cover opens the aggie branch'; }
    else if (t < 12) { next.coverLoad = 0; next.spin = .99 - .29 * Math.min(1, (t - 8) / 2); demo.stage = 'Reducing spin closes both apertures'; }
    else { next.coverLoad = 2; next.spin = .99; demo.stage = 'Experiment complete; restored defaults'; running = false; }
    if (Object.keys(DEFAULTS).some(key => next[key] !== parameters[key])) { parameters = next; computed = calculate(next); }
  }
  function tick(dt = .1) {
    if (typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0 || dt > 1) throw new RangeError('Time step must be finite in (0,1].');
    if (!running) return snapshot();
    elapsed = Number((elapsed + dt).toFixed(9));
    if (demo) { demo.elapsed = Number((demo.elapsed + dt).toFixed(9)); applyDemo(); }
    return publish();
  }
  function control(action) {
    if (!['play', 'pause', 'step', 'reset', 'demo'].includes(action)) throw new RangeError('Unknown control action.');
    if (action === 'reset' || action === 'demo') {
      parameters = { ...DEFAULTS }; computed = calculate(parameters); runId = randomUUID(); sequence = 0; elapsed = 0; running = action === 'demo';
      demo = action === 'demo' ? { elapsed: 0, stage: 'Shared spin; gaseous open, aggie sealed' } : null; frames = []; droppedFrames = 0;
      return publish();
    }
    if (action === 'play') { if (demo && demo.elapsed >= 12) demo = null; running = true; }
    if (action === 'pause') running = false;
    if (action === 'step') {
      // A single deterministic illustration step works while paused and preserves pause.
      elapsed = Number((elapsed + .1).toFixed(9));
      if (demo) { demo.elapsed = Number((demo.elapsed + .1).toFixed(9)); applyDemo(); }
    }
    return publish();
  }
  function exportData() { return { schema: 'GFM-Aperture-Aggie-recording/1', runId, exportedAt: new Date().toISOString(), scopes: SCOPES,
    recording: { retainedFrames: frames.length, droppedFrames, maximumFrames: maxFrames }, state: snapshot(), frames: clone(frames) }; }
  function exportCSV() {
    const rows = [['run_id','sequence','time_seconds','spin','cover_load','alpha_critical','r0','seal_threshold','aperture_radius','gaseous_cover','aggie_cover','gaseous_passage','aggie_passage','exterior_r_plus','exterior_omega_h','gfm_max_recovery_error']];
    for (const f of frames) rows.push([f.runId,f.sequence,f.elapsed,f.parameters.spin,f.parameters.coverLoad,f.parameters.alphaCritical,f.parameters.r0,f.parameters.sealThreshold,f.branches.gaseous.apertureRadius,f.branches.gaseous.cover,f.branches.aggie.cover,f.branches.gaseous.passage,f.branches.aggie.passage,f.exterior.rPlus,f.exterior.omegaH,f.gfm.maxRecoveryError]);
    return rows.map(row => row.join(',')).join('\r\n') + '\r\n';
  }
  return Object.freeze({ snapshot, setParameters, tick, control, exportData, exportCSV, subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Listener required.'); listeners.add(listener); return () => listeners.delete(listener); } });
}
module.exports = { createSimulation, validatePatch, calculate, DEFAULTS, RANGES, SCOPES };
