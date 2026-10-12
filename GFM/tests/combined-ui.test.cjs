'use strict';

// Exercise the real interface and numerical worker without a loopback server.
// The DOM and WebGL surfaces below capture submitted geometry; they do not
// substitute fields, rendering decisions, API responses, or control handlers.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
const decode = text => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function numericalWorker() {
  const bundleContext = vm.createContext({ URL, Blob, TextEncoder, crypto: crypto.webcrypto });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/browser-backend.js'), 'utf8'), bundleContext);
  const workerSource = vm.runInContext('GFM_WORKER_SOURCE', bundleContext);
  let identifier = 0, timerId = 0;
  const timers = new Map(), messages = [];
  const context = vm.createContext({ URL, TextEncoder, crypto: crypto.webcrypto,
    postMessage(message) { messages.push(plain(message)); },
    setTimeout(fn, delay) { const key = ++timerId; timers.set(key, { fn, delay }); return key; },
    clearTimeout(key) { timers.delete(key); } });
  vm.runInContext(workerSource, context);
  function message(kind, data = {}) {
    const id = ++identifier;
    context.onmessage({ data: { id, kind, ...data } });
    const index = messages.findIndex(reply => reply.id === id);
    assert.ok(index >= 0, 'The unchanged numerical worker replies');
    const reply = messages.splice(index, 1)[0];
    if (!reply.ok) throw new Error(reply.error);
    return reply.data;
  }
  const initial = message('initialize', { options: { initialPreset: 'covered-plasma', initialSeconds: 2e-9, running: false } });
  const requests = [];
  const backend = { ready: Promise.resolve(initial), initialPresetId: 'covered-plasma',
    async request(route, options) {
      requests.push({ route, options });
      return message('request', { path: route, method: options?.method || 'GET', body: options?.body });
    } };
  return { backend, initial, requests,
    state: () => message('request', { path: '/api/state', method: 'GET' }),
    tick() { const [id, entry] = timers.entries().next().value; timers.delete(id); entry.fn(); },
    close() { message('close'); } };
}

function webGLSurface() {
  const gl = { VERTEX_SHADER: 35633, FRAGMENT_SHADER: 35632, COMPILE_STATUS: 35713, LINK_STATUS: 35714,
    COLOR_BUFFER_BIT: 16384, DEPTH_BUFFER_BIT: 256, DEPTH_TEST: 2929, CULL_FACE: 2884, BLEND: 3042,
    SRC_ALPHA: 770, ONE_MINUS_SRC_ALPHA: 771, ARRAY_BUFFER: 34962, DYNAMIC_DRAW: 35048,
    FLOAT: 5126, LINES: 1, TRIANGLES: 4, draws: [], buffers: new Map(), uniforms: {} };
  let nextBuffer = 0, bound;
  const attributeBuffers = new Map();
  Object.assign(gl, {
    createShader: () => ({}), createProgram: () => ({}), createBuffer: () => ++nextBuffer,
    getShaderParameter: () => true, getProgramParameter: () => true,
    getAttribLocation: (_program, name) => ['aPosition', 'aColor', 'aNormal'].indexOf(name),
    getUniformLocation: (_program, name) => name,
    bindBuffer: (_target, buffer) => { bound = buffer; },
    bufferData: (_target, data) => { gl.buffers.set(bound, Array.from(data)); },
    bufferSubData: (_target, offset, data) => {
      assert.equal(offset, 0); gl.buffers.set(bound, Array.from(data));
    },
    deleteBuffer: buffer => { gl.buffers.delete(buffer); },
    uniform1f: (name, value) => { gl.uniforms[name] = value; },
    clear: () => { gl.draws = []; },
    drawArrays: (mode, start, count) => {
      const buffers = [0, 1, 2].map(attribute => gl.buffers.get(attributeBuffers.get(attribute)));
      const submission = { mode, count, alpha: gl.uniforms.uAlpha, lit: gl.uniforms.uLit,
        positions: buffers[0].slice(), colors: buffers[1].slice(), normals: buffers[2].slice() };
      assert.equal(start, 0); assert.equal(submission.positions.length, count * 3);
      assert.equal(submission.colors.length, count * 3); assert.equal(submission.normals.length, count * 3);
      for (const values of [submission.positions, submission.colors, submission.normals]) assert.ok(values.every(Number.isFinite), 'The real renderer submits finite GPU data');
      gl.draws.push(submission);
    }
  });
  for (const name of ['shaderSource', 'compileShader', 'attachShader', 'linkProgram', 'viewport', 'clearColor', 'enable', 'disable', 'blendFunc', 'useProgram', 'uniformMatrix4fv', 'depthMask', 'vertexAttribPointer', 'enableVertexAttribArray']) gl[name] = () => {};
  gl.vertexAttribPointer = attribute => { attributeBuffers.set(attribute, bound); };
  return gl;
}

