'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('../build-browser-backend.cjs');
const { createModel } = require('../backend/cylinder-em.cjs');
const { presetParameters } = require('../backend/research-presets.cjs');
const GR = require('../backend/gr-reference.cjs');
const bundle = build();
const plain = value => JSON.parse(JSON.stringify(value));

function workerHarness(source = bundle.workerSource) {
  let id = 0, nextTimer = 0, messages = [], timers = new Map();
  const context = vm.createContext({ crypto: crypto.webcrypto, TextEncoder, URL,
    postMessage(message) { messages.push(plain(message)); },
    setTimeout(fn, delay) { const key = ++nextTimer; timers.set(key, { fn, delay }); return key; },
    clearTimeout(key) { timers.delete(key); } });
  vm.runInContext(source, context, { filename: 'gfm-browser-worker.js' });
  function message(kind, data = {}) {
    context.onmessage({ data: { id: ++id, kind, ...data } });
    const reply = messages.find(item => item.id === id);
    if (!reply) throw new Error('Worker did not reply');
    messages = messages.filter(item => item !== reply);
    return reply;
  }
  return {
    context, timers,
    initialize(options) { return message('initialize', { options }); },
    request(route, body, method = body === undefined ? 'GET' : 'POST') { return message('request', { path: route, method, body }); },
    close() { return message('close'); },
    tick() { const entry = timers.entries().next().value; if (!entry) throw new Error('No scheduled computation'); const [key, value] = entry; timers.delete(key); value.fn(); return value.delay; },
    events() { const events = messages.filter(item => item.event); messages = messages.filter(item => !item.event); return events; }
  };
}
function compareSnapshot(frame, snapshot) {
  // HTTP JSON maps IEEE negative zero to zero. Compare both transports through
  // that same API representation; no calculated nonzero value is rounded.
  for (const key of Object.keys(snapshot)) assert.deepEqual(plain(frame[key]), plain(snapshot[key]), 'Exact Node/browser parity for ' + key);
}

test('browser bundle preserves every audited equation source and complete reference data', () => {
  assert.ok(bundle.receipt.browserBundleBytes < 800000);
  assert.equal(bundle.metadata.equationSourceTransformation, 'none');
  for (const [name, digest] of Object.entries(bundle.metadata.sourceModulesSHA256)) {
    const bytes = fs.readFileSync(path.join(__dirname, '..', name));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), digest);
    if (name.endsWith('.cjs')) assert.ok(bundle.workerSource.includes(bytes.toString()), name + ' copied without equation edits');
  }
  assert.doesNotMatch(bundle.workerSource, /\bfetch\(/);
});

test('worker initial fields exactly match Node for open, covered, hot cover and vacuum presets', () => {
  for (const preset of ['plasma-pulse', 'covered-plasma', 'hot-cover', 'vacuum']) {
    const worker = workerHarness();
    const reply = worker.initialize({ initialPreset: preset, running: false });
    assert.equal(reply.ok, true);
    compareSnapshot(reply.data, createModel(presetParameters(preset)).snapshot());
    assert.equal(reply.data.server.presetId, preset);
    assert.equal(reply.data.server.transport, 'browser-worker');
    assert.equal(reply.data.history.length, 1);
    worker.close();
  }
});

test('two-nanosecond worker preview is recomputed with exact field, phase, plasma and cover parity', () => {
  const worker = workerHarness();
  const reply = worker.initialize({ initialPreset: 'covered-plasma', initialSeconds: 2e-9, running: false });
  assert.equal(reply.ok, true);
  const model = createModel(presetParameters('covered-plasma'));
  let elapsed = 0, count = 0;
  while (2e-9 - elapsed > 1e-22) { const dt = Math.min(4e-11, 2e-9 - elapsed); model.step(dt); elapsed += dt; count++; }
  compareSnapshot(reply.data, model.snapshot());
  assert.equal(reply.data.history.length, count + 1);
  assert.ok(reply.data.fields.carrierPhaseValidMask.some(Boolean));
  assert.ok(reply.data.fields.plasmaJphiAPerM2.some(v => v !== 0));
  assert.ok(reply.data.diagnostics.plasmaCollisionHeatJ > 0);
  assert.ok(reply.data.diagnostics.coverThermalEnergyJ > 0);
  assert.ok(reply.data.diagnostics.relativeEnergyBalanceResidual < 1e-8);
  assert.equal(reply.data.running, false);
  const progress = worker.events().filter(event => event.event === 'initialization-progress');
  assert.ok(progress.length > 1);
  assert.equal(progress[0].data.percent, 0);
  assert.equal(progress.at(-1).data.percent, 100);
  assert.equal(progress.at(-1).data.targetSeconds, 2e-9);
  assert.ok(Math.abs(progress.at(-1).data.timeSeconds - 2e-9) < 1e-20);
  worker.close();
});

