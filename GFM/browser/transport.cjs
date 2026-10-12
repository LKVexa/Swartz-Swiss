'use strict';

// This controller exchanges messages with a dedicated in-browser calculation.
// It does not fetch localhost, replace global fetch, or change equation sources.
(function installTransport(root) {
  function portableWorker(source) {
    const timers = new Set();
    const copy = root.structuredClone ? value => root.structuredClone(value) : value => JSON.parse(JSON.stringify(value));
    let terminated = false, boot = null, internalId = 0;
    const port = { onmessage: null, onerror: null, onmessageerror: null };
    function defer(fn, delay = 0) {
      if (terminated) return null;
      const timer = root.setTimeout(() => { timers.delete(timer); if (!terminated) fn(); }, delay);
      timers.add(timer); return timer;
    }
    function emit(message) { if (!terminated) port.onmessage?.({ data: copy(message) }); }
    function progress(percent) { emit({ event: 'initialization-progress', data: { timeSeconds: boot.frame?.timeSeconds || 0, targetSeconds: boot.target, percent } }); }
    function finish() {
      const completed = boot; boot = null;
      emit({ id: completed.id, ok: true, status: 200, data: completed.frame });
    }
    function nextChunk() {
      if (!boot || terminated) return;
      if (boot.target - boot.elapsed <= 1e-22) {
        progress(100);
        if (boot.running) {
          boot.stage = 'play'; boot.internalId = 'gfm-bootstrap-' + (++internalId);
          scope.onmessage({ data: { id: boot.internalId, kind: 'request', path: '/api/control', method: 'POST', body: { action: 'play' } } });
        } else finish();
        return;
      }
      boot.stage = 'step'; boot.dt = Math.min(boot.advance, boot.target - boot.elapsed);
      boot.internalId = 'gfm-bootstrap-' + (++internalId);
      scope.onmessage({ data: { id: boot.internalId, kind: 'request', path: '/api/control', method: 'POST', body: { stepSeconds: boot.dt } } });
    }
    const scope = {
      crypto: root.crypto, performance: root.performance, GFM_TRANSPORT: 'browser-main-thread',
      setTimeout: defer,
      clearTimeout(timer) { root.clearTimeout(timer); timers.delete(timer); },
      postMessage(message) {
        if (terminated) return;
        if (boot) {
          // The zero-time private initialization is an implementation step.
          // Its progress and internal control replies are not public requests.
          if (message.event === 'initialization-progress') return;
          if (message.id === boot.id || message.id === boot.internalId) {
            if (!message.ok) { const id = boot.id; boot = null; emit({ ...message, id }); return; }
            boot.frame = message.data;
            if (boot.stage === 'step') { boot.elapsed += boot.dt; boot.advances++; if (boot.advances % 5 === 0) progress(Math.min(100, 100 * boot.elapsed / boot.target)); }
            if (boot.stage === 'play') { finish(); return; }
            // Yield between actual solver advances so the camera, controls and
            // progress display remain responsive in a worker-restricted frame.
            defer(nextChunk); return;
          }
        }
        emit(message);
      }
    };
    // Exact bundled modules execute in a private scope. This path is used only
    // where the containing preview permits scripts but cannot create a Worker.
    // The equations and diagnostic arrays are shared with the worker path.
    const Compile = root.Function || Function;
    new Compile('globalThis', source)(scope);
    port.postMessage = message => {
      if (terminated) throw new Error('The browser calculation is closed.');
      message = copy(message);
      defer(() => {
        try {
          const options = message.options;
          const target = options?.initialSeconds ?? 0;
          const validTarget = typeof target === 'number' && Number.isFinite(target) && target > 0 && target <= 2e-8;
          const validRunning = options?.running === undefined || typeof options.running === 'boolean';
          if (message.kind === 'initialize' && validTarget && validRunning && options && typeof options === 'object' && !Array.isArray(options)) {
            boot = { id: message.id, stage: 'initialize', target, advance: options.advanceSeconds ?? 4e-11,
              running: options.running === true, elapsed: 0, advances: 0, frame: null };
            progress(0);
            scope.onmessage({ data: { ...message, options: { ...options, initialSeconds: 0, running: false } } });
          } else scope.onmessage({ data: message });
        } catch (error) { port.onerror?.({ message: error.message }); }
      });
    };
    port.terminate = () => {
      if (terminated) return;
      terminated = true; boot = null;
      try { scope.onmessage({ data: { kind: 'close', id: 'gfm-portable-close' } }); } catch {}
      for (const timer of timers) root.clearTimeout(timer); timers.clear();
    };
    return port;
  }
  class GFMPreviewBackend {
    constructor(options = {}) {
      const WorkerType = options.Worker || root.Worker;
      this.pending = new Map(); this.listeners = new Set(); this.nextId = 0; this.closed = false; this.lastFrame = null; this.failure = null;
      this.queuedFrame = null; this.frameDelivery = null;
      this.performance = {streamFramesReceived: 0, streamFramesDelivered: 0, coalescedFrames: 0,
        maximumQueuedFrames: 0, renderAlignedDelivery: Boolean(root.requestAnimationFrame)};
      this.timeoutMs = options.timeoutMs ?? 60000;
      const suppliedWorker = options.worker;
      this.initialized = false; this.usingFallback = false;
      if (suppliedWorker) this.worker = suppliedWorker;
      else if (options.forceMainThread || !WorkerType || !root.Blob || !root.URL?.createObjectURL) {
        this.worker = portableWorker(GFM_WORKER_SOURCE); this.usingFallback = true;
      } else {
        try {
          this.workerURL = root.URL.createObjectURL(new root.Blob([GFM_WORKER_SOURCE], { type: 'text/javascript' }));
          this.worker = new WorkerType(this.workerURL);
        } catch {
          if (this.workerURL) root.URL.revokeObjectURL(this.workerURL); this.workerURL = null;
          this.worker = portableWorker(GFM_WORKER_SOURCE); this.usingFallback = true;
        }
      }
      const init = {};
      for (const key of ['running', 'initialPreset', 'initialSeconds', 'advanceSeconds', 'stream']) if (options[key] !== undefined) init[key] = options[key];
      this.initialMessage = { kind: 'initialize', options: init };
      this.attachHandlers();
      this.initialRequestId = this.nextId + 1;
      this.ready = this.send(this.initialMessage).then(frame => { this.initialized = true; return frame; });
    }
    attachHandlers() {
      const attachedWorker = this.worker;
      this.worker.onmessage = event => {
        if (this.worker !== attachedWorker || this.closed) return;
        const message = event.data || {};
        if (message.event) {
          if (message.event === 'frame') { this.queueFrame(message); return; }
          for (const listener of this.listeners) { try { listener(message); } catch {} }
          return;
        }
        const pending = this.pending.get(message.id); if (!pending) return;
        this.pending.delete(message.id); root.clearTimeout(pending.timer);
        if (message.ok) {
          if (message.data?.schema === 'GFM-cylindrical-frame/2') {
            this.lastFrame = message.data;
            // A reset/control reply is authoritative. A frame already waiting
            // for paint must never restore the prior run or an older time.
            const queued = this.queuedFrame;
            if (queued && (queued.data.runId !== message.data.runId || queued.data.timeSeconds <= message.data.timeSeconds)) {
              this.queuedFrame = null; this.acknowledge(queued);
            }
          }
          pending.resolve(message.data);
        }
        else { const error = new Error(message.error || 'Calculation request failed'); error.status = message.status; pending.reject(error); }
      };
      this.worker.onerror = event => {
        if (this.worker !== attachedWorker || this.closed) return;
        // Some browsers report an opaque-origin or CSP Worker rejection only
        // asynchronously. Retry initialization through the same solver locally.
        if (!this.initialized && !this.usingFallback && this.pending.has(this.initialRequestId)) {
          try {
            this.worker.terminate();
            if (this.workerURL) root.URL.revokeObjectURL(this.workerURL); this.workerURL = null;
            this.worker = portableWorker(GFM_WORKER_SOURCE); this.usingFallback = true; this.attachHandlers();
            this.worker.postMessage({ id: this.initialRequestId, ...this.initialMessage }); return;
          } catch (error) { this.failAll(error); return; }
        }
        this.failAll(new Error(event.message || 'The browser calculation stopped unexpectedly.'));
      };
      this.worker.onmessageerror = () => this.failAll(new Error('The browser calculation returned an unreadable message.'));
    }
    acknowledge(message) {
      if (this.closed || message.sequence === undefined) return;
      try { this.worker.postMessage({kind: 'frame-ack', sequence: message.sequence}); } catch {}
    }
    queueFrame(message) {
      this.performance.streamFramesReceived++;
      if (this.queuedFrame) { this.performance.coalescedFrames++; this.acknowledge(this.queuedFrame); }
      this.queuedFrame = message; this.performance.maximumQueuedFrames = 1;
      if (this.frameDelivery !== null) return;
      const deliver = () => {
        this.frameDelivery = null;
        const latest = this.queuedFrame; this.queuedFrame = null;
        if (!latest || this.closed) return;
        this.lastFrame = latest.data; this.performance.streamFramesDelivered++;
        for (const listener of this.listeners) { try { listener(latest); } catch {} }
        this.acknowledge(latest);
      };
      this.frameDelivery = root.requestAnimationFrame ? root.requestAnimationFrame(deliver) : root.setTimeout(deliver, 16);
    }
    send(message) {
      if (this.closed) return Promise.reject(new Error('The browser calculation is closed.'));
      if (this.failure) return Promise.reject(this.failure);
      const id = ++this.nextId;
      return new Promise((resolve, reject) => {
        const timer = root.setTimeout(() => { this.pending.delete(id); reject(new Error('The browser calculation request timed out.')); }, this.timeoutMs);
        this.pending.set(id, { resolve, reject, timer });
        try { this.worker.postMessage({ id, ...message }); }
        catch (error) { root.clearTimeout(timer); this.pending.delete(id); reject(error); }
      });
    }
    async request(path, options = {}) {
      await this.ready;
      return this.send({ kind: 'request', path, method: options.method || 'GET', body: options.body });
    }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    async startStream() { await this.ready; return this.send({kind: 'stream', enabled: true}); }
    async stopStream() { await this.ready; return this.send({kind: 'stream', enabled: false}); }
    failAll(error) { this.failure = error; for (const pending of this.pending.values()) { root.clearTimeout(pending.timer); pending.reject(error); } this.pending.clear(); }
    close() {
      if (this.closed) return;
      this.closed = true; this.failAll(new Error('The browser calculation was closed.')); this.worker.terminate(); this.listeners.clear();
      if (this.frameDelivery !== null) {
        if (root.cancelAnimationFrame) root.cancelAnimationFrame(this.frameDelivery); else root.clearTimeout(this.frameDelivery);
      }
      this.frameDelivery = null; this.queuedFrame = null;
      if (this.workerURL) root.URL.revokeObjectURL(this.workerURL);
    }
  }
  GFMPreviewBackend.metadata = GFM_BROWSER_METADATA;
  root.GFMPreviewBackend = GFMPreviewBackend;
})(globalThis);