function interfaceHarness(backend) {
  const nodes = new Map(), missingIDs = [], handlers = new Map(), intervals = [], observers = [], failures = [];
  const gl = webGLSurface();
  const plotCalls = [];
  const canvas2d = new Proxy({ measureText: text => ({ width: String(text).length * 5 }) }, {
    get(object, key) { if (key in object) return object[key]; return (...args) => { plotCalls.push({ key, args }); }; },
    set(object, key, value) { object[key] = value; return true; }
  });
  class Element {
    constructor(tag = 'div', attrs = {}) {
      this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null; this.listeners = new Map();
      this.attributes = { ...attrs }; this.hidden = Object.hasOwn(attrs, 'hidden'); this.checked = Object.hasOwn(attrs, 'checked');
      this.disabled = Object.hasOwn(attrs, 'disabled'); this._value = attrs.value || ''; this._text = ''; this.className = attrs.class || '';
      this.id = attrs.id || ''; this.type = attrs.type || ''; this.min = attrs.min; this.max = attrs.max;
      this.clientWidth = tag === 'canvas' ? 780 : 900; this.clientHeight = 560;
      this.width = 780; this.height = 560; this.style = {};
      this.classList = { toggle: (name, enabled) => {
        const entries = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled ?? !entries.has(name)) entries.add(name); else entries.delete(name);
        this.className = Array.from(entries).join(' ');
      } };
      if (this.id) { assert.ok(!nodes.has(this.id), 'Unique HTML ID ' + this.id); nodes.set(this.id, this); }
    }
    get value() { return this._value; } set value(value) { this._value = String(value); }
    get textContent() { return this._text + this.children.map(child => child.textContent || '').join(''); }
    set textContent(value) { this._text = String(value); this.children = []; }
    append(...children) { for (const child of children) { const node = typeof child === 'object' ? child : new Element('span'); if (typeof child !== 'object') node.textContent = child; node.parentElement = this; this.children.push(node); } }
    replaceChildren(...children) { this.children = []; this._text = ''; this.append(...children); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name] ?? null; }
    querySelector(selector) { if (!selector.startsWith('#')) throw Error('Unexpected query: ' + selector); const id = selector.slice(1), element = nodes.get(id); if (!element) missingIDs.push(id); return element || null; }
    closest(selector) { let cursor = this; const match = node => selector.startsWith('.') ? node.className.split(/\s+/).includes(selector.slice(1)) : node.tagName.toLowerCase() === selector; while (cursor && !match(cursor)) cursor = cursor.parentElement; return cursor; }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
    async dispatch(type, details = {}) { const event = { type, target: this, currentTarget: this, preventDefault() {}, ...details }; for (const fn of this.listeners.get(type) || []) await fn(event); }
    checkValidity() { const v = Number(this.value); return Number.isFinite(v) && (this.min === undefined || v >= Number(this.min)) && (this.max === undefined || v <= Number(this.max)); }
    setPointerCapture() {} click() { return this.dispatch('click'); }
    getContext(kind) { if (kind === 'webgl') return gl; if (kind === '2d') return canvas2d; throw Error('Unexpected canvas context ' + kind); }
    toDataURL() { return 'data:image/png;base64,'; }
  }
  const dom = new Element('div', { id: 'gfm-preview-v201' });
  const stack = [dom];
  const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[^>]+>|[^<]+/g)) {
    const text = token[0];
    if (/^<!/.test(text)) continue;
    if (/^<\//.test(text)) { const tag = text.match(/^<\/\s*([^\s>]+)/)[1].toLowerCase(); while (stack.length > 1) { const last = stack.pop(); if (last.tagName.toLowerCase() === tag) break; } continue; }
    if (/^</.test(text)) {
      const tag = text.match(/^<\s*([^\s/>]+)/)[1].toLowerCase(), attrs = {};
      const raw = text.slice(tag.length + 1, text.length - 1);
      for (const attr of raw.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[attr[1]] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
      const node = new Element(tag, attrs); stack.at(-1).append(node);
      if (!['input', 'meta', 'link', 'br', 'hr', 'img'].includes(tag) && !text.endsWith('/>')) stack.push(node);
    } else stack.at(-1)._text += decode(text);
  }
  for (const select of Array.from(nodes.values()).filter(node => node.tagName === 'SELECT')) {
    const options = select.children.filter(node => node.tagName === 'OPTION');
    select.value = (options.find(option => Object.hasOwn(option.attributes, 'selected')) || options[0])?.value || '';
  }
  const document = { activeElement: null, getElementById: id => nodes.get(id) || null,
    querySelector: dom.querySelector.bind(dom), createElement: tag => new Element(tag) };
  let fetchCalls = 0;
  const context = vm.createContext({ document, console, devicePixelRatio: 1, URL, Blob, AbortController,
    setTimeout, clearTimeout, setInterval: fn => { intervals.push(fn); return intervals.length; }, clearInterval() {},
    ResizeObserver: class { constructor(fn) { this.fn = fn; observers.push(this); } observe(node) { this.node = node; } },
    GFM_LOCAL_BACKEND: backend, fetch() { fetchCalls++; throw Error('UI used forbidden network transport'); },
    addEventListener(name, fn) { handlers.set(name, fn); } });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/pulse-diagnostics.js'), 'utf8'), context, { filename: 'public/pulse-diagnostics.js' });
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'public/app.js'), 'utf8'), context, { filename: 'public/app.js' }); }
  catch (error) { failures.push(error); }
  async function settle() { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); }
  return { context, nodes, gl, plotCalls, missingIDs, failures, fetchCalls: () => fetchCalls, settle,
    async event(id, type, value) { const node = nodes.get(id); assert.ok(node, 'Present control ' + id); if (typeof value === 'boolean') node.checked = value; else if (value !== undefined) node.value = value; await node.dispatch(type); await settle(); },
    async resize() { for (const observer of observers) observer.fn([{ target: observer.node }]); await settle(); },
    async poll() { for (const fn of intervals) await fn(); await settle(); },
    close() { handlers.get('beforeunload')?.(); },
    assertHealthy() { assert.equal(failures.length, 0); assert.deepEqual(missingIDs, []); assert.equal(fetchCalls, 0); assert.doesNotMatch(nodes.get('connection-status').textContent, /error|unavailable|failed/i); assert.equal(nodes.get('scene-notice').hidden, true, nodes.get('scene-notice').textContent); }
  };
}

