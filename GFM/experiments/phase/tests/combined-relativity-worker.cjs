'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const {Worker} = require('node:worker_threads');
const ROOT = path.resolve(__dirname, '..');
const original = require('../backend/relativity.cjs');
const identity = require('../public/relativity-provenance.js');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inheritedSHA = '94facda381ccf78ed204114d7e02929c99e513c898e343a76712feb576607f77';
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function browserCore() {
  const context = vm.createContext({});
  vm.runInContext(read('public/relativity-core.js'), context);
  const invoke = (method, inputs) => {
    context.requestJSON = JSON.stringify(inputs);
    return JSON.parse(vm.runInContext(`JSON.stringify(GFMRelativity.${method}(JSON.parse(requestJSON)))`, context));
  };
  return {context, invoke};
}
function browserWorker() {
  const messages = [], imports = []; let time = 0;
  const context = vm.createContext({performance: {now: () => ++time}, postMessage: message => messages.push(plain(message)),
    importScripts(...files) {
      for (const file of files) {
        assert.match(file, /^\.\/relativity-(core|provenance)\.js$/);
        imports.push(file); vm.runInContext(read('public/' + file.slice(2)), context);
      }
    }});
  vm.runInContext(read('public/relativity-worker.js'), context);
  return {imports, request(job) {
    context.requestJSON = JSON.stringify(job);
    vm.runInContext('onmessage({data:JSON.parse(requestJSON)})', context);
    assert.equal(messages.length, 1); return messages.shift();
  }};
}

test('offline Kerr bundle contains unchanged inherited solver bytes and true loaded source hashes', () => {
  const source = fs.readFileSync(path.join(ROOT, 'backend/relativity.cjs'));
  const core = fs.readFileSync(path.join(ROOT, 'public/relativity-core.js'));
  assert.equal(sha(source), inheritedSHA);
  assert.ok(core.indexOf(source) >= 0, 'Entire original solver is embedded without source rewriting');
  for (const [file, expected] of Object.entries(identity.sourceHashes)) assert.equal(sha(fs.readFileSync(path.join(ROOT, file))), expected);
  assert.equal(identity.sourceHashes['backend/relativity.cjs'], inheritedSHA);
  assert.match(identity.scope, /No pulse, plasma, cover, formation, or traversability/);
});

test('browser module reproduces complete nonextremal, Schwarzschild, and extremal bundles exactly', () => {
  const {invoke} = browserCore();
  for (const inputs of [{spin:0,rayCount:8,inclination:Math.PI/2,tolerance:1e-8}, {spin:.99,rayCount:8,inclination:Math.PI/3,tolerance:1e-9}, {spin:1,rayCount:8,inclination:.8,tolerance:1e-8}]) {
    const bundled = invoke('computeBundle', inputs), expected = plain(original.computeBundle(inputs));
    assert.deepEqual(bundled, expected);
    assert.equal(bundled.diagnostics.passed, true);
    assert.equal(bundled.diagnostics.captured + bundled.diagnostics.escaped + bundled.diagnostics.unresolved, inputs.rayCount);
    assert.ok(bundled.trajectories.every(ray => ray.points.length <= 600));
  }
});

test('actual browser worker loads local assets only and returns the full deterministic solver result', () => {
  const worker = browserWorker(), inputs = {spin:.9,observerRadius:20,inclination:Math.PI/3,rayCount:8,tolerance:1e-8};
  assert.deepEqual(worker.imports, ['./relativity-core.js', './relativity-provenance.js']);
  const reply = worker.request({id:7, inputs});
  assert.equal(reply.id, 7); assert.equal(reply.ok, true); assert.ok(reply.milliseconds >= 0);
  assert.deepEqual(reply.result, plain(original.computeBundle(inputs)));
  assert.deepEqual(reply.sourceHashes, identity.sourceHashes);
  assert.equal(reply.solverSourceSha256, inheritedSHA);
  assert.equal(reply.workerSourceSha256, identity.sourceHashes['public/relativity-worker.js']);
  assert.match(reply.result.observationProtocol, /exactly the same Kerr exterior/);
});

test('worker input failures are explicit, correlated, and do not prevent a subsequent valid calculation', () => {
  const worker = browserWorker();
  for (const job of [{id:1,inputs:{spin:2}}, {id:2,inputs:{spin:.8,cover:1}}, {id:3,inputs:{rayCount:9.5}}, {id:4,inputs:{spin:.8},play:true}, {id:5,inputs:null}]) {
    const reply = worker.request(job); assert.equal(reply.id, job.id); assert.equal(reply.ok, false); assert.match(reply.error, /parameter|finite|integer|plain|request/);
    assert.equal(reply.result, undefined); assert.equal(reply.solverSourceSha256, inheritedSHA);
  }
  const valid = worker.request({id:'recovered',inputs:{spin:0,rayCount:4}});
  assert.equal(valid.id, 'recovered'); assert.equal(valid.ok, true);
});

test('an actual asynchronous worker executes the same browser-packaged core without a backend service', async () => {
  const worker = new Worker(path.join(ROOT, 'public/relativity-worker.js'));
  const inputs = {spin:.95,rayCount:8,observerRadius:20,inclination:Math.PI/4,tolerance:1e-8};
  try {
    const reply = await new Promise((resolve,reject) => {
      const timeout = setTimeout(() => reject(new Error('Offline Kerr worker did not reply')), 10000);
      worker.once('message', value => {clearTimeout(timeout);resolve(value);});
      worker.once('error', error => {clearTimeout(timeout);reject(error);});
      worker.postMessage({id:11,inputs});
    });
    assert.equal(reply.id,11); assert.equal(reply.ok,true);
    assert.deepEqual(reply.result, original.computeBundle(inputs));
    assert.deepEqual(reply.sourceHashes, identity.sourceHashes);
  } finally {await worker.terminate();}
});

test('browser source retains independent Schwarzschild bending refinement and exterior guard behavior', () => {
  const {invoke} = browserCore(), quadrature = 1.7193883102301681;
  const loose = invoke('integrateRay',{Lz:6,tolerance:1e-5});
  const medium = invoke('integrateRay',{Lz:6,tolerance:1e-9});
  const fine = invoke('integrateRay',{Lz:6,tolerance:1e-11});
  assert.equal(loose.outcome,'escaped'); assert.equal(fine.outcome,'escaped');
  assert.ok(Math.abs(fine.deflectionRadians-quadrature)<1e-12);
  assert.ok(Math.abs(medium.deflectionRadians-quadrature)<Math.abs(loose.deflectionRadians-quadrature));
  assert.ok(Math.abs(fine.deflectionRadians-quadrature)<Math.abs(medium.deflectionRadians-quadrature));
  const extreme = invoke('computeBundle',{spin:1,rayCount:8,tolerance:1e-8});
  assert.ok(extreme.trajectories.every(ray => ray.points.every(point => point.r>=1.02-1e-12)));
});

test('browser source preserves unresolved critical and truncated trajectories rather than manufacturing capture', () => {
  const {invoke} = browserCore();
  const separatrix = invoke('integrateRay',{Lz:3*Math.sqrt(3),tolerance:1e-9});
  assert.equal(separatrix.outcome,'critical-limit'); assert.equal(separatrix.diagnostics.criticality.isNearCritical,true); assert.equal(separatrix.deflectionRadians,null);
  const short = invoke('integrateRay',{Lz:6,maxMino:.001});
  assert.equal(short.outcome,'integration-limit'); assert.equal(short.deflectionRadians,null);
  assert.equal(short.parameters.maxMino,.001);
  assert.ok(separatrix.points.every(point=>point.r>3));
});
