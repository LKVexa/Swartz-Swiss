'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const bridge = require('../src/workbench-bridge.js');
const { fixture } = require('./helpers/app-fixture.cjs');

function close(actual, expected, tolerance = 1e-11) { assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`); }

test('GF9 commands preserve complex phases and return explicit model conventions', async () => {
  const h = fixture();
  assert.equal((await h.app.run('gf.field gf9')).ok, true);
  assert.equal((await h.app.run('gf.basis 1')).ok, true);
  const phase = await h.app.run('gf.phase 1');
  assert.equal(phase.ok, true);
  close(phase.details.state[1].re, -0.5);
  close(phase.details.state[1].im, -Math.sqrt(3) / 2);
  const beforeFourier = h.app.snapshot();
  await h.app.run('gf.fourier');
  await h.app.run('gf.fourier inverse');
  assert.ok(h.engine.compare(beforeFourier.state, h.app.snapshot().state) < 1e-11);
  const verified = await h.app.run('gf.verify');
  assert.equal(verified.ok, true);
  assert.equal(verified.details.audit.passed, true);
  const model = verified.details.model;
  assert.equal(model.fourierSign, '+2pi i');
  assert.equal(model.normalization, '1/sqrt(q)');
  assert.equal(model.character, 'exp(2pi i Tr(x)/p)');
  assert.equal(model.amplitudes, 'complex floating point');
  assert.equal(model.field.q, 9);
  assert.deepEqual(h.plain(model.field.polynomial), [1, 0, 1]);
});

test('invalid mathematical and unknown commands preserve the current state', async () => {
  const h = fixture();
  await h.app.run('gf.field gf8');
  await h.app.run('gf.basis 5');
  await h.app.run('gf.fourier');
  const snapshot = h.plain(h.app.snapshot());
  for (const command of ['gf.shift 8', 'gf.phase -1', 'gf.field gf80', 'gf.fourier backwards', 'gf.state [{"re":2,"im":0}]', 'arbitrary.execute script']) {
    const result = await h.app.run(command);
    assert.equal(result.ok, false, command);
    assert.equal(result.details.statePreserved, true);
    assert.deepEqual(h.plain(h.app.snapshot()), snapshot, command);
  }
  assert.equal(h.app.getRecords().length, 0);
});

test('sequences stop on the first error and preserve earlier completed operations', async () => {
  const h = fixture();
  h.node('sequence').value = '# comment\ngf.field gf9\ngf.basis 2\ngf.shift 9\ngf.basis 4';
  await h.node('run-sequence').emit('click');
  assert.deepEqual(h.plain(h.app.snapshot().state), h.plain(h.engine.basisState(9, 2)));
  assert.equal(h.app.snapshot().operations, 1);
  assert.deepEqual(h.plain(h.app.getReturns().map(result => result.command)), ['gf.field gf9', 'gf.basis 2', 'gf.shift 9']);
  assert.match(h.node('sequence-status').textContent, /Completed 3 \/ 4.*stopped on error/);
});

test('session export/import restores state and inert provenance with consistent metadata', async () => {
  const h = fixture();
  await h.app.run('gf.field gf9');
  await h.app.run('gf.basis 1');
  await h.app.run('gf.phase 2');
  await h.app.run('ledger.record Character experiment');
  const expected = h.plain(h.app.snapshot());
  const packet = await h.exported();
  const verified = await h.app.validatePacket(packet);
  assert.deepEqual(h.plain(verified.snapshot), expected);
  assert.equal(packet.data.kind, 'session');
  assert.equal(packet.data.records[0].data.payload.snapshot.model.schema, 'RUSSL-finite-field-model/1');
  assert.equal(packet.data.records[0].data.kind, 'gf-state');
  assert.equal(packet.sha256, await h.app.digest(packet.data));
  assert.equal(packet.data.records[0].sha256, await h.app.digest(packet.data.records[0].data));
  await h.app.run('gf.field gf4');
  await h.import(packet);
  assert.deepEqual(h.plain(h.app.snapshot()), expected);
  assert.equal(h.app.getRecords().length, 1);
  assert.equal(h.app.getReturns().length, packet.data.returns.length, 'Import must not execute provenance');
});

test('ledger export uses the same envelope and omits command history and returns', async () => {
  const h = fixture();
  await h.app.run('ledger.record Initial state');
  const packet = await h.exported('ledger.export');
  assert.equal(packet.data.kind, 'ledger');
  assert.equal(packet.data.commandProvenance, undefined);
  assert.equal(packet.data.returns, undefined);
  assert.equal((await h.app.validatePacket(packet)).records.length, 1);
});

test('session and record tampering are rejected before import state changes', async () => {
  const h = fixture();
  await h.app.run('ledger.record Original label');
  const packet = await h.exported();
  const original = h.plain(h.app.snapshot());
  const tamperedSession = h.plain(packet);
  tamperedSession.data.snapshot.state[1].im = 0.1;
  await assert.rejects(h.app.validatePacket(tamperedSession), /integrity hash/);
  const tamperedRecord = h.plain(packet);
  tamperedRecord.data.records[0].data.label = 'Changed label';
  tamperedRecord.sha256 = await h.app.digest(tamperedRecord.data);
  await assert.rejects(h.app.validatePacket(tamperedRecord), /Record hash mismatch/);
  await h.import(tamperedSession);
  assert.deepEqual(h.plain(h.app.snapshot()), original);
});

test('even rehashed snapshots cannot silently change field or Fourier conventions', async () => {
  const h = fixture();
  const packet = await h.exported();
  for (const change of [
    model => { model.fourierSign = '-2pi i'; },
    model => { model.normalization = '1/q'; },
    model => { model.character = 'exp(2pi i x/q)'; },
    model => { model.labelEncoding = 'integer addition modulo q'; },
    model => { model.field.polynomial = [2, 1, 1]; },
    model => { model.field.id = 'gf80'; }
  ]) {
    const altered = h.plain(packet);
    change(altered.data.snapshot.model);
    altered.sha256 = await h.app.digest(altered.data);
    await assert.rejects(h.app.validatePacket(altered));
  }
});

test('GF80 capture and replay retain the bridge snapshot and result schemas', async () => {
  const h = fixture();
  const before = h.plain(h.app.snapshot());
  h.ready();
  const captured = await h.app.run('workbench.capture');
  assert.equal(captured.ok, true, captured.summary);
  assert.equal(captured.profile, 'GF(2^80) / Pixel160');
  assert.equal(captured.details.snapshot.schema, 'RUSSL-research-slice/1');
  const record = h.app.getRecords()[0];
  assert.equal(record.data.kind, 'gf80-slice');
  bridge.validateRequest({ protocol: bridge.protocol, id: 'cross_schema', method: 'replay', snapshot: h.plain(record.data.payload.snapshot) });
  const replay = await h.app.run(`workbench.replay ${record.id}`);
  assert.equal(replay.ok, true, replay.summary);
  assert.equal(replay.details.schema, 'RUSSL-research-result/1');
  assert.equal(replay.details.field, 'GF(2^80)');
  assert.deepEqual(h.plain(h.app.snapshot()), before, 'Word mechanics must not mutate the complex-amplitude model');
  assert.equal((await h.app.validatePacket(await h.exported())).records.length, 1);
});

test('GF80 session validation rejects snapshot shapes rejected by the existing bridge', async () => {
  const h = fixture();
  h.ready();
  await h.app.run('workbench.capture');
  const packet = await h.exported();
  for (const invalid of [
    { schema: 'RUSSL-research-slice/1' },
    { schema: 'RUSSL-research-slice/1', manifest: [], pixelPayloadHex: '00' },
    { schema: 'RUSSL-research-slice/1', manifest: {}, pixelPayloadHex: 'abc' },
    { schema: 'RUSSL-research-slice/1', manifest: {}, pixelPayloadHex: 'XX' }
  ]) {
    const altered = h.plain(packet);
    altered.data.records[0].data.payload.snapshot = invalid;
    altered.data.records[0].sha256 = await h.app.digest(altered.data.records[0].data);
    altered.sha256 = await h.app.digest(altered.data);
    assert.throws(() => bridge.validateRequest({ protocol: bridge.protocol, id: 'invalid_shape', method: 'replay', snapshot: invalid }));
    await assert.rejects(h.app.validatePacket(altered), /GF80|snapshot|Pixel160/);
  }
});

test('rejected oversized and non-string commands do not break session reimport', async () => {
  for (const command of ['x'.repeat(16001), null]) {
    const h = fixture();
    const before = h.plain(h.app.snapshot());
    const rejected = await h.app.run(command);
    assert.equal(rejected.ok, false);
    assert.deepEqual(h.plain(h.app.snapshot()), before);
    const packet = await h.exported();
    await assert.doesNotReject(h.app.validatePacket(packet));
  }
});

test('ledger restoration reserves the terminal while its integrity check is pending', async () => {
  const h = fixture();
  await h.app.run('gf.basis 2');
  const expected = h.plain(h.app.snapshot().state);
  await h.app.run('ledger.record Restorable state');
  await h.app.run('gf.field gf4');
  const restoreButton = h.node('ledger-list').children[0].children[0].children[1].children[0];
  void restoreButton.emit('click');
  assert.equal(h.node('import-session').disabled, true, 'Restore must reserve the terminal before awaiting SHA-256');
  assert.equal(await h.app.run('gf.field gf8'), null, 'A command cannot interleave with a pending restore');
  const deadline = Date.now() + 3000;
  while (h.node('import-session').disabled) {
    if (Date.now() > deadline) throw Error('Restore did not settle');
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(h.app.snapshot().model.field.id, 'gf9');
  assert.deepEqual(h.plain(h.app.snapshot().state), expected);
  const restore = h.app.getReturns().at(-1);
  assert.match(restore.command, /^ledger\.restore rec-/);
  assert.equal(restore.ok, true);
  assert.equal(restore.details.audit.passed, true);
  const packet = await h.exported();
  assert.equal(packet.data.commandProvenance.at(-1), restore.command, 'Exports retain the completed restore operation');
  assert.equal(packet.data.returns.at(-1).command, restore.command);
  const beforeError = h.plain(h.app.snapshot());
  const rejected = await h.app.run('ledger.restore nonexistent');
  assert.equal(rejected.ok, false);
  assert.equal(rejected.details.statePreserved, true);
  assert.equal(h.node('import-session').disabled, false);
  assert.deepEqual(h.plain(h.app.snapshot()), beforeError);
});
