'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { assembledFixture, project } = require('./helpers/assembled-fixture.cjs');

test('assembled HTML provides calculated data and a waiting status with live controls disabled before scripts run', async () => {
  const h = assembledFixture({ execute: false });
  assert.equal(h.scripts.length, 18); assert.equal(h.context.RusslTerminal, undefined);
  assert.equal(h.node('engine-status').dataset.state, 'pending');
  assert.match(h.node('engine-status').textContent, /Live calculations have not started/);
  assert.equal(h.node('gfm-live-controls').disabled, true); assert.equal(h.node('export-session').disabled, true);
  assert.equal(h.node('m-forward').effectivelyDisabled(), true); assert.equal(h.node('command-form').effectivelyDisabled(), true);
  assert.equal(h.query('.saved-example tbody tr').length, 9);
  assert.match(h.query('.saved-example')[0].textContent, /saved results, not live preview calculations/);
  assert.ok(h.query('.saved-example')[0].textContent.includes('3.78075636'), 'Raw nonunit norm must already be visible');
  await h.node('m-forward').emit('click'); assert.equal(h.context.RusslTerminal, undefined);
  const saved = fs.readFileSync(path.join(project, 'docs/Pendulum_Example.html'), 'utf8');
  assert.equal(/<script\b/i.test(saved), false); assert.match(saved, /uses no scripts/);
  assert.ok(saved.includes(h.query('.saved-example')[0].children.find(node => node.tagName === 'H2').textContent));
});

test('actual embedded scripts start against strict real IDs, defaults and a shared browser global', () => {
  const h = assembledFixture();
  assert.deepEqual(h.scriptErrors, []); assert.deepEqual(h.missingIds, []);
  assert.equal(vm.runInContext('window === globalThis && self === globalThis', h.context), true);
  assert.ok(h.app); assert.equal(h.node('engine-status').dataset.state, 'ready');
  assert.match(h.node('engine-status').textContent, /Live GFM calculation engine is ready/);
  assert.equal(h.node('gfm-live-controls').disabled, false); assert.equal(h.node('export-session').disabled, false);
  assert.equal(h.node('m-forward').effectivelyDisabled(), false);
  assert.equal(h.node('m-field').value, 'gf9'); assert.equal(h.node('m-domain').value, 'complex-signal');
  assert.equal(h.node('command-mode').value, 'gfm'); assert.equal(h.node('equation-filter').value, 'all');
  assert.equal(h.node('m-presets').children.length, 6); assert.equal(h.node('m-bars').children.length, 9);
  assert.equal(h.app.mechanicsSnapshot().values.length, 9); assert.ok(Number(h.node('m-energy').textContent) > 1);
  assert.match(h.node('sequence').value, /^gfm\.pendulum 9\.81 1 0\.2\ngfm\.transform/);
  assert.match(h.node('console-log').textContent, /boot .*70 available commands/);
  assert.equal(JSON.parse(h.node('m-values').value).length, 9);
});

test('assembled startup uses actual button and form wiring to produce transforms, exports and records', async () => {
  const h = assembledFixture(), before = h.plain(h.app.mechanicsSnapshot());
  await h.node('m-forward').emit('click'); await h.settled();
  assert.equal(h.app.mechanicsSnapshot().representation, 'trace-coefficients'); assert.equal(h.app.getReturns().at(-1).ok, true);
  await h.node('m-inverse').emit('click'); await h.settled();
  assert.equal(h.app.mechanicsSnapshot().representation, 'samples');
  h.app.mechanicsSnapshot().values.forEach((value, i) => assert.ok(Math.hypot(value.re - before.values[i].re, value.im - before.values[i].im) < 1e-10));
  h.node('m-field').value = 'gf3'; h.node('m-domain').value = 'complex-signal';
  h.node('m-values').value = '[2,0,3]'; h.node('m-units').value = 'N';
  await h.node('m-prepare').emit('click'); await h.settled();
  assert.equal(h.app.mechanicsSnapshot().field, 'gf3'); assert.equal(h.app.mechanicsSnapshot().codec.units, 'N');
  assert.deepEqual(h.plain(h.app.mechanicsSnapshot().values), [{ re: 2, im: 0 }, { re: 0, im: 0 }, { re: 3, im: 0 }]);
  h.node('command-input').value = 'gfm.verify'; await h.node('command-form').emit('submit'); await h.settled();
  assert.equal(h.node('command-input').value, ''); assert.equal(h.app.getReturns().at(-1).details.audit.passed, true);
  await h.node('m-export').emit('click'); await h.settled();
  assert.equal(h.downloads.length, 1); const exported = JSON.parse(await h.downloads[0].blob.text());
  assert.equal(exported.sha256, await h.app.digest(exported.data)); assert.equal(exported.data.dataset.field, 'gf3');
  await h.node('m-reapply').emit('click'); await h.settled();
  assert.equal(h.app.getRecords().length, 1); assert.equal(h.app.getRecords()[0].data.kind, 'gfm-dataset');
  assert.equal(h.app.getReturns().length, 7); assert.equal(h.app.getReturns().every(result => result.ok), true);
  assert.deepEqual(h.scriptErrors, []); assert.deepEqual(h.missingIds, []); assert.equal(h.node('engine-status').dataset.state, 'ready');
});

test('startup error keeps controls disabled and preserves script-free calculated results', () => {
  const h = assembledFixture({ omitGlobals: ['TextEncoder'] });
  assert.ok(h.scriptErrors.length > 0); assert.equal(h.node('engine-status').dataset.state, 'error');
  assert.match(h.node('engine-status').textContent, /Calculation engine could not start: TextEncoder is not defined/);
  assert.equal(h.node('gfm-live-controls').disabled, true); assert.equal(h.node('export-session').disabled, true);
  assert.equal(h.node('m-forward').effectivelyDisabled(), true); assert.equal(h.query('.saved-example tbody tr').length, 9);
  assert.match(h.query('.saved-example')[0].textContent, /Raw acceleration samples/);
  assert.deepEqual(h.missingIds, []);
});

test('live errors and unhandled rejections show their cause and disable controls without hiding saved data', async () => {
  for (const [type, event, message] of [['error', { message: 'Example calculation failure' }, 'Example calculation failure'],
    ['unhandledrejection', { reason: new Error('Example rejected calculation') }, 'Example rejected calculation']]) {
    const h = assembledFixture(), data = h.plain(h.app.mechanicsSnapshot()), saved = h.query('.saved-example')[0].textContent;
    h.dispatchWindow(type, event);
    assert.equal(h.node('engine-status').dataset.state, 'error'); assert.match(h.node('engine-status').textContent, /Live calculation error/);
    assert.ok(h.node('engine-status').textContent.includes(message));
    assert.equal(h.node('gfm-live-controls').disabled, true); assert.equal(h.node('export-session').disabled, true);
    await h.node('m-forward').emit('click'); assert.deepEqual(h.plain(h.app.mechanicsSnapshot()), data);
    assert.equal(h.app.getReturns().length, 0); assert.equal(h.query('.saved-example')[0].textContent, saved);
  }
});
