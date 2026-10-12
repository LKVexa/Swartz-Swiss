'use strict';
// One requested neutral Kerr bundle, no clock, playback, or material coupling.
// Browser imports stay relative to this installed same-origin worker.
const nodeWorker = typeof process === 'object' && Boolean(process.versions?.node);
let solver, provenance, send, listen;
if (nodeWorker) {
  const {parentPort} = require('node:worker_threads');
  solver = require('./relativity-core.js');
  provenance = require('./relativity-provenance.js');
  send = result => parentPort.postMessage(result);
  listen = handler => parentPort.on('message', handler);
} else {
  importScripts('./relativity-core.js', './relativity-provenance.js');
  solver = globalThis.GFMRelativity;
  provenance = globalThis.GFMRelativityProvenance;
  send = result => postMessage(result);
  listen = handler => { globalThis.onmessage = event => handler(event.data); };
}
listen(job => {
  const id = job?.id ?? null;
  const sourceHashes = provenance.sourceHashes;
  const identity = {solverSourceSha256: sourceHashes['backend/relativity.cjs'], workerSourceSha256: sourceHashes['public/relativity-worker.js'], sourceHashes};
  try {
    if (!job || typeof job !== 'object' || Array.isArray(job) || Object.keys(job).some(key => !['id', 'inputs'].includes(key))) throw new TypeError('Expected a Kerr worker request with id and inputs.');
    if (!(Number.isSafeInteger(id) && id >= 0) && !(typeof id === 'string' && id.length > 0 && id.length <= 200)) throw new TypeError('Kerr worker id must be a nonnegative integer or a short string.');
    const start = performance.now();
    const result = solver.computeBundle(job.inputs);
    send({id, ok: true, result, milliseconds: Math.max(0, performance.now() - start), ...identity});
  } catch (error) {
    send({id, ok: false, error: error instanceof Error ? error.message : String(error), ...identity});
  }
});
