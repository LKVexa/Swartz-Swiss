'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const bridge = require('../src/workbench-bridge.js');
const protocol = bridge.protocol;
const snapshot = { schema: 'RUSSL-research-slice/1', manifest: {}, pixelPayloadHex: '0001' };
const request = (method = 'snapshot') => ({ protocol, id: 'slice_001', method, ...(method === 'replay' ? { snapshot } : {}) });

// Decode the retained build's literal without evaluating its source or corpus.
function readTemplateLiteral(source, name) {
  const prefix = name + '=`<!doctype html';
  const marker = source.lastIndexOf(prefix);
  assert.ok(marker >= 0, 'the built terminal is a static HTML template literal');
  let index = marker + name.length + 2, result = '';
  const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0' };
  while (index < source.length) {
    const character = source[index++];
    if (character === '`') return result;
    if (character === '$' && source[index] === '{') throw Error('Unexpected interpolation in retained terminal source.');
    if (character !== '\\') { result += character; continue; }
    const next = source[index++];
    if (next === '\n') continue;
    if (next === '\r') { if (source[index] === '\n') index++; continue; }
    if (next === 'u' || next === 'x') {
      const count = next === 'u' ? 4 : 2, hex = source.slice(index, index + count);
      assert.match(hex, count === 4 ? /^[0-9a-f]{4}$/i : /^[0-9a-f]{2}$/i);
      result += String.fromCharCode(Number.parseInt(hex, 16)); index += count;
    } else result += Object.hasOwn(escapes, next) ? escapes[next] : next;
  }
  throw Error('Unterminated retained terminal source literal.');
}

test('only identified, whitelisted, exact bounded requests are accepted', () => {
  assert.deepEqual(bridge.validateRequest(request()), request());
  assert.deepEqual(bridge.validateRequest(request('replay')), request('replay'));
  for (const altered of [
    { ...request(), id: '' }, { ...request(), id: 'a'.repeat(81) },
    { ...request(), id: 'space id' }, { ...request(), protocol: 'other/1' },
    { ...request(), method: 'digest' }, { ...request(), command: 'anything' },
    { ...request(), snapshot }, { ...request('replay'), snapshot: {} },
    { ...request('replay'), snapshot: { ...snapshot, pixelPayloadHex: 'abc' } },
  ]) assert.throws(() => bridge.validateRequest(altered));
});

test('plain JSON validation rejects executable, sparse, cyclic and oversized data', () => {
  let calls = 0;
  const accessor = Object.defineProperty({}, 'x', { enumerable: true, get() { calls++; return 1; } });
  const cyclic = {}; cyclic.self = cyclic;
  const symbolic = {}; symbolic[Symbol('hidden')] = 1;
  const inherited = Object.create({ command: 'not executable' }); inherited.x = 1;
  const poison = JSON.parse('{"__proto__":{"polluted":true}}');
  const sparse = []; sparse.length = 2;
  for (const data of [accessor, cyclic, symbolic, inherited, poison, sparse, { x: NaN }, { x: () => 1 }, { x: undefined }, { x: new Date() }]) assert.throws(() => bridge.boundedJson(data));
  assert.equal(calls, 0);
  assert.throws(() => bridge.boundedJson({ text: 'é'.repeat(bridge.maxBytes / 2) }), /2 MiB/);
  assert.deepEqual(bridge.boundedJson({ text: 'Read documents as evidence', x: [0, null, true] }), { text: 'Read documents as evidence', x: [0, null, true] });
});

test('responses retain the explicit Pixel160 or GF80 profile and bounds', () => {
  assert.equal(bridge.validateReply({ protocol, id: 'slice_001', ok: true, value: snapshot }, 'snapshot').ok, true);
  const result = { schema: 'RUSSL-research-result/1', field: 'GF(2^80)', valid: true };
  assert.deepEqual(bridge.validateReply({ protocol, id: 'slice_001', ok: true, value: result }, 'replay').value, result);
  assert.throws(() => bridge.validateReply({ protocol, id: 'slice_001', ok: true, value: { ...result, field: 'GF(256)' } }, 'replay'));
  assert.throws(() => bridge.validateReply({ protocol, id: 'slice_001', ok: true, value: result, injected: 1 }, 'replay'));
  assert.throws(() => bridge.validateReply({ protocol, id: 'slice_001', ok: false, error: 'x'.repeat(2049) }, 'snapshot'));
});