function meshFingerprint(positions, colors, alpha, lines) {
  return crypto.createHash('sha256').update(JSON.stringify({ p: Array.from(positions, Math.fround), c: Array.from(colors, Math.fround), alpha, lines })).digest('hex');
}
function submittedMeshes(ui) {
  return ui.gl.draws.filter(draw => draw.count > 0).map(draw => meshFingerprint(draw.positions, draw.colors, draw.alpha, draw.mode === ui.gl.LINES));
}
function assertCombinedSubmission(ui, frame) {
  const result = ui.context.GFMCylinderViewAPI.combinedLayerGeometry(frame, {
    cutaway: ui.nodes.get('cutaway').checked,
    showPhase: ui.nodes.get('show-phase-layer').checked,
    showPlasma: ui.nodes.get('show-plasma-layer').checked,
    showCover: ui.nodes.get('show-cover-layer').checked,
    showVectors: ui.nodes.get('vectors').checked,
    presentationShape: ui.nodes.get('presentation-shape').value,
    showEnergyFlow: ui.nodes.get('show-energy-flow').checked,
    absorptionLayer: ui.nodes.get('absorption-layer').value,
    coverResponseLayer: ui.nodes.get('cover-response-layer').value,
    scales: { electricVPerM: Number(ui.nodes.get('electricScale').value),
      plasmaTemperatureRiseK: Number(ui.nodes.get('plasmaTemperatureRiseScale').value),
      coverHeatingWPerM3: Number(ui.nodes.get('coverHeatingScale').value),
      fluxWPerM2: Number(ui.nodes.get('fluxScale').value),
      plasmaPowerWPerM3: Number(ui.nodes.get('plasmaPowerScale').value),
      plasmaDepositedJPerM3: Number(ui.nodes.get('plasmaDepositedScale').value),
      coverDepositedJPerM3: Number(ui.nodes.get('coverDepositedScale').value) }
  });
  const submitted = submittedMeshes(ui);
  const expectedMeshes = [];
  for (const object of result.objects) {
    if (!object.p.length) continue;
    const expected = meshFingerprint(object.p, object.c, object.alpha, object.lines);
    expectedMeshes.push(expected);
    assert.ok(submitted.includes(expected), 'The actual WebGL draw includes calculated ' + object.layer + ' geometry');
  }
  assert.deepEqual(submitted, expectedMeshes, 'GPU submissions contain exactly the currently visible layers, without stale cover or plane geometry');
  return result;
}

