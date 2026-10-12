'use strict';

// Transport only. The equation modules above this controller are copied without
// transformation from their audited CommonJS sources by build-browser-backend.
(function installWorker(scope) {
  const { createModel } = bundledRequire('backend/cylinder-em.cjs');
  const GR = bundledRequire('backend/gr-reference.cjs');
  const { RESEARCH_PRESETS, presetParameters } = bundledRequire('backend/research-presets.cjs');
  const RELEASE = GFM_BUNDLE.release;
  const SOURCE_SHA = GFM_BUNDLE.engineSHA256;
  const TRANSPORT = scope.GFM_TRANSPORT === 'browser-main-thread' ? 'browser-main-thread' : 'browser-worker';
  let model, running = false, runId, failure = null, history = [], lastFrame;
  let advanceSeconds = 4e-11, timer = null, closed = false, stream = false, presetId = null;
  const now = () => scope.performance?.now?.() ?? Date.now();
  let frameInFlight = null, streamSequence = 0;
  let performanceStats = {integration: 'adaptive-transport/1', advances: 0, substeps: 0, computeWallMs: 0,
    lastAdvanceWallMs: 0, meanAdvanceWallMs: 0, simulatedSeconds: 0, physicsNanosecondsPerWallSecond: 0,
    substepsPerWallSecond: 0, streamedFrames: 0, suppressedStreamFrames: 0, outstandingStreamFrames: 0,
    schedulerDelayMs: 60, targetRenderHz: null, pacingMode: 'maximum serial throughput; native display cadence', physicsIntervalSeconds: advanceSeconds};

  function identifier() {
    return scope.crypto?.randomUUID?.() || ('browser-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
  }
  function record() {
    lastFrame = { schema: 'GFM-cylindrical-frame/2', ...model.snapshot() };
    history.push({ time: lastFrame.time || lastFrame.timeSeconds || 0, ...lastFrame.diagnostics });
    if (history.length > 240) history.shift();
    return lastFrame;
  }
  function envelope() {
    return { ...lastFrame, running, runId, server: { ...RELEASE, engineSHA256: SOURCE_SHA, advanceSeconds, failure,
      transport: TRANSPORT, presetId, sourceModulesSHA256: GFM_BUNDLE.sourceModulesSHA256,
      performance: {...performanceStats} }, history };
  }
  function replace(next) {
    model = next; runId = identifier(); history = []; failure = null; record();
  }
  function advance(dt = advanceSeconds) {
    try {
      const began = now(), before = lastFrame.stepCount;
      model.step(dt); failure = null; record();
      const wallMs = Math.max(0, now() - began);
      performanceStats.advances++; performanceStats.substeps += lastFrame.stepCount - before;
      performanceStats.computeWallMs += wallMs; performanceStats.lastAdvanceWallMs = wallMs;
      performanceStats.meanAdvanceWallMs = performanceStats.advances === 1 ? wallMs : .8 * performanceStats.meanAdvanceWallMs + .2 * wallMs;
      performanceStats.simulatedSeconds += dt;
      performanceStats.physicsNanosecondsPerWallSecond = performanceStats.computeWallMs > 0 ? performanceStats.simulatedSeconds * 1e12 / performanceStats.computeWallMs : 0;
      performanceStats.substepsPerWallSecond = performanceStats.computeWallMs > 0 ? performanceStats.substeps * 1000 / performanceStats.computeWallMs : 0;
    }
    catch (error) { running = false; failure = error.message; throw error; }
  }
  function streamFrame() {
    if (!stream) return;
    if (frameInFlight !== null) { performanceStats.suppressedStreamFrames++; return; }
    frameInFlight = ++streamSequence;
    performanceStats.streamedFrames++; performanceStats.outstandingStreamFrames = 1;
    scope.postMessage({event: 'frame', sequence: frameInFlight, data: envelope()});
  }
  function schedule() {
    if (timer !== null || closed) return;
    // Pacing is wall time only. Every solve keeps the same requested physical
    // interval and the engine's existing accuracy/CFL substep selection.
    // A serial fallback yields at least 4 ms for camera and input events.
    const delay = running ? (TRANSPORT === 'browser-main-thread' ? Math.min(8,
      Math.max(4, performanceStats.meanAdvanceWallMs * .1)) : 0) : 60;
    performanceStats.schedulerDelayMs = delay;
    timer = scope.setTimeout(() => {
      timer = null;
      if (closed) return;
      if (running) {
        try { advance(); streamFrame(); }
        catch (error) { scope.postMessage({ event: 'calculation-error', error: error.message }); }
      }
      schedule();
    }, delay);
  }
  function object(value, message = 'Parameters must be an object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
    return value;
  }
  function body(value) {
    if (value === undefined || value === '') return {};
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (new TextEncoder().encode(text).length > 24 * 1024) {
      const error = new Error('Request is too large'); error.status = 413; throw error;
    }
    try { return JSON.parse(text); } catch { throw new Error('Request must contain valid JSON'); }
  }
  function request(path, method = 'GET', rawBody) {
    if (!model) throw new Error('The browser calculation is not initialized');
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) throw new Error('A local API path is required');
    const route = new URL(path, 'http://gfm.local').pathname;
    if (method === 'GET' && route === '/api/health') return { ...RELEASE, engineSHA256: SOURCE_SHA, schema: lastFrame.schema, runId, transport: TRANSPORT, sourceModulesSHA256: GFM_BUNDLE.sourceModulesSHA256 };
    if (method === 'GET' && route === '/api/state') return envelope();
    if (method === 'GET' && route === '/api/audit') return GR.getAuditFindings();
    if (method === 'GET' && route === '/api/gr-reference') return GR.referenceExample();
    if (method === 'GET' && route === '/api/phase-reference') return GFM_BUNDLE.phaseReference;
    if (method === 'GET' && route === '/api/presets') return { schema: 'GFM-research-presets/2', items: Object.entries(RESEARCH_PRESETS).map(([id, item]) => ({ id, ...item, parameters: presetParameters(id) })) };
    if (method === 'GET' && route === '/api/export') return { schema: 'GFM-cylindrical-export/2', generatedAt: new Date().toISOString(), release: RELEASE,
      frame: { ...envelope(), staggered: model.snapshot({ includeStaggered: true }).staggered }, sourceSHA256: SOURCE_SHA,
      transport: TRANSPORT, sourceModulesSHA256: GFM_BUNDLE.sourceModulesSHA256 };
    if (method === 'POST' && route === '/api/gr-reference') {
      const data = object(body(rawBody), 'Reference request must be an object');
      const names = ['morrisThorne', 'misnerSharpDoubleNull', 'classifyFutureOuter', 'thinShell', 'thinShellPotential', 'kerrReference'];
      if (!names.includes(data.calculator)) throw new Error('Unknown reference calculator');
      return { schema: 'GFM-spacetime-reference-result/2', calculator: data.calculator, result: GR[data.calculator](object(data.parameters)), scope: 'Reference calculation; it does not modify the local Maxwell/plasma solution.' };
    }
    if (method === 'POST' && route === '/api/control') {
      const data = object(body(rawBody), 'Controls must be an object');
      for (const key of Object.keys(data)) if (!['action', 'running', 'stepSeconds', 'parameters', 'preset'].includes(key)) throw new Error('Unknown control: ' + key);
      if (data.running !== undefined && typeof data.running !== 'boolean') throw new Error('Running must be true or false');
      if (data.stepSeconds !== undefined && (typeof data.stepSeconds !== 'number' || !Number.isFinite(data.stepSeconds) || data.stepSeconds <= 0 || data.stepSeconds > 2e-10)) throw new Error('Step must be positive and no more than 0.2 ns');
      if (data.action !== undefined && !['play', 'pause', 'step', 'reset'].includes(data.action)) throw new Error('Unknown control action');
      if (data.preset !== undefined && (typeof data.preset !== 'string' || !Object.hasOwn(RESEARCH_PRESETS, data.preset))) throw new Error('Unknown research preset');
      if (data.preset !== undefined && data.parameters !== undefined) throw new Error('Choose a preset or individual parameter changes in one request');
      // Construct first: rejected parameters must preserve fields, run id,
      // history and play/pause controls, including mixed requests.
      let next;
      if (data.preset !== undefined) next = createModel(presetParameters(data.preset));
      if (data.parameters !== undefined) next = createModel({ ...lastFrame.parameters, ...object(data.parameters) });
      if (data.action === 'reset' && !next) next = createModel(lastFrame.parameters);
      if (next) { replace(next); if (data.preset !== undefined) presetId = data.preset; else if (data.parameters !== undefined) presetId = null; }
      if (data.running !== undefined) running = data.running;
      if (data.stepSeconds !== undefined) { running = false; advance(data.stepSeconds); }
      if (data.action === 'play') running = true;
      else if (data.action === 'pause') running = false;
      else if (data.action === 'step') { running = false; advance(); }
      return envelope();
    }
    if (method === 'POST' && route === '/api/reset') {
      const data = object(body(rawBody), 'Reset requires an object');
      for (const key of Object.keys(data)) if (key !== 'parameters') throw new Error('Unknown reset control: ' + key);
      replace(createModel(data.parameters !== undefined ? { ...lastFrame.parameters, ...object(data.parameters) } : lastFrame.parameters));
      if (data.parameters !== undefined) presetId = null;
      return envelope();
    }
    const error = new Error(method === 'GET' ? 'Not found' : 'Unsupported request method'); error.status = method === 'GET' ? 404 : 405; throw error;
  }
  function initialize(options = {}) {
    if (model) throw new Error('The browser calculation is already initialized');
    object(options, 'Initialization options must be an object');
    for (const key of Object.keys(options)) if (!['running', 'initialPreset', 'initialSeconds', 'advanceSeconds', 'stream'].includes(key)) throw new Error('Unknown initialization option: ' + key);
    for (const key of ['running', 'stream']) if (options[key] !== undefined && typeof options[key] !== 'boolean') throw new Error(key + ' must be true or false');
    const initialSeconds = options.initialSeconds ?? 0;
    const nextAdvance = options.advanceSeconds ?? 4e-11;
    if (typeof initialSeconds !== 'number' || !Number.isFinite(initialSeconds) || initialSeconds < 0 || initialSeconds > 2e-8) throw new Error('Initial interval must be between 0 and 20 ns');
    if (typeof nextAdvance !== 'number' || !Number.isFinite(nextAdvance) || nextAdvance <= 0 || nextAdvance > 2e-10) throw new Error('Advance interval must be positive and no more than 0.2 ns');
    // These messages are emitted by the computation thread. The interface stays
    // responsive and can report real progress while the initial causal history
    // is calculated, instead of mistaking that work for a failed connection.
    scope.postMessage({ event: 'initialization-progress', data: { timeSeconds: 0, targetSeconds: initialSeconds, percent: initialSeconds === 0 ? 100 : 0 } });
    const next = createModel(presetParameters(options.initialPreset ?? 'plasma-pulse'));
    advanceSeconds = nextAdvance; performanceStats.physicsIntervalSeconds = advanceSeconds;
    stream = options.stream === true; presetId = options.initialPreset ?? 'plasma-pulse'; replace(next);
    // Record each computed increment so the phase demodulator and energy ledger
    // have real causal histories before a precomputed preview is shown.
    let elapsed = 0, advances = 0;
    while (initialSeconds - elapsed > 1e-22) {
      const dt = Math.min(advanceSeconds, initialSeconds - elapsed); advance(dt); elapsed += dt; advances++;
      if (advances % 5 === 0 || initialSeconds - elapsed <= 1e-22) {
        scope.postMessage({ event: 'initialization-progress', data: { timeSeconds: lastFrame.timeSeconds, targetSeconds: initialSeconds,
          percent: initialSeconds - elapsed <= 1e-22 ? 100 : Math.min(100, 100 * elapsed / initialSeconds) } });
      }
    }
    running = options.running === true; schedule(); return envelope();
  }
  scope.onmessage = event => {
    const message = event.data || {}, id = message.id;
    try {
      let data;
      if (message.kind === 'frame-ack') {
        if (message.sequence === frameInFlight) { frameInFlight = null; performanceStats.outstandingStreamFrames = 0; }
        return;
      }
      if (message.kind === 'initialize') data = initialize(message.options);
      else if (message.kind === 'request') data = request(message.path, message.method, message.body);
      else if (message.kind === 'stream') {
        if (typeof message.enabled !== 'boolean') throw new Error('Stream enabled must be boolean');
        stream = message.enabled;
        if (stream) streamFrame();
        data = {stream, outstandingStreamFrames: performanceStats.outstandingStreamFrames};
      }
      else if (message.kind === 'close') { closed = true; running = false; stream = false; frameInFlight = null;
        performanceStats.outstandingStreamFrames = 0; if (timer !== null) scope.clearTimeout(timer); timer = null; data = { closed: true }; }
      else throw new Error('Unknown worker message');
      scope.postMessage({ id, ok: true, status: 200, data });
    } catch (error) { scope.postMessage({ id, ok: false, status: error.status || 400, error: error.message }); }
  };
})(globalThis);