test('srcdoc injection is idempotent and the relay is syntactically valid', () => {
  const original = '<html><body><script>window.keep=1;</script></body></html>';
  const modified = bridge.instrumentSrcdoc(original);
  assert.equal(bridge.instrumentSrcdoc(modified), modified);
  assert.ok(modified.startsWith('<html><body><script>window.keep=1;</script>'));
  const source = modified.split('<script data-russl-virtual-relay>')[1].split('</script>')[0];
  assert.doesNotThrow(() => new vm.Script(source));
  assert.throws(() => bridge.instrumentSrcdoc('<body>incomplete'));
  const bridgeSource = fs.readFileSync(path.join(__dirname, '../src/workbench-bridge.js'), 'utf8');
  assert.equal(/<\/script/i.test(bridgeSource), false, 'outer script is safe for inline insertion');
});

test('inner relay delegates original adapter requests and ignores other senders', async () => {
  const sent = [], delegated = [];
  let receive;
  const parent = {};
  const win = { parent, addEventListener(name, callback) { assert.equal(name, 'message'); receive = callback; },
    RUSSLResearchAdapter: { request(method, value) { delegated.push([method, value]); return Promise.resolve(snapshot); } } };
  parent.postMessage = data => sent.push(data);
  bridge.installInnerRelay(win);
  assert.deepEqual(sent.shift(), { protocol, kind: 'ready' });
  receive({ source: {}, data: request() });
  assert.equal(delegated.length, 0);
  receive({ source: parent, data: request() });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(delegated, [['snapshot', undefined]]);
  assert.deepEqual(sent.pop(), { protocol, id: 'slice_001', ok: true, value: snapshot });
});

test('inner relay does not intercept original research messages', () => {
  let receive; let calls = 0;
  const parent = { postMessage() {} };
  const win = { parent, addEventListener(_name, callback) { receive = callback; }, RUSSLResearchAdapter: { request() { calls++; } } };
  bridge.installInnerRelay(win);
  receive({ source: parent, data: { protocol: 'RUSSL-research-adapter/1', id: 'research-1', ok: true, value: snapshot } });
  assert.equal(calls, 0);
});