test('combined 3D app initializes and preserves all live layer/control flows without networking', async t => {
  const worker = numericalWorker();
  const ui = interfaceHarness(worker.backend);
  try {
    await ui.settle();
    await t.test('initial two-nanosecond covered example submits wave, plasma and cover from one real frame', () => {
      ui.assertHealthy();
      assert.equal(ui.nodes.get('field-layer').value, 'combined');
      assert.equal(ui.nodes.get('combined-layer-controls').hidden, false);
      assert.equal(ui.nodes.get('combined-legend').hidden, false);
      const data = assertCombinedSubmission(ui, worker.state());
      for (const name of ['phase', 'plasma', 'cover']) assert.ok(data.samples[name].length > 0, name + ' layer is populated');
      const frame = worker.state();
      for (const sample of data.samples.phase) { assert.equal(sample.value, frame.fields.envelopeAmplitudeVPerM[sample.index]); assert.equal(Boolean(frame.fields.carrierPhaseValidMask[sample.index]), true); }
      for (const sample of data.samples.plasma) { assert.equal(sample.value, data.layer.layers.plasma.values[sample.index]); assert.ok(frame.fields.plasmaFillFraction[sample.index] > 0); assert.ok(frame.fields.plasmaHeatCapacityJPerM3K[sample.index] > 0); }
      for (const sample of data.samples.cover) { assert.equal(sample.value, frame.fields.joulePowerDensityWPerM3[sample.index]); assert.ok(frame.fields.materialFillFraction[sample.index] > 0); assert.equal(sample.liquidFraction, frame.fields.coverLiquidFraction[sample.index]); }
      assert.equal(data.layer.timeSeconds, frame.timeSeconds);
      assert.equal(data.layer.phaseAnalysisTimeSeconds, frame.phaseAnalysis.analysisTimeSeconds);
      assert.ok(data.layer.phaseAnalysisTimeSeconds < data.layer.timeSeconds, 'Causal-window phase time stays separate from the thermal frame time');
      assert.match(ui.nodes.get('combined-phase-scale').textContent, /rad/);
      assert.match(ui.nodes.get('combined-plasma-scale').textContent, /W\/m³/);
      assert.match(ui.nodes.get('combined-cover-scale').textContent, /W\/m³/);
      assert.match(ui.nodes.get('combined-cover-liquid').textContent, /liquid|fraction|fl/i);
    });
    await t.test('visibility toggles independently remove the corresponding GPU layer and preserve other samples', async () => {
      const frame = worker.state(), initial = assertCombinedSubmission(ui, frame);
      for (const name of ['phase', 'plasma', 'cover']) {
        await ui.event('show-' + name + '-layer', 'change', false);
        ui.assertHealthy();
        const hidden = assertCombinedSubmission(ui, frame);
        assert.equal(hidden.samples[name].length, 0, name + ' geometry is removed');
        for (const other of ['phase', 'plasma', 'cover'].filter(value => value !== name)) assert.equal(hidden.samples[other].length, initial.samples[other].length, other + ' remains visible');
        await ui.event('show-' + name + '-layer', 'change', true);
        ui.assertHealthy();
        assert.equal(assertCombinedSubmission(ui, frame).samples[name].length, initial.samples[name].length);
      }
      await ui.event('show-phase-layer', 'change', false);
      await ui.event('show-plasma-layer', 'change', false);
      await ui.event('show-cover-layer', 'change', false);
      ui.assertHealthy();
      const hidden = assertCombinedSubmission(ui, frame);
      assert.equal(hidden.samples.phase.length + hidden.samples.plasma.length + hidden.samples.cover.length, 0);
      for (const name of ['phase', 'plasma', 'cover']) await ui.event('show-' + name + '-layer', 'change', true);
    });
    await t.test('wormhole shape and energy-flow controls preserve real diagnostics across power and cumulative heat views', async () => {
      const frame = worker.state(), original = assertCombinedSubmission(ui, frame);
      assert.equal(original.presentationShape, 'wormhole');
      assert.ok(original.energyFlow.samples.length > 0);
      assert.match(ui.nodes.get('energy-path-summary').textContent, /flow|vacuum|characteristic|return/i);
      assert.match(ui.nodes.get('pulse-energy-destinations').textContent, /plasma|cover/i);
      assert.match(ui.nodes.get('pulse-energy-destinations').textContent, /Initial stored energy/);
      await ui.event('show-energy-flow', 'change', false); ui.assertHealthy();
      const hidden = assertCombinedSubmission(ui, frame);
      assert.equal(hidden.objects.some(object => object.layer === 'energy-flow'), false);
      await ui.event('show-energy-flow', 'change', true); ui.assertHealthy();
      await ui.event('presentation-shape', 'change', 'cylinder'); ui.assertHealthy();
      const cylinder = assertCombinedSubmission(ui, frame);
      assert.equal(cylinder.presentationShape, 'cylinder');
      assert.notDeepEqual(plain(cylinder.samples.phase[0].positions), plain(original.samples.phase[0].positions));
      assert.equal(worker.state().timeSeconds, frame.timeSeconds);
      for (const kind of ['plasma-heating', 'plasma-deposited', 'plasma-power']) {
        await ui.event('absorption-layer', 'change', kind); ui.assertHealthy();
        const current = assertCombinedSubmission(ui, frame);
        const expected = kind === 'plasma-heating' ? frame.fields.plasmaTemperatureRiseK : kind === 'plasma-deposited' ? frame.fields.plasmaCollisionDepositedEnergyDensityJPerM3 : frame.fields.plasmaCollisionPowerDensityWPerM3;
        for (const sample of current.samples.plasma) assert.ok(Math.abs(sample.value - expected[sample.index]) < 1e-12);
      }
      await ui.event('cover-response-layer', 'change', 'cover-deposited'); ui.assertHealthy();
      assert.match(ui.nodes.get('layer-note').textContent, /deposited heat is cumulative/);
      for (const sample of assertCombinedSubmission(ui, frame).samples.cover) assert.equal(sample.value, frame.fields.depositedEnergyDensityJPerM3[sample.index]);
      await ui.event('cover-response-layer', 'change', 'cover-heating');
      await ui.event('presentation-shape', 'change', 'wormhole'); ui.assertHealthy();
      assert.equal(worker.state().timeSeconds, frame.timeSeconds);
    });
    await t.test('resize, standalone quantities and the neutral reference return to the combined legend safely', async () => {
      await ui.resize(); ui.assertHealthy(); assertCombinedSubmission(ui, worker.state());
      for (const quantity of ['electric', 'plasma-temperature-rise', 'cover-temperature']) {
        await ui.event('field-layer', 'change', quantity); ui.assertHealthy();
        assert.equal(ui.nodes.get('combined-legend').hidden, true);
        assert.equal(ui.nodes.get('combined-layer-controls').hidden, true);
        await ui.resize(); ui.assertHealthy();
        await ui.event('field-layer', 'change', 'combined'); ui.assertHealthy();
        assert.equal(ui.nodes.get('combined-legend').hidden, false);
        assertCombinedSubmission(ui, worker.state());
      }
      await ui.event('mode-phase', 'click'); ui.assertHealthy();
      assert.equal(ui.nodes.get('combined-legend').hidden, true);
      assert.equal(ui.nodes.get('combined-layer-controls').hidden, true);
      await ui.resize(); ui.assertHealthy();
      await ui.event('mode-em', 'click'); ui.assertHealthy();
      assert.equal(ui.nodes.get('field-layer').value, 'combined');
      assert.equal(ui.nodes.get('combined-legend').hidden, false);
      assertCombinedSubmission(ui, worker.state());
    });
    await t.test('Step and Run calculate new phase/plasma/cover samples through the local transport', async () => {
      const before = worker.state();
      await ui.event('step', 'click'); ui.assertHealthy();
      const stepped = worker.state(); assert.ok(stepped.stepCount > before.stepCount);
      assert.ok(stepped.timeSeconds > before.timeSeconds);
      assertCombinedSubmission(ui, stepped);
      assert.equal(ui.nodes.get('frame-label').textContent, 'Step ' + stepped.stepCount);
      await ui.event('run', 'click'); ui.assertHealthy();
      assert.equal(worker.state().running, true); assert.equal(ui.nodes.get('run').textContent, 'Pause');
      worker.tick(); await ui.poll(); ui.assertHealthy();
      const runningFrame = worker.state(); assert.ok(runningFrame.stepCount > stepped.stepCount);
      assertCombinedSubmission(ui, runningFrame);
      await ui.event('run', 'click'); ui.assertHealthy();
      assert.equal(worker.state().running, false); assert.equal(ui.nodes.get('run').textContent, 'Run');
      assert.ok(worker.requests.some(request => request.route === '/api/control' && /"action":"step"/.test(request.options?.body || '')));
      assert.equal(ui.fetchCalls(), 0);
    });
    await t.test('display scale and physical controls update actual layers without inventing warmup phase', async () => {
      await ui.event('coverHeatingScale', 'change', 40); ui.assertHealthy();
      const scaled = assertCombinedSubmission(ui, worker.state()); assert.equal(scaled.layer.layers.cover.hi, 40);
      const before = worker.state();
      await ui.event('coverFraction', 'change', .5); ui.assertHealthy();
      const changed = worker.state(); assert.equal(changed.parameters.coverFraction, .5);
      assert.notEqual(changed.runId, before.runId); assert.equal(changed.timeSeconds, 0);
      const resetGeometry = assertCombinedSubmission(ui, changed);
      assert.equal(resetGeometry.samples.phase.length, 0, 'Unresolved wave phase is genuinely masked');
      assert.ok(resetGeometry.samples.plasma.length > 0); assert.ok(resetGeometry.samples.cover.length > 0);
      assert.match(ui.nodes.get('combined-phase-status').textContent, /warm|mask|history/i);
      assert.equal(ui.fetchCalls(), 0);
    });
  } finally { ui.close(); worker.close(); }
});