test('worker controls validate atomically, reset history, and export staggered fields', () => {
  const worker = workerHarness();
  worker.initialize({ running: false });
  const step = worker.request('/api/control', JSON.stringify({ action: 'step' }));
  assert.equal(step.ok, true); assert.ok(step.data.timeSeconds > 0);
  for (const data of [
    { preset: 'hot-cover', running: 'yes' }, { parameters: { sigmaSPerM: -1 }, running: true },
    { parameters: { coverFraction: 1 }, action: 'launch' }, { preset: 'hot-cover', parameters: {} },
    { parameters: null }, { stepSeconds: -1 }, { stepSeconds: 3e-10 }, { unexpected: true }, []
  ]) {
    assert.equal(worker.request('/api/control', data).ok, false);
    assert.deepEqual(worker.request('/api/state').data, step.data);
  }
  const badJSON = worker.request('/api/control', '{'); assert.equal(badJSON.ok, false);
  assert.deepEqual(worker.request('/api/state').data, step.data);
  assert.equal(worker.request('/api/control', 'x'.repeat(24577)).status, 413);
  const hot = worker.request('/api/control', { preset: 'hot-cover' });
  assert.equal(hot.ok, true); assert.equal(hot.data.parameters.coverFraction, 1);
  assert.equal(hot.data.history.length, 1); assert.equal(hot.data.timeSeconds, 0);
  assert.ok(hot.data.fields.coverLiquidFraction.some(v => Math.abs(v - 0.5) < 1e-12));
  const exported = worker.request('/api/export').data;
  assert.equal(exported.frame.runId, hot.data.runId); assert.ok(exported.frame.staggered);
  assert.equal(exported.sourceSHA256, bundle.metadata.engineSHA256);
  const reset = worker.request('/api/reset', {}); assert.equal(reset.ok, true); assert.notEqual(reset.data.runId, hot.data.runId);
  assert.equal(worker.request('/api/control', { parameters: { coverFraction: 0.5 } }).data.server.presetId, null);
  assert.equal(worker.request('/api/missing').status, 404);
  assert.equal(worker.request('/api/state', undefined, 'DELETE').status, 405);
  worker.close();
});

test('worker serves unchanged audit/neutral reference and isolated corrected GR calculators', () => {
  const worker = workerHarness(); worker.initialize({ running: false });
  const initial = worker.request('/api/state').data;
  assert.deepEqual(worker.request('/api/audit').data, plain(GR.getAuditFindings()));
  assert.deepEqual(worker.request('/api/gr-reference').data, plain(GR.referenceExample()));
  const phase = require('../data/phase-reference.json');
  assert.deepEqual(worker.request('/api/phase-reference').data, phase);
  assert.equal(worker.request('/api/presets').data.items.length, 4);
  const parameters = { radiusM: 0.04, shapeM: 0.04, shapeDerivative: -1, regularRedshiftAtThroat: true };
  assert.deepEqual(worker.request('/api/gr-reference', { calculator: 'morrisThorne', parameters }).data.result, plain(GR.morrisThorne(parameters)));
  assert.equal(worker.request('/api/gr-reference', { calculator: 'eval', parameters: {} }).ok, false);
  assert.deepEqual(worker.request('/api/state').data, initial);
  worker.close();
});

test('worker schedules one computation at a time, supports pause/play, and cancels on close', () => {
  const worker = workerHarness(); worker.initialize({ running: false, stream: true });
  assert.equal(worker.timers.size, 1); worker.tick();
  assert.equal(worker.request('/api/state').data.stepCount, 0); assert.equal(worker.timers.size, 1);
  worker.request('/api/control', { action: 'play' });
  assert.equal(worker.tick(), 60); assert.equal(worker.timers.size, 1);
  const computedStepCount = worker.request('/api/state').data.stepCount;
  assert.ok(computedStepCount > 0);
  assert.equal(worker.events().filter(e => e.event === 'frame').length, 1);
  worker.request('/api/control', { action: 'pause' }); worker.tick();
  assert.equal(worker.request('/api/state').data.stepCount, computedStepCount);
  assert.equal(worker.close().ok, true); assert.equal(worker.timers.size, 0);
});