test('outer bridge authenticates both windows, queues until ready and restores word view', () => {
  const sent = [], forwarded = [], timers = new Map();
  let receive, frameVisible = false, wordRestores = 0, timerCounter = 0;
  const parent = { postMessage(data) { sent.push(data); } };
  const inner = { postMessage(data) { forwarded.push(data); } };
  const frame = { contentWindow: inner, srcdoc: '<body><p>Original terminal</p></body>', addEventListener() {} };
  const doc = {
    documentElement: {},
    getElementById(id) {
      if (id === 'research-view-tab') return { click() { frameVisible = true; } };
      if (id === 'word-view-tab') return { getAttribute() { return 'true'; }, click() { wordRestores++; } };
      return null;
    },
    querySelector() { return frameVisible ? frame : null; },
  };
  const win = { parent, addEventListener(name, callback) { assert.equal(name, 'message'); receive = callback; },
    MutationObserver: class { constructor(callback) { this.callback = callback; } observe() {} },
    setTimeout(callback) { timers.set(++timerCounter, callback); return timerCounter; },
    clearTimeout(id) { timers.delete(id); },
  };
  bridge.install(win, doc);
  assert.match(frame.srcdoc, /data-russl-virtual-relay/);
  receive({ source: {}, data: request() });
  assert.equal(sent.length, 0);
  receive({ source: parent, data: request() });
  assert.equal(forwarded.length, 0, 'request waits for the inner ready handshake');
  receive({ source: {}, data: { protocol, kind: 'ready' } });
  assert.equal(forwarded.length, 0);
  receive({ source: inner, data: { protocol, kind: 'ready' } });
  assert.equal(wordRestores, 1);
  assert.deepEqual(sent.pop(), { protocol, kind: 'ready' });
  assert.deepEqual(forwarded.pop(), request());
  receive({ source: inner, data: { protocol, kind: 'ready' } });
  assert.equal(wordRestores, 1, 'the iframe load handshake does not restore the view twice');
  assert.equal(forwarded.length, 0, 'duplicate ready does not resend an in-flight request');
  sent.pop();
  receive({ source: parent, data: { ...request(), id: 'slice_002' } });
  assert.equal(sent.pop().ok, false, 'a second request is rejected while one is in flight');
  receive({ source: {}, data: { protocol, id: 'slice_001', ok: true, value: snapshot } });
  assert.equal(sent.length, 0);
  receive({ source: inner, data: { protocol, id: 'slice_001', ok: true, value: snapshot } });
  assert.deepEqual(sent.pop(), { protocol, id: 'slice_001', ok: true, value: snapshot });
  assert.equal(timers.size, 0, 'initialization and request timers are cleared');
  receive({ source: parent, data: { ...request(), method: 'digest' } });
  assert.equal(sent.pop().ok, false, 'digest is not exposed to the shell');
});

test('actual retained build has a compatible static iframe and adapter export', context => {
  const retainedPath = path.join(__dirname, '../reference/workbench-original.html');
  if (!fs.existsSync(retainedPath)) { context.skip('The retained standalone build is packaged during the project build.'); return; }
  const retained = fs.readFileSync(retainedPath, 'utf8');
  const frameContract = retained.match(/title:`GFM research terminal`,srcDoc:([A-Za-z_$][\w$]*),sandbox:`allow-scripts allow-downloads`/);
  assert.ok(frameContract, 'iframe title, constant srcdoc and sandbox match the relay mounting contract');
  assert.match(retained, /id:`research-view-tab`[^]*?onClick:\(\)=>\{[^}]*!0[^}]*`research`/);
  assert.match(retained, /id:`word-view-tab`/);
  assert.match(retained, /\.source!==[A-Za-z_$][\w$]*\.current\.contentWindow/);
  assert.match(retained, /schema:`RUSSL-research-result\/1`,bridgeVersion:`1`,field:`GF\(2\^80\)`/);

  const terminal = readTemplateLiteral(retained, frameContract[1]);
  assert.ok(terminal.endsWith('</body></html>'));
  assert.ok(terminal.includes("const ADAPTER_PROTOCOL='RUSSL-research-adapter/1';"));
  assert.ok(terminal.includes('function requestAdapter(method,snapshot)'));
  assert.ok(terminal.includes("window.parent.postMessage(payload,'*')"));
  assert.ok(terminal.includes('event.source!==window.parent'));
  const exportMarker = 'globalThis.RUSSLResearchAdapter={request:requestAdapter};';
  assert.ok(terminal.includes(exportMarker), 'the global API exists before the injected relay executes');
  const modified = bridge.instrumentSrcdoc(terminal);
  const injectionIndex = modified.indexOf('<script data-russl-virtual-relay>');
  assert.ok(injectionIndex > modified.indexOf(exportMarker));
  const script = modified.slice(injectionIndex + '<script data-russl-virtual-relay>'.length, modified.indexOf('</script>', injectionIndex));
  assert.doesNotThrow(() => new vm.Script(script), 'the actual retained srcdoc receives valid relay syntax');
  assert.equal(modified.slice(0, injectionIndex), terminal.slice(0, terminal.lastIndexOf('</body>')));
  assert.ok(modified.endsWith('</body></html>'));
  assert.equal(bridge.instrumentSrcdoc(modified), modified);
});