test('browser transport resolves replies, rejects request failures and terminates pending work', async () => {
  const harness = workerHarness();
  const fake = {
    postMessage(message) {
      const old = harness.context.postMessage;
      harness.context.postMessage = reply => queueMicrotask(() => fake.onmessage({ data: plain(reply) }));
      harness.context.onmessage({ data: message }); harness.context.postMessage = old;
    }, terminate() { harness.close(); this.terminated = true; }
  };
  const context = vm.createContext({ setTimeout, clearTimeout, crypto: crypto.webcrypto, TextEncoder, URL });
  vm.runInContext(bundle.browserSource, context);
  const backend = new context.GFMPreviewBackend({ worker: fake, running: false, timeoutMs: 2000 });
  await backend.ready;
  const frame = await backend.request('/api/state'); assert.equal(frame.running, false);
  await assert.rejects(backend.request('/api/control', { method: 'POST', body: JSON.stringify({ running: 'yes' }) }), /Running must/);
  assert.equal(backend.pending.size, 0);
  fake.postMessage = () => {};
  const pending = backend.request('/api/state');
  await new Promise(resolve => setImmediate(resolve));
  fake.onerror({ message: 'Synthetic worker failure' });
  await assert.rejects(pending, /Synthetic worker failure/); assert.equal(backend.pending.size, 0);
  await assert.rejects(backend.request('/api/state'), /Synthetic worker failure/);
  backend.close(); assert.equal(fake.terminated, true);
  await assert.rejects(backend.request('/api/state'), /closed/);
});

function portableContext(extra = {}) {
  let scheduled = 0, active = new Set();
  const context = vm.createContext({
    setTimeout(fn, delay) { scheduled++; const timer = setTimeout(() => { active.delete(timer); fn(); }, delay); active.add(timer); return timer; },
    clearTimeout(timer) { active.delete(timer); clearTimeout(timer); },
    structuredClone, crypto: crypto.webcrypto, TextEncoder, URL, Blob, ...extra
  });
  vm.runInContext(bundle.browserSource, context);
  return { context, active, scheduled: () => scheduled };
}

test('Worker-free preview yields between real pulse advances and preserves exact phase/plasma/cover fields', async () => {
  const environment = portableContext();
  const backend = new environment.context.GFMPreviewBackend({ initialPreset: 'covered-plasma', initialSeconds: 1e-9, running: false });
  const progress = []; backend.subscribe(message => { if (message.event === 'initialization-progress') progress.push(message.data); });
  try {
    const frame = await backend.ready;
    const model = createModel(presetParameters('covered-plasma'));
    let elapsed = 0, advances = 0;
    while (1e-9 - elapsed > 1e-22) { const dt = Math.min(4e-11, 1e-9 - elapsed); model.step(dt); elapsed += dt; advances++; }
    compareSnapshot(frame, model.snapshot());
    assert.equal(frame.server.transport, 'browser-main-thread');
    assert.equal(frame.history.length, advances + 1);
    assert.equal(progress[0].percent, 0); assert.equal(progress.at(-1).percent, 100);
    assert.ok(environment.scheduled() > advances, 'Initialization yields between advances');
    assert.ok(frame.fields.plasmaJphiAPerM2.some(value => value !== 0));
    assert.ok(frame.fields.carrierPhaseValidMask.some(Boolean));
    const initialHistory = plain(frame.history);
    await backend.request('/api/control', { method: 'POST', body: JSON.stringify({ action: 'step' }) });
    assert.deepEqual(frame.history, initialHistory, 'A returned frame is not mutated by later calculations');
    const exported = await backend.request('/api/export'); assert.equal(exported.transport, 'browser-main-thread');
  } finally { backend.close(); }
  assert.equal(environment.active.size, 0, 'Termination cancels all portable timers');
});

test('synchronous and asynchronous Worker creation rejection use the same private solver fallback', async () => {
  for (const asynchronous of [false, true]) {
    let terminated = false;
    class RestrictedWorker {
      constructor() {
        if (!asynchronous) throw new Error('Worker unavailable in this opaque origin');
        setTimeout(() => this.onerror?.({ message: 'Worker unavailable in this opaque origin' }), 0);
      }
      postMessage() {}
      terminate() { terminated = true; }
    }
    const environment = portableContext();
    const backend = new environment.context.GFMPreviewBackend({ Worker: RestrictedWorker, initialPreset: 'hot-cover', running: false });
    try {
      const frame = await backend.ready;
      compareSnapshot(frame, createModel(presetParameters('hot-cover')).snapshot());
      assert.equal(frame.server.transport, 'browser-main-thread');
      assert.ok(frame.fields.coverLiquidFraction.some(value => value === 0.5));
      if (asynchronous) assert.equal(terminated, true);
      await assert.rejects(backend.request('/api/control', { method: 'POST', body: JSON.stringify({ parameters: { sigmaSPerM: -1 }, running: true }) }), /sigmaSPerM/);
      const intact = await backend.request('/api/state'); assert.equal(intact.runId, frame.runId); assert.equal(intact.running, false);
    } finally { backend.close(); }
    assert.equal(environment.active.size, 0);
  }
});

test('closing a Worker-free preview during chunked initialization rejects readiness and clears timers', async () => {
  const environment = portableContext();
  const backend = new environment.context.GFMPreviewBackend({ initialSeconds: 2e-9, running: false });
  backend.close();
  await assert.rejects(backend.ready, /closed/);
  assert.equal(environment.active.size, 0);
});
